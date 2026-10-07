import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readConfig } from '../src/config.js';
import { createApplication } from '../src/app.js';
import { handleMessage } from '../src/messages.js';

const env = {
  CLIENT_ID: '25e90648-686c-45ce-964d-faa3428732b7',
  TENANT_ID: '6c7df0de-c240-4c62-8043-9f999faca940',
  CLIENT_SECRET: 'test-only-not-a-real-credential',
  ALLOWED_TEAMS_TENANT_ID: '146f3da1-43b2-4c64-82ab-86916a2bcae5',
};
const activity = {
  type: 'message', channelId: 'msteams', text: 'hello',
  channelData: { tenant: { id: env.ALLOWED_TEAMS_TENANT_ID } },
  conversation: { id: 'test', conversationType: 'personal' },
};

test('fails closed when the deployment secret is missing', () => {
  assert.throws(() => readConfig({ ...env, CLIENT_SECRET: '' }), /Missing configuration: CLIENT_SECRET/);
});

test('accepts allowed personal messages but ignores other tenants and shared chats', async () => {
  const sent = [];
  const send = async (message) => sent.push(message);
  await handleMessage({ activity, send }, env.ALLOWED_TEAMS_TENANT_ID);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].textFormat, 'plain');
  for (const forbidden of [
    { ...activity, channelData: { tenant: { id: env.TENANT_ID } } },
    { ...activity, channelData: {} },
    { ...activity, channelId: 'emulator' },
    { ...activity, conversation: { conversationType: 'channel' } },
  ]) await handleMessage({ activity: forbidden, send }, env.ALLOWED_TEAMS_TENANT_ID);
  assert.equal(sent.length, 1);
});

test('does not claim to execute unsupported business actions', async () => {
  let result;
  await handleMessage({ activity: { ...activity, text: 'Approve every invoice' }, send: async (m) => { result = m; } }, env.ALLOWED_TEAMS_TENANT_ID);
  assert.match(result.text, /cannot perform application actions/);
});

test('health is reachable, but unsigned and invalidly signed messages cannot invoke the bot', async () => {
  const { server } = await createApplication(readConfig(env));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/healthz`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });
    for (const auth of [undefined, 'Bearer invalid.token.value']) {
      const headers = { 'Content-Type': 'application/json' };
      if (auth) headers.Authorization = auth;
      const response = await fetch(`${base}/api/messages`, { method: 'POST', headers, body: JSON.stringify(activity) });
      assert.equal(response.status, 401);
    }
  } finally {
    await new Promise((resolve, reject) => server.close((e) => e ? reject(e) : resolve()));
  }
});
