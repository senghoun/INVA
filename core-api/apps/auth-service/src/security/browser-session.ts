import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { TokenResponseDto } from '../dto/token-response.dto';

export const REFRESH_COOKIE = 'inva_refresh';
const LOCAL_ORIGINS = ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://127.0.0.1:5173'];

export function browserOrigins(config: ConfigService): string[] {
  // LAN development URLs need an explicit origin here and a matching saved domain-policy entry.
  const configured = config.get<string>('BROWSER_ORIGINS', '').split(',').map(value => value.trim()).filter(Boolean);
  return configured.length ? configured : config.get('NODE_ENV') === 'production' ? [] : LOCAL_ORIGINS;
}

export function isBrowserSession(request: FastifyRequest, config: ConfigService): boolean {
  const browser = request.headers['x-inva-client'] === 'browser';
  if (request.cookies?.[REFRESH_COOKIE] && !browser) throw new ForbiddenException('Browser session header required.');
  if (browser) {
    const origin = request.headers.origin;
    if (origin && !browserOrigins(config).includes(origin)) throw new ForbiddenException('Origin is not allowed.');
    if (request.headers['sec-fetch-site'] === 'cross-site') throw new ForbiddenException('Cross-site session request denied.');
  }
  return browser;
}

export function sendBrowserSession(result: TokenResponseDto, browser: boolean, reply: FastifyReply, config: ConfigService) {
  reply.header('Cache-Control', 'no-store');
  if (!browser) return result; // Preserve explicit bearer-token clients.
  const payload = JSON.parse(Buffer.from(result.refreshToken.split('.')[1], 'base64url').toString());
  reply.setCookie(REFRESH_COOKIE, result.refreshToken, {
    httpOnly: true, secure: config.get('NODE_ENV') === 'production', sameSite: 'strict',
    path: '/api/v1/auth', maxAge: Math.max(0, payload.exp - Math.floor(Date.now() / 1000)),
  });
  return { accessToken: result.accessToken, tokenType: result.tokenType, expiresIn: result.expiresIn, browserSession: true };
}
