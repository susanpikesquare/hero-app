/**
 * Cross-platform photo upload helper.
 *
 * React Native 0.85 broke `fetch(uri).blob()` on iOS — the bridge throws
 * "Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not
 * supported". That blocked the kid-side submit flow entirely.
 *
 * Workaround: on native, we ask expo-image-picker for the base64
 * representation of the picked image (it gives us this without going
 * through the broken Blob path), then convert base64 → Uint8Array and
 * hand THAT to Supabase Storage. Supabase Storage's `.upload()`
 * accepts a Uint8Array directly, no Blob construction needed.
 *
 * On web, the original blob path still works fine — and there's no
 * base64 in the picker payload there — so we keep it.
 */

import { Platform } from 'react-native';

import { supabase } from './supabase';

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileExtension: string;
  /**
   * Base64 of the image. Always provided on iOS/Android (request it via
   * `base64: true` on the ImagePicker call). Undefined on web — the web
   * path uses Blob via `fetch(uri).blob()`.
   */
  base64?: string;
};

/**
 * Convert a base64 string to a Uint8Array without any Blob construction.
 * Standard library only — no extra deps. Used on native where blob is
 * broken.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Upload a picked photo to a Supabase Storage bucket at `path`. Returns
 * `{ ok: true }` on success or `{ ok: false, error }` on failure.
 */
export async function uploadPickedPhoto(opts: {
  bucket: string;
  path: string;
  picked: PickedImage;
  upsert?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { bucket, path, picked, upsert = false } = opts;
  const contentType = picked.mimeType || 'image/jpeg';

  // Build the upload body in a platform-safe way.
  let body: Uint8Array | Blob;
  if (Platform.OS === 'web') {
    // Web: blob construction works fine here.
    try {
      const fileResp = await fetch(picked.uri);
      body = await fileResp.blob();
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? `Could not read image: ${err.message}`
            : 'Could not read image.',
      };
    }
  } else {
    // Native: use base64 → Uint8Array. The caller must have requested
    // `base64: true` from expo-image-picker.
    if (!picked.base64) {
      return {
        ok: false,
        error:
          'Image is missing base64 data. Make sure ImagePicker was called with base64: true.',
      };
    }
    body = base64ToUint8Array(picked.base64);
  }

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
      contentType,
      upsert,
    });

  if (uploadErr) {
    return { ok: false, error: uploadErr.message };
  }
  return { ok: true };
}
