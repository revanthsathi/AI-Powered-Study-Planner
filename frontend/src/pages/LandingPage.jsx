import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Calendar, BookOpen, Brain, 
  ChevronRight, Award, MessageSquare, ArrowUpRight, CheckCircle, ShieldCheck
} from 'lucide-react';

export default function LandingPage({ onStart }) {
  // Testimonials
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CS Undergrad @ MIT",
      quote: "The auto-rescheduler saved my semester. When I missed my Tuesday DBMS slots due to lab submissions, the planner adjusted my week automatically without overwhelming me.",
      streak: "24 Days"
    },
    {
      name: "Rohan Sharma",
      role: "UPSC Aspirant",
      quote: "Generating custom quizzes on weak areas detected from my daily review is incredible. It's like having a private tutor highlighting exactly what to recap.",
      streak: "48 Days"
    },
    {
      name: "Elena Rostova",
      role: "Medical Student",
      quote: "I upload long slides PDFs and get concise notes, formulas, and flashcards instantly. Spaced repetition timing works flawlessly.",
      streak: "15 Days"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#030014] text-slate-100 overflow-x-hidden font-outfit">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-[120px] pointer-events-none" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="floating-particle bg-purple-500/20 rounded-full"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 95}%`,
              top: `${Math.random() * 95}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 15}s`
            }}
          />
        ))}
      </div>

      {/* Navigation Header */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
            <Brain className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AI-powered study planner
          </span>
        </div>
        
        <button
          onClick={onStart}
          className="px-5 py-2.5 rounded-xl border border-purple-500/30 hover:border-purple-500 bg-purple-500/10 hover:bg-purple-500 text-purple-300 hover:text-white font-medium text-sm transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-5xl mx-auto">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Elevate Your Learning with the
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent neon-glow-text">
              AI-powered study planner
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal px-4">
            A personal AI tutor and productivity coach that creates study plans, tracks progress, adjusts schedules automatically, and provides personalized recommendations.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all hover:shadow-purple-500/20 active:scale-98 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 font-medium text-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore Features</span>
            </a>
          </div>
        </motion.div>
      </header>

      {/* 3D-Style Card Feature Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Built for Peak Student Performance
          </h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            A unified ecosystem merging custom schedulers, notes compilers, and adaptive quiz engines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -8 }}
            className="glass-card p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-6 border border-purple-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Smart Adaptive Planner</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Missed a session? The platform redistribution engine shifts missed items to upcoming study blocks automatically, prioritizing weaker subjects without piling on stress.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-purple-400 font-medium">
              <span>Automatic rescheduling</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -8 }}
            className="glass-card p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 w-fit mb-6 border border-pink-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">AI Slide & Notes Summarizer</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Paste texts or upload PDFs. Instantly compile formatted summaries, formulas lists, study briefs, and active recall flashcards mapped directly to your study slots.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-pink-400 font-medium">
              <span>Markdown exports & slide uploads</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -8 }}
            className="glass-card p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-6 border border-indigo-500/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Gemini Tutoring Assistant</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Stuck on a programming concept or complex calculus derivation? Discuss concepts, request practice interview queries, or ask for code solutions in real-time.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
              <span>Stateful learning context</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Onboarding Showcase/Streaks */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-4">
              <Award className="w-3.5 h-3.5" />
              <span>Behavioral Gamification</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Establish Consistency. <br />
              Unlock High Score Streaks.
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Consistency is the key to deep retention. Track your study streaks, earn visual badges on your dashboard, and level up your productivity score based on task completions and focused Pomodoro sets.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                <span className="text-slate-300 text-sm">Visual feedback rings that fill as you log study minutes.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                <span className="text-slate-300 text-sm">Diagnostic reports identifying weak areas based on quiz outcomes.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                <span className="text-slate-300 text-sm">Automated email reports summarizing weekly hours vs goal deadlines.</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-pink-500/5 blur-xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-slate-500">dashboard_preview.json</span>
            </div>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-xs text-slate-400">Current Study Streak</h4>
                  <p className="text-2xl font-bold text-white mt-1 flex items-center gap-1.5">
                    <span>🔥 12 Days</span>
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">+3% today</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 flex items-center justify-center font-bold text-xs">
                  80%
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs text-slate-400">Today's Focus Slots</h4>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                  <span className="text-purple-300 font-medium">Mathematics (Calculus)</span>
                  <span className="text-slate-400">2.0 Hours</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-slate-300">Algorithms (Tree Traversals)</span>
                  <span className="text-slate-400">1.5 Hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Endorsed by Top Students
          </h2>
          <p className="text-slate-400 mt-2">
            See how high-performing scholars manage their study calendars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-slate-300 text-sm italic leading-relaxed">
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                  <span className="text-xs text-slate-500">{t.role}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">
                  🔥 {t.streak}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center text-slate-500 text-sm">
        <p>© 2026 AI Academic Success Platform. Built for peak productivity.</p>
      </footer>
    </div>
  );
}
