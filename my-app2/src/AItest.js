// AITest.js

import { GoogleGenAI } from '@google/genai';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Removed explicit TypeScript types for Part and ChatMsg, 
// as they are inferred or implicitly defined by usage in JavaScript.

// Removed explicit Props type

export default function AITest({
  defaultModel = 'gemini-2.5-flash',
}) {
  const [model, setModel] = useState(defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(true);
  const [history, setHistory] = useState([]); // Array of ChatMsg objects
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('客服'); // State for the selected service role

  const listRef = useRef(null);

  // Load saved API Key
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) setApiKey(saved);
  }, []);

  // Auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history, loading]);

  const ai = useMemo(() => {
    try {
      return apiKey ? new GoogleGenAI({ apiKey }) : null;
    } catch {
      return null;
    }
  }, [apiKey]);

  // Send message
  async function sendMessage(message) {
    const content = (message ?? input).trim();
    if (!content || loading) return;
    if (!ai) {
      setError('請先輸入有效的 Gemini API Key');
      return;
    }

    setError('');
    setLoading(true);

    const newHistory = [
      ...history,
      { role: 'user', parts: [{ text: content }] },
    ];
    setHistory(newHistory);
    setInput('');

    try {
      const resp = await ai.models.generateContent({
        model,
        contents: newHistory,
      });
      const reply = resp.text || '[No content]';
      setHistory((h) => [...h, { role: 'model', parts: [{ text: reply }] }]);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // Auto-send first prompt for specific roles
  useEffect(() => {
    if (role === '天氣助理') {
      sendMessage('幫我搜尋今天的天氣，我應該穿什麼服裝出門？');
    } else if (role === '晚餐建議師') {
      sendMessage('請幫我決定今天晚餐要吃什麼。');
    } else if (role === '理財小助理') {
      sendMessage('請給我簡單的理財或預算建議');
    } else if (role === '情緒小幫手') {
      sendMessage('我心情不好，請給我一些安慰和建議');
    }
  }, [role]);

  // Render messages
  function renderMessage(text) {
    const lines = text.split('\n');
    return lines.map((line, idx) => (
      <div key={idx} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {line}
      </div>
    ));
  }

  return (
    <div style={styles.container}>
      {/* 左側設定 */}
      <div style={styles.sidebar}>
        <h3 style={{ marginBottom: 10 }}>設定區</h3>

        <label style={styles.label}>
          模型
          <input
            style={styles.input}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="例如 gemini-2.5-flash"
          />
        </label>

        <label style={styles.label}>
          Gemini API Key
          <input
            style={styles.input}
            type="password"
            value={apiKey}
            onChange={(e) => {
              const v = e.target.value;
              setApiKey(v);
              if (rememberKey) localStorage.setItem('gemini_api_key', v);
            }}
            placeholder="貼上你的 API Key"
          />
          <label style={{ fontSize: 12, marginTop: 4 }}>
            <input
              type="checkbox"
              checked={rememberKey}
              onChange={(e) => {
                setRememberKey(e.target.checked);
                if (!e.target.checked) localStorage.removeItem('gemini_api_key');
                else if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
              }}
            />{' '}
            記住在本機
          </label>
        </label>

        <label style={styles.label}>
          選擇服務角色
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)} // Removed 'as any'
            style={styles.input}
          >
            <option value="客服">智慧客服</option>
            <option value="天氣助理">天氣+穿搭助理</option>
            <option value="晚餐建議師">晚餐建議師</option>
            <option value="理財小助理">理財小助理</option>
            <option value="情緒小幫手">情緒小幫手</option>
          </select>
        </label>

        {error && <div style={styles.error}>⚠ {error}</div>}
      </div>

      {/* 右側聊天室 */}
      <div style={styles.chat}>
        <div ref={listRef} style={styles.messages}>
          {history.map((m, idx) => (
            <div
              key={idx}
              style={{
                ...styles.msg,
                ...(m.role === 'user' ? styles.user : styles.assistant),
              }}
            >
              <div style={styles.msgRole}>{m.role === 'user' ? '你' : 'AI'}</div>
              <div style={styles.msgBody}>
                {renderMessage(m.parts.map((p) => p.text).join('\n'))}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.msg, ...styles.assistant }}>
              <div style={styles.msgRole}>AI</div>
              <div style={styles.msgBody}>思考中…</div>
            </div>
          )}
        </div>

        <form
          style={styles.composer}
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            style={styles.textInput}
            placeholder="輸入訊息，按 Enter 送出"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !apiKey}
            style={styles.sendBtn}
          >
            送出
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
    background: '#f0f4f8',
  },
  sidebar: {
    width: 260,
    padding: 16,
    background: '#1e293b',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
  },
  input: {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #94a3b8',
    fontSize: 14,
  },
  error: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4,
  },
  chat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    position: 'relative', // 方便 composer 固定
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 8,
    paddingBottom: 100, // ← 避免被輸入欄擋住
  },
  msg: {
    borderRadius: 12,
    padding: 10,
    maxWidth: '70%',
  },
  user: {
    background: '#60a5fa',
    color: '#fff',
    alignSelf: 'flex-end',
  },
  assistant: {
    background: '#e2e8f0',
    color: '#111827',
    alignSelf: 'flex-start',
  },
  msgRole: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.7,
    marginBottom: 4,
  },
  msgBody: {
    fontSize: 14,
    lineHeight: 1.4,
  },
  composer: {
    display: 'flex',
    gap: 8,
    position: 'sticky', // ← 固定在底部
    bottom: 0,
    background: '#f0f4f8',
    padding: 8,
    zIndex: 10,
  },
  textInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #94a3b8',
    fontSize: 14,
  },
  sendBtn: {
    padding: '10px 16px',
    borderRadius: 6,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
};