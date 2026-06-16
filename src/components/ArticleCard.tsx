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
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Category accent line */}
      <View style={[styles.accentLine, { backgroundColor: categoryColor }]} />

      {article.coverImage ? (
        <Image source={{ uri: article.coverImage }} style={styles.coverImage} resizeMode="cover" />
      ) : null}

      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.emojiWrap, { backgroundColor: `${categoryColor}15` }]}>
          <Text style={styles.emoji}>{article.emoji}</Text>
        </View>
        <View style={styles.topRowRight}>
          <View style={[styles.categoryPill, { backgroundColor: `${categoryColor}12` }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>{article.category}</Text>
          </View>
          <View style={styles.arrowWrap}>
            <Text style={[styles.arrowIcon, { color: categoryColor }]}>→</Text>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  accentLine: {
    height: 3,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
    width: 36,
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
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  categoryPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  arrowWrap: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: '500',
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  summary: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginBottom: Spacing.sm,
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
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  seriesTagText: {
    fontSize: 11,
    color: '#4338CA',
    fontWeight: '600',
  },
  tag: {
    backgroundColor: Colors.surfaceDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
