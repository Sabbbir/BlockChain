/**
 * Client-Side Encryption Library
 *
 * Uses the Web Crypto API (AES-256-GCM) for file encryption/decryption.
 * All encryption happens IN THE BROWSER — raw data never leaves the client.
 *
 * Flow:
 *   1. Generate random AES-256 key
 *   2. Encrypt file with AES-256-GCM (authenticated encryption)
 *   3. Export key as base64 for storage/sharing
 *   4. For decryption: import key → decrypt ciphertext
 */

/**
 * Generate a random AES-256-GCM encryption key.
 * @returns {Promise<CryptoKey>} The generated key.
 */
export async function generateEncryptionKey() {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable — needed so we can export/share the key
    ["encrypt", "decrypt"]
  );
}

/**
 * Export a CryptoKey to a base64 string (for storage/sharing).
 * @param {CryptoKey} key - The key to export.
 * @returns {Promise<string>} Base64-encoded raw key bytes.
 */
export async function exportKey(key) {
  const rawKey = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(rawKey)));
}

/**
 * Import a base64-encoded key string back into a CryptoKey.
 * @param {string} base64Key - The base64-encoded key.
 * @returns {Promise<CryptoKey>} The imported CryptoKey.
 */
export async function importKey(base64Key) {
  const rawKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a file using AES-256-GCM.
 *
 * Output format: [12-byte IV] + [ciphertext + auth tag]
 * The IV is prepended to the ciphertext so it can be extracted during decryption.
 *
 * @param {File|Blob} file - The file to encrypt.
 * @param {CryptoKey} key - The AES-256-GCM key.
 * @returns {Promise<{encryptedBlob: Blob, iv: Uint8Array, timeTaken: number}>}
 */
export async function encryptFile(file, key) {
  const startTime = performance.now();

  // Generate random 12-byte IV (96-bit, recommended for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Read file into ArrayBuffer
  const fileData = await file.arrayBuffer();

  // Encrypt with AES-256-GCM (provides both confidentiality and integrity)
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileData
  );

  // Prepend IV to ciphertext: [IV (12 bytes)] + [ciphertext + GCM auth tag]
  const encryptedData = new Uint8Array(iv.length + ciphertext.byteLength);
  encryptedData.set(iv, 0);
  encryptedData.set(new Uint8Array(ciphertext), iv.length);

  const timeTaken = performance.now() - startTime;

  return {
    encryptedBlob: new Blob([encryptedData]),
    iv: iv,
    timeTaken: timeTaken,
    originalSize: fileData.byteLength,
    encryptedSize: encryptedData.byteLength,
  };
}

/**
 * Decrypt an encrypted file using AES-256-GCM.
 *
 * Expects input format: [12-byte IV] + [ciphertext + auth tag]
 *
 * @param {ArrayBuffer|Blob} encryptedData - The encrypted data (IV + ciphertext).
 * @param {CryptoKey} key - The AES-256-GCM key.
 * @returns {Promise<{decryptedBlob: Blob, timeTaken: number}>}
 */
export async function decryptFile(encryptedData, key) {
  const startTime = performance.now();

  // Convert Blob to ArrayBuffer if needed
  let dataBuffer;
  if (encryptedData instanceof Blob) {
    dataBuffer = await encryptedData.arrayBuffer();
  } else {
    dataBuffer = encryptedData;
  }

  const dataArray = new Uint8Array(dataBuffer);

  // Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = dataArray.slice(0, 12);
  const ciphertext = dataArray.slice(12);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  const timeTaken = performance.now() - startTime;

  return {
    decryptedBlob: new Blob([decrypted]),
    timeTaken: timeTaken,
    decryptedSize: decrypted.byteLength,
  };
}

/**
 * Encrypt a string (e.g., an AES key) with a password using PBKDF2 + AES-GCM.
 * Used for password-protecting encryption keys.
 *
 * @param {string} plaintext - The string to encrypt.
 * @param {string} password - The password to derive the key from.
 * @returns {Promise<string>} Base64-encoded encrypted data.
 */
export async function encryptWithPassword(plaintext, password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from password
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(plaintext)
  );

  // Format: [salt (16)] + [iv (12)] + [ciphertext]
  const result = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...result));
}

/**
 * Decrypt a password-encrypted string.
 *
 * @param {string} encryptedBase64 - Base64-encoded encrypted data.
 * @param {string} password - The password used during encryption.
 * @returns {Promise<string>} The decrypted plaintext string.
 */
export async function decryptWithPassword(encryptedBase64, password) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const data = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  );

  return decoder.decode(decrypted);
}
