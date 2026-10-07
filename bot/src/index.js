import { readConfig } from './config.js';
import { createApplication } from './app.js';

try {
  const config = readConfig();
  const { server } = await createApplication(config);
  server.on('error', () => { console.error('HTTP server failed to start.'); process.exit(1); });
  server.listen(config.port, '0.0.0.0', () => console.info(`Learning Assistant listening on port ${config.port}`));
  let closing = false;
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      if (closing) return;
      closing = true;
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
} catch (error) {
  // Configuration errors contain variable names only; never print SDK objects or credentials.
  if (error.message.startsWith('Missing configuration:') || /must be/.test(error.message)) console.error(error.message);
  else console.error('Bot initialization failed. Check the app identity and hosting settings.');
  process.exitCode = 1;
}
