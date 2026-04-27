const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const matter = require('gray-matter');
const { z } = require('zod');

const CATEGORIES = ['LLMs', 'Image AI', 'Agents', 'Techniques', 'Ethics', 'Tools'];

// Primary storage root — can be overridden via ARTICLE_STORAGE_DIR.
// Falls back to a temp directory if the configured path is not writable
// (e.g. when a Railway volume is mounted but owned by root).
const CONFIGURED_STORAGE_ROOT =
  process.env.ARTICLE_STORAGE_DIR?.trim() || path.join(os.tmpdir(), 'aiagentsols-content');
const FALLBACK_STORAGE_ROOT = path.join(os.tmpdir(), 'aiagentsols-content');

// These are resolved lazily inside ensureStore() once we know which root is usable.
let STORAGE_ROOT = CONFIGURED_STORAGE_ROOT;
let INDEX_FILE = path.join(STORAGE_ROOT, 'articles.json');
let MARKDOWN_DIR = path.join(STORAGE_ROOT, 'markdown');

const articleSchema = z.object({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().max(280).optional().default(''),
  content: z.string().trim().min(20),
  author: z.string().trim().min(2).max(80),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
  emoji: z.string().trim().min(1).max(4).default('??'),
  readTime: z.string().trim().max(32).optional().default(''),
  canonicalUrl: z.string().trim().url().optional().or(z.literal('')).default(''),
  coverImage: z.string().trim().url().optional().or(z.literal('')).default(''),
  series: z.string().trim().max(80).optional().default(''),
  status: z.enum(['draft', 'published']).default('draft'),
});

function getStoragePaths() {
  return {
    storageRoot: STORAGE_ROOT,
    indexFile: INDEX_FILE,
    markdownDir: MARKDOWN_DIR,
  };
}

/**
 * Attempt to create a directory and verify it is writable by the current
 * process user.  Returns true on success, false on any permission error.
 */
async function tryInitDirectory(rootDir) {
  const markdownDir = path.join(rootDir, 'markdown');
  try {
    await fs.mkdir(rootDir, { recursive: true });
    await fs.mkdir(markdownDir, { recursive: true });

    // chmod may fail when the directory is owned by a different user (e.g.
    // root-owned volume mount).  Treat that as a non-fatal hint and fall
    // through to the write-access check below.
    try {
      await fs.chmod(rootDir, 0o755);
      await fs.chmod(markdownDir, 0o755);
    } catch {
      // ignore — we will confirm writability with the access check
    }

    // Confirm the process can actually write here.
    await fs.access(rootDir, fsSync.constants.W_OK);
    await fs.access(markdownDir, fsSync.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureStore() {
  // ── 1. Try the configured (primary) storage root ──────────────────────────
  let usable = await tryInitDirectory(CONFIGURED_STORAGE_ROOT);

  if (usable) {
    STORAGE_ROOT = CONFIGURED_STORAGE_ROOT;
    console.log(`[articleStore] Using configured storage root: ${CONFIGURED_STORAGE_ROOT}`);
  } else {
    // ── 2. Fall back to a temp directory the process always owns ─────────────
    console.warn(
      `[articleStore] Cannot write to configured storage root "${CONFIGURED_STORAGE_ROOT}" ` +
        `(EACCES or volume not yet writable). Falling back to "${FALLBACK_STORAGE_ROOT}".`
    );
    console.warn(
      `[articleStore] To persist data across restarts, ensure the volume at ` +
        `"${CONFIGURED_STORAGE_ROOT}" is owned by the runtime user (uid ${process.getuid?.() ?? 'unknown'}).`
    );

    usable = await tryInitDirectory(FALLBACK_STORAGE_ROOT);
    if (!usable) {
      throw new Error(
        `[articleStore] Failed to initialize article storage. Neither ` +
          `"${CONFIGURED_STORAGE_ROOT}" nor the fallback "${FALLBACK_STORAGE_ROOT}" are writable. ` +
          `Set ARTICLE_STORAGE_DIR to a writable location.`
      );
    }

    STORAGE_ROOT = FALLBACK_STORAGE_ROOT;
  }

  // Update the derived paths to match whichever root we settled on.
  INDEX_FILE = path.join(STORAGE_ROOT, 'articles.json');
  MARKDOWN_DIR = path.join(STORAGE_ROOT, 'markdown');

  console.log(`[articleStore] Storage ready — root: ${STORAGE_ROOT}`);

  // Seed an empty index if one does not exist yet.
  try {
    await fs.access(INDEX_FILE);
  } catch {
    await writeIndex([]);
  }
}

async function readIndex() {
  await ensureStore();
  const raw = await fs.readFile(INDEX_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeIndex(records) {
  const tempFile = `${INDEX_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(records, null, 2), 'utf8');
  await fs.rename(tempFile, INDEX_FILE);
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'article';
}

function estimateReadTime(content) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

function summarize(content) {
  const cleaned = content.replace(/^#+\s+/gm, '').replace(/[*_`>#-]/g, '').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 220).trim();
}

function displayDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeTags(tags) {
  if (typeof tags === 'string') {
    return [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))];
  }

  if (!Array.isArray(tags)) {
    return [];
  }

  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
}

function buildRecord(input, existingRecord) {
  const now = new Date().toISOString();
  const parsed = articleSchema.parse({
    ...input,
    tags: normalizeTags(input.tags),
    readTime: input.readTime?.trim() || estimateReadTime(input.content),
    summary: input.summary?.trim() || summarize(input.content),
  });

  const status = parsed.status;
  const publishedAt = status === 'published'
    ? existingRecord?.publishedAt || now
    : existingRecord?.publishedAt || null;
  const id = existingRecord?.id || crypto.randomUUID();
  const slug = slugify(parsed.title);

  return {
    id,
    slug,
    title: parsed.title,
    summary: parsed.summary,
    content: parsed.content,
    author: parsed.author,
    category: parsed.category,
    tags: parsed.tags,
    emoji: parsed.emoji,
    readTime: parsed.readTime,
    canonicalUrl: parsed.canonicalUrl,
    coverImage: parsed.coverImage,
    series: parsed.series,
    status,
    date: publishedAt ? displayDate(publishedAt) : 'Draft',
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
    publishedAt,
    markdownFile: `${slug}-${id}.md`,
    source: 'managed',
  };
}

function serializeMarkdown(record) {
  const frontmatter = {
    title: record.title,
    description: record.summary,
    published: record.status === 'published',
    tags: record.tags.join(', '),
    ...(record.coverImage ? { cover_image: record.coverImage } : {}),
    ...(record.canonicalUrl ? { canonical_url: record.canonicalUrl } : {}),
    ...(record.series ? { series: record.series } : {}),
    summary: record.summary,
    author: record.author,
    category: record.category,
    emoji: record.emoji,
    readTime: record.readTime,
    status: record.status,
  };

  return matter.stringify(record.content, frontmatter);
}

async function persistMarkdown(record) {
  await ensureStore();
  await fs.writeFile(path.join(MARKDOWN_DIR, record.markdownFile), serializeMarkdown(record), 'utf8');
}

async function getPublishedArticles() {
  const records = await readIndex();
  return records
    .filter((record) => record.status === 'published')
    .sort((left, right) => (right.publishedAt || '').localeCompare(left.publishedAt || ''));
}

async function getAdminArticles() {
  const records = await readIndex();
  return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

async function getArticleById(id, includeDrafts = false) {
  const records = await readIndex();
  return records.find((record) => record.id === id && (includeDrafts || record.status === 'published')) || null;
}

async function createArticle(input) {
  const records = await readIndex();
  const record = buildRecord(input);
  records.push(record);
  await persistMarkdown(record);
  await writeIndex(records);
  return record;
}

async function updateArticle(id, input) {
  const records = await readIndex();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) {
    return null;
  }

  const record = buildRecord({ ...records[index], ...input }, records[index]);
  records[index] = record;
  await persistMarkdown(record);
  await writeIndex(records);
  return record;
}

function parseMarkdownUpload(markdownText, fallbackFields = {}) {
  const parsed = matter(markdownText);
  const frontmatter = parsed.data || {};

  return {
    title: fallbackFields.title || frontmatter.title,
    summary: fallbackFields.summary || frontmatter.summary || frontmatter.description,
    content: parsed.content.trim(),
    author: fallbackFields.author || frontmatter.author || 'Admin',
    category: fallbackFields.category || frontmatter.category || 'Tools',
    tags: fallbackFields.tags || frontmatter.tags || [],
    emoji: fallbackFields.emoji || frontmatter.emoji || '??',
    readTime: fallbackFields.readTime || frontmatter.readTime,
    canonicalUrl: fallbackFields.canonicalUrl || frontmatter.canonical_url || frontmatter.canonicalUrl,
    coverImage:
      fallbackFields.coverImage ||
      frontmatter.cover_image ||
      frontmatter.coverImage ||
      frontmatter.main_image ||
      frontmatter.mainImage,
    series: fallbackFields.series || frontmatter.series,
    status:
      fallbackFields.status ||
      frontmatter.status ||
      (frontmatter.published === true ? 'published' : 'draft'),
  };
}

module.exports = {
  CATEGORIES,
  createArticle,
  getAdminArticles,
  getArticleById,
  getPublishedArticles,
  getStoragePaths,
  initializeStore: ensureStore,
  parseMarkdownUpload,
  updateArticle,
};
