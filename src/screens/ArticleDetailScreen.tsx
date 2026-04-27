import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Colors, Typography, Spacing, Radius, Shadow, GradientPresets } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route, navigation }: Props) {
  const { article } = route.params;

  if (!article) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundEmoji}>😕</Text>
          <Text style={styles.notFoundText}>Article not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = Colors.categories[article.category] ?? Colors.primary;

  // Render the article content with basic markdown-like formatting
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('## ')) {
        elements.push(
          <Text key={key++} style={styles.heading2}>
            {line.replace('## ', '')}
          </Text>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <Text key={key++} style={styles.heading3}>
            {line.replace('### ', '')}
          </Text>
        );
      } else if (line.startsWith('| ')) {
        // Simple table row rendering
        const cells = line
          .split('|')
          .filter((c) => c.trim() !== '')
          .map((c) => c.trim());
        const isHeader = i > 0 && lines[i - 1]?.startsWith('|');
        const isSeparator = cells.every((c) => /^[-:]+$/.test(c));
        if (!isSeparator) {
          elements.push(
            <View key={key++} style={[styles.tableRow, isHeader && styles.tableHeaderRow]}>
              {cells.map((cell, ci) => (
                <Text
                  key={ci}
                  style={[styles.tableCell, isHeader && styles.tableHeaderCell]}
                  numberOfLines={2}
                >
                  {cell}
                </Text>
              ))}
            </View>
          );
        }
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <View key={key++} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{renderInlineMarkdown(line.replace(/^[-*] /, ''))}</Text>
          </View>
        );
      } else if (/^\d+\. /.test(line)) {
        const num = line.match(/^(\d+)\. /)?.[1] ?? '';
        elements.push(
          <View key={key++} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>{num}.</Text>
            <Text style={styles.bulletText}>{renderInlineMarkdown(line.replace(/^\d+\. /, ''))}</Text>
          </View>
        );
      } else if (line.trim() === '') {
        elements.push(<View key={key++} style={styles.spacer} />);
      } else {
        elements.push(
          <Text key={key++} style={styles.paragraph}>
            {renderInlineMarkdown(line)}
          </Text>
        );
      }
    }
    return elements;
  };

  // Handle **bold** inline markdown
  const renderInlineMarkdown = (text: string): string => {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <View style={styles.backButtonInner}>
            <Text style={styles.backIcon}>←</Text>
          </View>
          <Text style={styles.backLabel}>Articles</Text>
        </TouchableOpacity>
        <View style={[styles.navCategoryBadge, { backgroundColor: `${categoryColor}12`, borderColor: `${categoryColor}30` }]}>
          <Text style={[styles.navCategoryText, { color: categoryColor }]}>{article.category}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Header */}
        <LinearGradient
        colors={GradientPresets.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.articleHeader}
      >
          <View style={[styles.emojiContainer, { backgroundColor: `${categoryColor}15` }]}>
            <Text style={styles.emoji}>{article.emoji}</Text>
          </View>
          {article.coverImage ? (
            <Image source={{ uri: article.coverImage }} style={styles.coverImage} resizeMode="cover" />
          ) : null}
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.summary}>{article.summary}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.authorChip}>
              <Text style={styles.authorText}>{article.author}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statItem}>📅 {article.date}</Text>
            <Text style={styles.statDivider}>·</Text>
            <Text style={styles.statItem}>🕐 {article.readTime}</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {article.series ? (
              <View style={styles.seriesChip}>
                <Text style={styles.seriesChipText}>Series: {article.series}</Text>
              </View>
            ) : null}
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {article.canonicalUrl ? (
            <TouchableOpacity
              style={styles.canonicalLink}
              onPress={() => {
                void Linking.openURL(article.canonicalUrl as string);
              }}
            >
              <Text style={styles.canonicalLinkText}>🔗 View original article</Text>
            </TouchableOpacity>
          ) : null}
        </LinearGradient>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Article Content */}
        <View style={styles.contentContainer}>
          {renderContent(article.content)}
        </View>

        {/* Footer */}
        <View style={styles.articleFooter}>
          <Text style={styles.footerText}>✍️ Written by {article.author}</Text>
          <TouchableOpacity
            style={styles.backToListButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.backToListText}>← Back to Articles</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: Platform.OS === 'android' ? 28 : 0,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  notFoundEmoji: {
    fontSize: 56,
    marginBottom: Spacing.lg,
  },
  notFoundText: {
    ...Typography.h2,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    ...Shadow.md,
  },
  backBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    ...Shadow.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
    paddingRight: Spacing.md,
  },
  backButtonInner: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: '#EDE9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
  backLabel: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '700',
  },
  navCategoryBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderWidth: 1,
  },
  navCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 56,
  },
  articleHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
  },
  emojiContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emoji: {
    fontSize: 30,
  },
  coverImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.displayMd,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summary: {
    ...Typography.bodyLg,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  authorChip: {
    backgroundColor: '#EDE9FE',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  authorText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statItem: {
    ...Typography.bodyXs,
    color: Colors.textFaint,
  },
  statDivider: {
    fontSize: 13,
    color: Colors.borderMuted,
    marginHorizontal: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
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
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  seriesChip: {
    backgroundColor: '#EDE9FE',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  seriesChipText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '700',
  },
  canonicalLink: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
  },
  canonicalLinkText: {
    color: Colors.info,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 28,
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    ...Typography.bodyMd,
    color: '#334155',
    marginBottom: Spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 15,
    color: Colors.primary,
    marginRight: Spacing.sm,
    marginTop: 2,
    width: 18,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    ...Typography.bodyMd,
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMuted,
    paddingVertical: Spacing.sm,
  },
  tableHeaderRow: {
    backgroundColor: Colors.surfaceDim,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  spacer: {
    height: Spacing.sm,
  },
  articleFooter: {
    marginTop: 48,
    marginHorizontal: Spacing.xl,
    padding: Spacing['2xl'],
    backgroundColor: '#F8F7FF',
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FF',
  },
  footerText: {
    ...Typography.labelLg,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  backToListButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: 14,
    ...Shadow.md,
  },
  backToListText: {
    color: Colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
