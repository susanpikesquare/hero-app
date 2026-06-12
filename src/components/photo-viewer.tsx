/**
 * PhotoViewer — fullscreen modal for inspecting one photo or a gallery.
 *
 * Single photo:
 *   <PhotoViewer visible={open} uri={url} onClose={...} />
 *
 * Gallery (multiple reference photos):
 *   <PhotoViewer visible={open} uris={[a, b, c]} onClose={...} />
 *   Renders ‹ › arrows + a "2 / 3" counter to page through.
 *
 * On native we lean on Modal + Image at `contain` size; on web the Image
 * gets full pixels and the browser's pinch/scroll zoom handles the rest.
 */

import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  /** Single photo. Ignored if `uris` is provided + non-empty. */
  uri?: string | null;
  /** Gallery of photos. Takes precedence over `uri`. */
  uris?: (string | null | undefined)[];
  onClose: () => void;
  alt?: string;
};

export function PhotoViewer({ visible, uri, uris, onClose, alt }: Props) {
  // Normalize to a clean list. Gallery wins; otherwise the single uri.
  const list = (
    uris && uris.length > 0 ? uris : uri ? [uri] : []
  ).filter((u): u is string => typeof u === 'string' && u.length > 0);

  const [index, setIndex] = useState(0);

  // Reset to the first photo whenever the viewer (re)opens or the set
  // changes, so we never land on a stale out-of-range index.
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible, list.length]);

  // Esc closes on web; ← → page through the gallery.
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, list.length - 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose, list.length]);

  if (list.length === 0) return null;
  const safeIndex = Math.min(index, list.length - 1);
  const current = list[safeIndex];
  const hasMultiple = list.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close photo">
        <View style={styles.frame} pointerEvents="box-none">
          <Image
            source={{ uri: current }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={alt ?? 'Photo'}
          />
        </View>

        {/* Prev / next arrows + counter, only for a real gallery. */}
        {hasMultiple && (
          <>
            {safeIndex > 0 && (
              <Pressable
                onPress={() => setIndex((i) => Math.max(i - 1, 0))}
                style={[styles.arrow, styles.arrowLeft]}
                accessibilityRole="button"
                accessibilityLabel="Previous photo"
                hitSlop={12}
              >
                <Text style={styles.arrowLabel}>‹</Text>
              </Pressable>
            )}
            {safeIndex < list.length - 1 && (
              <Pressable
                onPress={() => setIndex((i) => Math.min(i + 1, list.length - 1))}
                style={[styles.arrow, styles.arrowRight]}
                accessibilityRole="button"
                accessibilityLabel="Next photo"
                hitSlop={12}
              >
                <Text style={styles.arrowLabel}>›</Text>
              </Pressable>
            )}
            <View style={styles.counter}>
              <Text style={styles.counterLabel}>
                {safeIndex + 1} / {list.length}
              </Text>
            </View>
          </>
        )}

        <Pressable
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
        >
          <Text style={styles.closeBtnLabel}>×</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  frame: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  arrowLabel: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '300',
  },
  counter: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  counterLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnLabel: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
  },
});
