import app, { initDB } from '../src/app.js';

export default async (req, res) => {
  await initDB();
  return app(req, res);
};
