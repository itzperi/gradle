'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Volume2, 
  AudioLines, 
  Radio, 
  RefreshCw, 
  Waves,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.mediaDevices) {
      setError('Your browser does not support microphone access');
      setTestStatus('error');
    }
  }, []);

  const startMicTest = async () => {
    setError('');
    setTestStatus('testing');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Microphone access not supported');
      setTestStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);

      setIsListening(true);
      monitorAudioLevel();
    } catch (err: any) {
      setError(err.message || 'Error accessing microphone');
      setTestStatus('error');
    }
  };

  const stopMicTest = () => {
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    setIsListening(false);
    setAudioLevel(0);
    setTestStatus('idle');
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current || !isListening) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
    const level = Math.min(100, average / 2.56);
    setAudioLevel(level);

    if (level > 10) {
      setTestStatus('success');
    }

    requestAnimationFrame(monitorAudioLevel);
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case 'testing': return 'from-blue-500 to-cyan-500';
      case 'success': return 'from-green-500 to-emerald-500';
      case 'error': return 'from-red-500 to-rose-500';
      default: return 'from-indigo-500 to-purple-500';
    }
  };

  return (
    <main className="min-h-screen">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 
        bg-gradient-to-br from-black via-slate-900 to-black">
        
        {/* Background Gradient */}
        <div className={`absolute inset-0 pointer-events-none 
          bg-gradient-to-r ${getStatusColor()} opacity-20 blur-3xl animate-pulse`} />
        
        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-900/60 backdrop-blur-2xl 
            border border-slate-800/50 rounded-3xl shadow-2xl 
            overflow-hidden transform transition-all duration-500 
            hover:scale-[1.02]">
            
            {/* Status Bar */}
            <div className={`w-full h-2 bg-gradient-to-r ${getStatusColor()} 
              transition-all duration-500`} />
            
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  {testStatus === 'testing' ? (
                    <Waves className="text-slate-200 animate-pulse" size={40} />
                  ) : testStatus === 'success' ? (
                    <CheckCircle2 className="text-green-400" size={40} />
                  ) : testStatus === 'error' ? (
                    <AlertTriangle className="text-red-400" size={40} />
                  ) : (
                    <Mic className="text-slate-200" size={40} />
                  )}
                </div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent 
                  bg-gradient-to-r from-green-400 to-emerald-600">
                  Mic Diagnostics
                </h1>
                <p className="text-slate-400 text-sm">
                  {testStatus === 'idle' ? 'Ready to test your microphone' :
                   testStatus === 'testing' ? 'Analyzing audio input...' :
                   testStatus === 'success' ? 'Microphone working perfectly!' :
                   'Something went wrong'}
                </p>
              </div>

              {/* Controls */}
              {!isListening ? (
                <button 
                  onClick={startMicTest}
                  disabled={testStatus === 'error'}
                  className="w-full flex items-center justify-center space-x-4 
                    bg-gradient-to-r from-green-500 to-emerald-600 
                    text-white py-4 rounded-xl transition-all duration-300 
                    hover:scale-105 focus:outline-none focus:ring-4 
                    focus:ring-green-500/50 disabled:opacity-50 
                    disabled:cursor-not-allowed"
                >
                  <Mic size={24} strokeWidth={2.5} />
                  <span className="font-semibold">Start Mic Test</span>
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 flex items-center">
                      <Waves className="mr-2" size={20} />
                      Audio Level
                    </span>
                    <div className="flex items-center space-x-2">
                      <Volume2 size={20} className="text-green-500" />
                      <span className="text-slate-200">{Math.round(audioLevel)}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 
                        h-3 rounded-full transition-all duration-300 animate-pulse"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button 
                      onClick={stopMicTest}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 
                        text-red-400 py-3 rounded-lg flex items-center 
                        justify-center space-x-2 transition-all duration-300"
                    >
                      <Radio size={20} />
                      <span>Stop Test</span>
                    </button>
                    <button 
                      onClick={() => { stopMicTest(); startMicTest(); }}
                      className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 
                        text-slate-200 py-3 rounded-lg flex items-center 
                        justify-center space-x-2 transition-all duration-300"
                    >
                      <RefreshCw size={20} />
                      <span>Restart</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 text-red-400 text-center bg-red-500/10 
                  p-4 rounded-lg border border-red-500/20 
                  flex flex-col items-center">
                  <AlertTriangle size={40} className="mb-2 text-red-500 opacity-70" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-slate-500 text-xs mt-4 opacity-70">
            <p className="flex items-center justify-center">
              <AudioLines size={16} className="mr-2" />
              Powered by Web Audio APIs
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
