// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IBondPool
 * @notice Interface for BondPool interaction with UnderwriteVault per plan §9.7.
 */
interface IBondPool {
    /// @notice Vault calls to lock bond capital backing a qualification.
    function lock(bytes32 qualId, uint256 amount) external;

    /// @notice Vault queries remaining available bond backing for qualId.
    function remaining(bytes32 qualId) external view returns (uint256);

    /// @notice Vault calls to release locked bond capital upon revocation/expiry.
    function release(bytes32 qualId) external;

    /// @notice BondPool queries vault whether payment is claimable (T1, not reconciled, not claimed).
    function isClaimable(uint256 paymentId) external view returns (bool);

    /// @notice BondPool calls vault during claim execution to suspend qualification and update exposure.
    function suspendForClaim(bytes32 qualId, uint256 claimId) external;

    /// @notice Query claim record to retrieve paymentId associated with claim.
    function claims(uint256 claimId)
        external
        view
        returns (uint256 id, bytes32 qualId, uint256 paymentId, uint256 lossAmount, bytes32 evidenceHash, uint8 status);
}
