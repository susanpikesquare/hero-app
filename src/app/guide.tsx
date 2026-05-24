/**
 * Customer-facing guide. Long-form, scrollable, branded. Linked from
 * the landing page footer so Susan can share the URL externally with
 * prospects, Erica, demo families, anyone evaluating the app.
 *
 * Content lives in src/lib/guide-content.ts. This file just renders it.
 *
 * The page is intentionally branded with the parent-facing design
 * tokens (sage / dusty-blue palette, serif headings, "clinical with
 * warmth" tone). It is NOT the bunny-mascot kid surface and never
 * shows kid-facing elements.
 */

import { Link, useRouter } from 'expo-router';
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
import {
  GUIDE_SECTIONS,
  GUIDE_TOC,
  GUIDE_UPDATED,
  type GuideBlock,
} from '@/lib/guide-content';

export default function GuideScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          {/* Nav bar — logo + back link */}
          <View style={styles.nav}>
            <BrandLogo height={64} />
            <BrandButton
              variant="ghost"
              label="← Home"
              onPress={() => router.replace('/')}
            />
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <BrandHeading level="eyebrow" themeColor="accent">
              Home Hero · Family Guide
            </BrandHeading>
            <BrandHeading level="display" style={styles.heroTitle}>
              The full guide to Home Hero.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.heroSub}
            >
              Everything you need to know about how the app works, who it’s
              for, and how to use it day to day. Written for parents,
              therapists, and anyone evaluating Home Hero for their family
              or practice.
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted">
              Last updated {GUIDE_UPDATED}
            </ThemedText>
          </View>

          {/* Table of contents */}
          <View
            style={[
              styles.tocCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="eyebrow" themeColor="info">
              What’s in this guide
            </BrandHeading>
            <View style={styles.tocList}>
              {GUIDE_TOC.map((entry, idx) => (
                <Link
                  key={entry.id}
                  href={`/guide#${entry.id}` as never}
                  style={[styles.tocItem, { color: theme.text }]}
                >
                  {String(idx + 1).padStart(2, '0')} · {entry.label}
                </Link>
              ))}
            </View>
          </View>

          {/* Sections */}
          {GUIDE_SECTIONS.map((section) => (
            <View key={section.id} nativeID={section.id} style={styles.section}>
              <BrandHeading level="eyebrow" themeColor="accent">
                {section.eyebrow}
              </BrandHeading>
              <BrandHeading level="h2" style={styles.sectionTitle}>
                {section.title}
              </BrandHeading>
              <View style={styles.blocks}>
                {section.blocks.map((block, i) => (
                  <BlockRenderer key={i} block={block} />
                ))}
              </View>
            </View>
          ))}

          {/* Footer CTA */}
          <View
            style={[
              styles.cta,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <BrandHeading level="h2" style={styles.ctaTitle}>
              Ready to set up your family?
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="text"
              style={styles.ctaBody}
            >
              v0 is invite-only while we work with our first cohort of
              founding families. Email info@homehero.co to request access.
            </ThemedText>
            <View style={styles.ctaActions}>
              <BrandButton
                label="Back to home"
                onPress={() => router.replace('/')}
              />
              <Link
                href="/privacy"
                style={[styles.ctaLink, { color: theme.info }]}
              >
                Read the privacy policy →
              </Link>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────────
// Block rendering. One small component per block type. Stays in this
// file because the renderer is a strict private partner of GuideScreen.
// ──────────────────────────────────────────────────────────────────

function BlockRenderer({ block }: { block: GuideBlock }) {
  const theme = useTheme();

  if (block.type === 'p') {
    return (
      <ThemedText
        type="default"
        themeColor="textSecondary"
        style={styles.paragraph}
      >
        {block.text}
      </ThemedText>
    );
  }

  if (block.type === 'h3') {
    return (
      <BrandHeading level="h3" style={styles.subheading}>
        {block.text}
      </BrandHeading>
    );
  }

  if (block.type === 'bullets') {
    return (
      <View style={styles.bullets}>
        {block.items.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <ThemedText
              type="default"
              themeColor="accent"
              style={styles.bulletDot}
            >
              ·
            </ThemedText>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.bulletText}
            >
              {item}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'steps') {
    return (
      <View style={styles.stepList}>
        {block.items.map((item) => (
          <View key={item.n} style={styles.stepRow}>
            <BrandHeading
              level="h3"
              themeColor="accent"
              style={styles.stepNumber}
            >
              {item.n}
            </BrandHeading>
            <View style={styles.stepBody}>
              <BrandHeading level="h3" style={styles.stepTitle}>
                {item.title}
              </BrandHeading>
              <ThemedText type="default" themeColor="textSecondary">
                {item.body}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'callout') {
    // Tone-driven palette. Defaults to accent (sage) when unspecified.
    const tone = block.tone ?? 'accent';
    const palette =
      tone === 'warm'
        ? {
            background: '#F4E6D6', // warm cream
            border: '#D9B98A',
            eyebrow: theme.accent,
          }
        : tone === 'info'
          ? {
              background: theme.infoSoft ?? '#E2EAF3',
              border: theme.info,
              eyebrow: theme.info,
            }
          : {
              background: theme.accentSoft,
              border: theme.accent,
              eyebrow: theme.accent,
            };
    return (
      <View
        style={[
          styles.callout,
          { backgroundColor: palette.background, borderColor: palette.border },
        ]}
      >
        {block.eyebrow && (
          <ThemedText
            type="smallBold"
            style={{
              color: palette.eyebrow,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {block.eyebrow}
          </ThemedText>
        )}
        {block.title && (
          <BrandHeading level="h3" style={styles.calloutTitle}>
            {block.title}
          </BrandHeading>
        )}
        <ThemedText
          type="default"
          themeColor="text"
          style={styles.calloutBody}
        >
          {block.body}
        </ThemedText>
        {block.lines && (
          <View style={styles.calloutLines}>
            {block.lines.map((line, i) => (
              <View key={i} style={styles.calloutLineRow}>
                <ThemedText
                  type="default"
                  themeColor="accent"
                  style={styles.calloutDot}
                >
                  ◆
                </ThemedText>
                <ThemedText
                  type="default"
                  themeColor="text"
                  style={styles.calloutLineText}
                >
                  {line}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (block.type === 'definitions') {
    return (
      <View style={styles.defList}>
        {block.items.map((item) => (
          <View key={item.term} style={styles.defRow}>
            <ThemedText
              type="smallBold"
              themeColor="accent"
              style={styles.defTerm}
            >
              {item.term}
            </ThemedText>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.defBody}
            >
              {item.body}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  }

  // exhaustiveness — every block type handled above
  return null;
}

const styles = StyleSheet.create({
  safe: { width: '100%', alignItems: 'center' },
  page: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
    gap: Spacing.six,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
  },

  // Hero
  hero: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  heroTitle: {
    marginTop: Spacing.one,
    maxWidth: ReadableContentWidth + Spacing.eight,
  },
  heroSub: {
    maxWidth: ReadableContentWidth,
    fontSize: 18,
    lineHeight: 28,
  },

  // TOC
  tocCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.three,
  },
  tocList: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  tocItem: {
    fontSize: 16,
    lineHeight: 24,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  // Section
  section: {
    paddingTop: Spacing.five,
    gap: Spacing.three,
    maxWidth: ReadableContentWidth + Spacing.eight,
  },
  sectionTitle: {
    maxWidth: ReadableContentWidth,
    marginTop: Spacing.one,
  },
  blocks: {
    gap: Spacing.four,
    marginTop: Spacing.three,
  },

  // Block rendering
  paragraph: {
    fontSize: 17,
    lineHeight: 28,
    maxWidth: ReadableContentWidth,
  },
  subheading: {
    marginTop: Spacing.three,
    fontSize: 22,
    lineHeight: 28,
  },

  bullets: {
    gap: Spacing.two,
    maxWidth: ReadableContentWidth,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  bulletDot: {
    fontSize: 22,
    lineHeight: 26,
    marginRight: Spacing.one,
  },
  bulletText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 28,
  },

  stepList: {
    gap: Spacing.five,
    marginTop: Spacing.two,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  stepNumber: {
    fontSize: 28,
    lineHeight: 32,
    minWidth: 56,
  },
  stepBody: {
    flex: 1,
    gap: Spacing.two,
  },
  stepTitle: {
    fontSize: 22,
    lineHeight: 28,
  },

  callout: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  calloutTitle: {
    fontSize: 20,
    lineHeight: 26,
    marginTop: Spacing.one,
  },
  calloutBody: {
    fontSize: 16,
    lineHeight: 25,
  },
  calloutLines: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  calloutLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  calloutDot: {
    fontSize: 14,
    lineHeight: 24,
    marginTop: 2,
  },
  calloutLineText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },

  defList: {
    gap: Spacing.three,
    maxWidth: ReadableContentWidth,
  },
  defRow: {
    gap: Spacing.one,
  },
  defTerm: {
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  defBody: {
    fontSize: 17,
    lineHeight: 28,
  },

  // Footer CTA
  cta: {
    marginTop: Spacing.five,
    padding: Spacing.eight,
    borderRadius: Radius.lg,
    gap: Spacing.three,
  },
  ctaTitle: {
    maxWidth: ReadableContentWidth,
  },
  ctaBody: {
    fontSize: 17,
    lineHeight: 28,
    maxWidth: ReadableContentWidth,
  },
  ctaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    flexWrap: 'wrap',
    marginTop: Spacing.three,
  },
  ctaLink: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
