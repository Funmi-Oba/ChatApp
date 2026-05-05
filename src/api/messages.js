import client from "./client";

// Get all conversations
export const getConversations = async () => {
  const res = await client.get("/conversations");
  return res.data;
};

// Get message history with a specific user (paginated)
export const getMessageHistory = async (userId, before = null) => {
  const url = before
    ? `/conversations/${userId}/messages?before=${before}`
    : `/conversations/${userId}/messages`;
  const res = await client.get(url);
  return res.data;
};

// REST fallback — used when WebSocket is unavailable
export const sendMessageREST = async ({
  recipientId,
  ciphertext,
  iv,
  encryptedKey,
  encryptedKeyForSelf,
}) => {
  const res = await client.post("/messages", {
    recipient_id: recipientId,
    ciphertext,
    iv,
    encrypted_key: encryptedKey,
    encrypted_key_for_self: encryptedKeyForSelf,
  });
  return res.data;
};