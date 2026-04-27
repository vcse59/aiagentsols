import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Article } from '../data/articles';

interface ArticleCardProps {
  article: Article;
  onPress: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  LLMs: '#6C63FF',
  'Image AI': '#F59E0B',
  Agents: '#10B981',
  Techniques: '#3B82F6',
  Ethics: '#EF4444',
  Tools: '#8B5CF6',
};

export default function ArticleCard({ article, onPress }: ArticleCardProps) {
  const categoryColor = CATEGORY_COLORS[article.category] ?? '#6C63FF';

  return (
    <TouchableOpacity
      style={[styles.card, { borderTopColor: categoryColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {article.coverImage ? (
        <Image source={{ uri: article.coverImage }} style={styles.coverImage} resizeMode="cover" />
      ) : null}

      {/* Top row: emoji + category badge + arrow */}
      <View style={styles.topRow}>
        <View style={[styles.emojiContainer, { backgroundColor: `${categoryColor}15` }]}>
          <Text style={styles.emoji}>{article.emoji}</Text>
        </View>
        <View style={styles.topRowRight}>
          <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}12`, borderColor: `${categoryColor}30` }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>{article.category}</Text>
          </View>
          <View style={[styles.arrowCircle, { backgroundColor: `${categoryColor}10` }]}>
            <Text style={[styles.arrow, { color: categoryColor }]}>›</Text>
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {article.title}
      </Text>

      {/* Summary */}
      <Text style={styles.summary} numberOfLines={3}>
        {article.summary}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.authorChip}>
          <Text style={styles.author}>{article.author}</Text>
        </View>
        <View style={styles.metaRight}>
          <Text style={styles.meta}>⏱ {article.readTime}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.meta}>{article.date}</Text>
        </View>
      </View>

      {/* Tags */}
      {(article.series || article.tags.length > 0) ? (
        <View style={styles.tagsRow}>
          {article.series ? (
            <View style={styles.seriesTag}>
              <Text style={styles.seriesTagText}>📚 {article.series}</Text>
            </View>
          ) : null}
          {article.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderTopWidth: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: '#F1F5F9',
    borderRightColor: '#F1F5F9',
    borderBottomColor: '#F1F5F9',
  },
  coverImage: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  summary: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  authorChip: {
    flex: 1,
  },
  author: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metaDot: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  seriesTag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  seriesTagText: {
    fontSize: 11,
    color: '#4338CA',
    fontWeight: '700',
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});
