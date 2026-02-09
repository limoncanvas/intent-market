/**
 * Arcium encryption utilities for private intents.
 *
 * Uses Arcium's x25519 key exchange + Rescue cipher (an arithmetization-friendly
 * symmetric cipher) to encrypt intent data client-side. This ensures private
 * intents are encrypted at rest — only the poster can decrypt them.
 *
 * Flow:
 *  1. Generate ephemeral x25519 keypair
 *  2. Derive shared secret from ephemeral private key + a deterministic "MXE" key
 *     (in production this would be the on-chain MXE public key from an Arcium cluster)
 *  3. Encrypt plaintext using Rescue cipher in CTR mode
 *  4. Store ciphertext + ephemeral public key + nonce — only the poster's
 *     ephemeral private key (derived from wallet signature) can recreate the shared secret
 */

import { x25519, RescueCipher } from '@arcium-hq/client'

// ── Text <-> BigInt conversion ───────────────────────────────────────

/** Encode a UTF-8 string into an array of bigints (each holding up to 31 bytes). */
function textToBigints(text: string): bigint[] {
  const bytes = new TextEncoder().encode(text)
  const chunkSize = 31 // leave room within 32-byte field element
  const result: bigint[] = []
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    let val = 0n
    for (let j = 0; j < chunk.length; j++) {
      val |= BigInt(chunk[j]) << BigInt(j * 8)
    }
    // Encode the chunk length in the top byte so we can reconstruct exactly
    val |= BigInt(chunk.length) << BigInt(31 * 8)
    result.push(val)
  }
  return result
}

/** Decode an array of bigints back into a UTF-8 string. */
function bigintsToText(values: bigint[]): string {
  const chunks: Uint8Array[] = []
  for (const val of values) {
    const len = Number((val >> BigInt(31 * 8)) & 0xFFn)
    const chunk = new Uint8Array(len)
    for (let j = 0; j < len; j++) {
      chunk[j] = Number((val >> BigInt(j * 8)) & 0xFFn)
    }
    chunks.push(chunk)
  }
  const total = chunks.reduce((s, c) => s + c.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) { merged.set(c, offset); offset += c.length }
  return new TextDecoder().decode(merged)
}

// ── Deterministic key derivation from wallet ─────────────────────────

/**
 * Derive a deterministic x25519 private key from a wallet signature.
 * The user signs a fixed message; the signature bytes become the seed.
 */
export async function deriveEncryptionKey(
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>
): Promise<Uint8Array> {
  const msg = new TextEncoder().encode('arcium-intent-market-encryption-key-v1')
  const sig = await signMessage(msg)
  // Use first 32 bytes of signature as x25519 private key seed
  return sig.slice(0, 32)
}

// ── Encrypt / Decrypt ────────────────────────────────────────────────

export interface EncryptedPayload {
  /** Ephemeral x25519 public key (hex) */
  pubkey: string
  /** 16-byte nonce (hex) */
  nonce: string
  /** Ciphertext blocks (array of 32-byte arrays, base64-encoded) */
  ciphertext: string
}

/**
 * Encrypt a plaintext string using Arcium's Rescue cipher.
 * Returns a JSON-serializable payload.
 */
export function encryptText(text: string, privateKey: Uint8Array): EncryptedPayload {
  const publicKey = x25519.getPublicKey(privateKey)
  // Self-encrypt: shared secret from own keypair (in production, would use MXE pubkey)
  const sharedSecret = x25519.getSharedSecret(privateKey, publicKey)

  const cipher = new RescueCipher(sharedSecret)
  const nonce = crypto.getRandomValues(new Uint8Array(16))
  const plainBigints = textToBigints(text)
  const ciphertext = cipher.encrypt(plainBigints, nonce)

  return {
    pubkey: Buffer.from(publicKey).toString('hex'),
    nonce: Buffer.from(nonce).toString('hex'),
    ciphertext: JSON.stringify(ciphertext),
  }
}

/**
 * Decrypt an EncryptedPayload back to plaintext.
 */
export function decryptText(payload: EncryptedPayload, privateKey: Uint8Array): string {
  const publicKey = x25519.getPublicKey(privateKey)
  const sharedSecret = x25519.getSharedSecret(privateKey, publicKey)

  const cipher = new RescueCipher(sharedSecret)
  const nonce = Buffer.from(payload.nonce, 'hex')
  const ciphertext: number[][] = JSON.parse(payload.ciphertext)
  const decrypted = cipher.decrypt(ciphertext, nonce)

  return bigintsToText(decrypted)
}
