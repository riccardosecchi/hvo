/**
 * CDN Encryption Utilities
 * Web Crypto API wrappers for end-to-end encryption
 * Uses AES-GCM-256 for file encryption and PBKDF2 for key derivation
 */

import type {
  DerivedKeyData,
  EncryptedFileData,
  EncryptionMetadata,
  DecryptionSession,
} from '@/lib/types/cdn';

// ============================================
// CONSTANTS
// ============================================

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const SALT_LENGTH = 16; // 128 bits

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_DERIVATION_ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';

// ============================================
// SESSION STORAGE FOR KEYS (OPTIONAL)
// ============================================

const SESSION_KEY_PREFIX = 'cdn_encryption_session_';
const SESSION_EXPIRY_MINUTES = 30;

interface StoredSession {
  salt: string; // base64
  timestamp: number;
}

/**
 * Store encryption session in sessionStorage (with user consent)
 * Only stores salt, not the actual key or passphrase
 */
export function storeEncryptionSession(
  userId: string,
  salt: Uint8Array
): void {
  try {
    const session: StoredSession = {
      salt: arrayBufferToBase64(salt),
      timestamp: Date.now(),
    };
    sessionStorage.setItem(
      `${SESSION_KEY_PREFIX}${userId}`,
      JSON.stringify(session)
    );
  } catch (error) {
    console.error('Failed to store encryption session:', error);
  }
}

/**
 * Retrieve encryption session from sessionStorage
 */
export function getEncryptionSession(
  userId: string
): { salt: Uint8Array; isExpired: boolean } | null {
  try {
    const stored = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${userId}`);
    if (!stored) return null;

    const session: StoredSession = JSON.parse(stored);
    const age = Date.now() - session.timestamp;
    const isExpired = age > SESSION_EXPIRY_MINUTES * 60 * 1000;

    return {
      salt: base64ToArrayBuffer(session.salt),
      isExpired,
    };
  } catch (error) {
    console.error('Failed to retrieve encryption session:', error);
    return null;
  }
}

/**
 * Clear encryption session from sessionStorage
 */
export function clearEncryptionSession(userId: string): void {
  try {
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error('Failed to clear encryption session:', error);
  }
}

// ============================================
// KEY DERIVATION
// ============================================

/**
 * Derive a cryptographic key from a passphrase using PBKDF2
 * @param passphrase - User's passphrase
 * @param salt - Salt (optional, generates new if not provided)
 * @param iterations - PBKDF2 iterations (default 100,000)
 * @returns Derived key data with salt
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt?: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<DerivedKeyData> {
  // Generate salt if not provided
  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  }

  // Import passphrase as key material
  const encoder = new TextEncoder();
  const passphraseBuffer = encoder.encode(passphrase);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passphraseBuffer,
    KEY_DERIVATION_ALGORITHM,
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_ALGORITHM,
      salt: salt,
      iterations: iterations,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: AES_KEY_LENGTH },
    true, // extractable (for wrapping file keys)
    ['encrypt', 'decrypt']
  );

  // Clear sensitive data
  passphraseBuffer.fill(0);

  return {
    key,
    salt,
    iterations,
  };
}

// ============================================
// FILE KEY GENERATION
// ============================================

/**
 * Generate a random file encryption key (FEK)
 * @returns AES-GCM-256 key
 */
export async function generateFileKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: ENCRYPTION_ALGORITHM, length: AES_KEY_LENGTH },
    true, // extractable (for storage)
    ['encrypt', 'decrypt']
  );
}

// ============================================
// KEY WRAPPING/UNWRAPPING
// ============================================

/**
 * Encrypt (wrap) a file encryption key with a master key
 * @param fileKey - File encryption key to wrap
 * @param masterKey - Master key derived from passphrase
 * @returns Encrypted file key and IV
 */
export async function encryptFileKey(
  fileKey: CryptoKey,
  masterKey: CryptoKey
): Promise<{ encryptedKey: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Export file key as raw bytes
  const fileKeyBytes = await crypto.subtle.exportKey('raw', fileKey);

  // Encrypt file key with master key
  const encryptedKey = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv },
    masterKey,
    fileKeyBytes
  );

  return { encryptedKey, iv };
}

/**
 * Decrypt (unwrap) a file encryption key with a master key
 * @param encryptedKey - Encrypted file key
 * @param iv - Initialization vector used for encryption
 * @param masterKey - Master key derived from passphrase
 * @returns Decrypted file key
 */
export async function decryptFileKey(
  encryptedKey: ArrayBuffer,
  iv: Uint8Array,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  // Decrypt file key bytes
  const fileKeyBytes = await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv },
    masterKey,
    encryptedKey
  );

  // Import as CryptoKey
  const fileKey = await crypto.subtle.importKey(
    'raw',
    fileKeyBytes,
    { name: ENCRYPTION_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  return fileKey;
}

// ============================================
// FILE ENCRYPTION
// ============================================

/**
 * Encrypt a file with end-to-end encryption
 * @param fileData - File data as ArrayBuffer
 * @param passphrase - User's passphrase
 * @param salt - Optional salt (generates new if not provided)
 * @returns Encrypted file data and metadata
 */
export async function encryptFile(
  fileData: ArrayBuffer,
  passphrase: string,
  salt?: Uint8Array
): Promise<EncryptedFileData> {
  // Derive master key from passphrase
  const { key: masterKey, salt: keySalt } = await deriveKeyFromPassphrase(
    passphrase,
    salt
  );

  // Generate file encryption key (FEK)
  const fileKey = await generateFileKey();

  // Encrypt file data with FEK
  const dataIv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedData = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv: dataIv },
    fileKey,
    fileData
  );

  // Encrypt FEK with master key
  const { encryptedKey: encryptedFileKey, iv: keyIv } = await encryptFileKey(
    fileKey,
    masterKey
  );

  return {
    encryptedData,
    encryptedFileKey,
    dataIv,
    keyIv,
    salt: keySalt,
  };
}

/**
 * Encrypt a file in chunks (for large files)
 * @param file - File object
 * @param passphrase - User's passphrase
 * @param chunkSize - Chunk size in bytes (default 5MB)
 * @param onProgress - Progress callback
 * @returns Encrypted chunks and metadata
 */
export async function encryptFileInChunks(
  file: File,
  passphrase: string,
  chunkSize: number = 5 * 1024 * 1024,
  onProgress?: (progress: number) => void
): Promise<{
  encryptedChunks: Blob[];
  encryptedFileKey: ArrayBuffer;
  keyIv: Uint8Array;
  salt: Uint8Array;
  chunkIVs: Uint8Array[];
}> {
  // Derive master key
  const { key: masterKey, salt } = await deriveKeyFromPassphrase(passphrase);

  // Generate file encryption key
  const fileKey = await generateFileKey();

  // Encrypt FEK with master key
  const { encryptedKey: encryptedFileKey, iv: keyIv } = await encryptFileKey(
    fileKey,
    masterKey
  );

  // Encrypt file in chunks
  const encryptedChunks: Blob[] = [];
  const chunkIVs: Uint8Array[] = [];
  const totalChunks = Math.ceil(file.size / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // Read chunk
    const chunkData = await chunk.arrayBuffer();

    // Generate unique IV for this chunk
    const chunkIv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    chunkIVs.push(chunkIv);

    // Encrypt chunk
    const encryptedChunk = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM, iv: chunkIv },
      fileKey,
      chunkData
    );

    encryptedChunks.push(new Blob([encryptedChunk]));

    // Report progress
    if (onProgress) {
      onProgress(((i + 1) / totalChunks) * 100);
    }
  }

  return {
    encryptedChunks,
    encryptedFileKey,
    keyIv,
    salt,
    chunkIVs,
  };
}

// ============================================
// FILE DECRYPTION
// ============================================

/**
 * Decrypt a file with end-to-end encryption
 * @param encryptedData - Encrypted file data
 * @param encryptedFileKey - Encrypted file encryption key
 * @param dataIv - IV used for file data encryption
 * @param keyIv - IV used for key encryption
 * @param salt - Salt used for key derivation
 * @param passphrase - User's passphrase
 * @returns Decrypted file data
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  encryptedFileKey: ArrayBuffer,
  dataIv: Uint8Array,
  keyIv: Uint8Array,
  salt: Uint8Array,
  passphrase: string
): Promise<ArrayBuffer> {
  // Derive master key from passphrase
  const { key: masterKey } = await deriveKeyFromPassphrase(passphrase, salt);

  // Decrypt file encryption key
  const fileKey = await decryptFileKey(encryptedFileKey, keyIv, masterKey);

  // Decrypt file data
  const decryptedData = await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv: dataIv },
    fileKey,
    encryptedData
  );

  return decryptedData;
}

/**
 * Decrypt a file downloaded in chunks
 * @param encryptedChunks - Array of encrypted chunks
 * @param chunkIVs - IVs for each chunk
 * @param encryptedFileKey - Encrypted file encryption key
 * @param keyIv - IV for key encryption
 * @param salt - Salt for key derivation
 * @param passphrase - User's passphrase
 * @param onProgress - Progress callback
 * @returns Decrypted file as Blob
 */
export async function decryptFileInChunks(
  encryptedChunks: Blob[],
  chunkIVs: Uint8Array[],
  encryptedFileKey: ArrayBuffer,
  keyIv: Uint8Array,
  salt: Uint8Array,
  passphrase: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // Derive master key
  const { key: masterKey } = await deriveKeyFromPassphrase(passphrase, salt);

  // Decrypt file encryption key
  const fileKey = await decryptFileKey(encryptedFileKey, keyIv, masterKey);

  // Decrypt chunks
  const decryptedChunks: Blob[] = [];

  for (let i = 0; i < encryptedChunks.length; i++) {
    const encryptedChunk = await encryptedChunks[i].arrayBuffer();
    const chunkIv = chunkIVs[i];

    const decryptedChunk = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv: chunkIv },
      fileKey,
      encryptedChunk
    );

    decryptedChunks.push(new Blob([decryptedChunk]));

    if (onProgress) {
      onProgress(((i + 1) / encryptedChunks.length) * 100);
    }
  }

  return new Blob(decryptedChunks);
}

// ============================================
// ENCRYPTION METADATA
// ============================================

/**
 * Create encryption metadata object for database storage
 */
export function createEncryptionMetadata(
  iv: Uint8Array,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): EncryptionMetadata {
  return {
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    algorithm: 'AES-GCM-256',
    keyDerivation: {
      algorithm: 'PBKDF2',
      iterations,
      hash: 'SHA-256',
    },
  };
}

/**
 * Parse encryption metadata from database
 */
export function parseEncryptionMetadata(metadata: EncryptionMetadata): {
  iv: Uint8Array;
  salt: Uint8Array;
  iterations: number;
} {
  return {
    iv: base64ToArrayBuffer(metadata.iv),
    salt: base64ToArrayBuffer(metadata.salt),
    iterations: metadata.keyDerivation?.iterations ?? PBKDF2_ITERATIONS,
  };
}

// ============================================
// PASSPHRASE VALIDATION
// ============================================

/**
 * Validate passphrase strength
 * @returns Object with valid flag and error message
 */
export function validatePassphrase(passphrase: string): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} {
  const errors: string[] = [];

  if (passphrase.length < 12) {
    errors.push('Passphrase must be at least 12 characters');
  }

  if (!/[a-z]/.test(passphrase)) {
    errors.push('Include lowercase letters');
  }

  if (!/[A-Z]/.test(passphrase)) {
    errors.push('Include uppercase letters');
  }

  if (!/[0-9]/.test(passphrase)) {
    errors.push('Include numbers');
  }

  if (!/[^a-zA-Z0-9]/.test(passphrase)) {
    errors.push('Include special characters');
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    strength = 'strong';
  } else if (errors.length <= 2) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    strength,
    errors,
  };
}

/**
 * Generate a random secure passphrase
 * @param length - Passphrase length (default 24)
 * @returns Random passphrase
 */
export function generateRandomPassphrase(length: number = 24): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues)
    .map((value) => charset[value % charset.length])
    .join('');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Create a Blob URL from decrypted data
 * @param data - Decrypted file data
 * @param mimeType - MIME type
 * @returns Blob URL
 */
export function createBlobUrl(
  data: ArrayBuffer | Blob,
  mimeType: string
): string {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Revoke a Blob URL to free memory
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Check if Web Crypto API is available
 */
export function isWebCryptoAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.encrypt === 'function'
  );
}

// ============================================
// ERROR HANDLING
// ============================================

export class EncryptionError extends Error {
  constructor(
    message: string,
    public code:
      | 'WEAK_PASSPHRASE'
      | 'DECRYPTION_FAILED'
      | 'ENCRYPTION_FAILED'
      | 'KEY_GENERATION_FAILED'
      | 'UNSUPPORTED_BROWSER'
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Verify decryption is possible (test decrypt)
 * @returns true if passphrase is correct
 */
export async function verifyPassphrase(
  encryptedFileKey: ArrayBuffer,
  keyIv: Uint8Array,
  salt: Uint8Array,
  passphrase: string
): Promise<boolean> {
  try {
    const { key: masterKey } = await deriveKeyFromPassphrase(passphrase, salt);
    await decryptFileKey(encryptedFileKey, keyIv, masterKey);
    return true;
  } catch {
    return false;
  }
}
