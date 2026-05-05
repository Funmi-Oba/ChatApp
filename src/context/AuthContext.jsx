import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, logoutUser, registerUser } from "../api/auth";
import {
  deriveWrappingKey,
  unwrapPrivateKey,
  storePrivateKey,
  storePublicKey,
  importPublicKey,
  generateSalt,
  generateKeyPair,
  exportPublicKey,
  wrapPrivateKey,
  bufferToBase64,
} from "../crypto/keys";
import { clearAllKeys } from "../crypto/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  // ── Register ────────────────────────────────────────────
  const register = async ({ username, email, password }) => {
    try {
      console.log("1. Generating key pair...");
      const keyPair = await generateKeyPair();
      console.log("2. Key pair generated ✅");

      const salt = generateSalt();
      console.log("3. Salt generated ✅");

      const wrappingKey = await deriveWrappingKey(password, salt);
      console.log("4. Wrapping key derived ✅");

      const wrappedPrivateKey = await wrapPrivateKey(
        keyPair.privateKey,
        wrappingKey
      );
      console.log("5. Private key wrapped ✅");

      const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
      console.log("6. Public key exported ✅");

      const saltBase64 = bufferToBase64(salt);

      console.log("7. Sending to server...");
      const data = await registerUser({
        username,
        email,
        password,
        displayName: username,
        publicKey: publicKeyBase64,
        wrappedPrivateKey,
        pbkdf2Salt: saltBase64,
      });
      console.log("8. Server response ✅", data);

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log("9. Tokens stored ✅");

      await storePrivateKey(keyPair.privateKey);
      await storePublicKey(keyPair.publicKey);
      console.log("10. Keys stored in IndexedDB ✅");

      setUser(data.user);
      return data;
    } catch (err) {
      console.error("Registration error at step:", err);
      throw err;
    }
  };

  // ── Login ───────────────────────────────────────────────
  const login = async ({ email, password }) => {
    try {
      console.log("Login 1. Calling API...");
      const data = await loginUser({ email, password });
      console.log("Login 2. API response ✅", data);

      // Store tokens first
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log("Login 3. Tokens stored ✅");

      // Decode the salt — handle both regular and URL-safe base64
      const saltBase64 = data.pbkdf2_salt
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      // Pad if necessary
      const padding = saltBase64.length % 4;
      const paddedSalt =
        padding === 0
          ? saltBase64
          : saltBase64 + "=".repeat(4 - padding);

      const saltBuffer = Uint8Array.from(
        atob(paddedSalt),
        (c) => c.charCodeAt(0)
      );
      console.log("Login 4. Salt decoded ✅");

      // Re-derive wrapping key from password + salt
      const wrappingKey = await deriveWrappingKey(password, saltBuffer);
      console.log("Login 5. Wrapping key derived ✅");

      // Unwrap private key
      const privateKey = await unwrapPrivateKey(
        data.wrapped_private_key,
        wrappingKey
      );
      console.log("Login 6. Private key unwrapped ✅");

      // Import public key
      const publicKey = await importPublicKey(data.user.public_key);
      console.log("Login 7. Public key imported ✅");

      // Store in IndexedDB
      await storePrivateKey(privateKey);
      await storePublicKey(publicKey);
      console.log("Login 8. Keys stored in IndexedDB ✅");

      setUser(data.user);
      return data;
    } catch (err) {
      console.error("Login failed at:", err);
      // Clean up on failure
      localStorage.clear();
      await clearAllKeys();
      throw err;
    }
  };

  // ── Logout ──────────────────────────────────────────────
  const logout = async () => {
  try {
    await logoutUser();
  } catch (_) {}
  localStorage.clear();
  await clearAllKeys();
  setUser(null);
  window.location.href = "/login";
};

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);