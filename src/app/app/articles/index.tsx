import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { ARTICLES } from '@/lib/articles';

export default function ArticlesIndexScreen() {
  const theme = useTheme();
  const router = useRouter();

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
              label="← Dashboard"
              onPress={() => router.replace('/app')}
            />
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              For parents
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              Coaching, by age.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              Short articles to help you set expectations with confidence —
              what to expect at each age, the boundaries that build security,
              and why connection beats correction every single time.
            </ThemedText>
          </View>

          <View style={styles.list}>
            {ARTICLES.map((a) => (
              <Pressable
                key={a.slug}
                onPress={() => router.push(`/app/articles/${a.slug}`)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: pressed
                      ? theme.backgroundSelected
                      : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor="accent"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  {a.eyebrow}
                </ThemedText>
                <BrandHeading level="h2" style={styles.cardTitle}>
                  {a.title}
                </BrandHeading>
                <ThemedText
                  type="default"
                  themeColor="textSecondary"
                  style={{ lineHeight: 26 }}
                >
                  {a.blurb}
                </ThemedText>
                <ThemedText
                  type="small"
                  themeColor="info"
                  style={{ textDecorationLine: 'underline', marginTop: Spacing.one }}
                >
                  Read →
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  lead: { maxWidth: ReadableContentWidth, fontSize: 17, lineHeight: 28 },
  list: { gap: Spacing.three },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.two,
  },
  cardTitle: { marginTop: Spacing.one, marginBottom: Spacing.one },
});
