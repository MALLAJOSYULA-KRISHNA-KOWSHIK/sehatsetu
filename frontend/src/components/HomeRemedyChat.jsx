import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

const HomeRemedyChat = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: t('Hello! I can suggest basic home remedies. (Note: I am not a doctor and cannot prescribe medicines)')
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setIsTyping(true);

    try {
      // The current language string e.g., 'English', 'Telugu', 'Hindi'
      let langName = 'English';
      if (i18n.language.startsWith('hi')) langName = 'Hindi';
      if (i18n.language.startsWith('te')) langName = 'Telugu';

      const res = await api.post('/chat/message', {
        message: userText,
        language: langName
      });

      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'bot', 
        text: res.data.response 
      }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'bot', 
        text: t('Sorry, I am having trouble connecting right now.') 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 md:bottom-28 md:right-10 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden" style={{ height: '450px', maxHeight: '70vh' }}>
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <h3 className="font-semibold text-lg">{t('Home Remedy Guide')}</h3>
        </div>
        <button onClick={onClose} className="hover:bg-green-700 p-1 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 ${
              msg.sender === 'user' 
                ? 'bg-green-600 text-white rounded-tr-sm' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
            }`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
              <span className="text-xs text-gray-500 font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('Ask about a home remedy...')}
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isTyping}
          className="bg-green-600 text-white p-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default HomeRemedyChat;
