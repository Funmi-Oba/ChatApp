import { createContext, useContext, useState, useCallback } from "react";
import { getConversations, getMessageHistory } from "../api/messages";
import { encryptMessage } from "../crypto/encrypt";
import { decryptMessage } from "../crypto/decrypt";
import { getUserPublicKey } from "../api/users";
import { getPublicKey } from "../crypto/keys";
import { sendMessageREST } from "../api/messages";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, []);

  // Load message history for a conversation
  const loadMessages = useCallback(async (userId) => {
    setLoadingMessages(true);
    try {
      const data = await getMessageHistory(userId);
      const currentUser = JSON.parse(localStorage.getItem("user"));

      // Decrypt all messages
      const decrypted = await Promise.all(
        data.map(async (msg) => {
          const isSentByMe = msg.sender_id === currentUser.id;
          const plaintext = await decryptMessage({
            ciphertext: msg.ciphertext,
            iv: msg.iv,
            encryptedKey: msg.encrypted_key,
            encryptedKeyForSelf: msg.encrypted_key_for_self,
            isSentByMe,
          });
          return { ...msg, plaintext, isSentByMe };
        })
      );

      // Reverse so oldest messages are first
      setMessages(decrypted.reverse());
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Handle incoming WebSocket message
  const handleIncomingMessage = useCallback(async (frame) => {
    if (frame.type !== "message.receive") return;

    const msg = frame.payload;
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const isSentByMe = msg.sender_id === currentUser.id;

    const plaintext = await decryptMessage({
      ciphertext: msg.ciphertext,
      iv: msg.iv,
      encryptedKey: msg.encrypted_key,
      encryptedKeyForSelf: msg.encrypted_key_for_self,
      isSentByMe,
    });

    const newMessage = { ...msg, plaintext, isSentByMe };

    setMessages((prev) => [...prev, newMessage]);

    // Update conversations list
    setConversations((prev) => {
      const exists = prev.find(
        (c) => c.user.id === msg.sender_id || c.user.id === msg.recipient_id
      );
      if (!exists) {
        loadConversations();
      }
      return prev;
    });
  }, [loadConversations]);

  // Send an encrypted message
  const sendEncryptedMessage = useCallback(async (recipientId, plaintext, sendWS) => {
    const currentUser = JSON.parse(localStorage.getItem("user"));

    // Get recipient's public key
    const recipientKeyData = await getUserPublicKey(recipientId);
    const recipientPublicKey = recipientKeyData.public_key;

    // Get our own public key
    const ownPublicKeyObj = await getPublicKey();
    const { exportPublicKey } = await import("../crypto/keys");
    const ownPublicKey = await exportPublicKey(ownPublicKeyObj);

    // Encrypt
    const encrypted = await encryptMessage(plaintext, recipientPublicKey, ownPublicKey);

    const payload = {
      recipient_id: recipientId,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      encrypted_key: encrypted.encryptedKey,
      encrypted_key_for_self: encrypted.encryptedKeyForSelf,
    };

    // Try WebSocket first
    const sent = sendWS({
      type: "message.send",
      payload,
    });

    // Fallback to REST
    if (!sent) {
      await sendMessageREST({
        recipientId,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        encryptedKey: encrypted.encryptedKey,
        encryptedKeyForSelf: encrypted.encryptedKeyForSelf,
      });
    }

    // Add to local messages immediately
    const optimisticMessage = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      recipient_id: recipientId,
      plaintext,
      isSentByMe: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        setActiveConversation,
        messages,
        loadingMessages,
        loadConversations,
        loadMessages,
        handleIncomingMessage,
        sendEncryptedMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);