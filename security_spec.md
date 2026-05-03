# Security Specification for SkinClinic B&A

## 1. Data Invariants
- A `Comparison` must have a valid `staffId` matching the current user.
- A `Comparison` must have at least one `beforeImage` and one `afterImage`.
- Only a `manager` can update `categories` (config).
- Users can only read their own `User` profile unless they are a `manager`.
- `Comparison` records are immutable once created (mostly), or only certain fields can be updated by manager if needed. For now, let's say they are logs.

## 2. The "Dirty Dozen" Payloads (Deny List)
1. **Identity Spoofing**: Create a comparison with someone else's `staffId`.
2. **Privilege Escalation**: Update own role to `manager`.
3. **Invalid Category**: Create a category without a name.
4. **ID Poisoning**: Create a document with a 2KB junk character string as ID.
5. **Orphaned Write**: Create a comparison for a category that doesn't exist.
6. **Shadow Field**: Adding `isAdmin: true` to a comparison object.
7. **Size Attack**: Sending a `beforeImages` array with 10,000 elements.
8. **PII Leak**: A staff member reading the entire `users` collection.
9. **State Shortcut**: Setting a comparison status to `completed` without AI feedback.
10. **Timestamp Spoofing**: Providing a `createdAt` from 1999.
11. **Type Poisoning**: Sending `checklist` results as a string instead of object.
12. **Blanket Read Attack**: Querying `/comparisons` without any filters.

## 3. Test Runner (Draft)
Verification will be done via manual inspection and code analysis as per environment limits.
