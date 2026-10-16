// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title BondPoolErrors
 * @notice Standard typed custom errors for BondPool per DEC-020 and plan §9.7.
 */
interface BondPoolErrors {
    error NotUnderwriter();
    error NotVault();
    error NotAdjudicator();
    error VaultAlreadySet();
    error VaultNotSet();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientFreeBalance();
    error NoLockedCapital();
    error QualificationStillActive();
    error ClaimGraceNotElapsed();
    error OpenClaimsExist();
    error PaymentNotClaimable();
    error ClaimGraceExpired();
    error LossExceedsPaymentAmount();
    error ClaimAlreadyResolved();
    error ClaimNotFound();
}
