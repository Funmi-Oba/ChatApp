import { bufferToBase64, importPublicKey } from "./keys";

// Encrypt a message for a recipient
// Returns everything the server needs to store
export const encryptMessage = async (
  plaintext,
  recipientPublicKeyBase64,
  senderPublicKeyBase64
) => {
  const enc = new TextEncoder();

  // 1. Generate a random AES-GCM key for this message
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt the plaintext with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    enc.encode(plaintext)
  );

  // 4. Export the raw AES key so we can encrypt it with RSA
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  // 5. Encrypt AES key with recipient's public key
  const recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAesKey
  );

  // 6. Encrypt AES key with sender's own public key (to read sent messages)
  const senderPublicKey = await importPublicKey(senderPublicKeyBase64);
  const encryptedKeyForSelf = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    senderPublicKey,
    rawAesKey
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
    encryptedKey: bufferToBase64(encryptedKey),
    encryptedKeyForSelf: bufferToBase64(encryptedKeyForSelf),
  };
};