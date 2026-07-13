import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, GraduationCap, Clock, Award, 
  Plus, Trash2, ArrowRight, ArrowLeft, Check, HelpCircle 
} from 'lucide-react';

export default function OnboardingWizard({ onComplete }) {
  const { api } = useAuth();
  const [step, setStep] = useState(1);
  
  // Step 1: Academic Info
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState(1);
  
  // Step 2: Goal and Availability
  const [targetGoal, setTargetGoal] = useState('Placement');
  const [preferredStudyTime, setPreferredStudyTime] = useState('Night');
  const [dailyAvailableHours, setDailyAvailableHours] = useState(4.0);

  // Step 3: Strong / Weak Subjects tags
  const [weakInput, setWeakInput] = useState('');
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [strongInput, setStrongInput] = useState('');
  const [strongSubjects, setStrongSubjects] = useState([]);

  // Step 4: Subject items (Name & Difficulty)
  const [subjects, setSubjects] = useState([
    { name: 'Mathematics', difficulty: 'Hard' },
    { name: 'Computer Science', difficulty: 'Medium' }
  ]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubDifficulty, setNewSubDifficulty] = useState('Medium');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handlers for lists
  const handleAddWeak = () => {
    if (weakInput.trim() && !weakSubjects.includes(weakInput.trim())) {
      setWeakSubjects([...weakSubjects, weakInput.trim()]);
      setWeakInput('');
    }
  };

  const handleRemoveWeak = (index) => {
    setWeakSubjects(weakSubjects.filter((_, i) => i !== index));
  };

  const handleAddStrong = () => {
    if (strongInput.trim() && !strongSubjects.includes(strongInput.trim())) {
      setStrongSubjects([...strongSubjects, strongInput.trim()]);
      setStrongInput('');
    }
  };

  const handleRemoveStrong = (index) => {
    setStrongSubjects(strongSubjects.filter((_, i) => i !== index));
  };

  const handleAddSubject = () => {
    if (newSubName.trim() && !subjects.some(s => s.name.toLowerCase() === newSubName.trim().toLowerCase())) {
      setSubjects([...subjects, { name: newSubName.trim(), difficulty: newSubDifficulty }]);
      setNewSubName('');
    }
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && (!college || !branch)) {
      setError('Please fill in your college and branch details.');
      return;
    }
    if (step === 4 && subjects.length === 0) {
      setError('Please add at least one subject to study.');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    // Structure payload according to schemas.OnboardingRequest
    const payload = {
      profile: {
        college,
        branch,
        semester: parseInt(semester, 10),
        target_goal: targetGoal,
        preferred_study_time: preferredStudyTime,
        daily_available_hours: parseFloat(dailyAvailableHours),
        weak_subjects: weakSubjects,
        strong_subjects: strongSubjects
      },
      subjects: subjects.map(s => ({
        name: s.name,
        difficulty: s.difficulty
      }))
    };

    try {
      await api.post('/api/profile/setup', payload);
      // Auto-trigger plan generation
      await api.post('/api/planner/generate');
      onComplete();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Failed to save profile. Please verify your fields.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 overflow-hidden bg-[#030014] font-outfit">
      
      {/* Background radial effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/15 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[100px]" />

      <div className="w-full max-w-xl z-10">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                step >= s 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-16 md:w-24 h-0.5 mx-2 transition-all duration-300 ${
                  step > s ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-800'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <motion.div 
          layout
          className="glass-card p-8 rounded-2xl relative overflow-hidden"
        >
          {/* Top glow border */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-pink-500 opacity-60" />

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Academic Setup */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Academic Details</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Let's set up your university details.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">College / University Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-[10px] text-slate-500">Provide the official name for planner context.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Branch / Major</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i+1} value={i+1}>Semester {i+1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Goal and Availability */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Study Preferences</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Define your targets and daily time budget.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Primary Target Goal</label>
                    <select
                      value={targetGoal}
                      onChange={(e) => setTargetGoal(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="Placement">Placements / Job Search</option>
                      <option value="Exams">University / Semester Exams</option>
                      <option value="GATE">GATE / Engineering Exams</option>
                      <option value="UPSC">UPSC / Civil Services</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Preferred Study Block</label>
                      <select
                        value={preferredStudyTime}
                        onChange={(e) => setPreferredStudyTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="Morning">Morning (06:00 - 12:00)</option>
                        <option value="Afternoon">Afternoon (12:00 - 17:00)</option>
                        <option value="Evening">Evening (17:00 - 21:00)</option>
                        <option value="Night">Night (21:00 - 02:00)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Daily Hours Limit</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="16"
                        value={dailyAvailableHours}
                        onChange={(e) => setDailyAvailableHours(parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Weak / Strong Subjects tags */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Skill Focus</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Mark your strengths & weak subjects for smart scheduling.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Weak Subjects */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Weak Areas / Needs Extra Attention</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Mathematics"
                        value={weakInput}
                        onChange={(e) => setWeakInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWeak())}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddWeak}
                        className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {weakSubjects.map((sub, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20">
                          <span>{sub}</span>
                          <button type="button" onClick={() => handleRemoveWeak(idx)} className="text-red-400 hover:text-red-200">×</button>
                        </span>
                      ))}
                      {weakSubjects.length === 0 && <span className="text-xs text-slate-500">None added yet.</span>}
                    </div>
                  </div>

                  {/* Strong Subjects */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Strong Areas / Good Confidence</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Computer Networks"
                        value={strongInput}
                        onChange={(e) => setStrongInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStrong())}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddStrong}
                        className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {strongSubjects.map((sub, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <span>{sub}</span>
                          <button type="button" onClick={() => handleRemoveStrong(idx)} className="text-emerald-400 hover:text-emerald-200">×</button>
                        </span>
                      ))}
                      {strongSubjects.length === 0 && <span className="text-xs text-slate-500">None added yet.</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Subjects configuration */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Course Syllabus</h3>
                    <p className="text-slate-400 text-xs mt-0.5">List the current subjects to allocate schedules for.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Form to add item */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase">Add Subject</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-sm"
                      />
                      <select
                        value={newSubDifficulty}
                        onChange={(e) => setNewSubDifficulty(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-sm"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSubject}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm flex items-center justify-center gap-1.5"
                      >
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* List of subjects added */}
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                    {subjects.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/30 text-sm">
                        <div>
                          <p className="font-semibold text-white">{sub.name}</p>
                          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                            sub.difficulty === 'Hard' ? 'bg-red-500/10 text-red-300' :
                            sub.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-300' :
                            'bg-emerald-500/10 text-emerald-300'
                          }`}>
                            {sub.difficulty}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(idx)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {subjects.length === 0 && (
                      <div className="text-center py-6 text-slate-500 text-sm italic">
                        No subjects added yet. Please add at least one subject.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 font-semibold flex items-center gap-1.5 text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 text-sm transition-all shadow-lg shadow-purple-900/30"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold flex items-center gap-1.5 text-sm transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Roadmaps...</span>
                  </>
                ) : (
                  <>
                    <span>Finish Onboarding</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
