# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source
COPY . .

# Export the static web build into /app/dist
RUN npx expo export --platform web

# ─── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV ARTICLE_STORAGE_DIR=/data

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node server ./server
COPY --chown=node:node --from=builder /app/dist ./dist

# /data is a Railway volume mount point — it is mounted at runtime and will
# replace anything created here, so we only set up the app-owned directories.
# The articleStore.js ensureStore() function handles creating /data/markdown
# at startup and falls back to a temp directory if the volume isn't writable.
RUN chown -R node:node /app/server /app/dist

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["node", "server/index.js"]
