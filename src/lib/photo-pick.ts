/**
 * Shared photo-pick helpers — used by every screen that captures or
 * chooses an image (parent reference photos + kid submissions).
 *
 * Two entry points:
 *   - pickFromCamera()  → opens the device camera (native) or the
 *     browser's camera/getUserMedia (web). Great for "photograph the
 *     made bed right now."
 *   - pickFromLibrary() → opens the photo library / file picker. On
 *     mobile web the OS sheet behind this also offers "Take Photo".
 *
 * Both return a normalized `Picked` (or null if the user cancelled /
 * the capture failed). Everything is wrapped so a missing camera,
 * denied permission, or unsupported browser degrades to null instead
 * of throwing into the UI.
 *
 * base64: requested on native only — it avoids the broken
 * fetch(uri).blob() path on iOS (see src/lib/upload-photo.ts). On web
 * the uploader reads the blob directly, so base64 isn't needed.
 */

import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type Picked = {
  uri: string;
  mimeType: string;
  fileExtension: string;
  /** Set on native (via ImagePicker `base64: true`); undefined on web. */
  base64?: string;
};

const NEEDS_BASE64 = Platform.OS !== 'web';

function toPicked(asset: ImagePicker.ImagePickerAsset): Picked {
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileExtension: (asset.fileName?.split('.').pop() ?? 'jpg').toLowerCase(),
    base64: asset.base64 ?? undefined,
  };
}

export async function pickFromLibrary(): Promise<Picked | null> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      base64: NEEDS_BASE64,
    });
    if (result.canceled || result.assets.length === 0) return null;
    return toPicked(result.assets[0]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('pickFromLibrary failed', err);
    return null;
  }
}

export async function pickFromCamera(): Promise<Picked | null> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: NEEDS_BASE64,
    });
    if (result.canceled || result.assets.length === 0) return null;
    return toPicked(result.assets[0]);
  } catch (err) {
    // Web with no camera / denied getUserMedia lands here — degrade to
    // null so the caller can fall back to the library button.
    // eslint-disable-next-line no-console
    console.warn('pickFromCamera failed', err);
    return null;
  }
}
