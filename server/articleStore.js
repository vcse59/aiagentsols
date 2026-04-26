const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const matter = require('gray-matter');
const { z } = require('zod');

const CATEGORIES = ['LLMs', 'Image AI', 'Agents', 'Techniques', 'Ethics', 'Tools'];
const STORAGE_ROOT =
  process.env.ARTICLE_STORAGE_DIR?.trim() || path.join(os.tmpdir(), 'aiagentsols-content');
const INDEX_FILE = path.join(STORAGE_ROOT, 'articles.json');
const MARKDOWN_DIR = path.join(STORAGE_ROOT, 'markdown');

const articleSchema = z.object({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().max(280).optional().default(''),
  content: z.string().trim().min(20),
  author: z.string().trim().min(2).max(80),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
  emoji: z.string().trim().min(1).max(4).default('??'),
  readTime: z.string().trim().max(32).optional().default(''),
  status: z.enum(['draft', 'published']).default('draft'),
});

function getStoragePaths() {
  return {
    storageRoot: STORAGE_ROOT,
    indexFile: INDEX_FILE,
    markdownDir: MARKDOWN_DIR,
  };
}

async function verifyWritableDirectory(dirPath) {
  try {
    await fs.access(dirPath, fsSync.constants.W_OK);
  } catch (error) {
    throw new Error(
      `Article storage path is not writable: ${dirPath}. ` +
        `Ensure the runtime user has write permission. Original error: ${error.message}`
    );
  }
}

async function ensureStore() {
  try {
    await fs.mkdir(STORAGE_ROOT, { recursive: true });
    await fs.mkdir(MARKDOWN_DIR, { recursive: true });
    await fs.chmod(STORAGE_ROOT, 0o755);
    await fs.chmod(MARKDOWN_DIR, 0o755);
    await verifyWritableDirectory(STORAGE_ROOT);
    await verifyWritableDirectory(MARKDOWN_DIR);

    try {
      await fs.access(INDEX_FILE);
    } catch {
      await writeIndex([]);
    }
  } catch (error) {
    throw new Error(
      `Failed to initialize article storage under ${STORAGE_ROOT}. ` +
        `Set ARTICLE_STORAGE_DIR to a writable location. Original error: ${error.message}`
    );
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
    summary: record.summary,
    author: record.author,
    category: record.category,
    tags: record.tags,
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
    summary: fallbackFields.summary || frontmatter.summary,
    content: parsed.content.trim(),
    author: fallbackFields.author || frontmatter.author || 'Admin',
    category: fallbackFields.category || frontmatter.category || 'Tools',
    tags: fallbackFields.tags || frontmatter.tags || [],
    emoji: fallbackFields.emoji || frontmatter.emoji || '??',
    readTime: fallbackFields.readTime || frontmatter.readTime,
    status: fallbackFields.status || frontmatter.status || 'draft',
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
