// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IBondPool } from "./interfaces/IBondPool.sol";
import { BondPoolErrors } from "./interfaces/BondPoolErrors.sol";

interface IVaultForBondPool {
    function isClaimable(uint256 paymentId) external view returns (bool);
    function suspendForClaim(bytes32 qualId, uint256 claimId) external;
    function quals(bytes32 qualId)
        external
        view
        returns (
            bytes32 att_qualId,
            address att_vault,
            address att_agentKey,
            bytes32 att_configHash,
            bytes32 att_reportHash,
            bytes32 att_corpusHash,
            uint256 att_examCommitId,
            bytes32 att_ownerInputsHash,
            uint256 att_t1MaxPerTx,
            uint256 att_t1MaxPerWindow,
            uint256 att_t2MaxPerTx,
            bool att_t2Allowed,
            uint256 att_issuedAt,
            uint256 att_expiresAt,
            address att_examiner,
            bool active,
            bool revoked,
            uint256 activatedAt,
            uint256 effectiveT1MaxPerTx,
            uint256 effectiveT1MaxPerWindow,
            uint256 effectiveT2MaxPerTx
        );
    function payments(uint256 paymentId)
        external
        view
        returns (
            bytes32 qualId,
            address recipient,
            uint256 amount,
            bytes32 invoiceKey,
            bytes32 memoHash,
            uint8 tier,
            uint256 timestamp,
            bool reconciled
        );
    function owner() external view returns (address);
}

/**
 * @title BondPool
 * @notice Capital backing pool for UnderwriteVault qualifications per plan §9.7.
 *         Holds underwriter capital, locks backing per qualification, and mediates claim payouts.
 */
contract BondPool is IBondPool, BondPoolErrors {
    using SafeERC20 for IERC20;

    enum ClaimStatus {
        NONE,
        FILED,
        APPROVED,
        REJECTED
    }

    struct Claim {
        uint256 id;
        bytes32 qualId;
        uint256 paymentId;
        uint256 lossAmount;
        bytes32 evidenceHash;
        ClaimStatus status;
        uint256 payout;
    }

    address public immutable underwriter;
    address public immutable adjudicator;
    IERC20 public immutable token;

    uint256 public immutable deductible;
    uint256 public immutable perClaimCap;
    uint256 public immutable claimGrace;

    address public vault;
    bool public vaultSet;

    uint256 public free;
    mapping(bytes32 => uint256) public locked;
    mapping(bytes32 => uint256) public paidOut;

    uint256 public nextClaimId = 1;
    mapping(uint256 => Claim) public claimRecords;
    mapping(uint256 => bool) public claimedPayment;
    mapping(bytes32 => uint256) public openClaimsCount;

    // Events
    event Deposited(address indexed underwriter, uint256 amount);
    event Withdrawn(address indexed underwriter, uint256 amount);
    event BondLocked(bytes32 indexed qualId, uint256 amount);
    event BondReleased(bytes32 indexed qualId, uint256 amount);
    event VaultSet(address indexed vault);
    event ClaimFiled(
        uint256 indexed claimId, bytes32 indexed qualId, uint256 paymentId, uint256 lossAmount, bytes32 evidenceHash
    );
    event ClaimPaid(uint256 indexed claimId, bytes32 indexed qualId, uint256 payout, address indexed vault);
    event ClaimRejected(uint256 indexed claimId, bytes32 indexed reasonHash);

    modifier onlyUnderwriter() {
        if (msg.sender != underwriter) revert NotUnderwriter();
        _;
    }

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault();
        _;
    }

    modifier onlyAdjudicator() {
        if (msg.sender != adjudicator) revert NotAdjudicator();
        _;
    }

    constructor(
        address _underwriter,
        address _adjudicator,
        address _token,
        uint256 _deductible,
        uint256 _perClaimCap,
        uint256 _claimGrace
    ) {
        if (_underwriter == address(0) || _adjudicator == address(0) || _token == address(0)) {
            revert ZeroAddress();
        }

        underwriter = _underwriter;
        adjudicator = _adjudicator;
        token = IERC20(_token);
        deductible = _deductible;
        perClaimCap = _perClaimCap;
        claimGrace = _claimGrace;
    }

    /**
     * @notice Binds the UnderwriteVault contract. Callable exactly once by the underwriter.
     * @param _vault Address of the deployed UnderwriteVault.
     */
    function setVault(address _vault) external onlyUnderwriter {
        if (vaultSet) revert VaultAlreadySet();
        if (_vault == address(0)) revert ZeroAddress();

        vault = _vault;
        vaultSet = true;
        emit VaultSet(_vault);
    }

    /**
     * @notice Underwriter deposits free capital to back future qualifications.
     * @param amount Token amount to deposit.
     */
    function deposit(uint256 amount) external onlyUnderwriter {
        if (amount == 0) revert ZeroAmount();

        free += amount;
        emit Deposited(msg.sender, amount);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Underwriter withdraws unencumbered free capital.
     * @param amount Token amount to withdraw.
     */
    function withdrawFree(uint256 amount) external onlyUnderwriter {
        if (amount == 0) revert ZeroAmount();
        if (amount > free) revert InsufficientFreeBalance();

        free -= amount;
        emit Withdrawn(msg.sender, amount);
        token.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice Locks backing capital for a qualification. Called by UnderwriteVault.
     * @param qualId The qualification identifier.
     * @param amount The effective maximum window amount to lock.
     */
    function lock(bytes32 qualId, uint256 amount) external override onlyVault {
        if (amount == 0) revert ZeroAmount();
        if (amount > free) revert InsufficientFreeBalance();

        free -= amount;
        locked[qualId] += amount;
        emit BondLocked(qualId, amount);
    }

    /**
     * @notice Returns remaining claimable backing capital for a qualification.
     * @param qualId The qualification identifier.
     * @return Remaining backing tokens (locked - paidOut).
     */
    function remaining(bytes32 qualId) external view override returns (uint256) {
        uint256 l = locked[qualId];
        uint256 p = paidOut[qualId];
        if (l <= p) return 0;
        return l - p;
    }

    /**
     * @notice Releases locked capital back to free pool once qualification is expired/inactive,
     *         claimGrace has elapsed, and no open claims remain. Callable by anyone.
     * @param qualId The qualification identifier.
     */
    function release(bytes32 qualId) external override {
        if (!vaultSet) revert VaultNotSet();
        uint256 currentLocked = locked[qualId];
        uint256 currentPaid = paidOut[qualId];
        if (currentLocked <= currentPaid) revert NoLockedCapital();

        // Check qualification status from vault
        (,,,,,,,,,,,,, uint256 expiresAt,, bool active,,,,,) = IVaultForBondPool(vault).quals(qualId);

        if (active) revert QualificationStillActive();
        if (block.timestamp <= expiresAt + claimGrace) revert ClaimGraceNotElapsed();
        if (openClaimsCount[qualId] > 0) revert OpenClaimsExist();

        uint256 remainder = currentLocked - currentPaid;
        locked[qualId] = currentPaid; // remaining becomes 0
        free += remainder;

        emit BondReleased(qualId, remainder);
    }

    /**
     * @notice Delegates isClaimable query to the bound UnderwriteVault.
     * @param paymentId The payment identifier.
     * @return True if claimable.
     */
    function isClaimable(uint256 paymentId) external view override returns (bool) {
        if (!vaultSet) return false;
        return IVaultForBondPool(vault).isClaimable(paymentId);
    }

    /**
     * @notice Not supported directly on BondPool; called on UnderwriteVault by BondPool.
     */
    function suspendForClaim(bytes32, uint256) external pure override {
        revert("Not implemented on BondPool");
    }

    /**
     * @notice Files a claim against a fraudulent or erroneous Tier 1 payment. Callable by vault owner.
     * @param paymentId The payment ID issued by UnderwriteVault.
     * @param lossAmount Amount of loss claimed (must be <= payment.amount).
     * @param evidenceHash Hash of evidence payload supporting the claim.
     * @return claimId Identifier of the filed claim.
     */
    function fileClaim(uint256 paymentId, uint256 lossAmount, bytes32 evidenceHash) external returns (uint256 claimId) {
        if (!vaultSet) revert VaultNotSet();
        IVaultForBondPool v = IVaultForBondPool(vault);
        if (msg.sender != v.owner()) revert NotVaultOwner();

        if (!v.isClaimable(paymentId)) revert PaymentNotClaimable();
        if (claimedPayment[paymentId]) revert PaymentNotClaimable();

        (bytes32 qualId,, uint256 pAmount,,,,,) = v.payments(paymentId);
        if (lossAmount == 0 || lossAmount > pAmount) revert LossExceedsPaymentAmount();

        (,,,,,,,,,,,,, uint256 expiresAt,,,,,,,) = v.quals(qualId);
        if (block.timestamp > expiresAt + claimGrace) revert ClaimGraceExpired();

        claimId = nextClaimId++;
        claimedPayment[paymentId] = true;
        openClaimsCount[qualId]++;

        claimRecords[claimId] = Claim({
            id: claimId,
            qualId: qualId,
            paymentId: paymentId,
            lossAmount: lossAmount,
            evidenceHash: evidenceHash,
            status: ClaimStatus.FILED,
            payout: 0
        });

        emit ClaimFiled(claimId, qualId, paymentId, lossAmount, evidenceHash);
    }

    /**
     * @notice Approves a filed claim and issues payout to UnderwriteVault. Callable by adjudicator.
     * @param claimId The claim identifier.
     * @param approvedLoss The adjudicated loss amount.
     * @return payout The actual payout amount transferred to the vault.
     */
    function approveClaim(uint256 claimId, uint256 approvedLoss) external onlyAdjudicator returns (uint256 payout) {
        Claim storage c = claimRecords[claimId];
        if (c.status != ClaimStatus.FILED) revert ClaimAlreadyResolved();
        if (approvedLoss > c.lossAmount) revert LossExceedsPaymentAmount();

        bytes32 qualId = c.qualId;
        openClaimsCount[qualId]--;

        // payout = min(approvedLoss - deductible (floor 0), perClaimCap, remaining(qualId))
        uint256 netLoss = 0;
        if (approvedLoss > deductible) {
            netLoss = approvedLoss - deductible;
        }

        uint256 rem = locked[qualId] > paidOut[qualId] ? locked[qualId] - paidOut[qualId] : 0;
        payout = netLoss < perClaimCap ? netLoss : perClaimCap;
        if (payout > rem) {
            payout = rem;
        }

        c.status = ClaimStatus.APPROVED;
        c.payout = payout;
        paidOut[qualId] += payout;

        emit ClaimPaid(claimId, qualId, payout, vault);

        // Transfer payout to vault, then suspend qualification and clear exposure in vault
        if (payout > 0) {
            token.safeTransfer(vault, payout);
        }
        IVaultForBondPool(vault).suspendForClaim(qualId, claimId);
    }

    /**
     * @notice Rejects a filed claim. Callable by adjudicator.
     * @param claimId The claim identifier.
     * @param reasonHash Hash explaining the rejection reason.
     */
    function rejectClaim(uint256 claimId, bytes32 reasonHash) external onlyAdjudicator {
        Claim storage c = claimRecords[claimId];
        if (c.status != ClaimStatus.FILED) revert ClaimAlreadyResolved();

        openClaimsCount[c.qualId]--;
        c.status = ClaimStatus.REJECTED;

        emit ClaimRejected(claimId, reasonHash);
    }

    /**
     * @notice IBondPool view method for claim records (used by UnderwriteVault and UI).
     */
    function claims(uint256 claimId)
        external
        view
        override
        returns (uint256 id, bytes32 qualId, uint256 paymentId, uint256 lossAmount, bytes32 evidenceHash, uint8 status)
    {
        Claim storage c = claimRecords[claimId];
        return (c.id, c.qualId, c.paymentId, c.lossAmount, c.evidenceHash, uint8(c.status));
    }

    /**
     * @notice View function to inspect full claim record.
     */
    function getClaim(uint256 claimId) external view returns (Claim memory) {
        return claimRecords[claimId];
    }
}
