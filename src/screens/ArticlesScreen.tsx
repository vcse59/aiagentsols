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
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <Text style={styles.brandIcon}>🤖</Text>
              <Text style={styles.brandName}>AI Agents Solutions</Text>
            </View>
            <Text style={styles.headerTitle}>Generative AI Knowledge Hub</Text>
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
                  onPress={() => {
                    void signOut();
                  }}
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
            <Text style={styles.adminBadgeText}>✓ Signed in as {admin.email}</Text>
          </View>
        ) : null}
      </LinearGradient>

      {loadError ? (
        <View style={styles.bannerWarning}>
          <Text style={styles.bannerWarningText}>{loadError}</Text>
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
    backgroundColor: '#F0F4FF',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  brandIcon: {
    fontSize: 18,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  manageButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutButton: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  signOutText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  adminBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  bannerWarningText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E4FF',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '400',
  },
  clearButton: {
    paddingLeft: 10,
    paddingRight: 2,
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
  },
  categoryWrapper: {
    marginTop: 14,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD8FF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C63FF',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  resultBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 21,
  },
});
