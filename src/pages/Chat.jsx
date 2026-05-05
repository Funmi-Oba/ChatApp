import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { searchUsers } from "../api/users";

export default function Chat() {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loadingMessages,
    loadConversations,
    loadMessages,
    handleIncomingMessage,
    sendEncryptedMessage,
  } = useChat();

  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { sendMessage } = useWebSocket(handleIncomingMessage);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results.filter((u) => u.id !== user.id));
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, user.id]);

  const handleSelectUser = (selectedUser) => {
    setActiveConversation(selectedUser);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConversation || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await sendEncryptedMessage(activeConversation.id, text, sendMessage);
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-full bg-bg">
      {/* ── Sidebar ── */}
      <div className="flex flex-col border-r w-80 border-border bg-surface shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
              <svg className="w-4 h-4 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="font-bold text-text">ChatApp</span>
          </div>
          <button
            onClick={logout}
            className="p-2 transition-colors rounded-lg text-muted hover:text-error hover:bg-error/10"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Current user */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full bg-accent/20 text-accent">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{user?.display_name || user?.username}</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <p className="text-xs text-muted">Online</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <svg className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full py-2 pl-10 pr-4 text-sm transition-colors border bg-bg border-border rounded-xl text-text placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 overflow-hidden border rounded-xl border-border bg-bg">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="flex items-center w-full gap-3 px-3 py-2.5 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full bg-accent/20 text-accent shrink-0">
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text">{u.display_name || u.username}</p>
                    <p className="text-xs text-muted">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searching && (
            <div className="flex items-center justify-center py-2">
              <div className="w-4 h-4 border-2 rounded-full border-accent border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-muted">No conversations yet</p>
              <p className="text-xs text-muted">Search for a user to start chatting</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user.id}
                onClick={() => handleSelectUser(conv.user)}
                className={`flex items-center w-full gap-3 px-4 py-3 transition-colors hover:bg-bg/50 ${
                  activeConversation?.id === conv.user.id ? "bg-bg/50 border-r-2 border-accent" : ""
                }`}
              >
                <div className="flex items-center justify-center w-10 h-10 font-bold rounded-full bg-accent/20 text-accent shrink-0">
                  {conv.user.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate text-text">
                    {conv.user.display_name || conv.user.username}
                  </p>
                  <p className="text-xs truncate text-muted">
                    {conv.last_message ? "🔒 Encrypted message" : "No messages yet"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {activeConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-surface">
              <div className="flex items-center justify-center font-bold rounded-full w-9 h-9 bg-accent/20 text-accent">
                {activeConversation.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-text">
                  {activeConversation.display_name || activeConversation.username}
                </p>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-muted">End-to-end encrypted</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 px-6 py-4 space-y-3 overflow-y-auto">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 rounded-full border-accent border-t-transparent animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm text-muted">No messages yet</p>
                  <p className="text-xs text-muted">Messages are end-to-end encrypted</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isSentByMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                        msg.isSentByMe
                          ? "bg-accent text-bg rounded-br-sm"
                          : "bg-surface text-text border border-border rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.plaintext}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.isSentByMe ? "justify-end" : "justify-start"}`}>
                        <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className={`text-xs opacity-60`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-border bg-surface">
              <div className="flex items-end gap-3">
                <div className="flex-1 transition-colors border border-border rounded-2xl bg-bg focus-within:border-accent">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 text-sm bg-transparent resize-none text-text placeholder-muted focus:outline-none"
                    style={{ maxHeight: "120px" }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="flex items-center justify-center transition-colors w-11 h-11 rounded-2xl bg-accent hover:bg-accent-light text-bg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 rounded-full border-bg border-t-transparent animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-muted">Messages are end-to-end encrypted</p>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <div className="flex items-center justify-center w-16 h-16 border rounded-2xl bg-surface border-border">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium text-text">Select a conversation</p>
              <p className="mt-1 text-sm text-muted">Search for a user to start an encrypted chat</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border rounded-xl border-border bg-surface">
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-muted">End-to-end encrypted with RSA-OAEP + AES-GCM</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}