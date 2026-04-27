import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Shadow, Typography, GradientPresets } from '../theme';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ARTICLES, CATEGORIES } from '../data/articles';
import ArticleCard from '../components/ArticleCard';
import { getPublishedManagedArticles } from '../lib/api';
import { RootStackParamList } from '../types/navigation';
import type { DisplayArticle } from '../types/articles';

type Props = NativeStackScreenProps<RootStackParamList, 'Articles'>;

export default function ArticlesScreen({ navigation }: Props) {
  const { admin, isInitializing, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [managedArticles, setManagedArticles] = useState<DisplayArticle[]>([]);
  const [isLoadingManaged, setIsLoadingManaged] = useState(true);
  const [loadError, setLoadError] = useState('');

  const seedArticles = useMemo<DisplayArticle[]>(
    () => ARTICLES.map((article) => ({ ...article, source: 'seed' })),
    []
  );

  const refreshArticles = useCallback(async () => {
    setIsLoadingManaged(true);
    try {
      const response = await getPublishedManagedArticles();
      setManagedArticles(
        response.articles.map((article) => ({
          ...article,
          source: 'managed',
        }))
      );
      setLoadError('');
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Unable to load published admin articles.'
      );
    } finally {
      setIsLoadingManaged(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshArticles();
    }, [refreshArticles])
  );

  const allArticles = useMemo(() => [...managedArticles, ...seedArticles], [managedArticles, seedArticles]);

  const filteredArticles = useMemo<DisplayArticle[]>(() => {
    return allArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === 'All' || article.category === selectedCategory;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        (article.series || '').toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        article.author.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [allArticles, searchQuery, selectedCategory]);

  const handleArticlePress = (article: DisplayArticle) => {
    navigation.navigate('ArticleDetail', { article });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient
        colors={GradientPresets.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconWrap}>
                <Text style={styles.brandIcon}>🤖</Text>
              </View>
              <Text style={styles.brandName}>AI Agents Solutions</Text>
            </View>
            <Text style={styles.headerTitle}>Generative AI{'\n'}Knowledge Hub</Text>
          </View>
          <View style={styles.headerActions}>
            {admin ? (
              <>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => navigation.navigate('AdminEditor')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.manageButtonText}>✏️ Manage</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={() => { void signOut(); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => navigation.navigate('AdminLogin')}
                activeOpacity={0.85}
              >
                <Text style={styles.manageButtonText}>Admin Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {admin ? (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>✓ {admin.email}</Text>
          </View>
        ) : null}
      </LinearGradient>

      {loadError ? (
        <View style={styles.bannerWarning}>
          <Text style={styles.bannerWarningText}>⚠️ {loadError}</Text>
        </View>
      ) : null}

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles, topics, authors..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Article Count */}
      <View style={styles.resultBar}>
        <Text style={styles.resultText}>
          {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
          {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </Text>
      </View>

      {/* Articles List */}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleCard article={item} onPress={() => handleArticlePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isLoadingManaged && !isInitializing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#0F766E" />
              <Text style={styles.loadingText}>Loading published admin articles...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No articles found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or selecting a different category.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 28 : 0,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brandIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.overlayMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandIcon: {
    fontSize: 16,
  },
  brandName: {
    ...Typography.labelMd,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.2,
  },
  headerTitle: {
    ...Typography.displayMd,
    color: Colors.textOnPrimary,
    lineHeight: 34,
  },
  headerActions: {
    flexDirection: 'column',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  manageButton: {
    backgroundColor: Colors.overlayMedium,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  manageButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  signOutButton: {
    backgroundColor: Colors.overlayDark,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  signOutText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  adminBadge: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  adminBadgeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerWarning: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  bannerWarningText: {
    color: '#92400E',
    ...Typography.labelMd,
  },
  searchWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 13 : 8,
    ...Shadow.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  clearButton: {
    paddingLeft: Spacing.sm,
    paddingRight: 2,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  categoryWrapper: {
    marginTop: Spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
    ...Shadow.xs,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.sm,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoryChipTextActive: {
    color: Colors.textOnPrimary,
  },
  resultBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  resultText: {
    ...Typography.labelMd,
    color: Colors.textMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  loadingText: {
    ...Typography.labelMd,
    color: Colors.textMuted,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 48,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 72,
    paddingHorizontal: 36,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodySm,
    color: Colors.textFaint,
    textAlign: 'center',
  },
});
