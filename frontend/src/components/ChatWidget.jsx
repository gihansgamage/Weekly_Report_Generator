import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import '../styles/Components.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am your AI Team Assistant. Ask me anything about the team\'s weekly reports, current projects, or blockers.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '⚠️ Failed to connect to the assistant. Please make sure the backend is running.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      { role: 'assistant', text: 'Conversation restarted. Ask me anything about the team\'s weekly reports, current projects, or blockers.' }
    ]);
  };

  const parseMarkdown = (text) => {
    if (!text) return '';
    
    // Safety escape
    let safeText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const lines = safeText.split('\n');
    let inList = false;
    let inTable = false;
    const formattedLines = [];

    for (let line of lines) {
      let trimmed = line.trim();

      // Table parsing
      if (trimmed.startsWith('|')) {
        if (!inTable) {
          formattedLines.push('<table><tbody>');
          inTable = true;
        }
        
        if (trimmed.includes('---')) {
          continue;
        }

        const cols = trimmed.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        formattedLines.push('<tr>' + cols.map(c => `<td>${c}</td>`).join('') + '</tr>');
        continue;
      } else if (inTable) {
        formattedLines.push('</tbody></table>');
        inTable = false;
      }

      // List parsing
      if (trimmed.startsWith('- ')) {
        if (!inList) {
          formattedLines.push('<ul>');
          inList = true;
        }
        let itemContent = trimmed.substring(2)
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/`(.*?)`/g, '<code>$1</code>');
        formattedLines.push(`<li>${itemContent}</li>`);
      } else {
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        
        if (trimmed === '') {
          formattedLines.push('<br/>');
        } else {
          let formattedLine = trimmed
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
          
          if (formattedLine.startsWith('### ')) {
            formattedLines.push(`<h4>${formattedLine.substring(4)}</h4>`);
          } else if (formattedLine.startsWith('## ')) {
            formattedLines.push(`<h3>${formattedLine.substring(3)}</h3>`);
          } else if (formattedLine.startsWith('# ')) {
            formattedLines.push(`<h2>${formattedLine.substring(2)}</h2>`);
          } else {
            formattedLines.push(`<p>${formattedLine}</p>`);
          }
        }
      }
    }

    if (inList) formattedLines.push('</ul>');
    if (inTable) formattedLines.push('</tbody></table>');

    return formattedLines.join('\n');
  };

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-window glass-panel animate-fade-in">
          <div className="chat-header">
            <div className="chat-header-title">
              <Bot size={20} style={{ color: 'var(--color-primary)' }} />
              <span>Team Intelligence AI</span>
            </div>
            <div className="chat-header-actions">
              <button className="btn-chat-action" onClick={handleClear} title="Clear Conversation" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <RefreshCw size={16} />
              </button>
              <button className="btn-chat-action" onClick={() => setIsOpen(false)} title="Close Chat" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role}`}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }} />
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {isLoading && (
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chat-input-area">
            <input
              type="text"
              placeholder="Ask about compliance, blockers..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="btn-send" disabled={!input.trim() || isLoading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button className="chat-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default ChatWidget;
