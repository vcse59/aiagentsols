# AI Agents Solutions — Admin-Managed Knowledge Hub

A production-oriented Expo web application with a built-in Node.js content API. Readers can browse published articles without signing in, while a single administrator can log in, upload markdown articles, save drafts, and publish content.

## Features

- **Public Reading Experience** — Published articles are visible to every visitor
- **Admin-Only Login** — Only the configured administrator can sign in
- **Markdown Authoring** — Write new articles directly in markdown
- **Markdown Upload** — Upload `.md` files and save as draft or publish immediately
- **Draft and Publish Workflow** — Manage unpublished drafts before release
- **Search and Filtering** — Full-text search and category filters for public readers
- **Responsive UI** — Optimized for web with Expo and React Native Web
- **Single-Service Deployment** — Node API and static frontend shipped together

## Screens

| Screen | Description |
|--------|-------------|
| `ArticlesScreen` | Public searchable article hub |
| `ArticleDetailScreen` | Full article view rendered from markdown content |
| `LoginScreen` | Admin-only sign-in |
| `AdminEditorScreen` | Draft, publish, and markdown upload workspace |

## Project Structure

```
src/
├── context/
│   └── AuthContext.tsx       # Admin session state
├── lib/
│   └── api.ts                # Frontend API client
├── navigation/
│   └── AppNavigator.tsx      # Public + admin stack navigation
├── screens/
│   ├── LoginScreen.tsx       # Admin login page
│   ├── ArticlesScreen.tsx    # Public articles list
│   ├── ArticleDetailScreen.tsx # Full article view
│   └── AdminEditorScreen.tsx # Admin draft/publish workspace
├── components/
│   └── ArticleCard.tsx       # Reusable article card
├── data/
│   └── articles.ts           # Seed article content
└── types/
    ├── articles.ts           # Shared article/admin types
    └── navigation.ts         # Navigation param types

server/
├── index.js                  # Express server and API routes
├── auth.js                   # Admin session handling
└── articleStore.js           # Markdown-backed article persistence
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 10+

### Install & Run

```bash
# Install dependencies
npm install

# Start Expo web development server
npm run web

# In a separate terminal, start the content API and production web server
npm run export
npm run init:storage
npm run serve

# Expo web dev uses http://localhost:19006
# Node content service uses http://localhost:8080
```

### Required Environment Variables

Configure these before running the Node service in production:

```bash
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=replace-with-a-strong-password
SESSION_SECRET=replace-with-a-long-random-secret
ARTICLE_STORAGE_DIR=/absolute/path/for/persistent-content
```

If `ARTICLE_STORAGE_DIR` is not set, the app defaults to your OS temp directory (for example `/tmp/aiagentsols-content` on Linux).

Optional for local Expo web development:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Admin Workflow

1. Open the public site and choose **Admin Login**.
2. Sign in with the configured admin credentials.
3. Open **Manage Articles**.
4. Write a new markdown article or upload a `.md` file.
5. Choose **Save Draft** or **Publish Article**.

Uploaded or authored admin articles are persisted as markdown files plus metadata under the configured article storage directory.

### Pre-Deploy Storage Initialization

Run this command before startup in containerized environments to verify that the storage path exists and is writable by the runtime user:

```bash
npm run init:storage
```

### Local Admin Defaults

All confidential admin settings are loaded from environment variables. Set these in `.env` for local use and in your platform secret manager for production:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

### Docker

Build and run the application in Docker. The image exports the Expo frontend and serves it together with the admin/article API from a Node.js process on port 8080:

```bash
# Build the image
docker build -t aiagentsols .

# Run the container
docker run -p 8080:8080 \
    -e ADMIN_EMAIL=admin@yourdomain.com \
    -e ADMIN_PASSWORD=replace-with-a-strong-password \
    -e SESSION_SECRET=replace-with-a-long-random-secret \
    -e ARTICLE_STORAGE_DIR=/tmp/aiagentsols-content \
    aiagentsols
```

Access the app at **http://localhost:8080**

## Cloud Deployment

This app is ready for container-based cloud hosting as a single service. The `Dockerfile` builds the Expo web bundle and runs the Node API plus static frontend together on port `8080`.

### Recommended: Google Cloud Run

Cloud Run is the lowest-friction option for this repository because it can build directly from the checked-in `Dockerfile` and manages HTTPS, scaling, and revisions for you.

#### Prerequisites
- Google Cloud SDK installed
- A Google Cloud project with billing enabled
- Cloud Run API enabled

#### Deploy from this repo

```bash
# Authenticate and select your project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Deploy directly from source using the existing Dockerfile
gcloud run deploy aiagentsols \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars ADMIN_EMAIL=admin@yourdomain.com,ADMIN_PASSWORD=replace-with-a-strong-password,SESSION_SECRET=replace-with-a-long-random-secret \
    --port 8080
```

After deployment, Cloud Run prints the public HTTPS URL for the service.

Important: Cloud Run filesystem writes are ephemeral. For durable article publishing, point `ARTICLE_STORAGE_DIR` at mounted persistent storage or move the article store to a managed database/object store.

### Other Cloud Options

- **Azure App Service (Web App for Containers)** — Build the same Docker image and deploy it as a custom container.
- **Azure Container Apps** — Good if you want container-based deployment with scale rules and revision management.
- **AWS App Runner** — Simple container hosting with managed HTTPS and autoscaling.
- **Any Kubernetes cluster** — Works unchanged because the container is already production-ready.

### Operational Notes

- Published admin-authored articles are public.
- Draft articles stay visible only through the admin workspace.
- `POST /api/admin/articles` and `POST /api/admin/articles/upload` are protected by admin session cookies.
- A lightweight `/healthz` endpoint is exposed by the Node service for platform health checks.
- Persistent storage is required if you want authored articles to survive container replacement.

## Tech Stack

- [Expo](https://expo.dev) ~51 — Universal React Native platform
- [React Navigation](https://reactnavigation.org) v6 — Stack navigation
- [TypeScript](https://www.typescriptlang.org) — Type safety
- React Native Web — Web browser support
- **Express** — Admin auth, article APIs, and static file serving
- **gray-matter** — Markdown frontmatter parsing for uploads
- **Docker** — Multi-stage build with Node 20 for export and runtime

This repository contains all the Generative AI Applications 
