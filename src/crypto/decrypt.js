import { base64ToBuffer, getPrivateKey } from "./keys";

// Decrypt a received message using our private key
export const decryptMessage = async ({
  ciphertext,
  iv,
  encryptedKey,
  encryptedKeyForSelf,
  isSentByMe = false,
}) => {
  try {
    // 1. Load our private key from IndexedDB
    const privateKey = await getPrivateKey();
    if (!privateKey) throw new Error("Private key not found");

    // 2. Choose which encrypted AES key to use
    // If we sent the message, use encryptedKeyForSelf
    // If we received it, use encryptedKey
    const keyToDecrypt = isSentByMe ? encryptedKeyForSelf : encryptedKey;
    if (!keyToDecrypt) throw new Error("No encrypted key available");

    // 3. Decrypt the AES key using our RSA private key
    const rawAesKey = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      base64ToBuffer(keyToDecrypt)
    );

    // 4. Import the raw AES key
    const aesKey = await crypto.subtle.importKey(
      "raw",
      rawAesKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // 5. Decrypt the ciphertext
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuffer(iv) },
      aesKey,
      base64ToBuffer(ciphertext)
    );

    // 6. Decode to string
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.error("Decryption failed:", err);
    return "[Message could not be decrypted]";
  }
};