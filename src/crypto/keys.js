import { saveKey, loadKey } from "./storage";

// ─── Helpers ──────────────────────────────────────────────

// Convert ArrayBuffer to Base64 string (for sending to server)
export const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

// Convert Base64 string back to ArrayBuffer (for crypto operations)
export const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// ─── Key Generation ───────────────────────────────────────

// Generate RSA-OAEP keypair
export const generateKeyPair = async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
  return keyPair;
};

// Generate a random PBKDF2 salt
export const generateSalt = () => {
  return crypto.getRandomValues(new Uint8Array(16));
};

// ─── Password-Based Wrapping Key ──────────────────────────

// Derive an AES-KW key from the user's password + salt
// This is used to wrap/unwrap the private key
// Derive an AES-GCM key from the user's password + salt
export const deriveWrappingKey = async (password, salt) => {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt instanceof Uint8Array ? salt : new Uint8Array(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};
// ─── Wrap / Unwrap Private Key ────────────────────────────

// Wrap (encrypt) the private key using the password-derived key
// Wrap private key using AES-GCM
export const wrapPrivateKey = async (privateKey, wrappingKey) => {
  const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    exported
  );

  // Combine iv + encrypted into one blob
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);
  return bufferToBase64(combined.buffer);
};

// Unwrap (decrypt) the private key using the password-derived key
// Unwrap private key using AES-GCM
export const unwrapPrivateKey = async (wrappedKeyBase64, wrappingKey) => {
  const combined = new Uint8Array(base64ToBuffer(wrappedKeyBase64));

  // Split iv and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    encrypted
  );

  return crypto.subtle.importKey(
    "pkcs8",
    decrypted,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

// ─── Export / Import Public Key ───────────────────────────

// Export public key to Base64 (to send to server)
export const exportPublicKey = async (publicKey) => {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return bufferToBase64(exported);
};

// Import a public key from Base64 (received from server)
export const importPublicKey = async (base64Key) => {
  const buffer = base64ToBuffer(base64Key);
  return crypto.subtle.importKey(
    "spki",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
};

// ─── Session Storage (IndexedDB) ─────────────────────────

// Save private key to IndexedDB for the session
export const storePrivateKey = async (privateKey) => {
  await saveKey("private_key", privateKey);
};

// Load private key from IndexedDB
export const getPrivateKey = async () => {
  return loadKey("private_key");
};

// Save own public key to IndexedDB
export const storePublicKey = async (publicKey) => {
  await saveKey("public_key", publicKey);
};

// Load own public key from IndexedDB
export const getPublicKey = async () => {
  return loadKey("public_key");
};