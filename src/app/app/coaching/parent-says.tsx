/**
 * "Parent says X, kid hears Y" — paired-examples coaching surface.
 *
 * The v1 visualization Erica asked for in the 2026-05-27 session. Each
 * card shows the same parenting moment two ways: the harmful phrase
 * (with what the kid internalizes + observable body language) and the
 * regulated Universal-Voice phrase (same parallel structure).
 *
 * The goal is to make the invisible visible. Parents read this once and
 * the next time they catch themselves about to say "you forgot again,"
 * the regulated version is already in their ear.
 *
 * Surfaces (planned):
 *   - Browse standalone via parent dashboard nav (this route).
 *   - Onboarding swiper for new parents (3-5 example cards).
 *   - Inline under the override composer when the parent's typed text
 *     matches a flagged phrase (v2).
 *
 * Content lives in `src/lib/parent-says-examples.ts` — drawn from the
 * framework, edit with Erica.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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
  EXAMPLE_CATEGORIES,
  findExamplesByCategory,
  type ExampleCategory,
  type ExamplePanel,
  type ParentSaysExample,
} from '@/lib/parent-says-examples';

// Soft red used on the harmful panel — *not* alarming, just clearly the
// "other" color. The point isn't to shame the parent — it's to mark the
// before/after.
const HARMFUL_BORDER = '#D6A89E';
const HARMFUL_BG = '#FBF2EE';
const HARMFUL_LABEL = '#8A4439';

type FilterValue = ExampleCategory | 'all';

export default function ParentSaysScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Side-by-side at tablet+ widths, stacked on phone. 720 is a good break
  // because the two panels need ~320 each + 16 gutter + padding.
  const sideBySide = width >= 720;

  const [filter, setFilter] = useState<FilterValue>('all');
  const examples = useMemo(() => findExamplesByCategory(filter), [filter]);

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
              Coaching tool · Parent ↔ Kid
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              Parent says X, kid hears Y.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              The same moment, two ways. On the left: a phrase that tends to
              land as a shame trigger — and what the kid actually
              internalizes. On the right: the same moment in the encouragement-first
              voice — same parent, same task, very different landing.
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textMuted"
              style={{ marginTop: Spacing.two }}
            >
              Authored with Erica Hospes, LMFT. Read once before bed and
              you'll catch yourself in the kitchen.
            </ThemedText>
          </View>

          {/* Category chips — including an "All" pill that's the default */}
          <View style={styles.chipsRow}>
            <CategoryChip
              theme={theme}
              label="All"
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {EXAMPLE_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.value}
                theme={theme}
                label={cat.label}
                active={filter === cat.value}
                onPress={() => setFilter(cat.value)}
              />
            ))}
          </View>

          <View style={styles.examplesList}>
            {examples.map((ex) => (
              <ExampleCard key={ex.id} example={ex} sideBySide={sideBySide} />
            ))}
          </View>

          {/* Footer hint — points at the still-to-build live translator */}
          <View
            style={[
              styles.futureHint,
              { backgroundColor: theme.accentSoft, borderColor: theme.accent },
            ]}
          >
            <ThemedText
              type="smallBold"
              themeColor="accent"
              style={{ textTransform: 'uppercase', letterSpacing: 1 }}
            >
              Coming next
            </ThemedText>
            <BrandHeading level="h3" style={{ marginTop: Spacing.one }}>
              A live translator
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary">
              In a future release: type what you want to say into a coaching
              box, and Home Hero will rewrite it in the Universal Voice in
              real time — with a kid panel that shows you, line by line,
              what's landing differently.
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function CategoryChip({
  theme,
  label,
  active,
  onPress,
}: {
  theme: ReturnType<typeof useTheme>;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active
            ? theme.accent
            : pressed
              ? theme.backgroundSelected
              : theme.backgroundElement,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}
    >
      <ThemedText
        type="smallBold"
        style={{ color: active ? theme.background : theme.text }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function ExampleCard({
  example,
  sideBySide,
}: {
  example: ParentSaysExample;
  sideBySide: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <ThemedText
        type="smallBold"
        themeColor="accent"
        style={{ textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {example.momentLabel}
      </ThemedText>
      <ThemedText
        type="default"
        themeColor="textSecondary"
        style={styles.setting}
      >
        {example.setting}
      </ThemedText>

      <View
        style={[
          styles.panelsContainer,
          sideBySide ? styles.panelsRow : styles.panelsColumn,
        ]}
      >
        <Panel
          panel={example.harmful}
          tone="harmful"
          theme={theme}
          flexBasis={sideBySide ? '48%' as const : '100%' as const}
        />
        <Panel
          panel={example.regulated}
          tone="regulated"
          theme={theme}
          flexBasis={sideBySide ? '48%' as const : '100%' as const}
        />
      </View>
    </View>
  );
}

function Panel({
  panel,
  tone,
  theme,
  flexBasis,
}: {
  panel: ExamplePanel;
  tone: 'harmful' | 'regulated';
  theme: ReturnType<typeof useTheme>;
  flexBasis: '48%' | '100%';
}) {
  const borderColor = tone === 'harmful' ? HARMFUL_BORDER : theme.accent;
  const headerBg = tone === 'harmful' ? HARMFUL_BG : theme.accentSoft;
  const labelColor = tone === 'harmful' ? HARMFUL_LABEL : theme.accent;
  const toneLabel =
    tone === 'harmful' ? 'How it can land' : 'How it could land differently';

  return (
    <View
      style={[
        styles.panel,
        {
          borderColor,
          backgroundColor: theme.background,
          flexBasis,
        },
      ]}
    >
      <View style={[styles.panelHeader, { backgroundColor: headerBg }]}>
        <ThemedText
          type="smallBold"
          style={{ color: labelColor, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          {toneLabel}
        </ThemedText>
      </View>

      <View style={styles.panelBody}>
        {/* Parent's speech bubble */}
        <View style={styles.speakerRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <ThemedText type="default" style={styles.avatarEmoji}>
              🧑‍🦰
            </ThemedText>
          </View>
          <View style={{ flex: 1, gap: Spacing.one }}>
            <ThemedText type="small" themeColor="textMuted">
              Parent says
            </ThemedText>
            <View
              style={[
                styles.speechBubble,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <ThemedText type="default" style={styles.parentText}>
                “{panel.parentSays}”
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Kid's thought bubble */}
        <View style={styles.speakerRow}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="default" style={styles.avatarEmoji}>
              🧒
            </ThemedText>
          </View>
          <View style={{ flex: 1, gap: Spacing.one }}>
            <ThemedText type="small" themeColor="textMuted">
              Kid hears
            </ThemedText>
            <View
              style={[
                styles.thoughtBubble,
                {
                  backgroundColor: headerBg,
                  borderColor,
                },
              ]}
            >
              <ThemedText
                type="default"
                style={[styles.kidText, { color: labelColor }]}
              >
                {panel.kidHears}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Body language line — concrete, observable */}
        <View
          style={[
            styles.bodyRow,
            { borderTopColor: theme.border },
          ]}
        >
          <ThemedText type="default" style={styles.bodyEmoji}>
            {panel.bodyEmoji}
          </ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" themeColor="textMuted">
              Body
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              {panel.bodyLanguage}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
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
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.two,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  title: { marginTop: Spacing.one },
  lead: { maxWidth: ReadableContentWidth, fontSize: 17, lineHeight: 28 },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  examplesList: { gap: Spacing.five, marginTop: Spacing.three },

  card: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  setting: {
    fontStyle: 'italic',
    lineHeight: 24,
    maxWidth: ReadableContentWidth,
  },

  panelsContainer: {
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  panelsRow: { flexDirection: 'row', alignItems: 'stretch' },
  panelsColumn: { flexDirection: 'column' },

  panel: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    flexGrow: 1,
  },
  panelHeader: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  panelBody: {
    padding: Spacing.four,
    gap: Spacing.four,
  },

  speakerRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22, lineHeight: 26 },

  speechBubble: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  parentText: { fontSize: 16, lineHeight: 22 },

  thoughtBubble: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    // Thought bubbles get a slightly dashed feel by being a bit softer.
  },
  kidText: { fontSize: 16, lineHeight: 22, fontWeight: '500' },

  bodyRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  bodyEmoji: { fontSize: 28, lineHeight: 32 },

  futureHint: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
});
