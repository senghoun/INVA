import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Key,
  Trash2,
  Cpu,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Bot,
  User as UserIcon,
  Loader2,
  Wand2,
  Activity,
  Copy,
  Check,
} from 'lucide-react';
import {
  atriaCopilotService,
  AtriaChatMessage,
  CopilotStatus,
} from '../../services/atria-copilot.service';

export const AtriaOpsConsole: React.FC = () => {
  const [messages, setMessages] = useState<AtriaChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(atriaCopilotService.getApiKey());
  const [modelInput, setModelInput] = useState(atriaCopilotService.getModel());
  const [showKeyConfig, setShowKeyConfig] = useState(!atriaCopilotService.getApiKey());
  const [copilotStatus, setCopilotStatus] = useState<CopilotStatus>('idle');
  const [statusText, setStatusText] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  useEffect(() => {
    const unsubMessages = atriaCopilotService.subscribeMessages((newMessages) => {
      setMessages(newMessages);
    });

    const unsubStatus = atriaCopilotService.subscribeStatus((newStatus, newText) => {
      setCopilotStatus(newStatus);
      setStatusText(newText || '');
    });

    // Check speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech error:', e);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      unsubMessages();
      unsubStatus();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, copilotStatus, statusText]);

  const handleSaveConfig = () => {
    atriaCopilotService.setApiKey(apiKeyInput.trim());
    atriaCopilotService.setModel(modelInput.trim() || 'Atria-Dawn-Preview');
    setShowKeyConfig(false);
  };

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || copilotStatus !== 'idle') return;
    atriaCopilotService.sendMessage(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    'Are all microservices healthy right now?',
    'Show me the recent system incidents or outages',
    'List all configured RBAC roles in the auth service',
    'How many users are registered in the user directory?',
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-dark-border flex flex-col h-[740px] relative overflow-hidden">
      {/* Top subtle ambient beam */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 via-indigo-500 to-transparent opacity-80"></div>

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-dark-border shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-dark-bg rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-white tracking-wide flex items-center space-x-1.5">
                <span>Atria Ops Intelligence</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Live Chat
                </span>
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                {modelInput || 'Atria-Dawn-Preview'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span className="font-mono text-[11px] text-cyan-400">https://api.atria-asi.ai/v1</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-slow inline-block"></span>
                <span>Autonomous Mesh Engine</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-card hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white text-xs transition-all duration-200"
            title="Configure Atria API Key & Model"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>API Settings</span>
          </button>

          <button
            onClick={() => atriaCopilotService.clearMessages()}
            className="p-2 rounded-lg bg-dark-card hover:bg-rose-950/40 border border-dark-border text-slate-400 hover:text-rose-400 transition-all duration-200"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Atria Configuration Banner */}
      {showKeyConfig && (
        <div className="my-3 p-4 rounded-xl bg-dark-card/95 border border-indigo-500/40 shrink-0 space-y-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Atria ASI Provider Configuration</span>
            </span>
            <a
              href="https://atria-asi.ai"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <span>Get Atria API Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Atria API Key
              </label>
              <input
                type="password"
                placeholder="Enter Atria API Key (e.g. atria_...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Model Name
              </label>
              <input
                type="text"
                placeholder="Atria-Dawn-Preview"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
            >
              Save Atria Settings
            </button>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
              <Sparkles className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1">
              How can I assist your microservices today?
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              Ask about real-time telemetry, downtime incidents, RBAC permissions, or API Gateway routing across Fastify (:3000) and downstream services.
            </p>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(p)}
                  className="p-3 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/80 hover:border-indigo-500/50 text-left text-xs text-slate-300 hover:text-white transition-all duration-200 shadow-sm hover:shadow-indigo-500/10 group flex items-start space-x-2"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0 group-hover:text-cyan-300 transition-colors" />
                  <span>"{p}"</span>
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
                className={`flex items-start space-x-3.5 ${
                  isUser ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'
                }`}
              >
                {!isUser && !isSystem && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 p-0.5 shadow-md shadow-indigo-600/20 shrink-0">
                    <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-cyan-300" />
                    </div>
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs max-w-xl transition-all group relative border ${
                    isUser
                      ? 'bg-[#121829]/95 text-slate-100 border-indigo-500/40 rounded-br-sm shadow-lg shadow-indigo-950/40 backdrop-blur-md'
                      : isSystem
                      ? 'bg-dark-card/60 text-indigo-300 border-indigo-500/30 text-center font-mono py-2 text-[11px]'
                      : 'bg-[#0f1422]/90 text-slate-200 border-slate-800/80 rounded-bl-sm backdrop-blur-md hover:border-slate-700/80'
                  }`}
                >
                  {isUser && (
                    <div className="flex items-center space-x-1.5 mb-1.5 text-[10px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      <span>Operator Query</span>
                    </div>
                  )}

                  {m.toolExecuted && (
                    <div className="mb-2.5 flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-dark-bg/90 text-indigo-300 border border-indigo-500/30 w-fit shadow-sm">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Telemetry Hook: {m.toolExecuted}()</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed text-[13px] font-normal text-slate-200 selection:bg-indigo-500/30 selection:text-white">
                    {m.text}
                    {m.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400 animate-pulse align-middle"></span>
                    )}
                  </div>

                  {/* Bubble Metadata & Quick Actions */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-slate-500">
                      {m.timestamp}
                    </div>

                    {!isUser && !isSystem && !m.isStreaming && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 transition-all duration-150"
                        title="Copy response"
                      >
                        {copiedMessageId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-950/70 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-sm shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}

              </div>
            );
          })
        )}

        {/* Gemini-Style Thinking & Waiting Indicator */}
        {(copilotStatus === 'thinking' || copilotStatus === 'calling_tool') && (
          <div className="flex items-start space-x-3.5 animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 p-0.5 shadow-md shadow-indigo-600/20 shrink-0">
              <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-spin-slow" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 rounded-bl-sm backdrop-blur-md shadow-lg shadow-indigo-500/5 max-w-md flex flex-col space-y-2">
              <div className="flex items-center space-x-2.5">
                {/* Gemini 3 Pulsing Wave Dots */}
                <div className="flex items-center space-x-1.5 px-1 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 gemini-dot-1"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 gemini-dot-2"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 gemini-dot-3"></span>
                </div>

                <span className="text-xs font-semibold gemini-shimmer-text">
                  {statusText || 'Thinking...'}
                </span>
              </div>

              {copilotStatus === 'calling_tool' && (
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 bg-dark-bg/80 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Terminal className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Connecting to microservice mesh gateway...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Gemini-Style Floating Message Box Dock */}
      <div className="pt-3 shrink-0">
        <div className="relative rounded-2xl bg-[#0f1422]/90 border border-slate-700/60 shadow-xl focus-within:border-indigo-500/70 focus-within:shadow-[0_0_25px_-5px_rgba(99,102,241,0.25)] transition-all duration-300">
          {/* Quick Context Pill Chips */}
          <div className="px-4 pt-2.5 pb-1 flex items-center space-x-2 overflow-x-auto text-[11px] text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 shrink-0">Ask Mesh:</span>
            <button
              type="button"
              onClick={() => setInputText('Are all microservices healthy right now?')}
              className="px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700/60 hover:border-indigo-500/40 whitespace-nowrap transition-all duration-150 flex items-center space-x-1"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Health Status</span>
            </button>
            <button
              type="button"
              onClick={() => setInputText('Show me the recent system incidents or outages')}
              className="px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 whitespace-nowrap transition-all duration-150 flex items-center space-x-1"
            >
              <Terminal className="w-3 h-3 text-rose-400" />
              <span>Incidents Log</span>
            </button>
            <button
              type="button"
              onClick={() => setInputText('List all configured RBAC roles in the auth service')}
              className="px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 border border-slate-700/60 hover:border-purple-500/40 whitespace-nowrap transition-all duration-150 flex items-center space-x-1"
            >
              <Key className="w-3 h-3 text-purple-400" />
              <span>RBAC Roles</span>
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="p-2.5 pt-1.5 flex flex-col">
            {/* Multi-line expandable text area */}
            <textarea
              disabled={copilotStatus !== 'idle'}
              rows={2}
              placeholder={
                isListening
                  ? 'Listening to your voice...'
                  : copilotStatus !== 'idle'
                  ? 'Atria Copilot is thinking...'
                  : 'Ask anything about service health, routes, latency, or RBAC roles (Enter to send, Shift+Enter for new line)...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-transparent px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none disabled:opacity-50 leading-relaxed font-sans"
            />

            {/* Bottom Actions Bar inside Message Box */}
            <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-800/60">
              <div className="flex items-center space-x-2">
                {/* Voice Input Button */}
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    disabled={copilotStatus !== 'idle'}
                    className={`p-2 rounded-xl transition-all duration-200 flex items-center space-x-1.5 text-xs ${
                      isListening
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                    title={isListening ? 'Listening... click to stop' : 'Voice dictation'}
                  >
                    {isListening ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4" />}
                    <span className="text-[11px] hidden sm:inline">{isListening ? 'Listening...' : 'Dictate'}</span>
                  </button>
                )}

                <div className="text-[10px] text-slate-500 hidden md:block">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700">Enter ↵</kbd> to send
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Clear Input if typed */}
                {inputText.trim() && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1 transition-colors"
                  >
                    Clear
                  </button>
                )}

                {/* Gemini Rounded Glow Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || copilotStatus !== 'idle'}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-30 disabled:hover:from-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 flex items-center space-x-1.5 hover:scale-[1.02] active:scale-[0.98]"
                  title="Send to Atria ASI"
                >
                  {copilotStatus !== 'idle' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-200" />
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

