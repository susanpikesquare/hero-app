/**
 * Kid-side photo submission, kid app version.
 *
 * Twin of /app/kid/[kid_id]/submit/[chore_id].tsx, except the kid_id is
 * resolved from the authenticated session (useKidSession) rather than a
 * URL param. The kid's anonymous Supabase user is the auth identity that
 * RLS keys off of.
 *
 * Flow (per Susan QA, Beta F8):
 *
 *   1. On mount, look for any unreviewed submission for this chore today.
 *      If found, load it — so the kid returning to the chore SEES the
 *      photo they sent, not a blank "pick a photo" screen.
 *
 *   2. Kid picks a photo → upload + insert submission row.
 *
 *   3. Wait for the AI verdict (poll every 2s, give up after 30s and
 *      fall through to "your grown-up will look at it"). During the
 *      wait, show a friendly "your photo is checking in…" state.
 *
 *   4. Once the AI verdict lands, show the encouragement-first message
 *      to the kid FIRST. They get two paths:
 *         - "Looks good · send to my grown-up" → close (the submission
 *           is already in the parent queue; this is a confirmation step,
 *           not a separate DB write).
 *         - "Try a different photo" → delete the submission + storage
 *           object, return to the pick state.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Celebration } from '@/components/celebration';
import { KidShell, KidStyles } from '@/components/kid-shell';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hapticSuccess, hapticTap } from '@/lib/haptics';
import { resolveKidMode, VOICE } from '@/lib/kid-mode';
import { useKidSession } from '@/lib/kid-session';
import { type Picked, pickFromCamera, pickFromLibrary } from '@/lib/photo-pick';
import { supabase } from '@/lib/supabase';
import { uploadPickedPhoto } from '@/lib/upload-photo';
import { useChores } from '@/lib/use-chores';

type Mode = 'loading' | 'pick' | 'submitting' | 'waiting_ai' | 'reviewing' | 'sent';

type ExistingSubmission = {
  id: string;
  photo_path: string;
  signedUrl: string | null;
  ai_verdict: 'pass' | 'needs_work' | null;
  ai_feedback: string | null;
};

const AI_POLL_INTERVAL_MS = 2_000;
const AI_POLL_TIMEOUT_MS = 30_000;

export default function KidSelfSubmitScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ chore_id: string }>();
  const { state } = useKidSession();
  const { chores } = useChores(state.status === 'ready');

  const [mode, setMode] = useState<Mode>('loading');
  const [picked, setPicked] = useState<Picked | null>(null);
  const [existing, setExisting] = useState<ExistingSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bump to fire confetti. 0 = idle.
  const [celebrate, setCelebrate] = useState(0);

  // Hold on to interval ids so unmount cleans them up.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ready = state.status === 'ready';
  const kid = ready ? state.kid : null;
  const family = ready ? state.family : null;
  const chore = chores.find((c) => c.id === params.chore_id) ?? null;
  // Drop the bunny for teen/peer kids so the submit surface matches the
  // home surface (Susan QA). Defaults to showing it until the kid resolves.
  const showMascot = kid
    ? VOICE[resolveKidMode({ setting: kid.kid_mode, age: kid.age })].showMascot
    : true;

  /** Stop any in-flight polling. */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollIntervalRef.current = null;
    pollTimeoutRef.current = null;
  }, []);

  /** Poll the submission row for the AI verdict to land. */
  const startPolling = useCallback(
    (submissionId: string) => {
      stopPolling();
      pollIntervalRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('submissions')
          .select('ai_verdict, ai_feedback')
          .eq('id', submissionId)
          .maybeSingle();
        if (data?.ai_verdict) {
          stopPolling();
          setExisting((prev) =>
            prev
              ? {
                  ...prev,
                  ai_verdict: data.ai_verdict as 'pass' | 'needs_work',
                  ai_feedback: data.ai_feedback,
                }
              : prev
          );
          setMode('reviewing');
          // The dopamine moment — confetti + buzz when the AI says great.
          if (data.ai_verdict === 'pass') {
            hapticSuccess();
            setCelebrate((c) => c + 1);
          }
        }
      }, AI_POLL_INTERVAL_MS);

      pollTimeoutRef.current = setTimeout(() => {
        stopPolling();
        // AI didn't respond in time. Don't shame the kid — frame it as
        // "your grown-up will see it." The submission is already in
        // the queue; the parent will review.
        setMode('reviewing');
      }, AI_POLL_TIMEOUT_MS);
    },
    [stopPolling]
  );

  /** Build a signed URL for a stored photo so it can be shown inline. */
  const signSubmissionPhoto = useCallback(async (path: string) => {
    const { data } = await supabase.storage
      .from('submissions')
      .createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
  }, []);

  /** On mount: check for an unreviewed submission today and load it. */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!ready || !chore || !kid) return;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error: loadErr } = await supabase
        .from('submissions')
        .select('id, photo_path, ai_verdict, ai_feedback')
        .eq('chore_id', chore.id)
        .eq('submitted_by', kid.id)
        .is('parent_override', null)
        .gte('submitted_at', todayStart.toISOString())
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (loadErr) {
        // eslint-disable-next-line no-console
        console.warn('load existing submission failed', loadErr.message);
      }

      if (data?.id && data.photo_path) {
        const signedUrl = await signSubmissionPhoto(data.photo_path);
        if (cancelled) return;
        setExisting({
          id: data.id,
          photo_path: data.photo_path,
          signedUrl,
          ai_verdict: data.ai_verdict as 'pass' | 'needs_work' | null,
          ai_feedback: data.ai_feedback,
        });
        if (data.ai_verdict) {
          setMode('reviewing');
        } else {
          setMode('waiting_ai');
          startPolling(data.id);
        }
      } else {
        setMode('pick');
      }
    }
    void load();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [ready, chore, kid, signSubmissionPhoto, startPolling, stopPolling]);

  const handlePick = async (source: 'camera' | 'library') => {
    setError(null);
    const result =
      source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (result) setPicked(result);
  };

  /** Upload the picked photo, insert the submission, kick off AI eval. */
  const handleSubmit = async () => {
    setError(null);
    if (!picked || !chore || !family || !kid) {
      setError('Pick a photo first.');
      return;
    }

    setMode('submitting');
    try {
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `${family.id}/${kid.id}/${chore.id}/${ts}-${rand}.${picked.fileExtension}`;

      const uploadResult = await uploadPickedPhoto({
        bucket: 'submissions',
        path,
        picked,
      });
      if (!uploadResult.ok) throw new Error(uploadResult.error);

      const { data: insertData, error: insertErr } = await supabase
        .from('submissions')
        .insert({
          chore_id: chore.id,
          submitted_by: kid.id,
          photo_path: path,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      // Get a signed URL so we can render the photo in this screen
      // while we wait for the AI to come back.
      const signedUrl = await signSubmissionPhoto(path);

      const submissionId = insertData?.id;
      if (!submissionId) throw new Error('Submission row missing id.');

      setExisting({
        id: submissionId,
        photo_path: path,
        signedUrl,
        ai_verdict: null,
        ai_feedback: null,
      });
      setPicked(null);

      // Fire the AI eval. Best-effort — if invoke fails, the poll will
      // hit its timeout and we'll fall through to the no-AI path.
      supabase.functions
        .invoke('evaluate-submission', { body: { submission_id: submissionId } })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('evaluate-submission invoke failed', err);
        });

      setMode('waiting_ai');
      startPolling(submissionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your photo.');
      setMode('pick');
    }
  };

  /** Discard the current submission + its storage object, return to pick. */
  const handleRetake = async () => {
    stopPolling();
    if (!existing) {
      setMode('pick');
      return;
    }
    try {
      // Best-effort cleanup. If either delete fails, we still let the
      // kid pick a new photo — the worst-case is one orphan row/file.
      await supabase
        .from('submissions')
        .delete()
        .eq('id', existing.id);
      await supabase.storage
        .from('submissions')
        .remove([existing.photo_path]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('retake cleanup failed', err);
    }
    setExisting(null);
    setPicked(null);
    setMode('pick');
  };

  /** Confirm the current submission. No DB write — the row is already
   * in pending_parent state. This just navigates back. */
  const handleConfirmSend = () => {
    hapticTap();
    setMode('sent');
  };

  if (!ready) {
    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }} showMascot={showMascot}>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          One sec…
        </Text>
      </KidShell>
    );
  }

  if (!chore) {
    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }} showMascot={showMascot}>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          We couldn’t find that chore.
        </Text>
      </KidShell>
    );
  }

  // ─── Final success state — kid confirmed the photo. ─────────────
  if (mode === 'sent') {
    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }} showMascot={showMascot}>
        <View
          style={[
            KidStyles.card,
            {
              backgroundColor: theme.accentSoft,
              borderColor: theme.border,
              gap: Spacing.three,
            },
          ]}
        >
          <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
            Photo sent ✓
          </Text>
          <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
            Nice hop, {kid!.display_name}!
          </Text>
          <Text style={[KidStyles.greetingSub, { color: theme.text }]}>
            We sent your {chore.title.toLowerCase()} photo to your grown-up.
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace('/kid')}
          style={[KidStyles.bigButton, { backgroundColor: theme.accent }]}
        >
          <Text
            style={[KidStyles.bigButtonLabel, { color: theme.background }]}
          >
            ← Back to my chores
          </Text>
        </Pressable>
      </KidShell>
    );
  }

  // ─── Loading existing submission. ────────────────────────────────
  if (mode === 'loading') {
    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }} showMascot={showMascot}>
        <View
          style={{
            paddingVertical: Spacing.eight,
            alignItems: 'center',
            gap: Spacing.three,
          }}
        >
          <ActivityIndicator color={theme.accent} />
          <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
            Loading your chore…
          </Text>
        </View>
      </KidShell>
    );
  }

  // ─── Waiting on AI after upload. ─────────────────────────────────
  if (mode === 'waiting_ai' && existing) {
    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }} showMascot={showMascot}>
        <View style={styles.heading}>
          <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
            {kid!.display_name} · {chore.title}
          </Text>
          <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
            Your photo is checking in…
          </Text>
          <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
            Hang tight for a sec. We’re looking at your photo so we can
            tell you how it went.
          </Text>
        </View>

        <View
          style={[
            styles.preview,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          {existing.signedUrl ? (
            <Image
              source={{ uri: existing.signedUrl }}
              style={styles.previewImg}
              resizeMode="contain"
            />
          ) : (
            <ActivityIndicator color={theme.accent} />
          )}
        </View>

        <View style={{ alignItems: 'center', gap: Spacing.two }}>
          <ActivityIndicator color={theme.accent} />
          <Text
            style={[KidStyles.choreBody, { color: theme.textSecondary }]}
          >
            One second…
          </Text>
        </View>
      </KidShell>
    );
  }

  // ─── AI verdict in (or timed out) — kid reviews + decides. ──────
  if (mode === 'reviewing' && existing) {
    const hasVerdict = !!existing.ai_verdict;
    const verdictIsPass = existing.ai_verdict === 'pass';

    // If AI didn't make it back in time, treat as "waiting on grown-up"
    // — no shame for the kid, no fake AI message.
    const headline = hasVerdict
      ? verdictIsPass
        ? `Nice hop, ${kid!.display_name}.`
        : `Have a look at this one, ${kid!.display_name}.`
      : 'Waiting on your grown-up.';
    const subline = existing.ai_feedback
      ? existing.ai_feedback
      : `We sent your ${chore.title.toLowerCase()} photo to your grown-up. They’ll have a look.`;

    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }} showMascot={showMascot}>
        <View style={styles.heading}>
          <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
            {kid!.display_name} · {chore.title}
          </Text>
          <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
            {headline}
          </Text>
        </View>

        <View
          style={[
            styles.preview,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          {existing.signedUrl ? (
            <Image
              source={{ uri: existing.signedUrl }}
              style={styles.previewImg}
              resizeMode="contain"
            />
          ) : (
            <Text
              style={[
                KidStyles.choreBody,
                { color: theme.textMuted, textAlign: 'center' },
              ]}
            >
              Loading photo…
            </Text>
          )}
        </View>

        <View
          style={[
            KidStyles.card,
            {
              backgroundColor: hasVerdict
                ? verdictIsPass
                  ? theme.accentSoft
                  : '#F3E8D6'
                : theme.backgroundElement,
              borderColor: theme.border,
              gap: Spacing.two,
            },
          ]}
        >
          <Text style={[KidStyles.choreBody, { color: theme.text }]}>
            {subline}
          </Text>
        </View>

        {error && (
          <Text style={[KidStyles.choreBody, { color: '#B23A48' }]}>
            {error}
          </Text>
        )}

        <Pressable
          style={[
            KidStyles.bigButton,
            { backgroundColor: theme.accent },
          ]}
          onPress={handleConfirmSend}
        >
          <Text
            style={[KidStyles.bigButtonLabel, { color: theme.background }]}
          >
            Looks good · send to my grown-up →
          </Text>
        </Pressable>

        <Pressable
          style={[
            KidStyles.bigButton,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: theme.border,
            },
          ]}
          onPress={handleRetake}
        >
          <Text
            style={[
              KidStyles.bigButtonLabel,
              { color: theme.text },
            ]}
          >
            Try a different photo
          </Text>
        </Pressable>

        <Celebration
          trigger={celebrate}
          emoji={showMascot ? '🐰' : '🎉'}
          label={showMascot ? 'Nice hop!' : 'Nice work!'}
        />
      </KidShell>
    );
  }

  // ─── Pick a photo (initial state, or after retake). ─────────────
  return (
    <KidShell back={{ href: '/kid', label: 'Back to chores' }} showMascot={showMascot}>
      <View style={styles.heading}>
        <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
          {kid!.display_name} · {chore.title}
        </Text>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          Show us what you did.
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          Take a picture of your finished {chore.title.toLowerCase()}, or
          pick one from your photos.
        </Text>
      </View>

      <View
        style={[
          styles.preview,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        {picked ? (
          <Image
            source={{ uri: picked.uri }}
            style={styles.previewImg}
            resizeMode="contain"
          />
        ) : (
          <Text
            style={[
              KidStyles.choreBody,
              { color: theme.textMuted, textAlign: 'center' },
            ]}
          >
            No photo yet
          </Text>
        )}
      </View>

      <View style={styles.pickRow}>
        {/* Camera ONLY for the kid — a live photo of the finished chore
            right now, no library upload of an old/borrowed shot (Erica,
            2026-07-25: "require a live photo and no upload for the kid").
            On web (no reliable rear camera; not the primary kid surface)
            we still allow choosing a file so a web test isn't blocked. */}
        <Pressable
          style={[
            KidStyles.bigButton,
            styles.pickBtn,
            { backgroundColor: theme.accent },
          ]}
          onPress={() => handlePick('camera')}
          disabled={mode === 'submitting'}
        >
          <Text style={[KidStyles.bigButtonLabel, { color: theme.background }]}>
            📸 Take a photo
          </Text>
        </Pressable>
        {Platform.OS === 'web' && (
          <Pressable
            style={[
              KidStyles.bigButton,
              styles.pickBtn,
              { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
            ]}
            onPress={() => handlePick('library')}
            disabled={mode === 'submitting'}
          >
            <Text style={[KidStyles.bigButtonLabel, { color: theme.text }]}>
              🖼️ Choose a file
            </Text>
          </Pressable>
        )}
      </View>

      {error && (
        <Text style={[KidStyles.choreBody, { color: '#B23A48' }]}>{error}</Text>
      )}

      <Pressable
        style={[
          KidStyles.bigButton,
          {
            backgroundColor: picked ? theme.info : theme.backgroundElement,
            opacity: picked && mode !== 'submitting' ? 1 : 0.6,
          },
        ]}
        onPress={handleSubmit}
        disabled={!picked || mode === 'submitting'}
      >
        <Text
          style={[
            KidStyles.bigButtonLabel,
            { color: picked ? theme.background : theme.textMuted },
          ]}
        >
          {mode === 'submitting' ? 'Sending…' : 'Send for a look'}
        </Text>
      </Pressable>
    </KidShell>
  );
}

const styles = StyleSheet.create({
  heading: { gap: Spacing.three },
  preview: {
    height: 280,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  pickRow: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap' },
  pickBtn: { flexGrow: 1, minWidth: 200 },
});
