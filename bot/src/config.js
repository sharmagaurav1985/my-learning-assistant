export function readConfig(env = process.env) {
  const required = ['CLIENT_ID', 'TENANT_ID', 'CLIENT_SECRET', 'ALLOWED_TEAMS_TENANT_ID'];
  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}`);
  for (const key of ['CLIENT_ID', 'TENANT_ID', 'ALLOWED_TEAMS_TENANT_ID']) {
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(env[key])) {
      throw new Error(`${key} must be a UUID`);
    }
  }
  const port = Number(env.PORT ?? 3978);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  return {
    clientId: env.CLIENT_ID, tenantId: env.TENANT_ID, clientSecret: env.CLIENT_SECRET,
    allowedTeamsTenantId: env.ALLOWED_TEAMS_TENANT_ID, port,
  };
}
