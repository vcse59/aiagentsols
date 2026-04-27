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

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

const CATEGORY_COLORS: Record<string, string> = {
  LLMs: '#6C63FF',
  'Image AI': '#F59E0B',
  Agents: '#10B981',
  Techniques: '#3B82F6',
  Ethics: '#EF4444',
  Tools: '#8B5CF6',
};

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

  const categoryColor = CATEGORY_COLORS[article.category] ?? '#6C63FF';

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
          colors={['#F8F7FF', '#FFFFFF']}
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
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 12,
  },
  backButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '700',
  },
  backLabel: {
    fontSize: 15,
    color: '#6C63FF',
    fontWeight: '600',
  },
  navCategoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
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
    paddingBottom: 48,
  },
  articleHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  emojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emoji: {
    fontSize: 30,
  },
  coverImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  summary: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  authorChip: {
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  authorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C63FF',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statItem: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  statDivider: {
    fontSize: 13,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  seriesChip: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seriesChipText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '700',
  },
  canonicalLink: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  canonicalLinkText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 28,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 26,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 15,
    color: '#6C63FF',
    marginRight: 10,
    marginTop: 2,
    width: 18,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  tableHeaderRow: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontWeight: '700',
    color: '#111827',
  },
  spacer: {
    height: 10,
  },
  articleFooter: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: '#F8F7FF',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FF',
  },
  footerText: {
    fontSize: 14,
    color: '#6C63FF',
    marginBottom: 18,
    fontWeight: '600',
  },
  backToListButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  backToListText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
