# Security Specification for Playzi

## 1. Data Invariants
- **Users**: A user can only modify their own profile. Sensitive fields like `xp`, `level`, `coins`, and `gems` must not be directly modifiable by the client in a production app (usually handled via backend/Cloud Functions), but for this IR/Blueprint we will enforce strict key-level updates if allowed at all. For now, we allow the owner to update their profile but block identity spoofing.
- **Chats**: Access to messages is strictly derived from the chat's `participants` list.
- **Messages**: A user can only send messages as themselves.
- **Encryption**: If a chat is marked as encrypted, messages must also be marked as encrypted.
- **Expiry**: Ephemeral messages must have an `expiresAt` timestamp set to exactly 24 hours in the future if `autoDelete24h` is active.

## 2. The Dirty Dozen (Attack Vectors)

| ID | Attack Name | Payload | Target Path | Expected Result |
|----|-------------|---------|-------------|-----------------|
| 1  | Identity Spoofing | `{ "uid": "VICTIM_UID", ... }` | `/users/ATTACKER_UID` | DENIED |
| 2  | Shadow Field Injection | `{ "text": "Hi", "hiddenStatus": "admin" }` | `/chats/ID/messages/NEW` | DENIED |
| 3  | Project ID Poisoning | `{ "id": "VERY_LONG_ID_1000_CHARACTERS_..." }` | `/chats/LONG_ID` | DENIED |
| 4  | Relational Break-in | Attempt to read `/chats/PRIVATE_ID` | `/chats/PRIVATE_ID` | DENIED (if non-participant) |
| 5  | XP Inflation | `{ "xp": 999999 }` | `/users/OWN_UID` | DENIED (if restricted) |
| 6  | Message Impersonation | `{ "senderId": "VICTIM_UID", "text": "..." }` | `/chats/ID/messages/NEW` | DENIED |
| 7  | State Shortcut | `{ "security": { "isEncrypted": false } }` | `/chats/ENCRYPTED_ID` | DENIED (if non-participant) |
| 8  | Terminal State Bypass | Modify a hidden chat without PIN field (logic check) | `/chats/ID` | DENIED |
| 9  | Null Pointer attack | `allow read` using `request.resource.data` | Any Read | CRASH/DENIED |
| 10 | Blanket Query Leak | `where('public', '==', true)` on private data | `/users` | DENIED |
| 11 | PII Leakage | authenticated player reading another's `email` | `/users/TARGET` | DENIED (if isolated) |
| 12 | Denial of Wallet | 1MB string in `displayName` | `/users/OWN_UID` | DENIED |

## 3. Test Runner Plan
Using `vitest` or `jest` with the Firebase Security Rules emulator to verify these denials.
