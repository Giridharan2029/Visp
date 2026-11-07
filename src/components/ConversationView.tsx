import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Orb } from './Orb';
import { Waveform } from './Waveform';
import {
  Mic,
  Send,
  Square,
  Maximize2,
  Minimize2,
  Radio,
  Shield,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const ConversationView: React.FC = () => {
  const {
    orbState,
    audioLevel,
    conversations,
    activeConversationId,
    currentTranscript,
    isStreaming,
    settings,
    systemContext,
    sendMessage,
    interrupt,
    startVoiceListening,
    stopVoiceListening,
    toggleMute,
    toggleHandsFree,
    setWindowMode,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isHoldingPTT, setIsHoldingPTT] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, currentTranscript]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput('');
  };

  // Push to talk handlers
  const handlePTTDown = () => {
    setIsHoldingPTT(true);
    startVoiceListening();
  };

  const handlePTTUp = () => {
    setIsHoldingPTT(false);
    stopVoiceListening();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/95 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden">
      {/* Top Header / Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-900/40 select-none">
        <div className="flex items-center gap-2.5">
          <Orb state={orbState} audioLevel={audioLevel} size={28} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-100 tracking-wide">VISP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {systemContext.activeWindow
                ? `${systemContext.activeWindow.processName}`
                : 'Ready for assistance'}
            </div>
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            title={settings.voice.isMuted ? 'Unmute VISP' : 'Mute VISP'}
            className={`p-1.5 rounded-lg text-xs transition ${
              settings.voice.isMuted
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {settings.voice.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setWindowMode('workspace')}
            title="Expand to Full Workspace Dashboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setWindowMode('orb')}
            title="Minimize to Floating Orb"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Audio Waveform / Live speech visualizer */}
      {(orbState === 'listening' || orbState === 'speaking' || isHoldingPTT) && (
        <div className="bg-slate-900/60 border-b border-cyan-500/20 py-1.5 flex items-center justify-between px-4 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-medium text-cyan-300">
              {orbState === 'speaking' ? 'VISP Speaking' : 'Listening to speech...'}
            </span>
          </div>
          <Waveform level={audioLevel} active={true} color="#06b6d4" barsCount={16} />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {activeConv?.messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-600/90 text-white shadow-md shadow-cyan-950/30 rounded-tr-xs'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800/80 shadow-md rounded-tl-xs backdrop-blur-md'
                }`}
              >
                <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                {msg.tokens && (
                  <div className="mt-1 text-[9px] text-slate-400/70 text-right">
                    {msg.tokens.total} tokens
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live speech transcription bubble */}
        {currentTranscript && (
          <div className="flex flex-col items-end animate-pulse">
            <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-3.5 py-2.5 text-xs bg-cyan-950/40 border border-cyan-500/40 text-cyan-200">
              <span>{currentTranscript}</span>
              <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Barge-in / Interrupt Banner when AI is active */}
      {(isStreaming || orbState === 'speaking') && (
        <div className="px-4 py-1.5 bg-rose-950/40 border-t border-rose-500/30 flex items-center justify-between">
          <span className="text-[11px] text-rose-300 font-medium">VISP is responding...</span>
          <button
            onClick={interrupt}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 transition"
          >
            <Square className="w-3 h-3 fill-current" />
            Interrupt
          </button>
        </div>
      )}

      {/* Input controls & Voice Triggers */}
      <div className="p-3 bg-slate-900/70 border-t border-slate-800/80 space-y-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Push-to-talk button */}
          <button
            type="button"
            onMouseDown={handlePTTDown}
            onMouseUp={handlePTTUp}
            onTouchStart={handlePTTDown}
            onTouchEnd={handlePTTUp}
            title="Press and hold to talk"
            className={`p-2.5 rounded-xl transition ${
              isHoldingPTT
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/50 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Hands-free toggle */}
          <button
            type="button"
            onClick={toggleHandsFree}
            title={settings.voice.handsFreeMode ? 'Disable hands-free listening' : 'Enable hands-free conversation'}
            className={`p-2.5 rounded-xl transition ${
              settings.voice.handsFreeMode
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Radio className="w-4 h-4" />
          </button>

          {/* Text input field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              settings.voice.handsFreeMode
                ? 'Hands-free voice active... or type here'
                : 'Message VISP or assign task...'
            }
            className="flex-1 bg-slate-950/80 border border-slate-800/80 focus:border-cyan-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white transition shadow-md shadow-cyan-950/40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Footer badges: context status & privacy */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Local Second Brain Active</span>
          </div>
          <div>
            <span>Push-to-Talk: Hold Mic</span>
          </div>
        </div>
      </div>
    </div>
  );
};
