import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Article } from '../data/articles';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

interface ArticleCardProps {
  article: Article;
  onPress: () => void;
}

export default function ArticleCard({ article, onPress }: ArticleCardProps) {
  const categoryColor = Colors.categories[article.category] ?? Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: categoryColor }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {article.coverImage ? (
        <Image source={{ uri: article.coverImage }} style={styles.coverImage} resizeMode="cover" />
      ) : null}

      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.emojiWrap, { backgroundColor: `${categoryColor}18` }]}>
          <Text style={styles.emoji}>{article.emoji}</Text>
        </View>
        <View style={styles.topRowRight}>
          <View style={[styles.categoryPill, { backgroundColor: `${categoryColor}14`, borderColor: `${categoryColor}38` }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>{article.category}</Text>
          </View>
          <View style={[styles.arrowWrap, { backgroundColor: `${categoryColor}12` }]}>
            <Text style={[styles.arrowIcon, { color: categoryColor }]}>›</Text>
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{article.title}</Text>

      {/* Summary */}
      <Text style={styles.summary} numberOfLines={3}>{article.summary}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.author} numberOfLines={1}>{article.author}</Text>
        <View style={styles.metaGroup}>
          <Text style={styles.metaText}>⏱ {article.readTime}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{article.date}</Text>
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
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: Colors.borderLight,
    borderRightColor: Colors.borderLight,
    borderBottomColor: Colors.borderLight,
    ...Shadow.md,
  },
  coverImage: {
    width: '100%',
    height: 164,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  categoryPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  arrowWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  summary: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderMuted,
    marginBottom: Spacing.md,
  },
  author: {
    ...Typography.labelMd,
    color: Colors.textSecondary,
    flex: 1,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...Typography.bodyXs,
    color: Colors.textFaint,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.borderMuted,
    marginHorizontal: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  seriesTag: {
    backgroundColor: '#EEF2FF',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  seriesTagText: {
    fontSize: 11,
    color: '#4338CA',
    fontWeight: '700',
  },
  tag: {
    backgroundColor: Colors.surfaceDim,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
