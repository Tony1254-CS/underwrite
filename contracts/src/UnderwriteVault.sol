// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IBondPool } from "./interfaces/IBondPool.sol";
import { VaultErrors } from "./interfaces/VaultErrors.sol";

/**
 * @title UnderwriteVault
 * @notice Autonomous AI payment wallet vault enforcing hard invariants, EIP-712 qualifications,
 *         exposure caps, and challenge periods for accounts payable.
 */
contract UnderwriteVault is VaultErrors {
    // --- Data structures ---

    struct Ceilings {
        uint256 perTx;
        uint256 perWindow;
        uint256 t2PerTx;
    }

    struct Recipient {
        bool active;
        uint256 activatesAt;
        uint256 perWindowCap;
    }

    struct QualificationAttestation {
        bytes32 qualId;
        address vault;
        address agentKey;
        bytes32 configHash;
        bytes32 reportHash;
        bytes32 corpusHash;
        uint256 examCommitId;
        bytes32 ownerInputsHash;
        uint256 t1MaxPerTx;
        uint256 t1MaxPerWindow;
        uint256 t2MaxPerTx;
        bool t2Allowed;
        uint256 issuedAt;
        uint256 expiresAt;
        address examiner;
    }

    struct StoredQualification {
        QualificationAttestation attestation;
        bool active;
        bool revoked;
        uint256 activatedAt;
        uint256 effectiveT1MaxPerTx;
        uint256 effectiveT1MaxPerWindow;
        uint256 effectiveT2MaxPerTx;
    }

    enum InvoiceStatus {
        NONE,
        RESERVED,
        PAID
    }

    enum PendingStatus {
        NONE,
        PENDING,
        EXECUTED,
        VETOED
    }

    struct PendingPayment {
        bytes32 qualId;
        address recipient;
        uint256 amount;
        bytes32 invoiceKey;
        bytes32 memoHash;
        uint256 readyAt;
        PendingStatus status;
    }

    struct PaymentRecord {
        bytes32 qualId;
        address recipient;
        uint256 amount;
        bytes32 invoiceKey;
        uint8 tier;
        uint256 timestamp;
        bool reconciled;
    }

    struct ExamCommit {
        uint256 commitId;
        bytes32 corpusHash;
        uint256 committedAt;
    }

    // --- Constants ---

    bytes32 public constant ATTESTATION_TYPEHASH = keccak256(
        "QualificationAttestation(bytes32 qualId,address vault,address agentKey,bytes32 configHash,bytes32 reportHash,bytes32 corpusHash,uint256 examCommitId,bytes32 ownerInputsHash,uint256 t1MaxPerTx,uint256 t1MaxPerWindow,uint256 t2MaxPerTx,bool t2Allowed,uint256 issuedAt,uint256 expiresAt,address examiner)"
    );

    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    bytes32 public constant DOMAIN_NAME_HASH = keccak256("UnderwriteVault");
    bytes32 public constant DOMAIN_VERSION_HASH = keccak256("1");

    // --- Immutables ---

    IERC20 public immutable token;
    IBondPool public immutable bondPool;

    // --- State variables ---

    address public owner;
    address public examiner;
    address public guardian;
    bool public paused;

    Ceilings public ceilings;
    uint256 public windowSeconds;
    uint256 public reserveFloor;
    uint256 public challengePeriod;
    uint256 public recipientCooldown;

    mapping(address => Recipient) public recipients;
    mapping(bytes32 => StoredQualification) public quals;
    mapping(address => bytes32) public activeQualOf;
    bytes32[] public activeQualList;
    mapping(bytes32 => bool) public usedAttestation;

    mapping(bytes32 => InvoiceStatus) public invoiceState;
    mapping(bytes32 => mapping(uint256 => uint256)) public qualWindowSpent;
    mapping(address => mapping(uint256 => uint256)) public recipientWindowSpent;

    mapping(uint256 => PendingPayment) public pending;
    mapping(uint256 => PaymentRecord) public payments;
    mapping(bytes32 => ExamCommit) public examCommits;

    mapping(bytes32 => uint256) public exposure;
    mapping(bytes32 => bytes32) public ownerInputsHashOf;

    // Sequential IDs
    uint256 public nextPaymentId = 1;
    uint256 public nextPendingId = 1;

    // Custom errors are inherited from VaultErrors interface

    // --- Events ---

    event QualificationActivated(
        bytes32 indexed qualId,
        address indexed agentKey,
        uint256 t1MaxPerTx,
        uint256 t1MaxPerWindow,
        uint256 t2MaxPerTx,
        uint256 expiresAt
    );
    event QualificationRevoked(bytes32 indexed qualId, bytes32 indexed reasonHash);
    event PaymentExecuted(
        uint256 indexed paymentId,
        bytes32 indexed qualId,
        address indexed recipient,
        uint256 amount,
        bytes32 invoiceKey,
        uint8 tier
    );
    event PaymentRequested(
        uint256 indexed id, bytes32 indexed qualId, address indexed recipient, uint256 amount, uint256 readyAt
    );
    event PaymentVetoed(uint256 indexed id, address indexed caller);
    event ExamCommitted(bytes32 indexed configHash, bytes32 indexed corpusHash, uint256 commitId);
    event PaymentsReconciled(bytes32 indexed qualId, uint256 upToPaymentId, uint256 totalReconciledAmount);

    event RecipientAdded(address indexed recipient, uint256 perWindowCap, uint256 activatesAt);
    event RecipientDeactivated(address indexed recipient);
    event CeilingsUpdated(uint256 perTx, uint256 perWindow, uint256 t2PerTx);
    event ReserveUpdated(uint256 reserveFloor);
    event ChallengePeriodUpdated(uint256 challengePeriod);
    event RecipientCooldownUpdated(uint256 recipientCooldown);
    event ExaminerUpdated(address indexed examiner);
    event GuardianUpdated(address indexed guardian);
    event PausedStateChanged(bool paused);
    event OwnerTransferExecuted(address indexed to, uint256 amount);

    // --- Constructor ---

    constructor(
        address _owner,
        address _examiner,
        address _guardian,
        address _bondPool,
        address _token,
        Ceilings memory _ceilings,
        uint256 _windowSeconds,
        uint256 _reserveFloor,
        uint256 _challengePeriod,
        uint256 _recipientCooldown
    ) {
        if (_owner == address(0) || _examiner == address(0) || _guardian == address(0) || _token == address(0)) {
            revert InvalidAddress();
        }

        owner = _owner;
        examiner = _examiner;
        guardian = _guardian;
        bondPool = IBondPool(_bondPool);
        token = IERC20(_token);

        ceilings = _ceilings;
        windowSeconds = _windowSeconds;
        reserveFloor = _reserveFloor;
        challengePeriod = _challengePeriod;
        recipientCooldown = _recipientCooldown;
    }

    // --- Modifiers ---

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyGuardianOrOwner() {
        if (msg.sender != owner && msg.sender != guardian) revert NotGuardianOrOwner();
        _;
    }

    // --- Version and Domain Separator ---

    function VERSION() external pure returns (string memory) {
        return "1.0.0";
    }

    function domainSeparator() public view returns (bytes32) {
        return keccak256(
            abi.encode(EIP712_DOMAIN_TYPEHASH, DOMAIN_NAME_HASH, DOMAIN_VERSION_HASH, block.chainid, address(this))
        );
    }

    // --- Admin Functions (P1-T03) ---

    function addRecipient(address addr, uint256 perWindowCap) external onlyOwner {
        if (addr == address(0)) revert InvalidAddress();
        uint256 activatesAt = block.timestamp + recipientCooldown;
        recipients[addr] = Recipient({ active: true, activatesAt: activatesAt, perWindowCap: perWindowCap });
        emit RecipientAdded(addr, perWindowCap, activatesAt);
    }

    function deactivateRecipient(address addr) external onlyOwner {
        recipients[addr].active = false;
        emit RecipientDeactivated(addr);
    }

    function setCeilings(Ceilings calldata newCeilings) external onlyOwner {
        ceilings = newCeilings;

        // Re-evaluate limits for all active qualifications:
        // Lowering takes effect immediately; raising never lifts above attested limits.
        uint256 len = activeQualList.length;
        for (uint256 i = 0; i < len; i++) {
            bytes32 qualId = activeQualList[i];
            StoredQualification storage q = quals[qualId];
            if (q.active && !q.revoked) {
                if (newCeilings.perTx < q.attestation.t1MaxPerTx) {
                    q.effectiveT1MaxPerTx = newCeilings.perTx;
                } else {
                    q.effectiveT1MaxPerTx = q.attestation.t1MaxPerTx;
                }

                if (newCeilings.perWindow < q.attestation.t1MaxPerWindow) {
                    q.effectiveT1MaxPerWindow = newCeilings.perWindow;
                } else {
                    q.effectiveT1MaxPerWindow = q.attestation.t1MaxPerWindow;
                }

                if (newCeilings.t2PerTx < q.attestation.t2MaxPerTx) {
                    q.effectiveT2MaxPerTx = newCeilings.t2PerTx;
                } else {
                    q.effectiveT2MaxPerTx = q.attestation.t2MaxPerTx;
                }
            }
        }

        emit CeilingsUpdated(newCeilings.perTx, newCeilings.perWindow, newCeilings.t2PerTx);
    }

    function setReserve(uint256 _reserveFloor) external onlyOwner {
        reserveFloor = _reserveFloor;
        emit ReserveUpdated(_reserveFloor);
    }

    function setChallengePeriod(uint256 _challengePeriod) external onlyOwner {
        challengePeriod = _challengePeriod;
        emit ChallengePeriodUpdated(_challengePeriod);
    }

    function setCooldown(uint256 _recipientCooldown) external onlyOwner {
        recipientCooldown = _recipientCooldown;
        emit RecipientCooldownUpdated(_recipientCooldown);
    }

    function setExaminer(address _examiner) external onlyOwner {
        if (_examiner == address(0)) revert InvalidAddress();
        examiner = _examiner;
        emit ExaminerUpdated(_examiner);
    }

    function setGuardian(address _guardian) external onlyOwner {
        if (_guardian == address(0)) revert InvalidAddress();
        guardian = _guardian;
        emit GuardianUpdated(_guardian);
    }

    function pause() external onlyGuardianOrOwner {
        paused = true;
        emit PausedStateChanged(true);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit PausedStateChanged(false);
    }

    function ownerTransfer(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        token.transfer(to, amount);
        emit OwnerTransferExecuted(to, amount);
    }
}
