import { healthMonitor } from './health.service';
import { authService } from './auth.service';
import { env } from '../config/env';

export type CopilotStatus = 'idle' | 'thinking' | 'calling_tool' | 'streaming' | 'error';

export interface AtriaChatMessage {
  id: string;
  sender: 'user' | 'atria' | 'system';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  toolExecuted?: string;
}

export interface AtriaToolDeclaration {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export class AtriaCopilotService {
  private baseUrl: string = '/atria-api/v1';
  private directUrl: string = `${env.ai.atriaApiUrl}/v1`;
  private model: string = env.ai.atriaModel || 'Atria-Dawn-Preview';
  private apiKey: string = '';
  private messages: AtriaChatMessage[] = [];
  private listeners: Set<(messages: AtriaChatMessage[]) => void> = new Set();
  private statusListeners: Set<(status: CopilotStatus, statusText?: string) => void> = new Set();
  private status: CopilotStatus = 'idle';
  private statusText: string = '';

  constructor() {
    this.apiKey = localStorage.getItem('inva_atria_api_key') || env.ai.atriaApiKey || '';
    this.model = localStorage.getItem('inva_atria_model') || env.ai.atriaModel || 'Atria-Dawn-Preview';
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('inva_atria_api_key', key);
  }

  public getModel(): string {
    return this.model;
  }

  public setModel(model: string): void {
    this.model = model;
    localStorage.setItem('inva_atria_model', model);
  }

  public getBaseUrl(): string {
    return this.directUrl;
  }

  public getMessages(): AtriaChatMessage[] {
    return [...this.messages];
  }

  public getStatus(): { status: CopilotStatus; statusText: string } {
    return { status: this.status, statusText: this.statusText };
  }

  public subscribeStatus(listener: (status: CopilotStatus, statusText?: string) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.statusText);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: CopilotStatus, text: string = ''): void {
    this.status = status;
    this.statusText = text;
    this.statusListeners.forEach((l) => l(status, text));
  }

  public subscribeMessages(listener: (messages: AtriaChatMessage[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.messages);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.messages));
  }

  public addMessage(message: AtriaChatMessage): void {
    this.messages = [...this.messages, message];
    this.notify();
  }

  public updateMessageText(id: string, text: string): void {
    const msg = this.messages.find((m) => m.id === id);
    if (msg) {
      msg.text = text;
      this.messages = [...this.messages];
      this.notify();
    }
  }

  public markMessageComplete(id: string): void {
    const msg = this.messages.find((m) => m.id === id);
    if (msg) {
      msg.isStreaming = false;
      this.messages = [...this.messages];
      this.notify();
    }
  }

  public finalizeStreamingMessage(): void {
    const last = this.messages[this.messages.length - 1];
    if (last && last.isStreaming) {
      last.isStreaming = false;
      this.messages = [...this.messages];
      this.notify();
    }
  }


  // ─── Ops Tools Definition (OpenAI compatible) ────────────────────────────
  private getOpsTools(): AtriaToolDeclaration[] {
    return [
      {
        type: 'function',
        function: {
          name: 'get_service_health',
          description:
            'Returns real-time health, status (UP/DOWN/DEGRADED), latency in ms, and uptime percentage for all microservices in the INVA ecosystem.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'query_recent_incidents',
          description:
            'Returns the most recent system downtime incidents, outages, and degraded performance alerts.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_system_roles',
          description: 'Returns all RBAC roles configured in the auth-service (inva_auth_db).',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_system_users',
          description: 'Returns total registered users count and active classification breakdown.',
          parameters: { type: 'object', properties: {} },
        },
      },
    ];
  }

  // ─── Execute Ops Tool Call Locally ───────────────────────────────────────
  private async executeTool(name: string): Promise<any> {
    if (name === 'get_service_health') {
      const metrics = healthMonitor.getMetrics();
      return {
        services: metrics.map((m) => ({
          name: m.name,
          key: m.key,
          port: m.port,
          status: m.status,
          latencyMs: m.latencyMs,
          uptimePercent: `${m.uptimePercent}%`,
        })),
        summary: `All ${metrics.filter((m) => m.status === 'UP').length}/${metrics.length} services UP`,
      };
    }

    if (name === 'query_recent_incidents') {
      const incidents = healthMonitor.getIncidents().slice(0, 8);
      return {
        count: incidents.length,
        recent: incidents.map((inc) => ({
          service: inc.serviceName,
          severity: inc.severity,
          title: inc.title,
          time: inc.timestamp,
        })),
      };
    }

    if (name === 'list_system_roles') {
      try {
        const roles = await authService.listRoles(true);
        return {
          totalRoles: roles.length,
          roles: roles.map((r) => ({ name: r.name, description: r.description, isActive: r.isActive })),
        };
      } catch (err: any) {
        return { error: 'Could not fetch roles: ' + err.message };
      }
    }

    if (name === 'list_system_users') {
      try {
        const users = await authService.listUsers({ limit: 100 });
        return {
          totalUsers: users.total,
          internalStaff: users.data.filter((u) => u.userType === 'INTERNAL').length,
          externalClients: users.data.filter((u) => u.userType === 'EXTERNAL').length,
        };
      } catch (err: any) {
        return { error: 'Could not fetch users: ' + err.message };
      }
    }

    return { error: 'Unknown tool: ' + name };
  }

  // ─── Send Message to Atria ASI (https://api.atria-asi.ai/v1) ─────────────
  public async sendMessage(promptText: string): Promise<void> {
    if (!promptText.trim() || this.status !== 'idle') return;

    // 1. Add User Message
    this.addMessage({
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString(),
    });

    // Check if user has an API key
    if (!this.apiKey) {
      this.setStatus('thinking', 'Checking API credentials...');
      setTimeout(() => {
        this.addMessage({
          id: `msg-${Date.now()}`,
          sender: 'atria',
          text:
            '⚠️ **Atria API Key Missing**: Please configure your API Key for `https://api.atria-asi.ai/v1` in the header configuration to enable live inference with the **Atria-Dawn-Preview** model.\n\n' +
            `*Current Local Ecosystem Status*: ${healthMonitor.getMetrics().filter((m) => m.status === 'UP').length} of 6 microservices operational.`,
          timestamp: new Date().toLocaleTimeString(),
        });
        this.setStatus('idle');
      }, 500);
      return;
    }

    // 2. Set Thinking State
    this.setStatus('thinking', 'Thinking...');

    // 3. Prepare request to Atria ASI
    const systemPrompt =
      'You are the INVA Ops Copilot powered by Atria ASI (Atria Dawn Preview) hosted at https://api.atria-asi.ai/v1. ' +
      'You manage the Fastify API Gateway and downstream microservices: Auth (3001), HR (3002), CRM (3003), Accounting (3004), and IT (3005). ' +
      'Respond accurately, concisely, and professionally about service health, up/downtime, routes, users, and RBAC roles. ' +
      'Format output with clear markdown lists, badges, and code snippets where appropriate.';

    const conversationHistory = this.messages
      .filter((m) => m.sender === 'user' || m.sender === 'atria')
      .slice(-8)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    // Check for quick tool triggers directly before making request
    const lower = promptText.toLowerCase();
    let executedToolName: string | undefined = undefined;
    let toolResultContext: any = null;

    if (
      lower.includes('health') ||
      lower.includes('status') ||
      lower.includes('down') ||
      lower.includes('up') ||
      lower.includes('latency')
    ) {
      executedToolName = 'get_service_health';
      this.setStatus('calling_tool', 'Calling get_service_health() telemetry...');
      await new Promise((r) => setTimeout(r, 450));
      toolResultContext = await this.executeTool('get_service_health');
    } else if (lower.includes('incident') || lower.includes('alert') || lower.includes('outage')) {
      executedToolName = 'query_recent_incidents';
      this.setStatus('calling_tool', 'Fetching incident audit logs...');
      await new Promise((r) => setTimeout(r, 450));
      toolResultContext = await this.executeTool('query_recent_incidents');
    } else if (lower.includes('role') || lower.includes('permission') || lower.includes('rbac')) {
      executedToolName = 'list_system_roles';
      this.setStatus('calling_tool', 'Querying RBAC roles in inva_auth_db...');
      await new Promise((r) => setTimeout(r, 450));
      toolResultContext = await this.executeTool('list_system_roles');
    } else if (lower.includes('user') || lower.includes('account') || lower.includes('staff')) {
      executedToolName = 'list_system_users';
      this.setStatus('calling_tool', 'Scanning user directory...');
      await new Promise((r) => setTimeout(r, 450));
      toolResultContext = await this.executeTool('list_system_users');
    }

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    if (toolResultContext && executedToolName) {
      messagesPayload.push({
        role: 'system',
        content: `[Real-Time Tool Result (${executedToolName})]: ${JSON.stringify(toolResultContext)}`,
      });
    }

    this.setStatus('thinking', 'Synthesizing response...');

    // Call Atria API endpoint
    try {
      const endpoint = `${this.baseUrl}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messagesPayload,
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Atria API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'No response returned from Atria model.';

      // Smooth typewriter stream simulation
      const messageId = `msg-${Date.now()}`;
      this.setStatus('streaming', 'Generating answer...');

      this.addMessage({
        id: messageId,
        sender: 'atria',
        text: '',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true,
        toolExecuted: executedToolName,
      });

      // Stream chunks for Gemini feel
      await this.streamTypewriter(messageId, reply);
    } catch (err: any) {
      // Fallback with graceful error and telemetry response
      let fallbackText = `❌ Error connecting to Atria ASI (${this.directUrl}): ${err.message}`;
      if (toolResultContext) {
        fallbackText += `\n\n**Direct Local Telemetry (${executedToolName}):**\n\`\`\`json\n${JSON.stringify(
          toolResultContext,
          null,
          2
        )}\n\`\`\``;
      }

      const messageId = `msg-${Date.now()}`;
      this.setStatus('streaming', 'Displaying telemetry...');
      this.addMessage({
        id: messageId,
        sender: 'atria',
        text: '',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true,
        toolExecuted: executedToolName,
      });

      await this.streamTypewriter(messageId, fallbackText);
    } finally {
      this.setStatus('idle');
    }
  }

  // Smooth typewriter streamer with word chunks
  private async streamTypewriter(messageId: string, fullText: string): Promise<void> {
    const words = fullText.split(' ');
    let currentText = '';
    const chunkSize = 2; // Output 2 words per step for fluid reading

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      currentText += (currentText ? ' ' : '') + chunk;
      this.updateMessageText(messageId, currentText);
      // Realistic typing cadence (15-30ms per word chunk)
      await new Promise((r) => setTimeout(r, 22));
    }

    this.markMessageComplete(messageId);
  }

  public clearMessages(): void {
    this.messages = [];
    this.setStatus('idle');
    this.notify();
  }
}


export const atriaCopilotService = new AtriaCopilotService();
