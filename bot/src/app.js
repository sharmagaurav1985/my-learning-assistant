import http from 'node:http';
import express from 'express';
import { App, ExpressAdapter } from '@microsoft/teams.apps';
import { handleMessage } from './messages.js';

// Avoid recording messages, credentials, or full SDK error objects in application logs.
const logger = {
  debug() {}, info() {}, log() {},
  warn() { console.warn('Teams SDK warning; check configuration if requests fail.'); },
  error() { console.error('Teams SDK operation failed.'); },
  child() { return this; },
};

export async function createApplication(config) {
  const web = express();
  web.disable('x-powered-by');
  web.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  web.get('/', (_req, res) => res.type('text/plain').send('Learning Assistant bot service. Send messages through Microsoft Teams.'));
  const adapter = new ExpressAdapter(web, { logger });
  const bot = new App({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    tenantId: config.tenantId,
    httpServerAdapter: adapter,
    dangerouslyAllowUnauthenticatedRequests: false,
    state: false,
    telemetry: { agent365: false },
    logger,
  });
  bot.on('message', (context) => handleMessage(context, config.allowedTeamsTenantId));
  await bot.initialize();
  return { server: http.createServer(web), bot };
}
