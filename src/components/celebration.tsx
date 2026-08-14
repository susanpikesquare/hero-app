/**
 * Celebration — a confetti burst + a big emoji/label pop, fired when a
 * kid completes a chore successfully. The dopamine moment.
 *
 * Pure React Native `Animated` (no extra native module, works on web +
 * native). Self-managing: bump the `trigger` prop (a counter) and it
 * plays once, then disappears. Renders in a transparent Modal so it
 * overlays the whole screen regardless of scroll position, with
 * pointerEvents disabled so it never blocks the UI underneath.
 *
 * Pair with hapticSuccess() at the call site for the tactile half.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const CONFETTI_COLORS = [
  '#7A957A',
  '#D7E3D4',
  '#E8B84B',
  '#E0795B',
  '#6B8CC7',
  '#C8B6E5',
  '#A8BDA5',
];
const NUM_PIECES = 16;
const NUM_PIECES_BIG = 34;
const DURATION_MS = 1500;
const DURATION_MS_BIG = 2100;

type Piece = {
  left: number; // % across the screen
  size: number;
  color: string;
  rise: number; // initial upward burst (px)
  drift: number; // horizontal drift (px)
  spin: number; // rotations
};

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    size: 7 + Math.random() * 8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rise: 40 + Math.random() * 90,
    drift: (Math.random() * 2 - 1) * 70,
    spin: (Math.random() * 2 - 1) * 1.5,
  }));
}

type Props = {
  /** Bump this counter to fire a celebration. 0 = idle. */
  trigger: number;
  /** Big emoji in the center pop. Defaults to a party popper. */
  emoji?: string;
  /** Optional label under the emoji (e.g. "Nice hop!"). */
  label?: string;
  /** Bigger, longer burst — for milestone/badge unlocks. */
  big?: boolean;
};

export function Celebration({ trigger, emoji = '🎉', label, big = false }: Props) {
  const [visible, setVisible] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const driver = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    setPieces(makePieces(big ? NUM_PIECES_BIG : NUM_PIECES));
    setVisible(true);
    driver.setValue(0);
    const anim = Animated.timing(driver, {
      toValue: 1,
      duration: big ? DURATION_MS_BIG : DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setVisible(false);
    });
    return () => anim.stop();
  }, [trigger, driver]);

  if (!visible) return null;

  const badgeOpacity = driver.interpolate({
    inputRange: [0, 0.12, 0.78, 1],
    outputRange: [0, 1, 1, 0],
  });
  const badgeScale = driver.interpolate({
    inputRange: [0, 0.2, 0.5, 1],
    outputRange: [0.3, 1.25, 1, 1],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => setVisible(false)}>
      <View pointerEvents="none" style={styles.overlay}>
        {pieces.map((p, i) => {
          const translateY = driver.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, -p.rise, 360],
          });
          const translateX = driver.interpolate({
            inputRange: [0, 1],
            outputRange: [0, p.drift],
          });
          const rotate = driver.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${p.spin * 360}deg`],
          });
          const opacity = driver.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [1, 1, 0],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.piece,
                {
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity,
                  transform: [{ translateY }, { translateX }, { rotate }],
                },
              ]}
            />
          );
        })}

        <Animated.View
          style={[
            styles.badge,
            { opacity: badgeOpacity, transform: [{ scale: badgeScale }] },
          ]}
        >
          <Text style={[styles.emoji, big && styles.emojiBig]}>{emoji}</Text>
          {label ? (
            <Text style={[styles.label, big && styles.labelBig]}>{label}</Text>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    position: 'absolute',
    top: '42%',
    borderRadius: 2,
  },
  badge: {
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 84,
    textAlign: 'center',
  },
  emojiBig: {
    fontSize: 112,
  },
  label: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3C4A3C',
    textAlign: 'center',
  },
  labelBig: {
    fontSize: 30,
  },
});
