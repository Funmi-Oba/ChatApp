import client from "./client";

// Search for users by name or username
export const searchUsers = async (query) => {
  const res = await client.get(`/users/search?q=${query}`);
  return res.data;
};

// Get a user's public key so we can encrypt messages for them
export const getUserPublicKey = async (userId) => {
  const res = await client.get(`/users/${userId}/public-key`);
  return res.data;
};

// Get current logged in user profile
export const getMe = async () => {
  const res = await client.get("/users/me");
  return res.data;
};