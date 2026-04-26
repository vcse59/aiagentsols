import type { DisplayArticle } from './articles';

export type RootStackParamList = {
  Articles: undefined;
  ArticleDetail: { article: DisplayArticle };
  AdminLogin: undefined;
  AdminEditor: undefined;
};
