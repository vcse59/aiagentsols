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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

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

  // ── Inline markdown: **bold**, *italic*, `code`, [link](url) ──────────────
  const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*(.+?)\*)/g;
    let lastIndex = 0;
    let inlineKey = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      if (match[2] !== undefined) {
        parts.push(<Text key={inlineKey++} style={styles.bold}>{match[2]}</Text>);
      } else if (match[3] !== undefined) {
        parts.push(<Text key={inlineKey++} style={styles.inlineCode}>{match[3]}</Text>);
      } else if (match[4] !== undefined && match[5] !== undefined) {
        const linkUrl = match[5];
        parts.push(
          <Text key={inlineKey++} style={styles.link} onPress={() => { void Linking.openURL(linkUrl); }}>
            {match[4]}
          </Text>
        );
      } else if (match[6] !== undefined) {
        parts.push(<Text key={inlineKey++} style={styles.italic}>{match[6]}</Text>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length > 0 ? parts : [text];
  };

  // ── Block-level markdown renderer ─────────────────────────────────────────
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeBlockLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // ── Fenced code block ──────────────────────────────────────────────────
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLines = [];
          codeBlockLang = line.slice(3).trim();
        } else {
          inCodeBlock = false;
          const codeContent = codeBlockLines.join('\n');
          elements.push(
            <View key={key++} style={styles.codeBlockWrapper}>
              {codeBlockLang ? (
                <View style={styles.codeBlockHeader}>
                  <View style={styles.codeBlockDots}>
                    <View style={[styles.dot, { backgroundColor: '#FF5F57' }]} />
                    <View style={[styles.dot, { backgroundColor: '#FEBC2E' }]} />
                    <View style={[styles.dot, { backgroundColor: '#28C840' }]} />
                  </View>
                  <Text style={styles.codeBlockLang}>{codeBlockLang}</Text>
                </View>
              ) : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{codeContent}</Text>
                </View>
              </ScrollView>
            </View>
          );
          codeBlockLines = [];
          codeBlockLang = '';
        }
        continue;
      }

      if (inCodeBlock) { codeBlockLines.push(line); continue; }

      // ── Block elements ─────────────────────────────────────────────────────
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        elements.push(<View key={key++} style={styles.horizontalRule} />);

      } else if (line.startsWith('# ')) {
        elements.push(
          <Text key={key++} style={styles.heading1}>
            {renderInlineMarkdown(line.replace(/^# /, ''))}
          </Text>
        );

      } else if (line.startsWith('## ')) {
        elements.push(
          <View key={key++} style={styles.heading2Wrap}>
            <View style={[styles.heading2Accent, { backgroundColor: categoryColor }]} />
            <Text style={styles.heading2}>{renderInlineMarkdown(line.replace(/^## /, ''))}</Text>
          </View>
        );

      } else if (line.startsWith('### ')) {
        elements.push(
          <Text key={key++} style={styles.heading3}>
            {renderInlineMarkdown(line.replace(/^### /, ''))}
          </Text>
        );

      } else if (line.startsWith('#### ')) {
        elements.push(
          <Text key={key++} style={styles.heading4}>
            {renderInlineMarkdown(line.replace(/^#### /, ''))}
          </Text>
        );

      } else if (line.startsWith('> ')) {
        // Blockquote
        elements.push(
          <View key={key++} style={[styles.blockquote, { borderLeftColor: categoryColor }]}>
            <Text style={styles.blockquoteText}>{renderInlineMarkdown(line.slice(2))}</Text>
          </View>
        );

      } else if (line.startsWith('| ')) {
        // Table
        const cells = line.split('|').filter((c) => c.trim() !== '').map((c) => c.trim());
        const isHeader = i > 0 && lines[i - 1]?.startsWith('|');
        const isSeparator = cells.every((c) => /^[-:]+$/.test(c));
        if (!isSeparator) {
          elements.push(
            <View key={key++} style={[styles.tableRow, isHeader && styles.tableHeaderRow]}>
              {cells.map((cell, ci) => (
                <Text key={ci} style={[styles.tableCell, isHeader && styles.tableHeaderCell]} numberOfLines={2}>
                  {cell}
                </Text>
              ))}
            </View>
          );
        }

      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const rawText = line.replace(/^[-*] /, '');
        const isChecked = /^\[x\] /i.test(rawText);
        const isUnchecked = /^\[ \] /.test(rawText);
        if (isChecked || isUnchecked) {
          const taskText = rawText.replace(/^\[.?\] /, '');
          elements.push(
            <View key={key++} style={styles.bulletRow}>
              <Text style={[styles.checkboxIcon, { color: categoryColor }]}>{isChecked ? '☑' : '☐'}</Text>
              <Text style={[styles.bulletText, isChecked && styles.checkedText]}>{renderInlineMarkdown(taskText)}</Text>
            </View>
          );
        } else {
          elements.push(
            <View key={key++} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: categoryColor }]} />
              <Text style={styles.bulletText}>{renderInlineMarkdown(rawText)}</Text>
            </View>
          );
        }

      } else if (/^\d+\. /.test(line)) {
        const num = line.match(/^(\d+)\. /)?.[1] ?? '';
        elements.push(
          <View key={key++} style={styles.bulletRow}>
            <Text style={[styles.bulletNum, { color: categoryColor }]}>{num}.</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Nav bar ─────────────────────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <View style={styles.backButtonInner}>
            <Text style={styles.backIcon}>←</Text>
          </View>
          <Text style={styles.backLabel}>Articles</Text>
        </TouchableOpacity>
        <View style={[styles.navCategoryBadge, { backgroundColor: `${categoryColor}15` }]}>
          <Text style={[styles.navCategoryText, { color: categoryColor }]}>{article.category}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Cover image (full bleed) ───────────────────────────────────────── */}
        {article.coverImage ? (
          <Image source={{ uri: article.coverImage }} style={styles.coverImage} resizeMode="cover" />
        ) : null}

        {/* ── Article header ─────────────────────────────────────────────────── */}
        <View style={styles.articleHeader}>

          {/* Emoji hero — only when no cover image */}
          {!article.coverImage ? (
            <View style={[styles.emojiHero, { backgroundColor: `${categoryColor}12` }]}>
              <Text style={styles.emojiHeroText}>{article.emoji}</Text>
            </View>
          ) : null}

          {/* Category + series badges */}
          <View style={styles.headerBadges}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>{article.category}</Text>
            </View>
            {article.series ? (
              <View style={styles.seriesChip}>
                <Text style={styles.seriesChipText}>📚 {article.series}</Text>
              </View>
            ) : null}
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Lead / summary */}
          <Text style={styles.summary}>{article.summary}</Text>

          {/* Author row */}
          <View style={styles.authorRow}>
            <View style={[styles.authorAvatar, { backgroundColor: `${categoryColor}20` }]}>
              <Text style={[styles.authorInitial, { color: categoryColor }]}>
                {article.author.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{article.author}</Text>
              <Text style={styles.articleMeta}>{article.date} · {article.readTime}</Text>
            </View>
          </View>

          {/* Tags */}
          {article.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {article.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Canonical link */}
          {article.canonicalUrl ? (
            <TouchableOpacity
              style={styles.canonicalLink}
              onPress={() => { void Linking.openURL(article.canonicalUrl as string); }}
              activeOpacity={0.8}
            >
              <Text style={styles.canonicalLinkText}>🔗 Read original on Dev.to</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Section divider ─────────────────────────────────────────────────── */}
        <View style={styles.contentDivider}>
          <View style={[styles.contentDividerLine, { backgroundColor: categoryColor }]} />
        </View>

        {/* ── Article content ─────────────────────────────────────────────────── */}
        <View style={styles.contentContainer}>
          {renderContent(article.content)}
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <View style={styles.articleFooter}>
          <View style={[styles.footerAvatar, { backgroundColor: `${categoryColor}20` }]}>
            <Text style={[styles.footerAvatarText, { color: categoryColor }]}>
              {article.author.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.footerAuthorName}>{article.author}</Text>
          <Text style={styles.footerRole}>Article Author</Text>
          <TouchableOpacity
            style={[styles.backToListButton, { borderColor: `${categoryColor}50`, backgroundColor: `${categoryColor}10` }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={[styles.backToListText, { color: categoryColor }]}>← Back to Articles</Text>
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

  // ── Not found ────────────────────────────────────────────────────────────
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  notFoundEmoji: { fontSize: 56, marginBottom: Spacing.lg },
  notFoundText: { ...Typography.h2, color: Colors.textSecondary, marginBottom: Spacing.xl },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    ...Shadow.md,
  },
  backBtnText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: 15 },

  // ── Nav bar ──────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
    paddingRight: Spacing.md,
  },
  backButtonInner: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { fontSize: 15, color: Colors.primary, fontWeight: '700' },
  backLabel: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  navCategoryBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  navCategoryText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 64 },

  // ── Cover image ──────────────────────────────────────────────────────────
  coverImage: {
    width: '100%',
    height: 240,
  },

  // ── Article header ───────────────────────────────────────────────────────
  articleHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  emojiHero: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emojiHeroText: { fontSize: 34 },

  headerBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  seriesChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  seriesChipText: { fontSize: 12, color: '#4338CA', fontWeight: '600' },

  title: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 42,
    marginBottom: Spacing.lg,
  },
  summary: {
    fontSize: 18,
    color: Colors.textMuted,
    lineHeight: 29,
    marginBottom: Spacing.xl,
    fontWeight: '400',
  },

  // Author row
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  authorAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitial: { fontSize: 22, fontWeight: '900' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  articleMeta: { fontSize: 13, color: Colors.textFaint },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tag: {
    backgroundColor: Colors.surfaceDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },

  // Canonical link
  canonicalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
  },
  canonicalLinkText: { color: Colors.info, fontSize: 13, fontWeight: '600' },

  // ── Content divider ──────────────────────────────────────────────────────
  contentDivider: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  contentDividerLine: {
    height: 3,
    borderRadius: Radius.full,
    width: 48,
  },

  // ── Content container ─────────────────────────────────────────────────────
  contentContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  // ── Heading styles ────────────────────────────────────────────────────────
  heading1: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 40,
    marginBottom: Spacing.md,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  heading2Wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 36,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  heading2Accent: {
    width: 5,
    borderRadius: Radius.full,
    marginTop: 3,
    height: 26,
  },
  heading2: {
    flex: 1,
    fontSize: 23,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.sm,
    lineHeight: 25,
  },
  heading4: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },

  // ── Body text ─────────────────────────────────────────────────────────────
  paragraph: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 27,
    marginBottom: 14,
  },
  spacer: { height: 10 },

  // ── Inline styles ─────────────────────────────────────────────────────────
  bold: { fontWeight: '700', color: '#1e293b' },
  italic: { fontStyle: 'italic', color: '#475569' },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    backgroundColor: '#F1F5F9',
    color: '#B91C1C',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  // ── Bullet / numbered lists ───────────────────────────────────────────────
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    marginTop: 9,
    marginRight: 12,
    flexShrink: 0,
  },
  bulletNum: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 10,
    marginTop: 1,
    minWidth: 22,
    textAlign: 'right',
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
  },
  checkboxIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
    marginTop: 2,
    width: 22,
    flexShrink: 0,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: Colors.textFaint,
  },

  // ── Blockquote ────────────────────────────────────────────────────────────
  blockquote: {
    borderLeftWidth: 4,
    borderRadius: Radius.sm,
    paddingLeft: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.md,
    backgroundColor: Colors.surfaceDim,
  },
  blockquoteText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 26,
  },

  // ── Code block ───────────────────────────────────────────────────────────
  codeBlockWrapper: {
    marginVertical: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  codeBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
  },
  codeBlockDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  codeBlockLang: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'lowercase',
  },
  codeBlock: {
    padding: Spacing.lg,
    minWidth: '100%',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 22,
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMuted,
    paddingVertical: Spacing.sm,
  },
  tableHeaderRow: { backgroundColor: Colors.surfaceDim },
  tableCell: { flex: 1, fontSize: 13, color: Colors.textSecondary, paddingHorizontal: 4 },
  tableHeaderCell: { fontWeight: '700', color: Colors.textPrimary },

  // ── Horizontal rule ───────────────────────────────────────────────────────
  horizontalRule: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xl,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  articleFooter: {
    marginTop: Spacing['3xl'],
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
    padding: Spacing['2xl'],
    backgroundColor: Colors.surfaceDim,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  footerAvatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  footerAvatarText: { fontSize: 24, fontWeight: '800' },
  footerAuthorName: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  footerRole: {
    ...Typography.bodyXs,
    color: Colors.textFaint,
    marginBottom: Spacing.xl,
  },
  backToListButton: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  backToListText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
