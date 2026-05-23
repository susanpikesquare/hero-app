import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'ghost';

export type BrandButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
};

export function BrandButton({
  label,
  variant = 'primary',
  style,
  ...rest
}: BrandButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        isPrimary
          ? { backgroundColor: theme.accent }
          : { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 },
        state.pressed && { opacity: 0.85 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.label,
          { color: isPrimary ? theme.background : theme.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
});
