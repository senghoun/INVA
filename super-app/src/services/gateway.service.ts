import { ApiEndpointItem, EndpointFieldDefinition } from '../types';
import { getStoredToken, setStoredToken, clearStoredTokens } from './api';
import { browserContextHeaders } from './browser-context';

export class GatewayService {
  public async getUnifiedSpec(): Promise<any> {
    const res = await fetch('/api/docs/specs/all.json');
    if (!res.ok) {
      throw new Error(`Failed to load OpenAPI spec: ${res.statusText}`);
    }
    return res.json();
  }

  public resolveSchema(schema: any, components: any, visited = new Set<string>()): any {
    if (!schema || typeof schema !== 'object') return null;

    if (schema.$ref) {
      const refKey = schema.$ref.replace('#/components/schemas/', '');
      if (visited.has(refKey)) return null;
      visited.add(refKey);
      const target = components?.schemas?.[refKey];
      if (!target) return schema;
      return this.resolveSchema(target, components, visited);
    }

    if (Array.isArray(schema.allOf)) {
      const merged: any = { type: 'object', properties: {}, required: [] };
      for (const sub of schema.allOf) {
        const resolvedSub = this.resolveSchema(sub, components, new Set(visited));
        if (resolvedSub?.properties) {
          Object.assign(merged.properties, resolvedSub.properties);
        }
        if (Array.isArray(resolvedSub?.required)) {
          merged.required.push(...resolvedSub.required);
        }
        if (resolvedSub?.example !== undefined && merged.example === undefined) {
          merged.example = resolvedSub.example;
        }
        if (resolvedSub?.description && !merged.description) {
          merged.description = resolvedSub.description;
        }
      }
      return merged;
    }

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
      return this.resolveSchema(schema.anyOf[0], components, visited);
    }

    if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
      return this.resolveSchema(schema.oneOf[0], components, visited);
    }

    return schema;
  }

  public extractFieldDefinitions(
    schema: any,
    components: any,
    depth = 0,
    prefix = ''
  ): EndpointFieldDefinition[] {
    if (!schema || depth > 3) return [];
    const resolved = this.resolveSchema(schema, components);
    if (!resolved || !resolved.properties) return [];

    const fields: EndpointFieldDefinition[] = [];
    const requiredList = Array.isArray(resolved.required) ? resolved.required : [];

    for (const [key, propDef] of Object.entries<any>(resolved.properties)) {
      const fullName = prefix ? `${prefix}.${key}` : key;
      const isReq = requiredList.includes(key);
      const propResolved = this.resolveSchema(propDef, components) || propDef;

      let displayType = propResolved.type || 'string';
      if (propResolved.enum && Array.isArray(propResolved.enum)) {
        displayType = `enum (${propResolved.enum.slice(0, 3).join(', ')}${
          propResolved.enum.length > 3 ? '...' : ''
        })`;
      } else if (propResolved.type === 'array') {
        const itemType =
          propResolved.items?.type ||
          (propResolved.items?.$ref ? propResolved.items.$ref.split('/').pop() : 'any');
        displayType = `${itemType}[]`;
      } else if (propDef.$ref) {
        displayType = propDef.$ref.split('/').pop() || 'object';
      }

      fields.push({
        name: fullName,
        type: displayType,
        required: isReq,
        description: propResolved.description,
        example: propResolved.example,
        enum: propResolved.enum,
        default: propResolved.default,
      });

      if (propResolved.type === 'object' && propResolved.properties && depth === 0) {
        const nested = this.extractFieldDefinitions(propResolved, components, depth + 1, fullName);
        fields.push(...nested);
      }
    }

    return fields;
  }

  public generateSampleFromSchema(
    schema: any,
    components: any,
    mode: 'all' | 'required' = 'all',
    depth = 0,
    visited = new Set<string>()
  ): any {
    if (!schema || depth > 8) return {};

    const resolved = this.resolveSchema(schema, components, new Set(visited));
    if (!resolved) return {};

    if (mode === 'all' && resolved.example !== undefined) {
      return resolved.example;
    }

    if (resolved.type === 'object' || resolved.properties) {
      const obj: Record<string, any> = {};
      const requiredList: string[] = Array.isArray(resolved.required) ? resolved.required : [];
      const props = resolved.properties || {};

      for (const [key, rawProp] of Object.entries<any>(props)) {
        const isRequired = requiredList.includes(key);
        if (mode === 'required' && !isRequired) {
          continue;
        }

        const prop = this.resolveSchema(rawProp, components, new Set(visited)) || rawProp;

        if (prop.example !== undefined) {
          obj[key] = prop.example;
        } else if (prop.default !== undefined) {
          obj[key] = prop.default;
        } else if (prop.enum && Array.isArray(prop.enum) && prop.enum.length > 0) {
          obj[key] = prop.enum[0];
        } else if (prop.type === 'string') {
          const k = key.toLowerCase();
          if (prop.format === 'date-time') {
            obj[key] = new Date().toISOString();
          } else if (prop.format === 'date') {
            obj[key] = new Date().toISOString().split('T')[0];
          } else if (prop.format === 'time') {
            obj[key] = '08:30';
          } else if (prop.format === 'email' || k.includes('email')) {
            obj[key] = 'user@inva.io';
          } else if (prop.format === 'password' || k.includes('password')) {
            obj[key] = 'Password123!';
          } else if (prop.format === 'uuid' || k.endsWith('id') || k === 'id') {
            obj[key] = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
          } else if (k.includes('phone')) {
            obj[key] = '+855 23 123 456';
          } else if (k.includes('url') || k.includes('website') || k.includes('logo')) {
            obj[key] = 'https://invaestate.com/logo.png';
          } else if (k.includes('status')) {
            obj[key] = 'ACTIVE';
          } else if (k.includes('gender')) {
            obj[key] = 'MALE';
          } else if (k.includes('currency')) {
            obj[key] = 'USD';
          } else if (k.includes('code')) {
            obj[key] = `${key.toUpperCase().replace(/[^A-Z0-9]/g, '')}-01`;
          } else if (k.includes('name')) {
            obj[key] = `Sample ${key.charAt(0).toUpperCase() + key.slice(1)}`;
          } else if (k.includes('title')) {
            obj[key] = `Sample ${key.charAt(0).toUpperCase() + key.slice(1)}`;
          } else if (
            k.includes('desc') ||
            k.includes('note') ||
            k.includes('reason') ||
            k.includes('comment')
          ) {
            obj[key] = `Sample ${key} details`;
          } else {
            obj[key] = `Sample ${key}`;
          }
        } else if (prop.type === 'number' || prop.type === 'integer') {
          const k = key.toLowerCase();
          if (prop.minimum !== undefined) {
            obj[key] = prop.minimum;
          } else if (k.includes('year')) {
            obj[key] = 2026;
          } else if (k.includes('month')) {
            obj[key] = 9;
          } else if (k.includes('day')) {
            obj[key] = 25;
          } else if (k.includes('hour')) {
            obj[key] = 8;
          } else if (k.includes('minute')) {
            obj[key] = 15;
          } else if (
            k.includes('price') ||
            k.includes('amount') ||
            k.includes('salary') ||
            k.includes('rate') ||
            k.includes('total')
          ) {
            obj[key] = 1000;
          } else if (k.includes('lat')) {
            obj[key] = 11.5564;
          } else if (k.includes('lng') || k.includes('lon')) {
            obj[key] = 104.9282;
          } else if (k.includes('radius')) {
            obj[key] = 100;
          } else if (k.includes('quantity') || k.includes('count')) {
            obj[key] = 1;
          } else {
            obj[key] = 1;
          }
        } else if (prop.type === 'boolean') {
          obj[key] = prop.default !== undefined ? prop.default : true;
        } else if (prop.type === 'array') {
          if (prop.example) {
            obj[key] = prop.example;
          } else if (prop.items) {
            const itemSample = this.generateSampleFromSchema(
              prop.items,
              components,
              mode,
              depth + 1,
              new Set(visited)
            );
            obj[key] = itemSample !== undefined ? [itemSample] : [];
          } else {
            obj[key] = [];
          }
        } else if (prop.type === 'object' || prop.properties) {
          obj[key] = this.generateSampleFromSchema(
            prop,
            components,
            mode,
            depth + 1,
            new Set(visited)
          );
        } else {
          obj[key] = '';
        }
      }

      return obj;
    }

    if (resolved.type === 'array') {
      if (resolved.items) {
        return [
          this.generateSampleFromSchema(
            resolved.items,
            components,
            mode,
            depth + 1,
            new Set(visited)
          ),
        ];
      }
      return [];
    }

    return {};
  }

  public parseEndpointsFromSpec(spec: any): ApiEndpointItem[] {
    if (!spec || !spec.paths) return [];

    const endpoints: ApiEndpointItem[] = [];
    const paths = spec.paths;
    const components = spec.components || {};

    for (const pathKey of Object.keys(paths)) {
      const pathItem = paths[pathKey];
      const methods: Array<'get' | 'post' | 'put' | 'patch' | 'delete'> = [
        'get',
        'post',
        'put',
        'patch',
        'delete',
      ];

      for (const method of methods) {
        if (pathItem[method]) {
          const op = pathItem[method];
          const tag = (op.tags && op.tags[0]) || 'gateway';

          let serviceKey = 'gateway';
          if (pathKey.includes('/auth') || tag === 'auth') serviceKey = 'auth-service';
          else if (pathKey.includes('/hr') || tag === 'hr') serviceKey = 'hr-service';
          else if (pathKey.includes('/crm') || tag === 'crm') serviceKey = 'crm-service';
          else if (pathKey.includes('/ac') || tag === 'ac') serviceKey = 'ac-service';
          else if (pathKey.includes('/it') || tag === 'it') serviceKey = 'it-service';

          let schemaName: string | undefined;
          let resolvedSchema: any = null;
          let samplePayload: any = null;
          let requiredSamplePayload: any = null;
          let fieldDefinitions: EndpointFieldDefinition[] = [];

          const content = op.requestBody?.content;
          const jsonContent =
            content?.['application/json'] ||
            content?.['*/*'] ||
            (content ? Object.values(content)[0] : null);

          if (jsonContent?.schema) {
            if (jsonContent.schema.$ref) {
              schemaName = jsonContent.schema.$ref.split('/').pop();
            }
            resolvedSchema = this.resolveSchema(jsonContent.schema, components);
            samplePayload =
              jsonContent.example !== undefined
                ? jsonContent.example
                : this.generateSampleFromSchema(jsonContent.schema, components, 'all');
            requiredSamplePayload = this.generateSampleFromSchema(
              jsonContent.schema,
              components,
              'required'
            );
            fieldDefinitions = this.extractFieldDefinitions(jsonContent.schema, components);
          } else if (jsonContent?.example !== undefined) {
            samplePayload = jsonContent.example;
          }

          // Login identities are alternatives. Generic all/required generation
          // would otherwise send both identities or omit them both.
          if (method === 'post' && pathKey === '/api/v1/auth/login') {
            samplePayload = jsonContent?.examples?.email?.value || {
              email: 'alice@inva.io', password: 'S3cur3P@ss!',
            };
            requiredSamplePayload = samplePayload;
          }

          endpoints.push({
            id: `${method.toUpperCase()}_${pathKey}`,
            method: method.toUpperCase() as any,
            path: pathKey,
            serviceKey,
            summary: op.summary || `${method.toUpperCase()} ${pathKey}`,
            description: op.description,
            parameters: op.parameters || [],
            requestBody: op.requestBody,
            requestBodySchemaName: schemaName,
            resolvedSchema,
            samplePayload,
            requiredSamplePayload,
            fieldDefinitions,
            responses: op.responses,
            security: op.security,
          });
        }
      }
    }

    return endpoints;
  }

  public async executeEndpoint(
    method: string,
    path: string,
    params?: Record<string, any>,
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<{ status: number; durationMs: number; data: any; headers: Record<string, string> }> {
    let resolvedPath = path;

    // Substitute path params like :id or {id}
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (resolvedPath.includes(`:${k}`)) {
          resolvedPath = resolvedPath.replace(`:${k}`, encodeURIComponent(String(v)));
        } else if (resolvedPath.includes(`{${k}}`)) {
          resolvedPath = resolvedPath.replace(`{${k}}`, encodeURIComponent(String(v)));
        }
      }
    }

    const start = performance.now();
    const headers = new Headers(customHeaders || {});
    headers.set('X-Inva-Client', 'browser');
    for (const [name, value] of Object.entries(browserContextHeaders())) headers.set(name, value);
    const token = getStoredToken();
    if (token && !headers.has('Authorization') && !['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/mfa/verify'].includes(resolvedPath)) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const reqOptions: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      reqOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    }

    let responseData: any;
    let status = 200;
    const responseHeaders: Record<string, string> = {};

    try {
      const res = await fetch(resolvedPath, reqOptions);

      status = res.status;
      res.headers.forEach((v, k) => {
        responseHeaders[k] = v;
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
        if (res.ok && ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/mfa/verify'].includes(resolvedPath) && responseData?.accessToken) {
          setStoredToken(responseData.accessToken, responseData.refreshToken);
        }
        if (res.ok && resolvedPath === '/api/v1/auth/logout') clearStoredTokens();
      } else {
        responseData = await res.text();
      }
    } catch (err: any) {
      status = 500;
      responseData = { error: err.message || 'Network request failed' };
    }

    const durationMs = Math.round(performance.now() - start);

    return {
      status,
      durationMs,
      data: responseData,
      headers: responseHeaders,
    };
  }
}

export const gatewayService = new GatewayService();
