import { useEffect, useRef, useCallback } from "react";

const WS_URL = "wss://whisperbox.koyeb.app/ws";

export const useWebSocket = (onMessage) => {
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    ws.current = new WebSocket(`${WS_URL}?token=${token}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected ✅");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected, reconnecting...");
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.current.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) ws.current.close();
    };
  }, [connect]);

  const sendMessage = useCallback((payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  return { sendMessage };
};