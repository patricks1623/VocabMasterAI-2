import React, { useState, useRef } from 'react';
import { VocabularyResponse, PronunciationResult } from '../types';
import { evaluatePronunciation } from '../services/geminiService';
import { Volume2, ExternalLink, BookOpen, PenTool, MessageCircle, Info, Layers, Image as ImageIcon, Mic, Square, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResultCardProps {
  data: VocabularyResponse;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cambridge Dictionary URL
  const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(data.word.toLowerCase())}`;
  
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

  const startRecording = async () => {
    try {
      setRecordingError(null);
      setPronunciationResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check for supported mime types to ensure compatibility (fixes iOS/Safari issues)
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Use the actual mime type determined by the MediaRecorder
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        if (blob.size > 0) {
          await handleAnalysis(blob, mimeType);
        } else {
          setRecordingError("No audio detected. Please try again.");
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setRecordingError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalysis = async (audioBlob: Blob, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const result = await evaluatePronunciation(data.word, base64String, mimeType);
        setPronunciationResult(result);
        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error(err);
      setRecordingError("Failed to analyze pronunciation.");
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
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
                  title="Listen to pronunciation"
                >
                  <Volume2 size={20} />
                </button>
                
                <div className="w-px h-4 bg-white/30 mx-1"></div>

                {/* Microphone Button */}
                {!isRecording ? (
                   <button 
                    onClick={startRecording}
                    disabled={isAnalyzing}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                    title="Practice Pronunciation"
                  >
                    <Mic size={20} />
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors animate-pulse"
                    title="Stop Recording"
                  >
                    <Square size={20} fill="currentColor" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {isRecording && <p className="text-xs text-white/80 ml-1 animate-pulse">Listening... click stop when done.</p>}
        </div>
      </div>

      {/* Pronunciation Feedback Section (Conditionals) */}
      {(isAnalyzing || pronunciationResult || recordingError) && (
        <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 p-6 transition-all duration-300">
           {recordingError && (
             <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
               <AlertCircle size={16} />
               {recordingError}
             </div>
           )}

           {isAnalyzing && (
             <div className="flex flex-col items-center justify-center py-4 gap-3">
                <Loader2 size={24} className="animate-spin text-brand-600" />
                <span className="text-sm text-slate-500 dark:text-slate-400">AI is analyzing your pronunciation...</span>
             </div>
           )}

           {pronunciationResult && !isAnalyzing && (
             <div className="animate-slide-down">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                   <Mic size={18} className="text-brand-600" />
                   Pronunciation Feedback
                 </h3>
                 <div className={`text-xl font-bold ${getScoreColor(pronunciationResult.score)}`}>
                   {pronunciationResult.score}<span className="text-sm font-normal text-slate-400">/100</span>
                 </div>
               </div>
               
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Coach's Feedback</h4>
                   <p className="text-sm text-slate-700 dark:text-slate-300">{pronunciationResult.feedback}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                   <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">Quick Tip</h4>
                   <p className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                     <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
                     {pronunciationResult.improvementTip}
                   </p>
                 </div>
               </div>
             </div>
           )}
        </div>
      )}

      <div className="p-8 space-y-8">
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Image & Meaning */}
          <div className="flex-1 space-y-6">
            
             {/* Generated Image */}
             {data.imageUrl ? (
              <section className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <ImageIcon size={14} />
                  <span>Visualization</span>
                </div>
                <img 
                  src={data.imageUrl} 
                  alt={`Illustration of ${data.word}`}
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-700"
                />
              </section>
            ) : (
              <div className="h-48 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 border-dashed">
                <span className="text-sm">Image not available</span>
              </div>
            )}

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
              <a 
                href={cambridgeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors text-sm font-medium w-full border border-indigo-100 dark:border-indigo-800"
              >
                <ExternalLink size={16} />
                View on Cambridge Dictionary
              </a>
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
                  <h3 className="font-bold text-sm uppercase">Related Phrases</h3>
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
            <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100">Practice & Retention</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/50 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-3">
                <MessageCircle size={20} />
                <h4 className="font-bold">Speaking Prompt</h4>
              </div>
              <p className="text-indigo-900 dark:text-indigo-200 font-medium italic text-lg">
                "{data.practice.speakingPrompt}"
              </p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-4 uppercase tracking-wide font-semibold">Try answering aloud now</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-xl border border-emerald-100 dark:border-emerald-900/50 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-3">
                <PenTool size={20} />
                <h4 className="font-bold">Writing Task</h4>
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