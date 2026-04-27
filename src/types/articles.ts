import type { Article as SeedArticle } from '../data/articles';

export type ManagedArticleStatus = 'draft' | 'published';

export interface DevtoCompatibleFields {
  canonicalUrl?: string;
  coverImage?: string;
  series?: string;
}

export type DisplayArticle = SeedArticle & {
  source: 'seed' | 'managed';
  status?: ManagedArticleStatus;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
} & DevtoCompatibleFields;

export interface AdminUser {
  email: string;
  role: 'admin';
}

export interface ArticleInput {
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  emoji: string;
  readTime: string;
  status: ManagedArticleStatus;
  canonicalUrl?: string;
  coverImage?: string;
  series?: string;
}
