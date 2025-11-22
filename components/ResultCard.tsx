
import React from 'react';
import { VocabularyResponse } from '../types';
import { Volume2, BookOpen, PenTool, MessageCircle, Info, Layers, Image as ImageIcon } from 'lucide-react';

interface ResultCardProps {
  data: VocabularyResponse;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data }) => {
  // YouGlish URL for pronunciation
  const youglishUrl = `https://youglish.com/pronounce/${encodeURIComponent(data.word)}/english?`;
  
  // Google Images URL for visual context
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(data.word)}`;

  // Simple browser-based TTS
  const playAudio = () => {
    const utterance = new SpeechSynthesisUtterance(data.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in transition-colors duration-300">
      {/* Header Section */}
      <div className="bg-brand-600 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-2">
            <h2 className="text-5xl font-serif font-bold tracking-tight capitalize">{data.word}</h2>
            <div className="flex items-center gap-3 md:mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                {data.partOfSpeech}
              </span>
              <span className="font-mono text-lg opacity-90">{data.phonetics}</span>
              
              <div className="flex items-center bg-white/10 rounded-full p-1 ml-2">
                <button 
                  onClick={playAudio}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Listen to standard pronunciation"
                >
                  <Volume2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Meaning */}
          <div className="flex-1 space-y-6">
            
            {/* Meaning */}
            <section>
              <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400 mb-3">
                <BookOpen size={20} />
                <h3 className="font-semibold uppercase tracking-wider text-sm">Meaning</h3>
              </div>
              <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {data.meaning}
              </p>
            </section>

             {/* External Links */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <a 
                    href={youglishUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
                >
                    <Volume2 size={16} />
                    YouGlish
                </a>
                <a 
                    href={googleImagesUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
                >
                    <ImageIcon size={16} />
                    Images
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Examples & Grammar */}
          <div className="flex-1 space-y-8">
            {/* Examples */}
            <section className="bg-slate-50 dark:bg-slate-950 rounded-xl p-6 border border-slate-100 dark:border-slate-800 h-fit">
              <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400 mb-4">
                <Layers size={20} />
                <h3 className="font-semibold uppercase tracking-wider text-sm">Example Sentences</h3>
              </div>
              <ul className="space-y-4">
                {data.exampleSentences.length > 0 ? (
                  data.exampleSentences.map((sentence, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-600 dark:text-slate-300">
                      <span className="text-brand-400 font-bold select-none mt-1">•</span>
                      <span className="italic leading-relaxed">"{sentence}"</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">No examples available.</li>
                )}
              </ul>
            </section>

            {/* Grammar Note */}
            <section className="border-l-4 border-brand-300 dark:border-brand-700 pl-4 py-1">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-2">
                <Info size={18} className="text-brand-600 dark:text-brand-500" />
                <h3 className="font-bold text-sm uppercase">Grammar & Usage</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {data.grammarNote}
              </p>
            </section>

            {/* Related Expressions */}
            {data.relatedExpressions && (
              <section className="border-l-4 border-amber-300 dark:border-amber-700 pl-4 py-1">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-2">
                  <Layers size={18} className="text-amber-600 dark:text-amber-500" />
                  <h3 className="font-bold text-sm uppercase">Synonyms</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {data.relatedExpressions}
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Practice Activity */}
        <section className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100">Study Prompts</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/50 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-3">
                <MessageCircle size={20} />
                <h4 className="font-bold">Conversation</h4>
              </div>
              <p className="text-indigo-900 dark:text-indigo-200 font-medium italic text-lg">
                "{data.practice.speakingPrompt}"
              </p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-4 uppercase tracking-wide font-semibold">Try saying this aloud</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-xl border border-emerald-100 dark:border-emerald-900/50 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-3">
                <PenTool size={20} />
                <h4 className="font-bold">Journaling</h4>
              </div>
              <p className="text-emerald-900 dark:text-emerald-200 font-medium">
                {data.practice.writingTask}
              </p>
              <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-4 uppercase tracking-wide font-semibold">Write it down in your notes</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
