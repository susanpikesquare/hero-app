/**
 * Public legal page shell. Renders Privacy / Terms from a structured
 * data object so the layout and review banner stay consistent.
 */

import { useRouter } from 'expo-router';
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
import { EFFECTIVE_DATE, REVIEW_BANNER } from '@/lib/legal-content';

type Section = { heading: string; paragraphs: string[] };

type Props = {
  title: string;
  intro: string[];
  sections: Section[];
};

export function LegalShell({ title, intro, sections }: Props) {
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
            <BrandLogo height={64} />
            <BrandButton
              variant="ghost"
              label="← Home"
              onPress={() => router.replace('/')}
            />
          </View>

          <View
            style={[
              styles.banner,
              { backgroundColor: '#F3E8D6', borderColor: '#D6B98E' },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{
                color: '#8A5A1F',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Draft — please review with counsel
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: '#8A5A1F', marginTop: 4, lineHeight: 20 }}
            >
              {REVIEW_BANNER}
            </ThemedText>
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              Effective {EFFECTIVE_DATE}
            </BrandHeading>
            <BrandHeading level="display" style={styles.title}>
              {title}
            </BrandHeading>
          </View>

          <View style={styles.body}>
            {intro.map((p, i) => (
              <ThemedText
                key={`intro-${i}`}
                type="default"
                themeColor="text"
                style={styles.paragraph}
              >
                {p}
              </ThemedText>
            ))}

            {sections.map((s, si) => (
              <View key={`s-${si}`} style={styles.section}>
                <BrandHeading level="h2" style={styles.sectionHeading}>
                  {s.heading}
                </BrandHeading>
                {s.paragraphs.map((p, pi) => (
                  <ThemedText
                    key={`s-${si}-p-${pi}`}
                    type="default"
                    themeColor="text"
                    style={styles.paragraph}
                  >
                    {p}
                  </ThemedText>
                ))}
              </View>
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
  banner: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  header: { gap: Spacing.two, maxWidth: ReadableContentWidth + Spacing.seven },
  title: { marginTop: Spacing.one },
  body: { maxWidth: ReadableContentWidth, gap: Spacing.three },
  paragraph: { fontSize: 17, lineHeight: 28 },
  section: { marginTop: Spacing.four, gap: Spacing.two },
  sectionHeading: { marginBottom: Spacing.one },
});
