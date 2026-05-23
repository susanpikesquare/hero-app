import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import {
  MaxContentWidth,
  Radius,
  ReadableContentWidth,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { articleBySlug } from '@/lib/articles';

export default function ArticleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ slug: string }>();
  const article = params.slug ? articleBySlug(params.slug) : null;

  if (!article) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background, padding: Spacing.four },
        ]}
      >
        <ThemedText type="default" themeColor="textSecondary">
          Couldn’t find that article.
        </ThemedText>
        <View style={{ height: Spacing.three }} />
        <BrandButton
          label="Browse all articles"
          onPress={() => router.replace('/app/articles')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <BrandLogo height={96} />
            <BrandButton
              variant="ghost"
              label="← All articles"
              onPress={() => router.replace('/app/articles')}
            />
          </View>

          <View style={styles.header}>
            <BrandHeading
              level="eyebrow"
              themeColor="accent"
              style={{ textTransform: 'uppercase', letterSpacing: 1 }}
            >
              {article.eyebrow}
            </BrandHeading>
            <BrandHeading level="display" style={styles.title}>
              {article.title}
            </BrandHeading>
          </View>

          <View style={styles.body}>
            {article.intro.map((p, i) => (
              <ThemedText
                key={`intro-${i}`}
                type="default"
                themeColor="text"
                style={styles.paragraph}
              >
                {p}
              </ThemedText>
            ))}

            {article.sections.map((section, sIdx) => (
              <View key={`s-${sIdx}`} style={styles.section}>
                <BrandHeading level="h2" style={styles.sectionHeading}>
                  {section.heading}
                </BrandHeading>
                {section.paragraphs.map((p, pIdx) => (
                  <ThemedText
                    key={`s-${sIdx}-p-${pIdx}`}
                    type="default"
                    themeColor="text"
                    style={styles.paragraph}
                  >
                    {p}
                  </ThemedText>
                ))}
              </View>
            ))}

            <View
              style={[
                styles.takeaway,
                { backgroundColor: theme.accentSoft, borderColor: theme.border },
              ]}
            >
              <BrandHeading
                level="eyebrow"
                themeColor="accent"
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Takeaway
              </BrandHeading>
              <ThemedText
                type="default"
                themeColor="text"
                style={[styles.paragraph, { marginTop: Spacing.one }]}
              >
                {article.takeaway}
              </ThemedText>
            </View>
          </View>

          <View style={styles.footer}>
            <BrandButton
              variant="ghost"
              label="← Back to all articles"
              onPress={() => router.replace('/app/articles')}
            />
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { width: '100%', alignItems: 'center' },
  page: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.eight,
    gap: Spacing.five,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  header: { gap: Spacing.two, maxWidth: ReadableContentWidth + Spacing.seven },
  title: { marginTop: Spacing.one },
  body: {
    maxWidth: ReadableContentWidth,
    gap: Spacing.three,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 28,
  },
  section: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  sectionHeading: {
    marginBottom: Spacing.one,
  },
  takeaway: {
    marginTop: Spacing.four,
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.one,
  },
  footer: {
    marginTop: Spacing.three,
    alignItems: 'flex-start',
  },
});
