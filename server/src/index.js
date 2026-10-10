import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { createApp } from './app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3001);
const dbFile = process.env.DB_FILE ?? path.join(here, '..', 'data.db');
const staticDir = process.env.STATIC_DIR ?? path.join(here, '..', '..', 'client', 'dist');

const app = createApp(openDb(dbFile), { staticDir });
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
