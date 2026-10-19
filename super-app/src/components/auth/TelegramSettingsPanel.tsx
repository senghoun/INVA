import React, { useEffect, useRef, useState } from 'react';
import { Bell, ExternalLink, Loader2, RefreshCw, Save, Send } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DatalistSelect, ErrorState, Input, Label } from '../common';
import { authService } from '../../services/auth.service';
import type { TelegramAlertKind, TelegramChatDiscovery, TelegramSettings, TelegramTopicRoute } from '../../types';

const services = ['api-gateway', 'auth-service', 'hr-service', 'crm-service', 'ac-service', 'it-service'];
const events: { id: TelegramAlertKind; label: string }[] = [
  { id: 'http_error', label: 'HTTP server error' }, { id: 'logged_error', label: 'Application error' },
  { id: 'startup_failure', label: 'Startup failure' }, { id: 'rate_limit', label: 'Rate limit (429)' },
  { id: 'ip_block', label: 'IP policy block' }, { id: 'domain_block', label: 'Origin/domain block' },
  { id: 'suspicious_probe', label: 'Suspicious probe' }, { id: 'repeated_rejections', label: 'Repeated rejections' },
];

export const TelegramSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [token, setToken] = useState('');
  const [adminIds, setAdminIds] = useState('');
  const [testService, setTestService] = useState('');
  const [testKind, setTestKind] = useState('');
  const [chats, setChats] = useState<TelegramChatDiscovery['chats']>([]);
  const [busy, setBusy] = useState<'load' | 'save' | 'bot' | 'discover' | 'test' | null>('load');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);

  const load = async () => {
    setBusy('load'); setError(''); setNotice('');
    try {
      const result = await authService.getTelegramSettings();
      if (mounted.current) { setSettings(result); setAdminIds((result.adminUserIds || []).join(', ')); setToken(''); setChats([]); setDirty(false); }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to load Telegram settings.');
    } finally { if (mounted.current) setBusy(null); }
  };
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; }; }, []);

  const patch = <K extends keyof TelegramSettings>(key: K, value: TelegramSettings[K]) => {
    setSettings(current => current && { ...current, [key]: value });
    setDirty(true); setNotice('');
  };
  const changeChat = (chatId: string) => {
    setSettings(current => current && { ...current, chatId, messageThreadId: null, topicRoutes: [] });
    setDirty(true); setNotice('');
  };
  const changeRoute = (index: number, value: Partial<TelegramTopicRoute>) => {
    if (settings) patch('topicRoutes', (settings.topicRoutes || []).map((rule, i) => i === index ? { ...rule, ...value } : rule));
  };

  const saveBot = async () => {
    if (!token.trim()) return;
    setBusy('bot'); setError(''); setNotice('');
    try {
      const result = await authService.updateTelegramSettings({ botToken: token.trim(), enabled: false, chatId: '' });
      if (mounted.current) {
        setSettings(result); setAdminIds((result.adminUserIds || []).join(', ')); setToken(''); setChats([]); setDirty(false);
        setNotice('Bot saved. Open Telegram, press Start, then return here and click Get chat ID.');
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to save the bot token.');
    } finally { if (mounted.current) setBusy(null); }
  };

  const saveSettings = async () => {
    if (!settings || token.trim()) return;
    setBusy('save'); setError(''); setNotice('');
    try {
      const result = await authService.updateTelegramSettings({
        enabled: settings.enabled, chatId: settings.chatId.trim(),
        messageThreadId: settings.messageThreadId ?? null, topicRoutes: settings.topicRoutes || [],
        commandsEnabled: settings.commandsEnabled || false,
        adminUserIds: adminIds.split(/[\s,]+/).filter(Boolean),
        cooldownSeconds: settings.cooldownSeconds, maxPerMinute: settings.maxPerMinute,
        failureThreshold: settings.failureThreshold, failureWindowSeconds: settings.failureWindowSeconds,
      });
      if (mounted.current) {
        setSettings(result); setAdminIds((result.adminUserIds || []).join(', ')); setToken(''); setDirty(false);
        setNotice('Settings saved. All API services will receive the change within 15 seconds.');
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to save Telegram settings.');
    } finally { if (mounted.current) setBusy(null); }
  };

  const discover = async () => {
    setBusy('discover'); setError(''); setNotice(''); setChats([]);
    try {
      const result = await authService.discoverTelegramChats();
      if (mounted.current) {
        setChats(result.chats);
        if (result.chats.length === 1) {
          setSettings(current => current && { ...current, chatId: result.chats[0].id,
            ...(current.chatId !== result.chats[0].id ? { messageThreadId: null, topicRoutes: [] } : {}) });
          setDirty(true);
        }
        setNotice(result.chats.length ? (result.chats.length === 1 ? 'Chat ID retrieved. Click Save chat ID to store it in the database.' : `Found ${result.chats.length} chats. Choose your destination, then click Save chat ID.`)
          : 'No recent chats found. Open Telegram and press Start or send a new message, then click Get chat ID again. You can also enter the ID manually.');
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to discover chats.');
    } finally { if (mounted.current) setBusy(null); }
  };

  const sendTest = async () => {
    setBusy('test'); setError(''); setNotice('');
    try {
      await authService.testTelegramAlerts(testService || testKind ? {
        ...(testService ? { service: testService } : {}), ...(testKind ? { kind: testKind } : {}),
      } : undefined);
      if (mounted.current) setNotice(settings?.enabled
        ? 'Test message sent to the saved Telegram chat.'
        : 'Test message sent. Automatic alerts are disabled. Check Enable Telegram alerts for all API services and save your settings to activate them.');
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to send a test message.');
    } finally { if (mounted.current) setBusy(null); }
  };

  return <Card role="region" aria-labelledby="telegram-settings-title" className="min-w-0">
    <CardHeader className="gap-3">
      <Bell aria-hidden="true" className="h-5 w-5 shrink-0 text-sky-400" />
      <div className="min-w-0 flex-1">
        <CardTitle id="telegram-settings-title">Telegram Alerts</CardTitle>
        <CardDescription>Choose where API error and suspicious activity alerts are delivered.</CardDescription>
      </div>
      <Button type="button" variant="outline" size="icon-sm" onClick={() => { void load(); }}
        disabled={!!busy || dirty} isLoading={busy === 'load'} aria-label="Refresh Telegram settings">
        <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      {error && <ErrorState title={settings ? 'Telegram settings could not be updated' : 'Telegram settings unavailable'} message={error}
        onRetry={!settings && !busy ? () => { void load(); } : undefined} />}
      {notice && <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{notice}</p>}
      {busy === 'load' && <p role="status" className="flex items-center gap-2 text-sm text-slate-400"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />Loading Telegram settings…</p>}
      {settings && <form onSubmit={event => { event.preventDefault(); void saveSettings(); }} className="space-y-4">
        <fieldset disabled={!!busy} className="min-w-0 space-y-4">
          <Label className="flex items-center gap-3 text-sm text-slate-200">
            <input type="checkbox" checked={settings.enabled} onChange={e => patch('enabled', e.target.checked)} className="accent-indigo-500 h-4 w-4" />
            Enable Telegram alerts for all API services
          </Label>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="min-w-0 space-y-2">
              <h4 className="text-sm font-semibold text-white">1. Save the bot token</h4>
              <Label htmlFor="telegram-bot-token">{settings.tokenConfigured ? 'Replace bot token' : 'Bot token'}</Label>
              <Input id="telegram-bot-token" type="password" value={token} autoComplete="new-password" spellCheck={false} maxLength={128}
                placeholder={settings.tokenConfigured ? 'Leave blank to keep saved token' : 'Token from BotFather'}
                onChange={e => { setToken(e.target.value); setChats([]); setDirty(true); setNotice(''); }} />
              <p className="text-xs text-slate-400">The saved token is encrypted and never shown here.</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => { void saveBot(); }}
                disabled={!token.trim() || !settings.encryptionConfigured} isLoading={busy === 'bot'} leftIcon={<Save className="h-3.5 w-3.5" />}>
                Save bot token
              </Button>
              <p className="text-xs text-slate-400">Replacing the bot clears the previous destination and pauses alerts until setup is complete.</p>
              {!settings.encryptionConfigured && <p className="text-xs text-amber-300">The server needs its Telegram encryption key before a token can be saved.</p>}
            </div>
            <div className="min-w-0 space-y-2">
              <h4 className="text-sm font-semibold text-white">2. Start the bot in Telegram</h4>
              <p className="text-xs text-slate-400">Open the saved bot, then press Start in Telegram. Return here after starting it.</p>
              {settings.botUsername && !token.trim() ? <a href={`https://t.me/${encodeURIComponent(settings.botUsername)}?start=inva_alerts`}
                target="_blank" rel="noopener noreferrer" aria-disabled={!!busy} tabIndex={busy ? -1 : undefined}
                onClick={event => { if (busy) event.preventDefault(); }}
                className={`inline-flex items-center gap-2 text-sm text-indigo-300 underline underline-offset-4 focus-visible:outline focus-visible:outline-indigo-400 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /><span className="break-all">Open @{settings.botUsername} in Telegram</span>
              </a> : <p className="text-xs text-slate-500">Save the bot token first to get its Telegram link.</p>}
              <p className="text-xs text-slate-400">For a group, add the bot to that group and send a message instead.</p>
              {settings.botUsername && !token.trim() && <a href={`https://t.me/${encodeURIComponent(settings.botUsername)}?startgroup=inva_alerts`}
                target="_blank" rel="noopener noreferrer" className="inline-flex text-sm text-indigo-300 underline underline-offset-4">
                Add @{settings.botUsername} to a group
              </a>}
            </div>
            <div className="min-w-0 space-y-2">
              <h4 className="text-sm font-semibold text-white">3. Get and save the chat ID</h4>
              <Label htmlFor="telegram-chat-id">Destination chat ID</Label>
              <Input id="telegram-chat-id" type="text" value={settings.chatId} onChange={e => changeChat(e.target.value)}
                placeholder="Private chat or group ID" pattern="-?[1-9][0-9]{0,19}" maxLength={21} required={settings.enabled} autoComplete="off" />
              <p className="text-xs text-slate-400">Start a conversation with the bot, or add it to your group and send a message. Then discover its chat ID.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { void discover(); }}
                  disabled={!!token.trim() || !settings.tokenConfigured || settings.commandsEnabled} isLoading={busy === 'discover'}>Get chat ID</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => { void saveSettings(); }}
                  disabled={!!token.trim() || !dirty || !/^-?[1-9]\d{0,19}$/.test(settings.chatId.trim())}
                  isLoading={busy === 'save'} leftIcon={<Save className="h-3.5 w-3.5" />}>Save chat ID</Button>
              </div>
            </div>
          </div>
          {chats.length > 0 && <div className="space-y-2">
            <Label htmlFor="telegram-discovered-chat">Select a discovered chat</Label>
            <DatalistSelect id="telegram-discovered-chat" value={settings.chatId}
              onChange={value => { if (value && value !== settings.chatId) changeChat(value); }} disabled={!!busy}
              options={chats.map(chat => ({ id: chat.id, label: `${chat.label} (${chat.type})`, sublabel: chat.id }))}
              placeholder="Choose a destination" />
            {chats.find(chat => chat.id === settings.chatId)?.senderUserIds?.length ? <p className="break-words text-xs text-slate-400">
              Recent sender user IDs: {chats.find(chat => chat.id === settings.chatId)!.senderUserIds!.join(', ')}. Copy only trusted operators into the admin field below.
            </p> : null}
          </div>}
          <div className="space-y-3 rounded-xl border border-slate-800 p-3">
            <h4 className="text-sm font-semibold text-white">Group topics and routing</h4>
            <p className="text-xs text-slate-400">Enable Topics in your Telegram group. Send /start@{settings.botUsername || 'yourbot'} inside each topic, then click Get chat ID to discover recent topic IDs.</p>
            {(chats.find(chat => chat.id === settings.chatId)?.topics?.length || 0) > 0 && <div className="space-y-2">
              <Label htmlFor="telegram-discovered-topic">Choose a discovered default topic</Label>
              <DatalistSelect id="telegram-discovered-topic" value={settings.messageThreadId ? String(settings.messageThreadId) : 'general'}
                onChange={value => patch('messageThreadId', value === 'general' ? null : Number(value))}
                options={[{ id: 'general', label: 'General / default destination' },
                  ...(chats.find(chat => chat.id === settings.chatId)?.topics || []).map(topic => ({ id: String(topic.id), label: topic.label, sublabel: `Topic ID ${topic.id}` }))]} />
            </div>}
            <Label htmlFor="telegram-topic-id">Default topic ID (optional)</Label>
            <Input id="telegram-topic-id" type="number" min={1} max={2147483647} step={1} value={settings.messageThreadId ?? ''}
              placeholder="Blank = General / default destination" onChange={e => patch('messageThreadId', e.target.value ? Number(e.target.value) : null)} />
            <p className="text-xs text-slate-400">Topic IDs are Telegram message thread IDs, not the numbers in topic names. Changing the destination chat clears its topic rules.</p>
            {(settings.topicRoutes || []).map((rule, index) => <div key={index} className="grid gap-3 rounded-lg border border-slate-700 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor={`telegram-route-service-${index}`}>Rule {index + 1} service</Label>
                <DatalistSelect id={`telegram-route-service-${index}`} value={rule.service}
                  onChange={value => changeRoute(index, { service: value })}
                  options={[{ id: '*', label: 'All services' }, ...services.map(service => ({ id: service, label: service }))]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`telegram-route-event-${index}`}>Rule {index + 1} event</Label>
                <DatalistSelect id={`telegram-route-event-${index}`} value={rule.kind}
                  onChange={value => changeRoute(index, { kind: value as TelegramTopicRoute['kind'] })}
                  options={[{ id: '*', label: 'All events' }, ...events]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`telegram-route-topic-${index}`}>Rule {index + 1} topic ID</Label>
                <Input id={`telegram-route-topic-${index}`} type="number" min={1} max={2147483647} step={1} required
                  value={rule.messageThreadId || ''} onChange={e => changeRoute(index, { messageThreadId: Number(e.target.value) })} />
                {(chats.find(chat => chat.id === settings.chatId)?.topics || []).length > 0 && <DatalistSelect
                  value={String(rule.messageThreadId)} onChange={value => changeRoute(index, { messageThreadId: Number(value) })}
                  options={(chats.find(chat => chat.id === settings.chatId)?.topics || []).map(topic => ({ id: String(topic.id), label: topic.label, sublabel: `Topic ID ${topic.id}` }))}
                  placeholder="Choose a recent topic" />}
              </div>
              <Button type="button" variant="outline" size="sm" className="self-end" onClick={() => patch('topicRoutes', (settings.topicRoutes || []).filter((_, i) => i !== index))}>Remove rule {index + 1}</Button>
            </div>)}
            <Button type="button" variant="secondary" size="sm" disabled={(settings.topicRoutes || []).length >= 50}
              onClick={() => patch('topicRoutes', [...(settings.topicRoutes || []), { service: 'auth-service', kind: '*', messageThreadId: settings.messageThreadId || 0 }])}>Add topic rule</Button>
            <p className="text-xs text-slate-400">Priority: service + event, then event, then service, then default topic. Each service/event match must be unique.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telegram-test-service">Test routing service</Label>
                <DatalistSelect id="telegram-test-service" value={testService || 'default'} onChange={value => setTestService(value === 'default' ? '' : value)}
                  options={[{ id: 'default', label: 'Default destination' }, ...services.map(service => ({ id: service, label: service }))]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram-test-event">Test routing event</Label>
                <DatalistSelect id="telegram-test-event" value={testKind || 'default'} onChange={value => setTestKind(value === 'default' ? '' : value)}
                  options={[{ id: 'default', label: 'Default destination' }, ...events]} />
              </div>
            </div>
            <p className="text-xs text-slate-400">The test button uses saved routing. Select a service and event to verify a rule; leave both at Default destination to test the fallback topic. When only one is selected, the other uses auth-service or HTTP server error.</p>
          </div>
          <div className="space-y-3 rounded-xl border border-slate-800 p-3">
            <Label className="flex items-center gap-3">
              <input type="checkbox" checked={settings.commandsEnabled || false}
                onChange={e => patch('commandsEnabled', e.target.checked)} className="h-4 w-4 accent-indigo-500" />
              Enable Telegram management buttons
            </Label>
            <Label htmlFor="telegram-admin-users">Telegram admin user IDs</Label>
            <Input id="telegram-admin-users" value={adminIds} placeholder="123456789, 987654321" autoComplete="off" maxLength={450}
              onChange={e => { setAdminIds(e.target.value); setDirty(true); setNotice(''); }} />
            <p className="text-xs text-slate-400">Enter numeric Telegram user IDs separated by commas. Send a fresh message to the bot, then use Get chat ID to see recent sender IDs. Only configured users in the saved destination can view policies or unblock rules. Unblocking asks for confirmation.</p>
            <p className="text-xs text-slate-400">The bot reads incoming updates while management is enabled. Disable management before discovering another chat. Send /menu, /blocked or /status to manage policies.</p>
          </div>
          <details className="rounded-xl border border-slate-800 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-300">Alert frequency and detection limits</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([
                ['cooldownSeconds', 'Duplicate cooldown (seconds)', 3600],
                ['maxPerMinute', 'Max alerts per minute', 60],
                ['failureThreshold', 'Failed request threshold', 1000],
                ['failureWindowSeconds', 'Detection window (seconds)', 3600],
              ] as const).map(([key, label, max]) => <div key={key} className="space-y-2">
                <Label htmlFor={`telegram-${key}`}>{label}</Label>
                <Input id={`telegram-${key}`} type="number" size="sm" min={1} max={max} step={1} required value={settings[key]}
                  onChange={e => patch(key, Number(e.target.value))} />
              </div>)}
            </div>
          </details>
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
            <Button type="submit" size="sm" disabled={!dirty || !!token.trim()} isLoading={busy === 'save'}
              leftIcon={<Save className="h-3.5 w-3.5" />}>Save Telegram settings</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => { void sendTest(); }}
              disabled={dirty || !settings.tokenConfigured || !settings.chatId} isLoading={busy === 'test'}
              leftIcon={<Send className="h-3.5 w-3.5" />}>Send test message</Button>
            {dirty && <Badge variant="warning" size="sm">Unsaved changes</Badge>}
            {!dirty && <Badge variant={settings.enabled ? 'success' : 'default'} size="sm" dot>{settings.enabled ? 'Alerts enabled' : 'Alerts disabled'}</Badge>}
          </div>
        </fieldset>
      </form>}
    </CardContent>
  </Card>;
};
