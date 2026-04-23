import app, { initDB } from './app.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 5000;

initDB()
  .then(() => app.listen(PORT, () => logger.info(`API ready on :${PORT}`)))
  .catch(err => {
    logger.error('Failed to start server', { stack: err.stack, message: err.message });
    process.exit(1);
  });
