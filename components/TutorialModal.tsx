import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, CheckCircle } from 'lucide-react';

interface Step {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  actionRequired?: boolean; // If true, user must interact with element to proceed
}

interface TourGuideProps {
  isOpen: boolean;
  currentStepIndex: number;
  onNext: () => void;
  onClose: () => void;
}

export const TOUR_STEPS: Step[] = [
  {
    targetId: 'tour-search-input',
    title: 'Start Here',
    description: 'Type a word you want to master (e.g., "Resilient") and press Enter or click Search.',
    position: 'bottom',
    actionRequired: true
  },
  {
    targetId: 'tour-audio-btn',
    title: 'Listen & Repeat',
    description: 'Don\'t just read! Click here to hear the standard pronunciation.',
    position: 'right',
    actionRequired: false
  },
  {
    targetId: 'tour-youglish-btn',
    title: 'Real Context',
    description: 'Click YouGlish to hear how native speakers use this word in real videos.',
    position: 'top',
    actionRequired: false
  },
  {
    targetId: 'tour-images-btn',
    title: 'Visual Memory',
    description: 'Connect the word to an image. Click here to see visual references.',
    position: 'top',
    actionRequired: false
  },
  {
    targetId: 'tour-study-prompts',
    title: 'Active Practice',
    description: 'The most important part: Use these prompts to practice speaking and writing immediately.',
    position: 'top',
    actionRequired: false
  }
];

export const TutorialModal: React.FC<TourGuideProps> = ({ isOpen, currentStepIndex, onNext, onClose }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const step = TOUR_STEPS[currentStepIndex];

  const updatePosition = useCallback(() => {
    if (!step) return;
    
    const element = document.getElementById(step.targetId);
    if (element) {
      // Scroll element into view with some padding
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Get coordinates
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      setIsVisible(true);
    } else {
      // If element not found yet (e.g. during loading transitions), hide tooltip momentarily
      setIsVisible(false);
    }
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow DOM updates/animations to finish before calculating position
      const timer = setTimeout(updatePosition, 500);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isOpen, currentStepIndex, updatePosition]);

  if (!isOpen || !step || !targetRect || !isVisible) return null;

  // Calculate Tooltip Position
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 60,
    width: '320px',
  };

  const gap = 16; // Gap between element and tooltip

  if (step.position === 'bottom') {
    tooltipStyle.top = targetRect.bottom + gap;
    tooltipStyle.left = targetRect.left + (targetRect.width / 2) - 160;
  } else if (step.position === 'top') {
    tooltipStyle.bottom = (window.innerHeight - targetRect.top) + gap;
    tooltipStyle.left = targetRect.left + (targetRect.width / 2) - 160;
  } else if (step.position === 'right') {
    tooltipStyle.top = targetRect.top + (targetRect.height / 2) - 60; // Vertically centered approx
    tooltipStyle.left = targetRect.right + gap;
  } else if (step.position === 'left') {
    tooltipStyle.top = targetRect.top;
    tooltipStyle.right = (window.innerWidth - targetRect.left) + gap;
  }

  // Ensure tooltip stays on screen horizontally
  if (tooltipStyle.left && typeof tooltipStyle.left === 'number') {
    if (tooltipStyle.left < 10) tooltipStyle.left = 10;
    if (tooltipStyle.left + 320 > window.innerWidth) tooltipStyle.left = window.innerWidth - 330;
  }

  return (
    <>
      {/* Backdrop Overlay (Darken the rest of the screen) */}
      <div className="fixed inset-0 z-50 bg-slate-900/60 transition-opacity duration-300" />

      {/* Spotlight Ring/Highlight */}
      <div 
        className="fixed z-50 rounded-lg ring-4 ring-brand-400 ring-opacity-70 animate-pulse pointer-events-none transition-all duration-300"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      {/* The Tooltip Card */}
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-5 border border-slate-200 dark:border-slate-700 animate-scale-up"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
            {step.title}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-5 leading-relaxed">
          {step.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Step {currentStepIndex + 1} of {TOUR_STEPS.length}
          </span>
          
          {!step.actionRequired && (
            <button 
              onClick={onNext}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-bold transition-colors shadow-md"
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              {currentStepIndex === TOUR_STEPS.length - 1 ? <CheckCircle size={14} /> : <ArrowRight size={14} />}
            </button>
          )}
          {step.actionRequired && (
             <span className="text-xs text-brand-600 dark:text-brand-400 font-bold animate-pulse">
               Interact to continue...
             </span>
          )}
        </div>

        {/* Little arrow pointing to element */}
        <div 
          className={`absolute w-4 h-4 bg-white dark:bg-slate-800 transform rotate-45 border-slate-200 dark:border-slate-700 ${
            step.position === 'bottom' ? '-top-2 border-t border-l left-1/2 -ml-2' :
            step.position === 'top' ? '-bottom-2 border-b border-r left-1/2 -ml-2' :
            step.position === 'right' ? '-left-2 border-b border-l top-1/2 -mt-2' :
            ''
          }`}
        />
      </div>
    </>
  );
};