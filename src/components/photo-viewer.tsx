/**
 * PhotoViewer — fullscreen modal for inspecting a photo.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <Pressable onPress={() => setOpen(true)}><Image source={...} /></Pressable>
 *   <PhotoViewer visible={open} uri={url} onClose={() => setOpen(false)} />
 *
 * On native we lean on Modal + Image at `contain` size; on web the Image
 * renders as an `<img>`-like element that gets full pixels, and the
 * browser's built-in pinch/scroll zoom does the heavy lifting after that.
 */

import { useEffect } from 'react';
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
  uri: string | null;
  onClose: () => void;
  alt?: string;
};

export function PhotoViewer({ visible, uri, onClose, alt }: Props) {
  // Allow Esc to close on web — Modal doesn't trap focus the same way.
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!uri) return null;

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
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={alt ?? 'Photo'}
          />
        </View>
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
