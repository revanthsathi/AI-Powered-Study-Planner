import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  Sparkles, CheckCircle2, Circle, Calendar, 
  Flame, Clock, Award, ChevronRight, Zap, Target
} from 'lucide-react';

export default function Dashboard({ setActivePage }) {
  const { api, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    setUpdatingTaskId(taskId);
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/api/planner/tasks/${taskId}`, { status: nextStatus });
      // Reload stats
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to toggle task', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Compiling daily academic diagnostics...</p>
      </div>
    );
  }

  const {
    motivation,
    streak,
    today_goals = [],
    progress_percentage = 0,
    upcoming_exams = [],
    weekly_study_chart = [],
    subject_progress = [],
    productivity_score = 0
  } = data || {};

  // Color mappings for chart nodes
  const chartColor = "#a855f7"; // purple-500
  const subChartColor = "#ec4899"; // pink-500

  return (
    <div className="space-y-6 font-outfit max-w-7xl mx-auto px-1">
      
      {/* Header and Welcome Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="z-10">
            <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal AI Study Coach</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">
              Welcome back, {user?.full_name || 'Scholar'}!
            </h2>
            <p className="text-slate-300 text-sm italic mt-3 bg-slate-950/30 p-3 rounded-xl border border-white/5 leading-relaxed">
              "{motivation}"
            </p>
          </div>
        </div>

        {/* Productivity & Streak */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-2xl flex flex-col justify-between items-center text-center">
            <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div className="mt-2">
              <h4 className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Study Streak</h4>
              <p className="text-2xl font-bold text-white mt-1">{streak} Days</p>
            </div>
            <span className="text-[10px] text-orange-300 font-medium">Keep the fire hot!</span>
          </div>

          <div className="glass-card p-4 rounded-2xl flex flex-col justify-between items-center text-center">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div className="mt-2">
              <h4 className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Productivity</h4>
              <p className="text-2xl font-bold text-white mt-1">{productivity_score}%</p>
            </div>
            <span className="text-[10px] text-indigo-300 font-medium">Focused study rating</span>
          </div>
        </div>
      </div>

      {/* Row 2: Today's study goal + Progress Ring + Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Tasks */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-base">Today's Focus Goals</h3>
            </div>
            <span className="text-xs text-slate-500">
              {today_goals.length} tasks scheduled
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {today_goals.map((task) => (
              <div 
                key={task.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  task.status === 'completed' 
                    ? 'border-purple-500/20 bg-purple-500/5 text-slate-400' 
                    : 'border-white/5 bg-slate-950/20 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button 
                    disabled={updatingTaskId === task.id}
                    onClick={() => handleToggleTask(task.id, task.status)}
                    className="text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <p className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </p>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md mt-1 inline-block font-medium">
                      {task.subject}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {task.duration} hrs
                  </span>
                </div>
              </div>
            ))}
            {today_goals.length === 0 && (
              <div className="text-center py-10 border border-dashed border-white/5 rounded-xl text-slate-500 text-sm">
                No sessions scheduled for today. Take a revision quiz or generate a new study block!
              </div>
            )}
          </div>
        </div>

        {/* Progress Ring and Countdown */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between gap-6">
          <div className="text-center">
            <h3 className="font-semibold text-slate-300 text-sm">Daily Completion Ring</h3>
            <div className="relative w-28 h-28 mx-auto mt-4 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-purple-500 transition-all duration-500"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - progress_percentage / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-extrabold text-white">{progress_percentage}%</span>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Done</p>
              </div>
            </div>
          </div>

          {/* Exam count-downs */}
          <div>
            <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Exam Timers</span>
            </h4>
            <div className="space-y-2">
              {upcoming_exams.map((ex, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-2 px-3 rounded-lg border border-white/5 text-xs">
                  <span className="font-medium text-slate-300 truncate max-w-[120px]">{ex.subject}</span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-pink-500/10 text-pink-300">
                    {ex.days_left} days left
                  </span>
                </div>
              ))}
              {upcoming_exams.length === 0 && (
                <div className="text-center py-2 text-slate-600 text-xs italic">
                  No exam dates logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly study trend */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Weekly Study Hour Chart</h3>
            <p className="text-slate-400 text-xs mt-0.5">Hours logged per day.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly_study_chart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#090514', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke={chartColor} 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: '#a855f7', strokeWidth: 2, fill: '#030014' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject wise progress bar chart */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Subject Completion Tracker</h3>
            <p className="text-slate-400 text-xs mt-0.5">Task completion percentage by subject.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subject_progress} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#090514', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="percentage" 
                  fill={subChartColor} 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Quick Actions */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-white text-base">Quick Academic Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActivePage('planner')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-slate-950/20 hover:border-purple-500/30 hover:bg-purple-500/5 text-center transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">Daily Planner</span>
            <span className="text-[10px] text-slate-500 mt-1">Check timetable</span>
          </button>

          <button
            onClick={() => setActivePage('assistant')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-slate-950/20 hover:border-pink-500/30 hover:bg-pink-500/5 text-center transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-lg bg-pink-500/10 text-pink-400 mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">AI Tutor Chat</span>
            <span className="text-[10px] text-slate-500 mt-1">Discuss doubts</span>
          </button>

          <button
            onClick={() => setActivePage('notes')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-slate-950/20 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-center transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">Notes Compiler</span>
            <span className="text-[10px] text-slate-500 mt-1">Summarize text</span>
          </button>

          <button
            onClick={() => setActivePage('quiz')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-slate-950/20 hover:border-amber-500/30 hover:bg-amber-500/5 text-center transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 mb-3 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">AI Quiz Generator</span>
            <span className="text-[10px] text-slate-500 mt-1">Diagnostic test</span>
          </button>
        </div>
      </div>
    </div>
  );
}
