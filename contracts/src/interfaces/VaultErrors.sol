// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title VaultErrors
 * @notice Standard typed custom errors for UnderwriteVault per plan §9.7 and S5.
 */
interface VaultErrors {
    error NotOwner();
    error NotAgent();
    error NoActiveQualification();
    error QualificationExpired();
    error QualificationIsRevoked();
    error AttestationUsed();
    error BadSignature();
    error WrongVault();
    error RecipientNotAllowed();
    error RecipientCoolingDown();
    error ExceedsPerTx();
    error ExceedsWindow();
    error ExceedsRecipientWindow();
    error InsufficientBacking();
    error ReserveBreached();
    error DuplicateInvoice();
    error T2NotAllowed();
    error NotReady();
    error NotPending();
    error Paused();
    error BondLockFailed();
    error StaleExamCommit();
    error AlreadyReconciled();
    error Vetoed();

    // Admin authorization errors
    error InvalidAddress();
    error NotGuardianOrOwner();
    error NotExaminer();
    error NotBondPool();
}
