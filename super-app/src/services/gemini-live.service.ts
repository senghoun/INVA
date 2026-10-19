import { healthMonitor } from './health.service';
import { authService } from './auth.service';
import { env } from '../config/env';

export interface LiveSessionMetrics {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

export type LiveSessionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini' | 'system';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: any = null;
  private audioWorkletNode: any = null;
  private audioQueue: Float32Array[] = [];
  private nextPlayTime = 0;
  private status: LiveSessionStatus = 'DISCONNECTED';
  private statusListeners: Set<(status: LiveSessionStatus) => void> = new Set();
  private messageListeners: Set<(messages: ChatMessage[]) => void> = new Set();
  private messages: ChatMessage[] = [];
  private apiKey: string = '';

  constructor() {
    this.apiKey = localStorage.getItem('inva_gemini_api_key') || env.ai.geminiApiKey || '';
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('inva_gemini_api_key', key);
  }

  public getStatus(): LiveSessionStatus {
    return this.status;
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public subscribeStatus(listener: (status: LiveSessionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public subscribeMessages(listener: (messages: ChatMessage[]) => void): () => void {
    this.messageListeners.add(listener);
    listener(this.messages);
    return () => this.messageListeners.delete(listener);
  }

  private setStatus(newStatus: LiveSessionStatus): void {
    this.status = newStatus;
    this.statusListeners.forEach((l) => l(newStatus));
  }

  private addMessage(message: ChatMessage): void {
    this.messages = [...this.messages, message];
    this.messageListeners.forEach((l) => l(this.messages));
  }

  private updateLastGeminiMessage(delta: string): void {
    const last = this.messages[this.messages.length - 1];
    if (last && last.sender === 'gemini' && last.isStreaming) {
      last.text += delta;
      this.messages = [...this.messages];
      this.messageListeners.forEach((l) => l(this.messages));
    } else {
      this.addMessage({
        id: `msg-${Date.now()}`,
        sender: 'gemini',
        text: delta,
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true,
      });
    }
  }

  private finalizeStreamingMessage(): void {
    const last = this.messages[this.messages.length - 1];
    if (last && last.isStreaming) {
      last.isStreaming = false;
      this.messages = [...this.messages];
      this.messageListeners.forEach((l) => l(this.messages));
    }
  }

  // ─── Ops Tools Definition ────────────────────────────────────────────────
  private getOpsToolsDeclaration() {
    return [
      {
        functionDeclarations: [
          {
            name: 'get_service_health',
            description: 'Returns real-time health, latency (ms), status (UP/DOWN/DEGRADED), and uptime percentage for all microservices.',
            parameters: { type: 'OBJECT', properties: {} },
          },
          {
            name: 'query_recent_incidents',
            description: 'Returns the most recent system incidents, outages, and alerts.',
            parameters: { type: 'OBJECT', properties: {} },
          },
          {
            name: 'list_system_roles',
            description: 'Returns all RBAC roles configured in the auth microservice.',
            parameters: { type: 'OBJECT', properties: {} },
          },
        ],
      },
    ];
  }

  // ─── Tool Call Execution ─────────────────────────────────────────────────
  private async executeToolCall(call: any): Promise<any> {
    const { name, id } = call;

    if (name === 'get_service_health') {
      const metrics = healthMonitor.getMetrics();
      return {
        id,
        name,
        response: {
          services: metrics.map((m) => ({
            name: m.name,
            key: m.key,
            port: m.port,
            status: m.status,
            latencyMs: m.latencyMs,
            uptimePercent: `${m.uptimePercent}%`,
          })),
        },
      };
    }

    if (name === 'query_recent_incidents') {
      const incidents = healthMonitor.getIncidents().slice(0, 10);
      return {
        id,
        name,
        response: {
          count: incidents.length,
          incidents,
        },
      };
    }

    if (name === 'list_system_roles') {
      try {
        const roles = await authService.listRoles(true);
        return {
          id,
          name,
          response: {
            roles: roles.map((r) => ({ name: r.name, description: r.description, isActive: r.isActive })),
          },
        };
      } catch (err: any) {
        return {
          id,
          name,
          response: { error: 'Could not fetch roles from auth service: ' + err.message },
        };
      }
    }

    return { id, name, response: { status: 'unknown_tool' } };
  }

  // ─── Connect to Gemini Live API ──────────────────────────────────────────
  public async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Please set your Gemini API Key in the settings first.');
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('CONNECTING');

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        this.sendSetupMessage();
        this.addMessage({
          id: `msg-${Date.now()}`,
          sender: 'system',
          text: 'Connected to Gemini Live real-time ops copilot (Model: gemini-3.1-flash-live-preview). Voice & text streaming ready.',
          timestamp: new Date().toLocaleTimeString(),
        });
      };

      this.ws.onmessage = async (event) => {
        await this.handleServerMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.error('Gemini Live WebSocket error:', err);
        this.setStatus('ERROR');
      };

      this.ws.onclose = () => {
        this.setStatus('DISCONNECTED');
        this.stopAudioCapture();
      };
    } catch (err: any) {
      this.setStatus('ERROR');
      throw err;
    }
  }

  private sendSetupMessage(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const setupPayload = {
      setup: {
        model: 'models/gemini-3.1-flash-live-preview',
        generationConfig: {
          responseModalities: ['TEXT'], // supports low latency audio and text
          thinkingConfig: {
            thinkingLevel: 'minimal',
          },
        },
        systemInstruction: {
          parts: [
            {
              text:
                'You are INVA Ops Copilot, an AI assistant operating inside the INVA Super-App. ' +
                'You manage the Fastify API Gateway and downstream microservices: Auth (3001), HR (3002), CRM (3003), Accounting (3004), and IT (3005). ' +
                'Provide concise, accurate, operational answers. When asked about system health, service up/downtime, or roles, use your available tools.',
            },
          ],
        },
        tools: this.getOpsToolsDeclaration(),
      },
    };

    this.ws.send(JSON.stringify(setupPayload));
  }

  private async handleServerMessage(rawData: any): Promise<void> {
    let msg: any;
    try {
      if (rawData instanceof Blob) {
        const text = await rawData.text();
        msg = JSON.parse(text);
      } else {
        msg = JSON.parse(rawData);
      }
    } catch (err) {
      console.warn('Failed to parse WebSocket message:', err);
      return;
    }

    // 1. Tool Call handling
    if (msg.toolCall) {
      const functionCalls = msg.toolCall.functionCalls || [];
      const functionResponses = [];

      for (const call of functionCalls) {
        const result = await this.executeToolCall(call);
        functionResponses.push(result);
      }

      // Send tool response back
      const toolResponsePayload = {
        toolResponse: {
          functionResponses,
        },
      };
      this.ws?.send(JSON.stringify(toolResponsePayload));
      return;
    }

    // 2. Server Content (Model Turn)
    const serverContent = msg.serverContent;
    if (serverContent) {
      if (serverContent.modelTurn?.parts) {
        for (const part of serverContent.modelTurn.parts) {
          if (part.text) {
            this.updateLastGeminiMessage(part.text);
          }
          if (part.inlineData?.data) {
            // Audio data received
            this.playAudioChunk(part.inlineData.data);
          }
        }
      }

      if (serverContent.turnComplete) {
        this.finalizeStreamingMessage();
      }

      if (serverContent.interrupted) {
        this.clearAudioQueue();
        this.finalizeStreamingMessage();
      }
    }
  }

  // ─── Text Realtime Input ─────────────────────────────────────────────────
  public sendTextMessage(text: string): void {
    if (!text.trim()) return;

    this.addMessage({
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Offline fallback
      setTimeout(() => {
        this.addMessage({
          id: `msg-${Date.now()}`,
          sender: 'gemini',
          text: `[Live Session Offline]: Connect to Gemini Live with your API key to interact with the real-time AI copilot. Current Gateway Status: ${
            healthMonitor.getMetrics().find((m) => m.key === 'gateway')?.status || 'UNKNOWN'
          }.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }, 500);
      return;
    }

    const payload = {
      realtimeInput: {
        text,
      },
    };

    this.ws.send(JSON.stringify(payload));
  }

  // ─── Voice / Microphone Streaming ────────────────────────────────────────
  public async startAudioCapture(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.audioProcessor.onaudioprocess = (e: any) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = this.convertFloat32ToInt16(inputData);
      const base64Audio = this.arrayBufferToBase64(pcm16.buffer);

      const payload = {
        realtimeInput: {
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio,
          },
        },
      };
      this.ws.send(JSON.stringify(payload));
    };

    source.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);
  }

  public stopAudioCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
  }

  private convertFloat32ToInt16(buffer: Float32Array): Int16Array {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return buf;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private playAudioChunk(base64: string): void {
    // 24kHz raw PCM decoding
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  private clearAudioQueue(): void {
    this.audioQueue = [];
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
  }

  public disconnect(): void {
    this.stopAudioCapture();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }
}

export const geminiLiveService = new GeminiLiveService();
