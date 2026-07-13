import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  Sparkles, Calendar, Clock, Award, Bell, Mail, CheckCircle2, ChevronLeft, ChevronRight, Bookmark
} from 'lucide-react';

export default function Analytics() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar dates
  const [currentDate] = useState(new Date());

  const fetchAnalytics = async () => {
    try {
      const [dashRes, quizRes, notifRes] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/quiz/results'),
        api.get('/api/notifications')
      ]);
      setData(dashRes.data);
      setResults(quizRes.data);
      setNotifs(notifRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <div className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-500">Retrieving study database...</span>
      </div>
    );
  }

  // Format quiz results for Recharts
  const quizChartData = results.map((r, idx) => ({
    name: `Quiz ${results.length - idx}`,
    score: Math.round((r.score / r.total_questions) * 100)
  })).reverse();

  // Calendar day calculation helper
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const monthIdx = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, monthIdx);
  const startDayOffset = getFirstDayOfMonth(year, monthIdx);
  
  const calendarDays = [];
  // Fill offset days
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push(null);
  }
  // Fill days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Simulate deadlines/reminders on calendar (e.g. 10th and 18th have mock exam/sessions)
  const isDateMarked = (day) => {
    if (!day) return null;
    if (day === 10) return { type: 'exam', color: 'bg-pink-500' };
    if (day === 15) return { type: 'assignment', color: 'bg-amber-500' };
    if (day === 22) return { type: 'session', color: 'bg-purple-500' };
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-outfit max-w-7xl mx-auto px-1">
      
      {/* LEFT COLUMN: Progress & Consistency Charts (2/3 cols) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Study Hours Trend */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Monthly Study Consistency</h3>
            <p className="text-slate-400 text-xs mt-0.5">Study hours log mapped relative to monthly limits.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.weekly_study_chart || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#090514', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#a855f7" 
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Performance Scores */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">AI Quiz Diagnostics</h3>
            <p className="text-slate-400 text-xs mt-0.5">Performance trends of diagnostic MCQ submissions.</p>
          </div>
          <div className="h-64 w-full">
            {quizChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#090514', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#ec4899" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, stroke: '#ec4899', strokeWidth: 2, fill: '#030014' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                No quiz scores registered. Submit a diagnostic quiz to render diagnostic stats.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Calendar Widget & Reminders (1/3 cols) */}
      <div className="space-y-6">
        
        {/* Calendar Widget */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Study Calendar</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-semibold uppercase">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const marker = isDateMarked(day);
              const isToday = day === new Date().getDate();
              return (
                <div 
                  key={idx} 
                  className={`h-8 rounded-lg flex flex-col items-center justify-center text-xs relative ${
                    day ? 'bg-slate-900/40 border border-white/5 hover:border-slate-800' : 'bg-transparent'
                  } ${isToday ? 'border-purple-500 bg-purple-500/10 text-white font-bold' : 'text-slate-400'}`}
                >
                  <span>{day}</span>
                  {marker && (
                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${marker.color}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legends */}
          <div className="pt-2 flex flex-wrap gap-3 text-[9px] text-slate-500 font-semibold border-t border-white/5">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span>Exam date</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Assignment</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Study Session</span>
            </div>
          </div>
        </div>

        {/* Reminders Notifications */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-purple-400" />
            <span>Alerts & Reminders</span>
          </h3>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {notifs.map((notif) => (
              <div 
                key={notif.id}
                className={`p-3 rounded-xl border text-[11px] leading-relaxed flex gap-2.5 items-start ${
                  notif.read ? 'border-white/5 bg-slate-950/20 text-slate-500' : 'border-purple-500/10 bg-purple-500/5 text-slate-300'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${notif.read ? 'text-slate-600' : 'text-purple-400'}`} />
                <div>
                  <p>{notif.message}</p>
                  <span className="text-[9px] text-slate-500 mt-1 inline-block">
                    {new Date(notif.scheduled_at).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            {notifs.length === 0 && (
              <div className="text-center py-4 text-slate-600 text-xs italic">
                No active reminders log.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
