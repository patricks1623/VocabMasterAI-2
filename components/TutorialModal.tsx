import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, GraduationCap, Search, Mic, History, Sparkles } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to VocabMaster AI",
      description: "Your personal AI-powered English vocabulary coach. Let's take a quick tour to help you get the most out of your learning.",
      icon: <GraduationCap size={48} className="text-brand-600" />,
      color: "bg-brand-50 dark:bg-brand-900/20"
    },
    {
      title: "Smart Search & Context",
      description: "Enter any word to get a full lesson. You can also add 'Context' (e.g., 'In a business meeting') to tell the AI exactly which meaning you want to learn.",
      icon: <Search size={48} className="text-blue-600" />,
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Interactive Pronunciation",
      description: "Click the Microphone icon on any word card to practice. Speak the word, and our AI will give you a score and specific tips to improve your accent.",
      icon: <Mic size={48} className="text-red-600" />,
      color: "bg-red-50 dark:bg-red-900/20"
    },
    {
      title: "Comprehensive Lessons",
      description: "Every search generates phonetics, images, example sentences, and grammar notes specifically tailored to help you master the word.",
      icon: <Sparkles size={48} className="text-amber-600" />,
      color: "bg-amber-50 dark:bg-amber-900/20"
    },
    {
      title: "Track Your Progress",
      description: "We automatically save your lessons. Use the 'History' tab to review past words or clear your study session to start fresh.",
      icon: <History size={48} className="text-purple-600" />,
      color: "bg-purple-50 dark:bg-purple-900/20"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative animate-scale-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Visual Header */}
        <div className={`h-48 ${currentStep.color} flex items-center justify-center transition-colors duration-500 ease-in-out`}>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg animate-bounce-slight">
            {currentStep.icon}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center flex-grow flex flex-col justify-between h-64">
          <div>
            <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-4 transition-all duration-300">
              {currentStep.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === step 
                    ? 'w-8 bg-brand-600' 
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer / Navigation */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
          <button 
            onClick={handlePrev}
            disabled={step === 0}
            className={`flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            {step === steps.length - 1 ? (
              <>
                Get Started
                <Sparkles size={18} />
              </>
            ) : (
              <>
                Next
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};