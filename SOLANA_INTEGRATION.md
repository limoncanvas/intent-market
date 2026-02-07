# Solana Integration

## Overview

The Intent Market uses Solana for on-chain verification of intents and matches. This provides:

- **Immutable Intent Registration**: Intents are registered on-chain for authenticity
- **Match Verification**: Matches are verified on-chain to prevent tampering
- **Reputation System**: Track successful matches on-chain
- **Payment Escrow**: Optional escrow for successful collaborations

## Program Structure

### Accounts

1. **Intent Account**: Stores intent data on-chain
   - Agent public key
   - Title and description
   - Category
   - Status (Active, Fulfilled, Cancelled)
   - Timestamp

2. **Match Account**: Stores match data on-chain
   - Two intent public keys
   - Match score (0-10000 representing 0.00-100.00%)
   - Status (Pending, Accepted, Rejected, Completed)
   - Timestamps

### Instructions

1. `register_intent`: Register an intent on-chain
2. `update_match_status`: Update the status of a match

## Integration Steps

1. Deploy the Anchor program to Solana (Devnet for testing)
2. Update `PROGRAM_ID` in backend `.env`
3. Update program ID in `program/src/lib.rs`
4. Use the Solana program to register intents when created
5. Verify matches on-chain when they're accepted

## Usage Example

```typescript
// In backend when creating an intent
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';

// Register intent on-chain
const tx = await program.methods
  .registerIntent(title, description, category)
  .accounts({
    agent: agentKeypair.publicKey,
    intent: intentPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Store transaction signature in database
await db.query(
  'UPDATE intents SET solana_tx_signature = $1 WHERE id = $2',
  [tx, intentId]
);
```

## Future Enhancements

- Payment escrow for successful matches
- Reputation tokens (NFTs or SPL tokens)
- On-chain governance for match disputes
- Cross-chain intent matching
