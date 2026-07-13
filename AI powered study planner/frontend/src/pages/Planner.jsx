import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, CheckCircle2, Circle, 
  Play, Pause, RotateCcw, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

export default function Planner() {
  const { api } = useAuth();
  
  // Date tracking for timeline
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);

  // Pomodoro states
  const [timerMode, setTimerMode] = useState('Study'); // 'Study' or 'Break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const startString = formatDate(currentDate);
      const endString = formatDate(currentDate);
      const res = await api.get(`/api/planner/tasks?start=${startString}&end=${endString}`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentDate]);

  // Pomodoro Tick logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            playAlertSound();
            // Switch mode automatically
            if (timerMode === 'Study') {
              setTimerMode('Break');
              return 5 * 60;
            } else {
              setTimerMode('Study');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerMode]);

  // Utility to format date for API
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToggleTaskStatus = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/api/planner/tasks/${taskId}`, { status: nextStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSmartReschedule = async () => {
    setRescheduling(true);
    try {
      await api.post('/api/planner/reschedule');
      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setRescheduling(false);
    }
  };

  // Synthesize beep using Web Audio API
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      // 880Hz beep (A5 tone)
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Web Audio Context not permitted without interaction first.', e);
    }
  };

  // Pomodoro controls
  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(timerMode === 'Study' ? 25 * 60 : 5 * 60);
  };

  const setMode = (mode) => {
    setTimerRunning(false);
    setTimerMode(mode);
    setTimeLeft(mode === 'Study' ? 25 * 60 : 5 * 60);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-outfit max-w-7xl mx-auto px-1">
      
      {/* Timeline Planner */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Date Selector Header */}
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrevDay} 
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center px-4">
              <h3 className="font-bold text-white text-base">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Timeline View</p>
            </div>
            <button 
              onClick={handleNextDay} 
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleSmartReschedule}
            disabled={rescheduling}
            className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rescheduling ? 'animate-spin' : ''}`} />
            <span>Smart Reschedule</span>
          </button>
        </div>

        {/* Tasks List */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span>Daily Schedule Block</span>
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Querying schedule...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    task.status === 'completed'
                      ? 'border-purple-500/20 bg-purple-500/5 text-slate-500'
                      : task.status === 'missed'
                      ? 'border-red-500/20 bg-red-500/5'
                      : 'border-white/5 bg-slate-950/20 hover:border-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleToggleTaskStatus(task.id, task.status)}
                      className="text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h4 className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-medium">
                          {task.subject}
                        </span>
                        {task.status === 'missed' && (
                          <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Missed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{task.start_time || '10:00'} ({task.duration} hr)</span>
                    </span>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-xl text-slate-500 text-sm">
                  No studies planned for this day. Enjoy your free time or hit "Smart Reschedule" to fetch missed items.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pomodoro Timer widget */}
      <div className="space-y-6">
        <div className="glass-card p-6 rounded-2xl text-center space-y-6 relative overflow-hidden">
          {/* Subtle gradient background inside timer */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-lg pointer-events-none" />

          <div>
            <h3 className="font-bold text-white text-base flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
              <span>Pomodoro Focus Timer</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Use blocks of focused study and short breaks.</p>
          </div>

          {/* Mode Toggles */}
          <div className="flex justify-center bg-slate-950/60 p-1.5 rounded-xl border border-white/5 w-fit mx-auto">
            <button
              onClick={() => setMode('Study')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timerMode === 'Study' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Study Slot (25m)
            </button>
            <button
              onClick={() => setMode('Break')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timerMode === 'Break' 
                  ? 'bg-pink-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Short Break (5m)
            </button>
          </div>

          {/* Time Display */}
          <div className="py-2">
            <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent select-none">
              {formatTimer(timeLeft)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={resetTimer}
              className="p-3 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={toggleTimer}
              className={`p-4 rounded-full text-white shadow-md transition-all active:scale-95 cursor-pointer ${
                timerRunning 
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-900/30'
              }`}
            >
              {timerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
          </div>

          <div className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
            * A synthesized chime will fire when the timer ends. Ensure your browser sound permissions are active.
          </div>
        </div>
      </div>
    </div>
  );
}
