import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OnboardingWizard from './pages/OnboardingWizard';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import ChatAssistant from './pages/ChatAssistant';
import NotesGenerator from './pages/NotesGenerator';
import QuizGenerator from './pages/QuizGenerator';
import Analytics from './pages/Analytics';

import { 
  Brain, LayoutDashboard, Calendar, MessageSquare, 
  BookOpen, Target, BarChart2, LogOut, Menu, X, Sun, Moon, Sparkles 
} from 'lucide-react';

function AppContent() {
  const { user, token, loading, logout, api } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [checkingOnboard, setCheckingOnboard] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Check onboarding status on login
  useEffect(() => {
    const checkOnboardStatus = async () => {
      if (!token) {
        setCheckingOnboard(false);
        return;
      }
      try {
        const res = await api.get('/api/profile');
        // If college details exist, they are onboarded
        if (res.data && res.data.college) {
          setIsOnboarded(true);
        } else {
          setIsOnboarded(false);
        }
      } catch (err) {
        // If profile doesn't exist or is empty
        setIsOnboarded(false);
      } finally {
        setCheckingOnboard(false);
      }
    };
    checkOnboardStatus();
  }, [token, user]);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#030014';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f8fafc';
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (loading || (token && checkingOnboard)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030014] text-slate-100 gap-2">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading AI Study Hub...</span>
      </div>
    );
  }

  // 1. ANONYMOUS: Show Landing or Login
  if (!token) {
    if (showLogin) {
      return (
        <LoginPage 
          onAuthSuccess={() => setShowLogin(false)} 
          onGoBack={() => setShowLogin(false)} 
        />
      );
    }
    return <LandingPage onStart={() => setShowLogin(true)} />;
  }

  // 2. LOGGED IN BUT NOT ONBOARDED: Show Onboarding wizard
  if (!isOnboarded) {
    return <OnboardingWizard onComplete={() => setIsOnboarded(true)} />;
  }

  // 3. FULLY AUTHENTICATED & ONBOARDED: Show Sidebar + Active Page layout
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Daily Planner', icon: Calendar },
    { id: 'assistant', label: 'AI Tutor Chat', icon: MessageSquare },
    { id: 'notes', label: 'Notes Compiler', icon: BookOpen },
    { id: 'quiz', label: 'AI Quiz', icon: Target },
    { id: 'analytics', label: 'Analytics & Calendar', icon: BarChart2 }
  ];

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#030014] text-slate-100' : 'bg-slate-50 text-slate-900'} font-outfit`}>
      
      {/* Background gradients for dark mode */}
      {theme === 'dark' && (
        <>
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-purple-900/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/3 left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r transition-all duration-350 lg:static lg:translate-x-0 ${
        theme === 'dark' ? 'bg-[#06041a] border-white/5' : 'bg-white border-slate-200'
      } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/25">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AI Study Planner
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Summary profile card */}
        <div className="p-4 mx-4 my-4 rounded-xl border border-white/5 bg-slate-950/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white shadow-inner">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.full_name}</p>
            <span className="text-[9px] text-slate-500 truncate block">Academic Member</span>
          </div>
        </div>

        {/* Menu Navigation Link List */}
        <nav className="px-4 py-2 space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30' 
                    : 'text-slate-400 hover:bg-purple-500/5 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-white/5 bg-slate-950/10 space-y-3">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-white/5 bg-slate-950/30 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <span className="text-[10px] text-slate-600">Toggle</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Main app panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Top Header navbar */}
        <header className={`p-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#06041a]/60 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl border border-white/5 lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-white capitalize flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>{activePage.replace('-', ' ')} Hub</span>
            </h1>
          </div>
          
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider hidden sm:block">
            AI Study Platform v1.0
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
          {activePage === 'planner' && <Planner />}
          {activePage === 'assistant' && <ChatAssistant />}
          {activePage === 'notes' && <NotesGenerator />}
          {activePage === 'quiz' && <QuizGenerator />}
          {activePage === 'analytics' && <Analytics />}
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
