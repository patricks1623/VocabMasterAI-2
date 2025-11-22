import React, { useState, useCallback, useEffect } from 'react';
import { generateVocabularyLesson, generateImageForWord } from './services/geminiService';
import { VocabularyResponse } from './types';
import { ResultCard } from './components/ResultCard';
import { TutorialModal } from './components/TutorialModal';
import { GraduationCap, Sparkles, Loader2, Clock, ArrowRight, History, Trash2, ChevronLeft, HelpCircle } from 'lucide-react';

type ViewState = 'home' | 'result' | 'history';

function App() {
  const [word, setWord] = useState('');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VocabularyResponse | null>(null);
  const [history, setHistory] = useState<VocabularyResponse[]>([]);
  const [view, setView] = useState<ViewState>('home');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Load history from local storage on mount and check for tutorial
  useEffect(() => {
    const savedHistory = localStorage.getItem('vocabMasterHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
        // If corrupt, clear it
        localStorage.removeItem('vocabMasterHistory');
      }
    }

    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem('vocabMaster_hasSeenTutorial_v1');
    if (!hasSeenTutorial) {
      setIsTutorialOpen(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    localStorage.setItem('vocabMaster_hasSeenTutorial_v1', 'true');
  };

  const handleOpenTutorial = () => {
    setIsTutorialOpen(true);
  };

  const addToHistory = (newItem: VocabularyResponse) => {
    setHistory(prevHistory => {
      // Remove if exists (to move to top)
      const filtered = prevHistory.filter(item => item.word.toLowerCase() !== newItem.word.toLowerCase());
      // Add new item to top.
      const newHistory = [newItem, ...filtered];
      localStorage.setItem('vocabMasterHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    if (confirmClear) {
      setHistory([]);
      localStorage.removeItem('vocabMasterHistory');
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      // Auto-reset confirmation state after 3 seconds
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleGoHome = () => {
    setView('home');
    setResult(null);
    setWord('');
    setContext('');
    setError(null);
    setConfirmClear(false);
  };

  const handleGoToHistory = () => {
    setView('history');
    setResult(null);
    setError(null);
    setConfirmClear(false);
  };

  const handleHistoryClick = (item: VocabularyResponse) => {
    setResult(item);
    setWord(item.word);
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Run both generation tasks in parallel
      const [lessonData, generatedImageUrl] = await Promise.all([
        generateVocabularyLesson({ word, context }),
        generateImageForWord(word)
      ]);
      
      const completeResult = {
        ...lessonData,
        imageUrl: generatedImageUrl
      };

      // Combine the data
      setResult(completeResult);
      addToHistory(completeResult);
      setView('result');

    } catch (err: any) {
      console.error("Operation failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [word, context]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300 flex flex-col">
      <TutorialModal isOpen={isTutorialOpen} onClose={handleCloseTutorial} />
      
      {/* Header / Hero */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoHome}
              className="flex items-center gap-2 text-brand-600 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <GraduationCap size={32} strokeWidth={1.5} />
              <h1 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 tracking-tight">VocabMaster</h1>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenTutorial}
              className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Help / Tutorial"
            >
              <HelpCircle size={20} />
            </button>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>

            <button
              onClick={handleGoToHistory}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                view === 'history' 
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History size={18} />
              <span className="hidden md:inline">History</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 w-full flex-grow">
        
        {/* SEARCH / HOME VIEW */}
        {view === 'home' && (
          <div className="animate-fade-in">
            {/* Introduction */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-4">
                Master English,<br /> One Word at a Time.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Enter a word below to receive comprehensive definitions, phonetics, illustrations, and practice prompts.
              </p>
            </div>

            {/* Search Form */}
            <div className="max-w-xl mx-auto mb-16">
              <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-2 transition-colors duration-300">
                <div className="flex-1 flex flex-col justify-center px-4 py-2">
                  <label htmlFor="word" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Word</label>
                  <input
                    id="word"
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="e.g. Ephemeral"
                    className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-100 font-serif text-lg placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    required
                  />
                </div>
                <div className="w-px bg-slate-100 dark:bg-slate-800 hidden md:block transition-colors"></div>
                <button
                  type="submit"
                  disabled={isLoading || !word}
                  className="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl px-8 py-3 md:py-0 font-medium transition-colors flex items-center justify-center gap-2 min-w-[140px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error State */}
            {error && (
              <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-200 rounded-lg border border-red-100 dark:border-red-900 text-center">
                <span className="font-bold block mb-1">Not Found:</span>
                {error}
              </div>
            )}

            {/* Recent Studies (Limit to top 6 on home) */}
            {history.length > 0 && (
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xs font-bold">
                    <Clock size={14} />
                    <span>Recent Searches</span>
                  </div>
                  <button 
                    onClick={handleGoToHistory}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.slice(0, 6).map((item) => (
                    <button 
                      key={item.word}
                      onClick={() => handleHistoryClick(item)}
                      className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all text-left group flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-3 w-full">
                        <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors capitalize">
                          {item.word}
                        </h3>
                        <span className="text-[10px] px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-100 dark:border-slate-700 font-medium uppercase tracking-wide">
                          {item.partOfSpeech}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-grow">
                        {item.meaning}
                      </p>
                      <div className="flex items-center text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        <span>View Details</span>
                        <ArrowRight size={12} className="ml-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT VIEW */}
        {view === 'result' && result && (
          <div className="animate-slide-up">
            <button 
              onClick={handleGoHome}
              className="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium text-sm"
            >
              <ChevronLeft size={16} />
              Back to Search
            </button>
            <ResultCard data={result} />
          </div>
        )}

        {/* LOADING VIEW (If coming from search) */}
        {view === 'home' && isLoading && (
           <div className="fixed inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <Loader2 size={48} className="animate-spin text-brand-600" />
               <p className="font-serif text-xl text-slate-800 dark:text-slate-100 animate-pulse">Searching Dictionary...</p>
             </div>
           </div>
        )}

        {/* HISTORY VIEW */}
        {view === 'history' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Study History
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Review your entire learning journey.
                </p>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium self-start md:self-auto ${
                    confirmClear 
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-md ring-2 ring-red-200 dark:ring-red-900' 
                      : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40'
                  }`}
                >
                  <Trash2 size={16} />
                  {confirmClear ? 'Confirm Delete?' : 'Clear History'}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 mb-4">
                  <History size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No history yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Start searching for words to build your vocabulary.</p>
                <button 
                  onClick={handleGoHome}
                  className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
                >
                  Start Learning
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item, index) => (
                  <button 
                    key={`${item.word}-${index}`}
                    onClick={() => handleHistoryClick(item)}
                    className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all text-left group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-3 w-full">
                      <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors capitalize">
                        {item.word}
                      </h3>
                      <span className="text-[10px] px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-100 dark:border-slate-700 font-medium uppercase tracking-wide">
                        {item.partOfSpeech}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-grow">
                      {item.meaning}
                    </p>
                    <div className="flex items-center text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                      <span>View Details</span>
                      <ArrowRight size={12} className="ml-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;