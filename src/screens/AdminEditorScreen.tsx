import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CATEGORIES } from '../data/articles';
import { useAuth } from '../context/AuthContext';
import {
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticles,
  importAdminMarkdown,
  updateAdminArticle,
  uploadAdminMarkdown,
} from '../lib/api';
import { RootStackParamList } from '../types/navigation';
import type { ArticleInput, DisplayArticle, ManagedArticleStatus } from '../types/articles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminEditor'>;

type FormState = {
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  tags: string;
  emoji: string;
  readTime: string;
  canonicalUrl: string;
  coverImage: string;
  series: string;
};

const initialFormState: FormState = {
  title: '',
  summary: '',
  content: '',
  author: 'Admin',
  category: 'Tools',
  tags: '',
  emoji: '📝',
  readTime: '',
  canonicalUrl: '',
  coverImage: '',
  series: '',
};

function toFormState(article?: DisplayArticle): FormState {
  if (!article) {
    return initialFormState;
  }

  return {
    title: article.title,
    summary: article.summary,
    content: article.content,
    author: article.author,
    category: article.category,
    tags: article.tags.join(', '),
    emoji: article.emoji,
    readTime: article.readTime,
    canonicalUrl: article.canonicalUrl || '',
    coverImage: article.coverImage || '',
    series: article.series || '',
  };
}

function toPayload(form: FormState, status: ManagedArticleStatus): ArticleInput {
  return {
    title: form.title.trim(),
    summary: form.summary.trim(),
    content: form.content,
    author: form.author.trim(),
    category: form.category,
    tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    emoji: form.emoji.trim() || '📝',
    readTime: form.readTime.trim(),
    status,
    canonicalUrl: form.canonicalUrl.trim(),
    coverImage: form.coverImage.trim(),
    series: form.series.trim(),
  };
}

export default function AdminEditorScreen({ navigation }: Props) {
  const { admin, isInitializing, signOut } = useAuth();
  const [articles, setArticles] = useState<DisplayArticle[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [markdownImportText, setMarkdownImportText] = useState('');

  const loadArticles = useCallback(async () => {
    if (!admin) {
      return;
    }

    setError('');
    try {
      const response = await getAdminArticles();
      setArticles(response.articles);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin articles.');
    }
  }, [admin]);

  useFocusEffect(
    useCallback(() => {
      void loadArticles();
    }, [loadArticles])
  );

  const selectedArticle = useMemo(
    () => articles.find((article) => article.id === selectedArticleId),
    [articles, selectedArticleId]
  );

  React.useEffect(() => {
    if (!isInitializing && !admin) {
      navigation.replace('AdminLogin');
    }
  }, [admin, isInitializing, navigation]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetEditor = () => {
    setSelectedArticleId(null);
    setForm(initialFormState);
    setError('');
    setSuccessMessage('');
  };

  const selectArticle = (article: DisplayArticle) => {
    setSelectedArticleId(article.id);
    setForm(toFormState(article));
    setError('');
    setSuccessMessage(`Loaded ${article.title}`);
  };

  const saveArticle = async (status: ManagedArticleStatus) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = toPayload(form, status);
      const response = selectedArticleId
        ? await updateAdminArticle(selectedArticleId, payload)
        : await createAdminArticle(payload);

      setSelectedArticleId(response.article.id);
      setForm(toFormState(response.article));
      setSuccessMessage(status === 'published' ? 'Article published successfully.' : 'Draft saved successfully.');
      await loadArticles();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save article.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadMarkdown = async (status: ManagedArticleStatus) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      setError('Markdown upload is currently available on web only.');
      return;
    }

    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = '.md,text/markdown';

    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('status', status);
      formData.append('author', form.author.trim() || 'Admin');
      formData.append('category', form.category);
      formData.append('emoji', form.emoji.trim() || '📝');
      formData.append('tags', form.tags);
      formData.append('canonicalUrl', form.canonicalUrl.trim());
      formData.append('coverImage', form.coverImage.trim());
      formData.append('series', form.series.trim());

      setIsUploading(true);
      setError('');
      setSuccessMessage('');

      try {
        const response = await uploadAdminMarkdown(formData);
        setSelectedArticleId(response.article.id);
        setForm(toFormState(response.article));
        setSuccessMessage(status === 'published' ? 'Markdown uploaded and published.' : 'Markdown uploaded as a draft.');
        await loadArticles();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload markdown file.');
      } finally {
        setIsUploading(false);
      }
    };

    picker.click();
  };

  const importMarkdownText = async (status: ManagedArticleStatus) => {
    if (!markdownImportText.trim()) {
      setError('Paste markdown content before importing.');
      return;
    }

    setIsImporting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await importAdminMarkdown({
        markdown: markdownImportText,
        status,
        title: form.title.trim(),
        summary: form.summary.trim(),
        author: form.author.trim() || 'Admin',
        category: form.category,
        tags: form.tags,
        emoji: form.emoji.trim() || '📝',
        readTime: form.readTime.trim(),
        canonicalUrl: form.canonicalUrl.trim(),
        coverImage: form.coverImage.trim(),
        series: form.series.trim(),
      });
      setSelectedArticleId(response.article.id);
      setForm(toFormState(response.article));
      setSuccessMessage(status === 'published' ? 'Markdown imported and published.' : 'Markdown imported as draft.');
      await loadArticles();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import markdown content.');
    } finally {
      setIsImporting(false);
    }
  };

  const confirmDeleteArticle = () => {
    if (!selectedArticle) {
      return;
    }

    const message = `Delete "${selectedArticle.title}" permanently?`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(message)) {
        void deleteSelectedArticle();
      }
      return;
    }

    Alert.alert('Delete article', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteSelectedArticle();
        },
      },
    ]);
  };

  const deleteSelectedArticle = async () => {
    if (!selectedArticleId) {
      return;
    }

    setIsDeleting(true);
    setError('');
    setSuccessMessage('');

    try {
      await deleteAdminArticle(selectedArticleId);
      resetEditor();
      setSuccessMessage('Article deleted successfully.');
      await loadArticles();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete article.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.centeredState}>
        <ActivityIndicator size="large" color="#0E7490" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1E3A8A', '#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>Admin Workspace</Text>
          <Text style={styles.heroTitle}>Publish markdown articles without leaving the site.</Text>
          <Text style={styles.heroSubtitle}>
            Write in markdown, preserve Dev.to frontmatter fields, upload `.md` files, and publish in one flow.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Articles')}>
              <Text style={styles.secondaryButtonText}>View Site</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostButton}
              onPress={async () => {
                await signOut();
                navigation.replace('Articles');
              }}
            >
              <Text style={styles.ghostButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Managed Articles</Text>
            <TouchableOpacity style={styles.linkButton} onPress={resetEditor}>
              <Text style={styles.linkButtonText}>New Article</Text>
            </TouchableOpacity>
          </View>
          {articles.length === 0 ? (
            <Text style={styles.emptyText}>No admin-authored articles yet.</Text>
          ) : (
            articles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={[styles.articleRow, selectedArticleId === article.id && styles.articleRowActive]}
                onPress={() => selectArticle(article)}
              >
                <View style={styles.articleRowCopy}>
                  <Text style={styles.articleRowTitle}>{article.title}</Text>
                  <Text style={styles.articleRowMeta}>{article.author} · {article.date}</Text>
                </View>
                <View style={[styles.statusBadge, article.status === 'published' ? styles.statusPublished : styles.statusDraft]}>
                  <Text style={[styles.statusText, article.status === 'published' ? styles.statusTextPublished : styles.statusTextDraft]}>
                    {article.status || 'draft'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{selectedArticle ? 'Edit Article' : 'Write New Article'}</Text>
          <Text style={styles.editorHint}>Markdown is stored as the source of truth for each admin article.</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <View style={styles.inlineRow}>
            <View style={styles.flexField}>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={(value) => updateField('title', value)} />
            </View>
            <View style={styles.emojiField}>
              <Text style={styles.label}>Emoji</Text>
              <TextInput style={styles.input} value={form.emoji} onChangeText={(value) => updateField('emoji', value)} />
            </View>
          </View>

          <Text style={styles.label}>Summary</Text>
          <TextInput
            style={[styles.input, styles.multilineSmall]}
            multiline
            value={form.summary}
            onChangeText={(value) => updateField('summary', value)}
          />

          <View style={styles.inlineRow}>
            <View style={styles.flexField}>
              <Text style={styles.label}>Author</Text>
              <TextInput style={styles.input} value={form.author} onChangeText={(value) => updateField('author', value)} />
            </View>
            <View style={styles.flexField}>
              <Text style={styles.label}>Read Time</Text>
              <TextInput style={styles.input} value={form.readTime} onChangeText={(value) => updateField('readTime', value)} placeholder="8 min read" />
            </View>
          </View>

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORIES.filter((category) => category !== 'All').map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryChip, form.category === category && styles.categoryChipActive]}
                onPress={() => updateField('category', category)}
              >
                <Text style={[styles.categoryChipText, form.category === category && styles.categoryChipTextActive]}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Tags</Text>
          <TextInput style={styles.input} value={form.tags} onChangeText={(value) => updateField('tags', value)} placeholder="markdown, admin, publishing" />

          <Text style={styles.label}>Series (Dev.to)</Text>
          <TextInput
            style={styles.input}
            value={form.series}
            onChangeText={(value) => updateField('series', value)}
            placeholder="Building AI Agents"
          />

          <Text style={styles.label}>Cover Image URL (Dev.to cover_image)</Text>
          <TextInput
            style={styles.input}
            value={form.coverImage}
            onChangeText={(value) => updateField('coverImage', value)}
            placeholder="https://example.com/cover.png"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Canonical URL (Dev.to canonical_url)</Text>
          <TextInput
            style={styles.input}
            value={form.canonicalUrl}
            onChangeText={(value) => updateField('canonicalUrl', value)}
            placeholder="https://your-site.com/original-post"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Paste Markdown (Dev.to frontmatter supported)</Text>
          <TextInput
            style={[styles.input, styles.importInput]}
            multiline
            textAlignVertical="top"
            value={markdownImportText}
            onChangeText={setMarkdownImportText}
            placeholder="---\ntitle: Your title\ndescription: Summary\npublished: false\ntags: ai, agents\n---\n\n# Article"
          />

          <Text style={styles.label}>Markdown Content</Text>
          <TextInput
            style={[styles.input, styles.markdownInput]}
            multiline
            textAlignVertical="top"
            value={form.content}
            onChangeText={(value) => updateField('content', value)}
            placeholder="# Heading\n\nWrite your article in markdown..."
          />

          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => importMarkdownText('draft')} disabled={isImporting}>
              <Text style={styles.secondaryButtonText}>{isImporting ? 'Importing...' : 'Import Paste as Draft'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => importMarkdownText('published')} disabled={isImporting}>
              <Text style={styles.secondaryButtonText}>Import Paste and Publish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => uploadMarkdown('draft')} disabled={isUploading}>
              <Text style={styles.secondaryButtonText}>{isUploading ? 'Uploading...' : 'Upload as Draft'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => uploadMarkdown('published')} disabled={isUploading}>
              <Text style={styles.secondaryButtonText}>Upload and Publish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={() => saveArticle('draft')} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? 'Saving...' : 'Save Draft'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButtonDark} onPress={() => saveArticle('published')} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>Publish Article</Text>
            </TouchableOpacity>
            {selectedArticleId ? (
              <TouchableOpacity style={styles.destructiveButton} onPress={confirmDeleteArticle} disabled={isDeleting}>
                <Text style={styles.destructiveButtonText}>{isDeleting ? 'Deleting...' : 'Delete Article'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
  },
  content: {
    padding: 20,
    gap: 18,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E4FF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  linkButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDE9FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  linkButtonText: {
    color: '#6C63FF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E4FF',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FAFBFF',
  },
  articleRowActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F3FF',
  },
  articleRowCopy: {
    flex: 1,
  },
  articleRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  articleRowMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDraft: {
    backgroundColor: '#FFF7ED',
  },
  statusPublished: {
    backgroundColor: '#ECFDF3',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusTextDraft: {
    color: '#C2410C',
  },
  statusTextPublished: {
    color: '#15803D',
  },
  editorHint: {
    fontSize: 13,
    color: '#7B8794',
    marginBottom: 16,
  },
  errorText: {
    color: '#B42318',
    marginBottom: 12,
    fontWeight: '600',
  },
  successText: {
    color: '#067647',
    marginBottom: 12,
    fontWeight: '600',
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexField: {
    flex: 1,
  },
  emojiField: {
    width: 90,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#DDD8FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FAFBFF',
  },
  multilineSmall: {
    minHeight: 88,
  },
  markdownInput: {
    minHeight: 240,
  },
  importInput: {
    minHeight: 180,
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 4,
  },
  categoryChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#DDD8FF',
    backgroundColor: '#FAFBFF',
  },
  categoryChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  categoryChipText: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonDark: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: '#EDE9FF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 14,
  },
  destructiveButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  destructiveButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  ghostButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
