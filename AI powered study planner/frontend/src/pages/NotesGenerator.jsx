import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Sparkles, Download, Plus, FileText, Upload, HelpCircle, Check, Award
} from 'lucide-react';

export default function NotesGenerator() {
  const { api } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  // Form states
  const [topic, setTopic] = useState('');
  const [textContent, setTextContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');

  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active flashcard flip tracking
  const [flippedCardIdx, setFlippedCardIdx] = useState(null);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/api/notes');
      setNotes(res.data);
      if (res.data.length > 0 && !selectedNote) {
        setSelectedNote(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      // Extract raw base64 string
      const base64String = reader.result.split(',')[1];
      setFileBase64(base64String);
    };
    reader.onerror = (err) => {
      console.error('File reading error: ', err);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic && !textContent && !fileBase64) {
      setError('Please provide a Topic or Reference Text/File.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const res = await api.post('/api/notes/generate', {
        topic,
        text_content: textContent,
        file_content: fileBase64
      });
      
      setNotes([res.data, ...notes]);
      setSelectedNote(res.data);
      // Clear form
      setTopic('');
      setTextContent('');
      setFileName('');
      setFileBase64('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to compile notes. Check API credentials.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (noteId, noteTopic) => {
    try {
      const response = await api.get(`/api/notes/${noteId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${noteTopic.replace(/\s+/g, '_')}_notes.md`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error downloading note', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-outfit max-w-7xl mx-auto px-1">
      
      {/* Input panel & history sidebar */}
      <div className="space-y-6 lg:col-span-1">
        
        {/* Compiler Form */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Notes Compiler</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Produce summaries, revision notes, and flashcards.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase">Topic Title</label>
              <input
                type="text"
                placeholder="e.g. Database Normalization"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase">Reference Content / Clipboard</label>
              <textarea
                rows="4"
                placeholder="Paste course slides text, lecture transcripts, or textbook chapters here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* File upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase">Upload Lecture Slip / PDF</label>
              <div className="relative border border-dashed border-slate-700 hover:border-purple-500/50 rounded-xl p-4 bg-slate-900/25 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".txt,.pdf,.md"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                <span className="text-xs font-medium text-slate-400">
                  {fileName ? fileName : 'Choose PDF, text, or MD file'}
                </span>
                <p className="text-[10px] text-slate-600 mt-1">Maximum size 4MB.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Notes...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Generate with Gemini</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compiled Library</h4>
          
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-600">Loading library...</div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note);
                    setFlippedCardIdx(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                    selectedNote?.id === note.id
                      ? 'border-purple-500/30 bg-purple-500/5 text-white'
                      : 'border-white/5 bg-slate-950/20 hover:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-semibold truncate">{note.topic}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 shrink-0">
                    {new Date(note.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                  </span>
                </button>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-6 text-slate-600 text-xs italic">
                  No summaries generated yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compiled Notes View */}
      <div className="lg:col-span-2 space-y-6">
        {selectedNote ? (
          <div className="space-y-6">
            
            {/* Note Header */}
            <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-semibold uppercase">Study Guide</span>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedNote.topic}</h2>
              </div>
              
              <button
                onClick={() => handleDownload(selectedNote.id, selectedNote.topic)}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Markdown</span>
              </button>
            </div>

            {/* Note Content tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Bullet summaries & formulas */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Core text */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2.5">Syllabus Overview</h3>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedNote.content}
                  </div>
                </div>

                {/* Summaries list */}
                <div className="glass-card p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Check className="w-4.5 h-4.5 text-emerald-400" />
                    <span>Bullet Summaries</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {(selectedNote.bullet_summaries || []).map((b, i) => (
                      <li key={i} className="flex gap-2.5 text-slate-400 text-xs leading-relaxed">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Formulas & Flashcards column */}
              <div className="space-y-6">
                
                {/* Key formulas */}
                <div className="glass-card p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-pink-400" />
                    <span>Key Formulas</span>
                  </h3>
                  <div className="space-y-3">
                    {(selectedNote.key_formulas || []).map((f, i) => (
                      <div key={i} className="bg-slate-950/40 p-3 rounded-xl border border-white/5 text-xs space-y-1.5">
                        <span className="font-bold text-slate-300">{f.name}</span>
                        <code className="block bg-slate-900 p-1.5 rounded border border-white/5 text-pink-400 font-semibold">{f.formula}</code>
                        <p className="text-[10px] text-slate-500">{f.description}</p>
                      </div>
                    ))}
                    {(selectedNote.key_formulas || []).length === 0 && (
                      <div className="text-slate-500 text-xs italic text-center">No formulas registered for this topic.</div>
                    )}
                  </div>
                </div>

                {/* Interactive Flashcards */}
                <div className="glass-card p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <HelpCircle className="w-4.5 h-4.5 text-indigo-400" />
                    <span>Flashcards</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {(selectedNote.flashcards || []).map((card, idx) => {
                      const isFlipped = flippedCardIdx === idx;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setFlippedCardIdx(isFlipped ? null : idx)}
                          className="h-[100px] cursor-pointer perspective bg-transparent group"
                        >
                          <motion.div 
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.4 }}
                            className="relative w-full h-full text-center preserve-3d border border-white/10 rounded-xl bg-slate-900/50 flex items-center justify-center p-3 select-none"
                          >
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden p-3 flex flex-col justify-between rounded-xl">
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider text-left">Q{idx+1}</span>
                              <p className="text-xs font-semibold text-slate-200">{card.question}</p>
                              <span className="text-[9px] text-purple-400 font-medium text-right mt-1">Click to flip</span>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 p-3 flex flex-col justify-between rounded-xl bg-purple-950/20 text-slate-300">
                              <span className="text-[8px] text-purple-400 uppercase tracking-wider text-left">Answer</span>
                              <p className="text-xs">{card.answer}</p>
                              <span className="text-[9px] text-slate-500 text-right mt-1">Click to revert</span>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="glass-card p-12 rounded-2xl text-center text-slate-500 text-sm italic">
            Enter a topic in the side form and compile to get detailed study briefs and flashcards.
          </div>
        )}
      </div>

    </div>
  );
}
