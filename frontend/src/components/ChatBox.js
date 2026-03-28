import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './ChatBox.css';

const ROOMS = [
  { id: 'farmer-general', label: '👨‍🌾 Farmer Community' },
  { id: 'marketplace',    label: '🛒 Marketplace Chat' },
];

export default function ChatBox() {
  const { user } = useAuth();
  const [room, setRoom]         = useState('farmer-general');
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const pollRef                 = useRef(null);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000); // poll every 5s
    return () => clearInterval(pollRef.current);
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/chat/${room}`);
      setMessages(data);
    } catch {
      // silent fail on poll
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/chat/${room}`, { text });
      setMessages(prev => [...prev, data]);
      setText('');
    } catch {
      // fail silently
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = formatDate(msg.createdAt);
    if (d !== lastDate) { grouped.push({ type: 'divider', label: d }); lastDate = d; }
    grouped.push({ type: 'message', ...msg });
  });

  return (
    <div className="chatbox-wrap">
      {/* Room tabs */}
      <div className="chat-rooms">
        {ROOMS.map(r => (
          <button
            key={r.id}
            className={`chat-room-btn ${room === r.id ? 'active' : ''}`}
            onClick={() => setRoom(r.id)}
          >{r.label}</button>
        ))}
      </div>

      {/* Message list */}
      <div className="chat-messages">
        {loading && messages.length === 0 && (
          <div className="chat-loading">Loading messages...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {grouped.map((item, i) =>
          item.type === 'divider' ? (
            <div key={`d-${i}`} className="chat-date-divider">
              <span>{item.label}</span>
            </div>
          ) : (
            <div
              key={item._id}
              className={`chat-bubble-wrap ${item.sender === user?._id || item.senderName === user?.name ? 'mine' : 'theirs'}`}
            >
              <div className="chat-bubble">
                {item.senderName !== user?.name && (
                  <div className="chat-sender-name">
                    {item.senderName}
                    <span className={`chat-role-badge ${item.senderRole}`}>
                      {item.senderRole === 'farmer' ? '👨‍🌾' : '🛒'}
                    </span>
                  </div>
                )}
                <div className="chat-text">{item.text}</div>
                <div className="chat-time">{formatTime(item.createdAt)}</div>
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="chat-input-row" onSubmit={sendMessage}>
        <input
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={sending}
        />
        <button className="chat-send-btn" type="submit" disabled={sending || !text.trim()}>
          {sending ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
}
