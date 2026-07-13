import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Sparkles, Send, Bot, User, Trash2, Code, BookOpen, FileText, ChevronRight, Copy, Check, Paperclip, X 
} from 'lucide-react';

export default function ChatAssistant() {
  const { api } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  // Image attachments state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageInputFile, setImageInputFile] = useState(null);
  const imageInputRef = useRef(null);

  // Scratchpad contents
  const [scratchpadText, setScratchpadText] = useState(
    `// AI Study Planner Scratchpad\n// Use this side pane to write notes, edit coding structures, or experiment with equations.\n\n`
  );
  
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const chatBottomRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/assistant/history');
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageInputFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageInputFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !imagePreview) return;

    const userText = inputText;
    const sentImage = imagePreview; // capture base64 URL

    setInputText('');
    setImagePreview(null);
    setImageInputFile(null);
    setLoading(true);

    // Optimistic user message render (include local image string)
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      message: userText || "Analyze this screenshot",
      image: sentImage,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post('/api/assistant/chat', { 
        message: userText || "Analyze this visual snapshot", 
        image: sentImage 
      });
      // Replace optimistic message and append assistant message
      setMessages((prev) => {
        const cleaned = prev.filter(m => m.id !== tempUserMsg.id);
        return [...cleaned, { ...tempUserMsg, id: res.data.id - 1 }, res.data];
      });
      
      // Auto-extract code blocks to scratchpad if assistant outputs code
      if (res.data.message.includes('```')) {
        const matches = res.data.message.match(/```[\s\S]*?```/g);
        if (matches) {
          const codes = matches.map(m => m.replace(/```[a-zA-Z]*\n?|```/g, '')).join('\n\n');
          setScratchpadText(prev => prev + `\n/* AI Exported Code Block */\n` + codes + '\n');
        }
      }
    } catch (err) {
      console.error(err);
      // Append error message
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        message: 'Could not connect to AI service. Please make sure the backend server and internet connection are active.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-outfit max-w-7xl mx-auto px-1 h-[calc(100vh-120px)] min-h-[500px]">
      
      {/* LEFT PANE: Chat Dialog (8/12 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between glass-card rounded-2xl overflow-hidden h-full">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI Study Assistant</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Online Tutor & Coding Coach</p>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold uppercase">AI Connected</span>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Retrieving tutoring history...</span>
            </div>
          ) : (
            <>
              {/* Initial welcome message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-slate-950/40 p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[85%] text-xs text-slate-300 leading-relaxed font-sans">
                  Hello! I am your personal AI study assistant. Ask me to explain concepts, suggest coding structures, compile summaries, or run sample interview questions! You can also click the paperclip icon to upload a screenshot of your problem.
                </div>
              </div>

              {messages.map((msg, idx) => {
                const isBot = msg.role === 'assistant';
                return (
                  <div key={msg.id || idx} className={`flex gap-3 ${!isBot ? 'justify-end' : ''}`}>
                    {isBot && (
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-purple-400 shrink-0">
                        <Bot className="w-4.5 h-4.5" />
                      </div>
                    )}
                    
                    <div 
                      className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed font-sans border ${
                        isBot 
                          ? 'bg-slate-950/40 rounded-tl-none border-white/5 text-slate-300' 
                          : 'bg-gradient-to-br from-purple-600 to-indigo-600 rounded-tr-none border-purple-500/30 text-white'
                      }`}
                    >
                      {/* Image Render if sent in this message */}
                      {msg.image && (
                        <img 
                          src={msg.image} 
                          alt="Student upload" 
                          className="max-w-[240px] max-h-[160px] rounded-lg border border-white/10 mb-2 object-cover block cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => window.open(msg.image, '_blank')}
                        />
                      )}

                      {/* Message Content */}
                      <div className="whitespace-pre-wrap">
                        {msg.message}
                      </div>

                      {/* Display custom copy button for code blocks inside bot message */}
                      {isBot && msg.message.includes('```') && (
                        <button
                          onClick={() => handleCopyCode(msg.message, idx)}
                          className="mt-3 py-1 px-2 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-white/5 text-[10px] font-semibold flex items-center gap-1 w-fit transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied Code</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Block</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {!isBot && (
                      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">
                        U
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-purple-400 shrink-0">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[80%] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-slate-950/30 flex flex-col gap-2">
          {/* Image Preview Tray */}
          {imagePreview && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-slate-900 group">
              <img src={imagePreview} alt="upload preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-center">
            {/* Hidden Input */}
            <input 
              type="file" 
              ref={imageInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange} 
            />
            {/* Attachment Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => imageInputRef.current?.click()}
              className="p-3 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              disabled={loading}
              placeholder={loading ? 'Tutor is formulating thoughts...' : 'Type concepts or ask about the screenshot (e.g. "Explain this diagram")'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || (!inputText.trim() && !imagePreview)}
              className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PANE: Code Scratchpad & Editor Preview (5/12 cols) */}
      <div className="lg:col-span-5 flex flex-col glass-card rounded-2xl overflow-hidden h-full">
        
        {/* Editor Header */}
        <div className="p-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-white text-xs">Sandbox Scratchpad</span>
          </div>
          <span className="text-[10px] text-slate-500">Live Editor Workspace</span>
        </div>

        {/* Textarea Scratchpad */}
        <textarea
          value={scratchpadText}
          onChange={(e) => setScratchpadText(e.target.value)}
          className="flex-1 p-4 bg-slate-950/60 text-slate-300 font-mono text-xs focus:outline-none border-none resize-none leading-relaxed select-text"
        />

        {/* Footer controls */}
        <div className="p-3 border-t border-white/5 bg-slate-950/20 flex items-center justify-between text-[10px] text-slate-500">
          <span>* Coding replies are automatically auto-extracted here.</span>
          <button 
            onClick={() => setScratchpadText('')}
            className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
          >
            Clear Editor
          </button>
        </div>
      </div>

    </div>
  );
}
