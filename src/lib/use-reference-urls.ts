/**
 * Batch-resolve reference-photo storage paths into signed URLs.
 *
 * The reference-photos bucket is private (kid clients can't read it
 * directly via RLS), so we mint short-lived signed URLs and stuff them
 * into a map keyed by storage path. The kid chore tile reads the URL
 * for its chore's reference_photo_path; null means no reference exists
 * (or the URL failed to mint, in which case the tile falls back to the
 * 📸 placeholder).
 *
 * Used by both kid surfaces (/kid and /app/kid/[kid_id]).
 *
 * Why a single batch call instead of one-per-tile:
 *   - One round-trip vs N round-trips. With 6-10 chores per kid this
 *     matters for first-paint.
 *   - createSignedUrls (plural) is a built-in supabase-js method that
 *     takes an array of paths and returns an array of results. Easy.
 *
 * The signed URL lives for SIGN_TTL_SECONDS. That's longer than the
 * kid will stay on the home screen in one session; we re-mint on
 * subsequent loads.
 */

import { useEffect, useState } from 'react';

import { supabase } from './supabase';

const SIGN_TTL_SECONDS = 60 * 60; // 1 hour

type UrlMap = Record<string, string>;

export function useReferenceUrls(paths: (string | null | undefined)[]) {
  const [urls, setUrls] = useState<UrlMap>({});

  // Stable signature so we don't re-fetch every render when the chores
  // array is recreated but content is unchanged.
  const sigKey = paths
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .sort()
    .join('|');

  useEffect(() => {
    let cancelled = false;
    const list = sigKey ? sigKey.split('|') : [];
    if (list.length === 0) {
      setUrls({});
      return;
    }
    (async () => {
      const { data, error } = await supabase.storage
        .from('reference-photos')
        .createSignedUrls(list, SIGN_TTL_SECONDS);
      if (cancelled) return;
      if (error || !data) {
        setUrls({});
        return;
      }
      const next: UrlMap = {};
      for (const row of data) {
        if (row.path && row.signedUrl) {
          next[row.path] = row.signedUrl;
        }
      }
      setUrls(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [sigKey]);

  return urls;
}
