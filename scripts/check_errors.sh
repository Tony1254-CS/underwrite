#!/usr/bin/env bash
set -e
cd contracts
for e in NotOwner NotAgent NoActiveQualification QualificationExpired QualificationRevoked AttestationUsed BadSignature WrongVault RecipientNotAllowed RecipientCoolingDown ExceedsPerTx ExceedsWindow ExceedsRecipientWindow InsufficientBacking ReserveBreached DuplicateInvoice T2NotAllowed NotReady NotPending Paused BondLockFailed StaleExamCommit AlreadyReconciled Vetoed; do
  grep -rqE "$e(\.selector|\(\))" test || echo "MISSING $e"
done
