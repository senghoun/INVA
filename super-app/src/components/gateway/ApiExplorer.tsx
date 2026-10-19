import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Search,
  Play,
  Copy,
  Check,
  Code2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Filter,
  Trash2,
  AlertCircle,
  FileCode,
  Plus,
} from 'lucide-react';
import { ApiEndpointItem } from '../../types';
import { gatewayService } from '../../services/gateway.service';
import { env } from '../../config/env';

interface ApiExplorerProps {
  initialServiceFilter?: string;
}

export const ApiExplorer: React.FC<ApiExplorerProps> = ({ initialServiceFilter }) => {
  const [endpoints, setEndpoints] = useState<ApiEndpointItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>(initialServiceFilter || 'ALL');
  const [search, setSearch] = useState('');
  const [activeEndpointId, setActiveEndpointId] = useState<string | null>(null);

  // Runner state for active endpoint
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [showFieldGuide, setShowFieldGuide] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    status: number;
    durationMs: number;
    data: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  useEffect(() => {
    loadSpec();
  }, []);

  useEffect(() => {
    if (initialServiceFilter) {
      setSelectedService(initialServiceFilter);
    }
  }, [initialServiceFilter]);

  const loadSpec = async () => {
    setLoading(true);
    try {
      const spec = await gatewayService.getUnifiedSpec();
      const parsed = gatewayService.parseEndpointsFromSpec(spec);
      setEndpoints(parsed);
      if (parsed.length > 0 && !activeEndpointId) {
        selectEndpoint(parsed[0]);
      }
    } catch (err) {
      console.error('Failed to load unified spec:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectEndpoint = (ep: ApiEndpointItem) => {
    setActiveEndpointId(ep.id);
    setExecutionResult(null);
    setShowFieldGuide(false);

    // Populate body for POST / PUT / PATCH
    if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      if (ep.samplePayload && Object.keys(ep.samplePayload).length > 0) {
        setRequestBody(JSON.stringify(ep.samplePayload, null, 2));
      } else if (ep.requestBody?.content?.['application/json']?.schema?.example) {
        setRequestBody(
          JSON.stringify(ep.requestBody.content['application/json'].schema.example, null, 2)
        );
      } else {
        setRequestBody('{\n  \n}');
      }
    } else {
      setRequestBody('');
    }

    // Extract path params from path and prefill intelligent samples
    const extractedParams: Record<string, string> = {};
    const paramMatches = ep.path.match(/:[a-zA-Z0-9_]+|\{[a-zA-Z0-9_]+\}/g) || [];
    paramMatches.forEach((m) => {
      const cleanKey = m.replace(/[:{}]/g, '');
      const docParam = ep.parameters?.find((p: any) => p.name === cleanKey);
      const sampleVal =
        docParam?.example ??
        docParam?.schema?.example ??
        docParam?.schema?.default ??
        (cleanKey.toLowerCase().includes('id') ? 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' : '');
      extractedParams[cleanKey] = String(sampleVal);
    });
    setPathParams(extractedParams);
  };

  const activeEndpoint = endpoints.find((ep) => ep.id === activeEndpointId);
  const isLoginEndpoint = activeEndpoint?.method === 'POST' && activeEndpoint.path === '/api/v1/auth/login';

  const handleLoginSample = (identity: 'email' | 'phone') => {
    let current: Record<string, any> = {};
    try { current = JSON.parse(requestBody); } catch { /* Replace invalid JSON with a valid login example. */ }
    const examples = activeEndpoint?.requestBody?.content?.['application/json']?.examples;
    const fallback = identity === 'phone' ? '+85512345678' : 'alice@inva.io';
    setRequestBody(JSON.stringify({
      [identity]: current?.[identity] || examples?.[identity]?.value?.[identity] || fallback,
      password: current?.password || examples?.[identity]?.value?.password || 'S3cur3P@ss!',
    }, null, 2));
  };

  const jsonValidation = useMemo(() => {
    if (!activeEndpoint || !['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method)) {
      return { valid: true, error: null, keyCount: 0 };
    }
    if (!requestBody.trim()) {
      return { valid: true, error: null, keyCount: 0 };
    }
    try {
      const parsed = JSON.parse(requestBody);
      const keyCount = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
      return { valid: true, error: null, keyCount };
    } catch (e: any) {
      return { valid: false, error: e.message, keyCount: 0 };
    }
  }, [requestBody, activeEndpoint]);

  const handleLoadSample = (mode: 'all' | 'required') => {
    if (!activeEndpoint) return;
    if (
      mode === 'required' &&
      activeEndpoint.requiredSamplePayload &&
      Object.keys(activeEndpoint.requiredSamplePayload).length > 0
    ) {
      setRequestBody(JSON.stringify(activeEndpoint.requiredSamplePayload, null, 2));
    } else if (activeEndpoint.samplePayload) {
      setRequestBody(JSON.stringify(activeEndpoint.samplePayload, null, 2));
    }
  };

  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(requestBody);
      setRequestBody(JSON.stringify(parsed, null, 2));
    } catch (err: any) {
      alert(`Cannot format JSON: ${err.message}`);
    }
  };

  const handleClearJson = () => {
    setRequestBody('{\n  \n}');
  };

  const handleCopyRequestBody = () => {
    if (requestBody) {
      navigator.clipboard.writeText(requestBody);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  const handleInsertField = (fieldName: string, exampleVal: any) => {
    try {
      const current = requestBody.trim() ? JSON.parse(requestBody) : {};
      if (typeof current === 'object' && current !== null) {
        current[fieldName] = exampleVal !== undefined ? exampleVal : 'sample';
        setRequestBody(JSON.stringify(current, null, 2));
      }
    } catch {
      // If current body is not valid JSON, replace with simple property
      setRequestBody(JSON.stringify({ [fieldName]: exampleVal ?? 'sample' }, null, 2));
    }
  };

  const handleExecute = async (ep: ApiEndpointItem) => {
    if (!jsonValidation.valid && requestBody.trim()) {
      alert(`Invalid JSON in request body:\n${jsonValidation.error}`);
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    let parsedBody: any = undefined;
    if (requestBody && ['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (e: any) {
        alert('Invalid JSON in request body');
        setIsRunning(false);
        return;
      }
    }

    try {
      const result = await gatewayService.executeEndpoint(
        ep.method,
        ep.path,
        pathParams,
        parsedBody
      );
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        status: 500,
        durationMs: 0,
        data: { error: err.message },
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyJson = () => {
    if (executionResult?.data) {
      navigator.clipboard.writeText(JSON.stringify(executionResult.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesService =
      selectedService === 'ALL' ||
      (selectedService === 'gateway' && ep.serviceKey === 'gateway') ||
      ep.serviceKey === selectedService;
    const matchesSearch =
      search === '' ||
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.summary.toLowerCase().includes(search.toLowerCase());
    return matchesService && matchesSearch;
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'POST':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'PATCH':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'PUT':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Explorer Controls Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Interactive API Gateway Explorer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time proxy routing test bench dynamically grounded on Unified OpenAPI specs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search route or path..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-dark-bg/80 border border-dark-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-60"
            />
          </div>

          <button
            onClick={loadSpec}
            className="p-2 rounded-lg bg-dark-card hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white transition"
            title="Reload Specs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Domain Services Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ALL', label: 'All Endpoints' },
          { id: env.services.gateway.key, label: `API Gateway (:${env.services.gateway.port})` },
          { id: env.services.auth.key, label: `Auth & RBAC (:${env.services.auth.port})` },
          { id: env.services.hr.key, label: `HR Domain (:${env.services.hr.port})` },
          { id: env.services.crm.key, label: `CRM Portal (:${env.services.crm.port})` },
          { id: env.services.ac.key, label: `Accounting (:${env.services.ac.port})` },
          { id: env.services.it.key, label: `IT Operations (:${env.services.it.port})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedService(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              selectedService === tab.id
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow'
                : 'bg-dark-surface/60 border-dark-border text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Split View: Routes List (Left) and Interactive Runner (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoints List */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-4 border border-dark-border max-h-[700px] overflow-y-auto space-y-2">
          <div className="text-[11px] uppercase font-bold text-slate-400 px-2 pb-2 border-b border-dark-border flex items-center justify-between">
            <span>Available Routes ({filteredEndpoints.length})</span>
            <span>Method & Path</span>
          </div>

          {filteredEndpoints.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 italic">
              No routes found matching your criteria.
            </div>
          ) : (
            filteredEndpoints.map((ep) => {
              const isSelected = activeEndpointId === ep.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => selectEndpoint(ep)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-600/10'
                      : 'bg-dark-card/50 hover:bg-dark-card border-dark-border/60 hover:border-dark-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getMethodBadge(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {ep.serviceKey.replace('-service', '')}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-200 truncate">
                    {ep.path}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {ep.summary}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Live Request Execution Console */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-dark-border flex flex-col justify-between">
          {activeEndpoint ? (
            <div className="space-y-5">
              {/* Endpoint Header */}
              <div className="flex items-start justify-between pb-4 border-b border-dark-border">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${getMethodBadge(
                        activeEndpoint.method
                      )}`}
                    >
                      {activeEndpoint.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {activeEndpoint.path}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {activeEndpoint.summary || 'No documentation summary provided.'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 font-medium">
                    {activeEndpoint.serviceKey}
                  </span>
                </div>
              </div>

              {/* Path Parameters Inputs if any */}
              {Object.keys(pathParams).length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Path Parameters
                  </label>
                  <div className="space-y-2">
                    {Object.keys(pathParams).map((paramName) => (
                      <div key={paramName} className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400 w-28 shrink-0">
                          {paramName}:
                        </span>
                        <input
                          type="text"
                          value={pathParams[paramName]}
                          onChange={(e) =>
                            setPathParams({ ...pathParams, [paramName]: e.target.value })
                          }
                          placeholder={`Enter ${paramName}...`}
                          className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON Request Body (for POST/PATCH/PUT) */}
              {['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method) && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Request Body (application/json)</span>
                      </label>
                      {activeEndpoint.requestBodySchemaName && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-semibold shadow-sm">
                          {activeEndpoint.requestBodySchemaName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isLoginEndpoint && (['email', 'phone'] as const).map(identity => (
                        <button key={identity} type="button" onClick={() => handleLoginSample(identity)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                          {identity === 'phone' ? 'Phone login' : 'Email login'}
                        </button>
                      ))}
                      {!isLoginEndpoint && activeEndpoint.samplePayload && (
                        <button
                          type="button"
                          onClick={() => handleLoadSample('all')}
                          title="Auto-fill sample payload with all fields"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition flex items-center space-x-1 shadow-sm"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>All Fields</span>
                        </button>
                      )}

                      {!isLoginEndpoint && activeEndpoint.requiredSamplePayload &&
                        Object.keys(activeEndpoint.requiredSamplePayload).length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleLoadSample('required')}
                            title="Auto-fill sample payload with only mandatory required fields"
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center space-x-1 shadow-sm"
                          >
                            <Filter className="w-3 h-3 text-amber-400" />
                            <span>Required Only</span>
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={handlePrettifyJson}
                        title="Format JSON structure"
                        className="px-2 py-1 rounded-lg text-[11px] font-medium bg-dark-card hover:bg-dark-border text-slate-300 hover:text-white border border-dark-border transition flex items-center space-x-1"
                      >
                        <FileCode className="w-3 h-3 text-slate-400" />
                        <span>Prettify</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyRequestBody}
                        title="Copy Request Body"
                        className="px-2 py-1 rounded-lg text-[11px] font-medium bg-dark-card hover:bg-dark-border text-slate-300 hover:text-white border border-dark-border transition flex items-center space-x-1"
                      >
                        {copiedBody ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleClearJson}
                        title="Reset to empty JSON object"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-dark-border transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* High Quality Code Editor Container */}
                  <div className="relative">
                    <textarea
                      rows={8}
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{\n  "field": "value"\n}'
                      spellCheck={false}
                      className={`w-full bg-[#0a0d14] border ${
                        !jsonValidation.valid && requestBody.trim()
                          ? 'border-rose-500/70 focus:border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-dark-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                      } rounded-xl p-3.5 text-xs font-mono text-indigo-200 focus:outline-none resize-y leading-relaxed transition-all shadow-inner`}
                    />
                  </div>

                  {isLoginEndpoint && (
                    <p className="text-xs text-slate-400">Use either <code>email</code> or <code>phone</code> with your password. Phone numbers need a country code and must be assigned to your login account.</p>
                  )}

                  {/* Validation status bar & Field Guide toggle */}
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <div>
                      {!jsonValidation.valid && requestBody.trim() ? (
                        <span className="text-rose-400 flex items-center space-x-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="line-clamp-1">{jsonValidation.error}</span>
                        </span>
                      ) : jsonValidation.valid && requestBody.trim() ? (
                        <span className="text-emerald-400 flex items-center space-x-1.5 font-mono">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Valid JSON payload ({jsonValidation.keyCount} root properties)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Empty body payload</span>
                      )}
                    </div>

                    {activeEndpoint.fieldDefinitions && activeEndpoint.fieldDefinitions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowFieldGuide(!showFieldGuide)}
                        className="text-slate-400 hover:text-indigo-300 transition flex items-center space-x-1 font-medium"
                      >
                        <span>
                          {showFieldGuide
                            ? 'Hide Schema Guide'
                            : `Schema Guide (${activeEndpoint.fieldDefinitions.length} fields)`}
                        </span>
                        {showFieldGuide ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Schema Field Reference Inspector */}
                  {showFieldGuide &&
                    activeEndpoint.fieldDefinitions &&
                    activeEndpoint.fieldDefinitions.length > 0 && (
                      <div className="rounded-xl border border-dark-border/80 bg-dark-bg/80 p-3 mt-1.5 max-h-64 overflow-y-auto space-y-2 shadow-lg backdrop-blur-sm animate-in fade-in duration-150">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between pb-1.5 border-b border-dark-border/60">
                          <span>
                            OpenAPI Schema Properties (
                            {activeEndpoint.fieldDefinitions.length})
                          </span>
                          <span className="text-slate-500 text-[10px]">Click + to add/reset</span>
                        </div>
                        <div className="space-y-1.5 divide-y divide-dark-border/30">
                          {activeEndpoint.fieldDefinitions.map((field) => (
                            <div
                              key={field.name}
                              className="pt-2 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                  <span className="font-mono text-slate-100 font-semibold text-[11px]">
                                    {field.name}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border ${
                                      field.required
                                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                                    }`}
                                  >
                                    {field.required ? 'Required' : 'Optional'}
                                  </span>
                                  <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/40 px-1.5 py-0.2 rounded border border-indigo-500/20">
                                    {field.type}
                                  </span>
                                  {field.default !== undefined && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      default: {JSON.stringify(field.default)}
                                    </span>
                                  )}
                                </div>
                                {field.description && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    {field.description}
                                  </p>
                                )}
                                {field.enum && (
                                  <p className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                                    enum: [{field.enum.join(', ')}]
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleInsertField(field.name, field.example ?? field.default)
                                }
                                className="shrink-0 p-1.5 rounded-lg bg-dark-card hover:bg-indigo-600 hover:text-white text-slate-400 border border-dark-border transition shadow-sm"
                                title={`Insert or reset "${field.name}"`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Execute Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bearer token injected automatically</span>
                </div>

                <button
                  onClick={() => handleExecute(activeEndpoint)}
                  disabled={isRunning || (!jsonValidation.valid && requestBody.trim().length > 0)}
                  className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Executing...' : 'Send Request'}</span>
                </button>
              </div>

              {/* Response Viewer */}
              {executionResult && (
                <div className="pt-4 border-t border-dark-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          executionResult.status >= 200 && executionResult.status < 300
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        HTTP {executionResult.status}
                      </span>
                      <span className="flex items-center space-x-1 text-xs text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{executionResult.durationMs}ms</span>
                      </span>
                    </div>

                    <button
                      onClick={handleCopyJson}
                      className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-dark-bg border border-dark-border transition"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Response</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-dark-bg/90 rounded-xl p-4 border border-dark-border max-h-72 overflow-y-auto font-mono text-xs text-slate-200">
                    <pre className="whitespace-pre-wrap break-all">
                      {typeof executionResult.data === 'object'
                        ? JSON.stringify(executionResult.data, null, 2)
                        : executionResult.data}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs italic">
              Select an endpoint from the left list to test and inspect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
