export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  emoji: string;
  tags: string[];
  canonicalUrl?: string;
  coverImage?: string;
  series?: string;
}

export const CATEGORIES = ['All', 'LLMs', 'Image AI', 'Agents', 'Techniques', 'Ethics', 'Tools'];

export const ARTICLES: Article[] = [];
