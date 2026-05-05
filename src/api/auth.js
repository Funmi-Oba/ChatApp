import client from "./client";
import axios from "axios";

const BASE_URL = "https://whisperbox.koyeb.app";

export const registerUser = async ({
  username,
  email,
  password,
   displayName,
  publicKey,
  wrappedPrivateKey,
  pbkdf2Salt,
}) => {
  const payload = {
    username,
    email,
    password,
    display_name: username,
    public_key: publicKey,
    wrapped_private_key: wrappedPrivateKey,
    pbkdf2_salt: pbkdf2Salt,
  };

  console.log("Sending to server:", JSON.stringify(payload, null, 2));

  try {
    const res = await client.post("/auth/register", payload);
    return res.data;
  } catch (err) {
    console.error("Server error response:", JSON.stringify(err.response?.data, null, 2));
    throw err;
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const res = await client.post("/auth/login", { 
      username: email,
      password 
    });
    return res.data;
  } catch (err) {
    console.error("Login error response:", JSON.stringify(err.response?.data, null, 2));
    throw err;
  }
};

export const refreshToken = async (refresh_token) => {
  const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token });
  return res.data;
};

export const logoutUser = async () => {
  try {
    const refresh_token = localStorage.getItem("refresh_token");
    const access_token = localStorage.getItem("access_token");
    if (refresh_token && access_token) {
      await client.post("/auth/logout", { refresh_token });
    }
  } catch (err) {
    // Ignore logout errors — we still clear locally
    console.log("Logout API error (ignored):", err.message);
  }
};