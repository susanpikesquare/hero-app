/**
 * Kid-side photo submission, kid app version.
 *
 * Twin of /app/kid/[kid_id]/submit/[chore_id].tsx, except the kid_id is
 * resolved from the authenticated session (useKidSession) rather than a
 * URL param. The kid's anonymous Supabase user is the auth identity that
 * RLS keys off of.
 */

import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { KidShell, KidStyles } from '@/components/kid-shell';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useKidSession } from '@/lib/kid-session';
import { supabase } from '@/lib/supabase';
import { useChores } from '@/lib/use-chores';

type Picked = {
  uri: string;
  mimeType: string;
  fileExtension: string;
};

async function pickFromLibrary(): Promise<Picked | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    fileExtension: (a.fileName?.split('.').pop() ?? 'jpg').toLowerCase(),
  };
}

async function pickFromCamera(): Promise<Picked | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (result.canceled || result.assets.length === 0) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    fileExtension: (a.fileName?.split('.').pop() ?? 'jpg').toLowerCase(),
  };
}

export default function KidSelfSubmitScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ chore_id: string }>();
  const { state } = useKidSession();
  const { chores } = useChores(state.status === 'ready');

  const [picked, setPicked] = useState<Picked | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (state.status !== 'ready') {
    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }}>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          One sec…
        </Text>
      </KidShell>
    );
  }

  const kid = state.kid;
  const family = state.family;
  const chore = chores.find((c) => c.id === params.chore_id);

  const handlePick = async (source: 'camera' | 'library') => {
    setError(null);
    const result = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (result) setPicked(result);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!picked || !chore) {
      setError('Pick a photo first.');
      return;
    }

    setSubmitting(true);
    try {
      const fileResp = await fetch(picked.uri);
      const blob = await fileResp.blob();
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `${family.id}/${kid.id}/${chore.id}/${ts}-${rand}.${picked.fileExtension}`;

      const { error: uploadErr } = await supabase.storage
        .from('submissions')
        .upload(path, blob, {
          contentType: picked.mimeType,
          upsert: false,
        });
      if (uploadErr) throw uploadErr;

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

      // Fire-and-forget AI eval. Same edge function as parent-supervised mode.
      if (insertData?.id) {
        supabase.functions
          .invoke('evaluate-submission', {
            body: { submission_id: insertData.id },
          })
          .catch((err) => {
            console.warn('evaluate-submission invoke failed', err);
          });
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your photo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done && chore) {
    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }}>
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
            Nice hop, {kid.display_name}!
          </Text>
          <Text style={[KidStyles.greetingSub, { color: theme.text }]}>
            We sent your {chore.title.toLowerCase()} photo to your grown-up.
            They’ll have a look and let you know.
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace('/kid')}
          style={[KidStyles.bigButton, { backgroundColor: theme.accent }]}
        >
          <Text style={[KidStyles.bigButtonLabel, { color: theme.background }]}>
            ← Back to my chores
          </Text>
        </Pressable>
      </KidShell>
    );
  }

  if (!chore) {
    return (
      <KidShell back={{ href: '/kid', label: 'Back to chores' }}>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          We couldn’t find that chore.
        </Text>
      </KidShell>
    );
  }

  return (
    <KidShell back={{ href: '/kid', label: 'Back to chores' }}>
      <View style={styles.heading}>
        <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
          {kid.display_name} · {chore.title}
        </Text>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          Show us what you did.
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          Take a picture of your finished {chore.title.toLowerCase()}, or pick
          one from your photos.
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
          <Text style={[KidStyles.choreBody, { color: theme.textMuted, textAlign: 'center' }]}>
            No photo yet
          </Text>
        )}
      </View>

      <View style={styles.pickRow}>
        {Platform.OS !== 'web' && (
          <Pressable
            style={[KidStyles.bigButton, styles.pickBtn, { backgroundColor: theme.accent }]}
            onPress={() => handlePick('camera')}
            disabled={submitting}
          >
            <Text style={[KidStyles.bigButtonLabel, { color: theme.background }]}>
              📸 Use camera
            </Text>
          </Pressable>
        )}
        <Pressable
          style={[
            KidStyles.bigButton,
            styles.pickBtn,
            {
              backgroundColor: Platform.OS === 'web' ? theme.accent : 'transparent',
              borderWidth: Platform.OS === 'web' ? 0 : 1,
              borderColor: theme.border,
            },
          ]}
          onPress={() => handlePick('library')}
          disabled={submitting}
        >
          <Text
            style={[
              KidStyles.bigButtonLabel,
              {
                color: Platform.OS === 'web' ? theme.background : theme.text,
              },
            ]}
          >
            {Platform.OS === 'web' ? '📁 Pick a photo' : 'Pick from photos'}
          </Text>
        </Pressable>
      </View>

      {error && (
        <Text style={[KidStyles.choreBody, { color: '#B23A48' }]}>{error}</Text>
      )}

      <Pressable
        style={[
          KidStyles.bigButton,
          {
            backgroundColor: picked ? theme.info : theme.backgroundElement,
            opacity: picked && !submitting ? 1 : 0.6,
          },
        ]}
        onPress={handleSubmit}
        disabled={!picked || submitting}
      >
        <Text
          style={[
            KidStyles.bigButtonLabel,
            { color: picked ? theme.background : theme.textMuted },
          ]}
        >
          {submitting ? 'Sending…' : 'Send to my grown-up'}
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
