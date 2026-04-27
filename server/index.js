require('dotenv').config();

const path = require('node:path');
const fs = require('node:fs/promises');
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { z } = require('zod');
const {
  clearSession,
  getConfiguredCredentials,
  getSessionFromRequest,
  issueSession,
  requireAdmin,
} = require('./auth');
const {
  createArticle,
  deleteArticle,
  getAdminArticles,
  getArticleById,
  getPublishedArticles,
  getStoragePaths,
  initializeStore,
  parseMarkdownUpload,
  updateArticle,
} = require('./articleStore');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 1024 * 1024 * 2,
  },
});

const DIST_DIR = path.join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 8080);

const urlField = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().url().optional());

const articleInputSchema = z.object({
  title: z.string().trim().min(3),
  summary: z.string().trim().optional(),
  description: z.string().trim().optional(),
  content: z.string().trim().min(20),
  author: z.string().trim().min(2).default('Admin'),
  category: z.enum(['LLMs', 'Image AI', 'Agents', 'Techniques', 'Ethics', 'Tools']).default('Tools'),
  tags: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) => {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value;
      }

      return value.split(',');
    }),
  emoji: z.string().trim().optional(),
  readTime: z.string().trim().optional(),
  status: z.enum(['draft', 'published']).optional(),
  published: z.boolean().optional(),
  canonicalUrl: urlField,
  coverImage: urlField,
  mainImage: urlField,
  series: z.string().trim().max(80).optional(),
});

const markdownImportSchema = z.object({
  markdown: z.string().trim().min(20),
  title: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  description: z.string().trim().optional(),
  author: z.string().trim().optional(),
  category: z.enum(['LLMs', 'Image AI', 'Agents', 'Techniques', 'Ethics', 'Tools']).optional(),
  tags: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) => {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value;
      }

      return value.split(',');
    }),
  emoji: z.string().trim().optional(),
  readTime: z.string().trim().optional(),
  status: z.enum(['draft', 'published']).optional(),
  published: z.boolean().optional(),
  canonicalUrl: urlField,
  coverImage: urlField,
  mainImage: urlField,
  series: z.string().trim().max(80).optional(),
});

function normalizeArticlePayload(payload) {
  return {
    title: payload.title,
    summary: payload.summary || payload.description || '',
    content: payload.content,
    author: payload.author,
    category: payload.category,
    tags: payload.tags,
    emoji: payload.emoji,
    readTime: payload.readTime,
    canonicalUrl: payload.canonicalUrl,
    coverImage: payload.coverImage || payload.mainImage,
    series: payload.series,
    status: payload.status || (payload.published ? 'published' : 'draft'),
  };
}

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => {
  req.admin = getSessionFromRequest(req);
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

app.get('/healthz', async (_req, res) => {
  try {
    await fs.access(DIST_DIR);
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'starting' });
  }
});

app.get('/api/admin/session', (req, res) => {
  const { configured } = getConfiguredCredentials();
  if (!req.admin) {
    return res.json({ authenticated: false, configured });
  }

  res.json({ authenticated: true, configured, admin: req.admin });
});

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const credentials = getConfiguredCredentials();
  if (!credentials.configured) {
    return res.status(503).json({ error: 'Admin credentials are not configured on the server.' });
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (email !== credentials.email.toLowerCase() || password !== credentials.password) {
    return res.status(401).json({ error: 'Invalid admin email or password.' });
  }

  const admin = { email: credentials.email, role: 'admin' };
  issueSession(res, admin);
  res.json({ authenticated: true, admin });
});

app.post('/api/admin/logout', (req, res) => {
  clearSession(res);
  res.status(204).send();
});

app.get('/api/articles', async (_req, res, next) => {
  try {
    const articles = await getPublishedArticles();
    res.json({ articles });
  } catch (error) {
    next(error);
  }
});

app.get('/api/articles/:id', async (req, res, next) => {
  try {
    const article = await getArticleById(req.params.id, Boolean(req.admin));
    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    res.json({ article });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/articles', requireAdmin, async (_req, res, next) => {
  try {
    const articles = await getAdminArticles();
    res.json({ articles });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/articles', requireAdmin, async (req, res, next) => {
  try {
    const payload = normalizeArticlePayload(articleInputSchema.parse(req.body));
    const article = await createArticle(payload);
    res.status(201).json({ article });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/articles/:id', requireAdmin, async (req, res, next) => {
  try {
    const payload = normalizeArticlePayload(articleInputSchema.parse(req.body));
    const article = await updateArticle(req.params.id, payload);
    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    res.json({ article });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/articles/:id', requireAdmin, async (req, res, next) => {
  try {
    const article = await deleteArticle(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/articles/upload', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'A markdown file is required.' });
    }

    const tags = String(req.body.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = parseMarkdownUpload(req.file.buffer.toString('utf8'), {
      title: req.body.title,
      summary: req.body.summary,
      description: req.body.description,
      author: req.body.author,
      category: req.body.category,
      emoji: req.body.emoji,
      readTime: req.body.readTime,
      canonicalUrl: req.body.canonicalUrl,
      coverImage: req.body.coverImage,
      series: req.body.series,
      status: req.body.status,
      tags,
    });

    const article = await createArticle(normalizeArticlePayload(articleInputSchema.parse(payload)));
    res.status(201).json({ article });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/articles/import', requireAdmin, async (req, res, next) => {
  try {
    const payload = markdownImportSchema.parse(req.body);
    const parsed = parseMarkdownUpload(payload.markdown, {
      title: payload.title,
      summary: payload.summary,
      description: payload.description,
      author: payload.author,
      category: payload.category,
      tags: payload.tags,
      emoji: payload.emoji,
      readTime: payload.readTime,
      status: payload.status,
      published: payload.published,
      canonicalUrl: payload.canonicalUrl,
      coverImage: payload.coverImage || payload.mainImage,
      series: payload.series,
    });

    const article = await createArticle(normalizeArticlePayload(articleInputSchema.parse(parsed)));
    res.status(201).json({ article });
  } catch (error) {
    next(error);
  }
});

app.use(
  express.static(DIST_DIR, {
    index: false,
    extensions: ['html'],
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html') || filePath.endsWith('metadata.json')) {
        res.setHeader('Cache-Control', 'no-store');
      }
    },
  })
);

app.get('*', async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }

  try {
    await fs.access(path.join(DIST_DIR, 'index.html'));
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: error.issues[0]?.message || 'Invalid request.' });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

async function startServer() {
  await initializeStore();
  const { storageRoot } = getStoragePaths();

  app.listen(PORT, () => {
    console.log(`AI Agents Solutions server listening on port ${PORT}`);
    console.log(`Article storage initialized at ${storageRoot}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
