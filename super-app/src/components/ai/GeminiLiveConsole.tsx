import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Radio,
  Volume2,
  Key,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import {
  geminiLiveService,
  ChatMessage,
  LiveSessionStatus,
} from '../../services/gemini-live.service';

interface GeminiLiveConsoleProps {
  onClose?: () => void;
}

export const GeminiLiveConsole: React.FC<GeminiLiveConsoleProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<LiveSessionStatus>('DISCONNECTED');
  const [inputText, setInputText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiLiveService.getApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(!geminiLiveService.getApiKey());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubStatus = geminiLiveService.subscribeStatus((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'DISCONNECTED') {
        setIsMicActive(false);
      }
    });

    const unsubMessages = geminiLiveService.subscribeMessages((newMessages) => {
      setMessages(newMessages);
    });

    return () => {
      unsubStatus();
      unsubMessages();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveApiKey = () => {
    geminiLiveService.setApiKey(apiKeyInput.trim());
    setShowKeyConfig(false);
  };

  const handleToggleConnect = async () => {
    if (status === 'CONNECTED') {
      geminiLiveService.disconnect();
    } else {
      try {
        await geminiLiveService.connect();
      } catch (err: any) {
        alert(`Connection error: ${err.message}`);
      }
    }
  };

  const handleToggleMic = async () => {
    if (!isMicActive) {
      if (status !== 'CONNECTED') {
        await geminiLiveService.connect();
      }
      try {
        await geminiLiveService.startAudioCapture();
        setIsMicActive(true);
      } catch (e: any) {
        alert(`Microphone access error: ${e.message}`);
      }
    } else {
      geminiLiveService.stopAudioCapture();
      setIsMicActive(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    geminiLiveService.sendTextMessage(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    'Are all microservices healthy right now?',
    'Show me the recent system incidents or outages',
    'List all configured RBAC roles in the auth service',
    'What is the current latency of the API Gateway?',
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-dark-border flex flex-col h-[740px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-dark-border shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-dark-bg rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-white tracking-wide">
                Gemini Live Ops Copilot
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                gemini-3.1-flash-live-preview
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time voice & streaming text AI operator with ecosystem tool execution
            </p>
          </div>
        </div>

        {/* Status indicator & Key button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-dark-bg border border-dark-border text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'CONNECTED'
                  ? 'bg-emerald-400 animate-ping-slow'
                  : status === 'CONNECTING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 font-mono text-[11px]">{status}</span>
          </div>

          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="p-2 rounded-lg bg-dark-card hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white transition"
            title="Configure Gemini API Key"
          >
            <Key className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={handleToggleConnect}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              status === 'CONNECTED'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:bg-rose-900/60'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
            }`}
          >
            {status === 'CONNECTED' ? 'Disconnect' : 'Connect Live Session'}
          </button>
        </div>
      </div>

      {/* API Key Modal Banner */}
      {showKeyConfig && (
        <div className="my-3 p-4 rounded-xl bg-dark-card/90 border border-indigo-500/40 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini API Key Setup</span>
            </span>
            <span className="text-[11px] text-slate-400">Stored safely in browser storage</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="password"
              placeholder="Enter your Gemini API key (AIzaSy...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">
              INVA Operations AI Copilot
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              Connect to stream real-time voice and commands. The copilot can inspect your API Gateway routes, query microservice up/downtime status, list incidents, and check RBAC roles.
            </p>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputText(p);
                  }}
                  className="p-2.5 rounded-xl bg-dark-card hover:bg-dark-border border border-dark-border text-left text-xs text-slate-300 hover:text-white transition"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.sender === 'user';
            const isSystem = m.sender === 'system';
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-3 ${
                  isUser ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'
                }`}
              >
                {!isUser && !isSystem && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs max-w-xl shadow-md ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : isSystem
                      ? 'bg-dark-card/60 text-indigo-300 border border-indigo-500/30 text-center font-mono py-2 text-[11px]'
                      : 'glass-panel text-slate-200 border border-dark-border rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  <div
                    className={`mt-1 text-[10px] font-mono ${
                      isUser ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls & Input Bar */}
      <div className="pt-3 border-t border-dark-border shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          {/* Microphone Toggle (16kHz PCM Audio Stream) */}
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-3 rounded-xl border transition ${
              isMicActive
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                : 'bg-dark-card hover:bg-dark-border border-dark-border text-slate-300 hover:text-white'
            }`}
            title={isMicActive ? 'Stop Live Audio' : 'Start Live Voice Streaming'}
          >
            {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={
              isMicActive
                ? 'Listening to live microphone... (or type here)'
                : 'Ask Gemini Live Copilot about services, routes, or roles...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-lg shadow-indigo-600/20 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
