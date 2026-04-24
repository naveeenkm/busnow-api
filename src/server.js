import app, { initDB } from './app.js';
import { logInfo, logError } from './config/logger.js';

const PORT = process.env.PORT || 5000;

initDB()
  .then(() => app.listen(PORT, () => logInfo('Server:start - API ready', { port: PORT })))
  .catch(err => {
    logError('Server:start - Failed to start', { stack: err.stack, message: err.message });
    process.exit(1);
  });
