import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Top row: emoji + category badge */}
      <View style={styles.topRow}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{article.emoji}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}18` }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>{article.category}</Text>
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
        <Text style={styles.author}>{article.author}</Text>
        <View style={styles.metaRight}>
          <Text style={styles.meta}>🕐 {article.readTime}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.meta}>{article.date}</Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {article.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 8,
  },
  summary: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  author: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metaDot: {
    fontSize: 11,
    color: '#9CA3AF',
    marginHorizontal: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});
