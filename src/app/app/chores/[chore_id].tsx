import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { PhotoViewer } from '@/components/photo-viewer';
import { ThemedText } from '@/components/themed-text';
import {
  MaxContentWidth,
  Radius,
  ReadableContentWidth,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

async function pickFromLibrary() {
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

async function pickFromCamera() {
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

export default function ChoreDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ chore_id: string }>();
  const { session } = useAuth();
  const { family, kids } = useFamily(!!session);
  const { chores, loading: choresLoading, reload } = useChores(!!session);

  const chore = chores.find((c) => c.id === params.chore_id);
  const assignedKid = chore ? kids.find((k) => k.id === chore.kid_id) : null;

  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [picked, setPicked] = useState<{
    uri: string;
    mimeType: string;
    fileExtension: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Load signed URL for any existing reference photo.
  useEffect(() => {
    let cancelled = false;
    if (!chore?.reference_photo_path) {
      setReferenceUrl(null);
      return;
    }
    supabase.storage
      .from('reference-photos')
      .createSignedUrl(chore.reference_photo_path, 60 * 10)
      .then(({ data, error: signErr }) => {
        if (cancelled) return;
        if (signErr) {
          setReferenceUrl(null);
          return;
        }
        setReferenceUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [chore?.reference_photo_path]);

  const handlePick = async (source: 'camera' | 'library') => {
    setError(null);
    const result = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (result) setPicked(result);
  };

  const handleUpload = async () => {
    setError(null);
    if (!picked || !family || !chore) {
      setError('Pick a photo first.');
      return;
    }
    setUploading(true);
    try {
      const resp = await fetch(picked.uri);
      const blob = await resp.blob();
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `${family.id}/${chore.id}/${ts}-${rand}.${picked.fileExtension}`;

      const { error: uploadErr } = await supabase.storage
        .from('reference-photos')
        .upload(path, blob, { contentType: picked.mimeType, upsert: false });
      if (uploadErr) throw uploadErr;

      const { error: updateErr } = await supabase
        .from('chores')
        .update({ reference_photo_path: path })
        .eq('id', chore.id);
      if (updateErr) throw updateErr;

      setPicked(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload reference photo.');
    } finally {
      setUploading(false);
    }
  };

  if (choresLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Loading chore…
        </ThemedText>
      </View>
    );
  }

  if (!chore) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Couldn’t find that chore.
        </ThemedText>
        <View style={{ height: Spacing.three }} />
        <BrandButton label="Back to dashboard" onPress={() => router.replace('/app')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <BrandLogo height={96} />
            <BrandButton
              variant="ghost"
              label="← Dashboard"
              onPress={() => router.replace('/app')}
            />
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {assignedKid?.display_name ?? 'A kid'} · Chore
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              {chore.title}
            </BrandHeading>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Reference photo
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary">
              Show the AI what {assignedKid?.display_name ?? 'your kid'}’s
              {' '}
              {chore.title.toLowerCase()} looks like when it’s done. The AI
              compares submitted photos against this one and gives kid-friendly
              feedback.
            </ThemedText>

            <Pressable
              onPress={() => {
                if (picked || referenceUrl) setViewerOpen(true);
              }}
              style={[
                styles.preview,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              {picked ? (
                <Image source={{ uri: picked.uri }} style={styles.previewImg} resizeMode="contain" />
              ) : referenceUrl ? (
                <Image
                  source={{ uri: referenceUrl }}
                  style={styles.previewImg}
                  resizeMode="contain"
                />
              ) : (
                <ThemedText type="default" themeColor="textMuted">
                  No reference photo yet.
                </ThemedText>
              )}
              {(picked || referenceUrl) && (
                <View
                  style={[
                    styles.zoomHint,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    Tap to enlarge
                  </ThemedText>
                </View>
              )}
            </Pressable>

            <View style={styles.pickRow}>
              {Platform.OS !== 'web' && (
                <Pressable
                  onPress={() => handlePick('camera')}
                  disabled={uploading}
                  style={[
                    styles.pickBtn,
                    { backgroundColor: theme.accent },
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: theme.background }}>
                    📸 Use camera
                  </ThemedText>
                </Pressable>
              )}
              <Pressable
                onPress={() => handlePick('library')}
                disabled={uploading}
                style={[
                  styles.pickBtn,
                  Platform.OS === 'web'
                    ? { backgroundColor: theme.accent }
                    : { borderWidth: 1, borderColor: theme.border },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={{
                    color: Platform.OS === 'web' ? theme.background : theme.text,
                  }}
                >
                  {Platform.OS === 'web' ? '📁 Pick a photo' : 'Pick from photos'}
                </ThemedText>
              </Pressable>
            </View>

            {picked && (
              <BrandButton
                label={uploading ? 'Uploading…' : referenceUrl ? 'Replace reference' : 'Save reference'}
                onPress={handleUpload}
                disabled={uploading}
              />
            )}

            {error && (
              <ThemedText type="small" style={{ color: '#B23A48' }}>
                {error}
              </ThemedText>
            )}
          </View>
        </View>
      </SafeAreaView>

      <PhotoViewer
        visible={viewerOpen}
        uri={picked?.uri ?? referenceUrl}
        alt="Reference photo"
        onClose={() => setViewerOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  safe: { width: '100%', alignItems: 'center' },
  page: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.eight,
    gap: Spacing.five,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  header: { gap: Spacing.two, maxWidth: ReadableContentWidth },
  title: { marginTop: Spacing.one },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.four,
  },
  cardTitle: { marginBottom: Spacing.one },
  preview: {
    minHeight: 360,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: Spacing.two,
  },
  previewImg: { width: '100%', height: 360 },
  zoomHint: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pickRow: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap' },
  pickBtn: {
    flexGrow: 1,
    minWidth: 200,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
