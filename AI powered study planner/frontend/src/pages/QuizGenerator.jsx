import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Check, X, HelpCircle, Award, 
  RotateCcw, ShieldCheck, ArrowRight, AlertTriangle
} from 'lucide-react';

export default function QuizGenerator() {
  const { api } = useAuth();
  
  // Settings states
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionsCount, setQuestionsCount] = useState(3);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Active quiz states
  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]); // user selections
  const [graded, setGraded] = useState(false); // whether current question shows explanation
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please specify a topic for the quiz.');
      return;
    }

    setLoading(true);
    setError('');
    setQuiz(null);
    setCurrentIdx(0);
    setAnswers([]);
    setGraded(false);
    setScore(0);
    setQuizFinished(false);

    try {
      const res = await api.post(`/api/quiz/generate?topic=${encodeURIComponent(topic.trim())}&difficulty=${difficulty}&questions_count=${questionsCount}`);
      setQuiz(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate quiz. Verify Gemini settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option) => {
    if (graded) return; // cannot change answer once evaluated
    setSelectedOption(option);
  };

  const handleEvaluate = () => {
    if (!selectedOption) return;
    
    const currentQuestion = quiz.questions[currentIdx];
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers([...answers, {
      question: currentQuestion.question,
      selected: selectedOption,
      correct: currentQuestion.correct_answer,
      isCorrect
    }]);

    setGraded(true);
  };

  const handleNext = async () => {
    setSelectedOption(null);
    setGraded(false);

    if (currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Quiz finished
      setQuizFinished(true);
      setSubmitting(true);
      try {
        // Collect weak topics from answers
        const weakTopics = [];
        answers.forEach((ans, index) => {
          if (!ans.isCorrect) {
            // Push sub-topics if any, or just the parent topic
            weakTopics.push(quiz.topic);
          }
        });
        
        // Post score to DB
        await api.post(`/api/quiz/submit/${quiz.id}`, {
          score: score,
          total_questions: quiz.questions.length,
          time_taken: 60, // Mock time taken
          weak_topics: Array.from(new Set(weakTopics))
        });
      } catch (err) {
        console.error('Failed to submit results', err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto font-outfit px-1">
      
      {!quiz ? (
        // Setup Card
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-2xl space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <span>AI Quiz Generator</span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Test your comprehension and detect weaknesses dynamically.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleStartQuiz} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase">Topic / Syllabus Unit</label>
              <input
                type="text"
                placeholder="e.g. Database Normalization or Calculus Limits"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-[10px] text-slate-500">Provide the specific concept you wish to practice.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white text-sm"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Number of MCQs</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={questionsCount}
                  onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/50 text-white text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating AI Diagnostic Quiz...</span>
                </>
              ) : (
                <>
                  <span>Generate Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      ) : !quizFinished ? (
        // Active Quiz Card
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 md:p-8 rounded-2xl space-y-6"
        >
          {/* Progress header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-semibold uppercase">{quiz.title}</span>
              <p className="text-xs text-slate-400 mt-1">Difficulty: {quiz.difficulty}</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Q: {currentIdx + 1} of {quiz.questions.length}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
              {quiz.questions[currentIdx].question}
            </h3>
            
            {/* Options list */}
            <div className="space-y-2.5">
              {quiz.questions[currentIdx].options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === quiz.questions[currentIdx].correct_answer;
                
                let optionStyle = "border-white/5 bg-slate-950/20 text-slate-300 hover:border-slate-800";
                
                if (isSelected) {
                  optionStyle = "border-purple-500 bg-purple-500/10 text-purple-200";
                }
                
                if (graded) {
                  if (isCorrect) {
                    optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                  } else if (isSelected) {
                    optionStyle = "border-red-500 bg-red-500/10 text-red-300";
                  } else {
                    optionStyle = "border-white/5 bg-slate-950/20 text-slate-500 opacity-60";
                  }
                }

                return (
                  <button
                    key={i}
                    disabled={graded}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span>{opt}</span>
                    {graded && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                    {graded && isSelected && !isCorrect && <X className="w-4 h-4 text-red-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation block */}
          <AnimatePresence>
            {graded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-xl border border-slate-700 bg-slate-900/40 space-y-2 text-xs"
              >
                <p className="font-bold text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  <span>AI Tutor Explanation</span>
                </p>
                <p className="text-slate-400 leading-relaxed font-sans">
                  {quiz.questions[currentIdx].explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action button */}
          <div className="flex justify-end pt-4 border-t border-white/5">
            {!graded ? (
              <button
                onClick={handleEvaluate}
                disabled={!selectedOption}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-md flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              >
                <span>{currentIdx + 1 < quiz.questions.length ? 'Next Question' : 'View Score'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </motion.div>
      ) : (
        // Results Card
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 rounded-2xl text-center space-y-6"
        >
          <div className="p-4 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit mx-auto animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Quiz Evaluation Completed!</h2>
            <p className="text-slate-400 text-xs mt-1">Diagnostic stats updated.</p>
          </div>

          <div className="py-2">
            <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {score} / {quiz.questions.length}
            </span>
            <p className="text-xs text-slate-500 mt-1">Total score logged</p>
          </div>

          {/* Pass / Fail threshold */}
          {((score / quiz.questions.length) * 100) < 70 ? (
            <div className="p-4 rounded-xl border border-red-500/15 bg-red-500/5 text-red-300 text-xs flex gap-2 text-left items-start max-w-md mx-auto leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Adaptive Alert:</span> Score is below 70%. We've flagged <code className="text-white">"{quiz.topic}"</code> as a weak subject in your profile. Schedulers will prioritize it in future plans.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 text-emerald-300 text-xs flex gap-2 text-left items-start max-w-md mx-auto leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Excellent score!</span> You have displayed strong comprehension. Future schedules will space out this topic for maintenance revision.
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-4 justify-center">
            <button
              onClick={() => setQuiz(null)}
              className="px-6 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry / New Quiz</span>
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
