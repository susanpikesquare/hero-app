import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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

  // KeyboardAvoidingView is what lets the form scroll past the iOS keyboard.
  // Without it, the keyboard floats on top of the ScrollView and the bottom
  // CTA (Sign in / Sign up) stays hidden — user types the password and has
  // no way to submit. On Android the system handles this automatically via
  // android:windowSoftInputMode="adjustResize" so we no-op the behavior
  // there to avoid double-adjusting.
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={styles.scroll}
        // Lets the user tap the Sign in button without first dismissing
        // the keyboard. Default behavior eats the first tap.
        keyboardShouldPersistTaps="handled"
        // Lets the user swipe the form to dismiss the keyboard, which is
        // the iOS-native gesture they expect.
        keyboardDismissMode="on-drag"
      >
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.page}>
            <BrandLogo height={96} />

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
    </KeyboardAvoidingView>
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
