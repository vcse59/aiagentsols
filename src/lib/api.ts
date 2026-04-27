import type { AdminUser, ArticleInput, DisplayArticle, ManagedArticleStatus } from '../types/articles';

const isWeb = typeof window !== 'undefined';
const isExpoWebDev = isWeb && window.location.port === '19006';
const runtimeProcess = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};
const apiBaseUrl =
  runtimeProcess.process?.env?.EXPO_PUBLIC_API_BASE_URL ||
  (isExpoWebDev ? 'http://localhost:8080' : '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers || {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data as T;
}

export function getPublishedManagedArticles() {
  return request<{ articles: DisplayArticle[] }>('/api/articles');
}

export function getAdminSession() {
  return request<{ authenticated: boolean; configured: boolean; admin?: AdminUser }>('/api/admin/session');
}

export function loginAdmin(email: string, password: string) {
  return request<{ authenticated: boolean; admin: AdminUser }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logoutAdmin() {
  return request<void>('/api/admin/logout', { method: 'POST' });
}

export function getAdminArticles() {
  return request<{ articles: DisplayArticle[] }>('/api/admin/articles');
}

export function createAdminArticle(payload: ArticleInput) {
  return request<{ article: DisplayArticle }>('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminArticle(id: string, payload: ArticleInput) {
  return request<{ article: DisplayArticle }>(`/api/admin/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminArticle(id: string) {
  return request<void>(`/api/admin/articles/${id}`, {
    method: 'DELETE',
  });
}

export function uploadAdminMarkdown(formData: FormData) {
  return request<{ article: DisplayArticle }>('/api/admin/articles/upload', {
    method: 'POST',
    body: formData,
  });
}

interface MarkdownImportPayload {
  markdown: string;
  status: ManagedArticleStatus;
  title?: string;
  summary?: string;
  author?: string;
  category?: string;
  tags?: string;
  emoji?: string;
  readTime?: string;
  canonicalUrl?: string;
  coverImage?: string;
  series?: string;
}

export function importAdminMarkdown(payload: MarkdownImportPayload) {
  return request<{ article: DisplayArticle }>('/api/admin/articles/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
