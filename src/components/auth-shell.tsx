import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { Radius, ReadableContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ eyebrow, title, subtitle, children, footer }: Props) {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <BrandLogo height={42} />

          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            {eyebrow && (
              <BrandHeading level="eyebrow" themeColor="accent" style={styles.eyebrow}>
                {eyebrow}
              </BrandHeading>
            )}
            <BrandHeading level="h2" style={styles.title}>
              {title}
            </BrandHeading>
            {subtitle && (
              <ThemedText
                type="default"
                themeColor="textSecondary"
                style={styles.subtitle}
              >
                {subtitle}
              </ThemedText>
            )}
            <View style={styles.body}>{children}</View>
          </View>

          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignItems: 'center',
    flexGrow: 1,
  },
  safe: {
    width: '100%',
    alignItems: 'center',
  },
  page: {
    width: '100%',
    maxWidth: ReadableContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.eight,
    gap: Spacing.five,
  },
  wordmark: {
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.three,
  },
  eyebrow: {
    marginBottom: Spacing.one,
  },
  title: {
    marginTop: Spacing.one,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  footer: {
    alignItems: 'flex-start',
  },
});
