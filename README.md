# AI Agents Solutions — Generative AI Knowledge Hub

A **React Native + TypeScript** web application built with Expo, featuring user authentication and a curated Generative AI articles hub.

## Features

- **Authentication** — Sign in / Sign out with protected routes
- **Articles Hub** — 8 in-depth Generative AI articles across 6 categories
- **Search** — Real-time full-text search across titles, summaries, tags, and authors
- **Category Filtering** — Filter by LLMs, Image AI, Agents, Techniques, Ethics, Tools
- **Article Detail** — Full article content with rich formatting
- **Responsive** — Runs on iOS, Android, and Web

## Screens

| Screen | Description |
|--------|-------------|
| `LoginScreen` | Email/password sign-in with demo credentials |
| `ArticlesScreen` | Searchable, filterable list of GenAI articles |
| `ArticleDetailScreen` | Full article with headings, lists, and tables |

## Project Structure

```
src/
├── context/
│   └── AuthContext.tsx       # Authentication state & logic
├── navigation/
│   └── AppNavigator.tsx      # Stack navigator (auth-gated)
├── screens/
│   ├── LoginScreen.tsx       # Sign in page
│   ├── ArticlesScreen.tsx    # Articles list with search & filter
│   └── ArticleDetailScreen.tsx # Full article view
├── components/
│   └── ArticleCard.tsx       # Reusable article card
├── data/
│   └── articles.ts           # Article content & types
└── types/
    └── navigation.ts         # Navigation param types
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`

### Install & Run

```bash
# Install dependencies
npm install

# Start for web
npm run web

# Start for iOS simulator
npm run ios

# Start for Android emulator
npm run android
```

### Demo Credentials

| Field | Value |
|-------|-------|
| Email | `demo@aiagents.dev` |
| Password | `Demo@123` |

Admin account: `admin@aiagents.dev` / `Admin@123`

### Docker

Build and run the application in Docker (production static web build served via nginx on port 8080):

```bash
# Build the image
docker build -t aiagentsols .

# Run the container
docker run -p 8080:8080 aiagentsols
```

Access the app at **http://localhost:8080**

## Tech Stack

- [Expo](https://expo.dev) ~51 — Universal React Native platform
- [React Navigation](https://reactnavigation.org) v6 — Stack navigation
- [TypeScript](https://www.typescriptlang.org) — Type safety
- React Native Web — Web browser support
- **Docker** — Multi-stage build with Node 20 → static export → nginx 1.26

This repository contains all the Generative AI Applications 
