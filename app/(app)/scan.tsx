import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { glass } from '../../src/components/glass';
import { colors } from '../../src/components/ui';
import { useProfile, useTenders, useUploadDocument } from '../../src/hooks/use-workspace';
import { buildPdf, capturePage, pickPages, safeFileName, type ScannedPage } from '../../src/lib/scanner';
import {
  CLOSED_STATUSES,
  COMPANY_SCAN_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  formatDate,
  TENDER_DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from '../../src/lib/tenderpilot';
import { useAuth } from '../../src/providers/auth-provider';

type Step = 'idle' | 'building' | 'uploading';

export default function ScanScreen() {
  const params = useLocalSearchParams<{ tenderId?: string }>();
  const { user } = useAuth();
  const profile = useProfile();
  const tenders = useTenders();
  const upload = useUploadDocument();

  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [name, setName] = useState(`Scan ${formatDate(new Date().toISOString())}`);
  const [tenderId, setTenderId] = useState<string | null>(params.tenderId ?? null);
  const [category, setCategory] = useState<DocumentCategory>(params.tenderId ? 'tender_mandatory' : 'certificate');
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  const openTenders = useMemo(
    () => (tenders.data ?? []).filter((t) => !CLOSED_STATUSES.has(t.status)),
    [tenders.data],
  );
  const categories = tenderId ? TENDER_DOCUMENT_CATEGORIES : COMPANY_SCAN_CATEGORIES;

  const chooseTarget = (id: string | null) => {
    setTenderId(id);
    setCategory(id ? 'tender_mandatory' : 'certificate');
  };

  const addFromCamera = async () => {
    setError(null);
    try {
      const page = await capturePage();
      if (page) setPages((current) => [...current, page]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const addFromGallery = async () => {
    setError(null);
    const picked = await pickPages();
    setPages((current) => [...current, ...picked]);
  };

  const save = async () => {
    if (!user || !profile.data?.company_id) {
      setError('Your company profile has not loaded yet. Check your connection and try again.');
      return;
    }
    setError(null);
    try {
      setStep('building');
      const pdf = await buildPdf(pages);
      setStep('uploading');
      await upload.mutateAsync({
        companyId: profile.data.company_id,
        uploadedBy: user.id,
        tenderId,
        category,
        name: safeFileName(name),
        file: pdf,
        mimeType: 'application/pdf',
      });
      Alert.alert('Saved to Documents', 'The scan is now in TenderPilot AI on the web as well.');
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStep('idle');
    }
  };

  const isBusy = step !== 'idle';

  return (
    <LinearGradient colors={['#04192f', '#071521', '#050e1a']} style={styles.fill}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan document</Text>
          <Pressable accessibilityLabel="Close" hitSlop={12} onPress={() => router.back()} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {pages.length === 0 ? (
              <Pressable onPress={addFromCamera} style={styles.stage}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                <Ionicons name="scan-outline" size={54} color={colors.accent} />
                <Text style={styles.stageTitle}>Tap to scan</Text>
                <Text style={styles.stageHint}>
                  Lay the ID, certificate or page flat in good light and fill the frame.
                </Text>
              </Pressable>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pages}>
                {pages.map((page, index) => (
                  <View key={`${page.uri}-${index}`} style={styles.page}>
                    <Image source={{ uri: page.uri }} style={styles.pageImage} contentFit="cover" />
                    <Text style={styles.pageNumber}>{index + 1}</Text>
                    <Pressable
                      accessibilityLabel={`Remove page ${index + 1}`}
                      hitSlop={8}
                      onPress={() => setPages((current) => current.filter((_, i) => i !== index))}
                      style={styles.pageRemove}
                    >
                      <Ionicons name="close" size={14} color="#ffffff" />
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={addFromCamera} style={[styles.page, styles.addPage]}>
                  <Ionicons name="add" size={28} color={colors.accent} />
                  <Text style={styles.addPageText}>Add page</Text>
                </Pressable>
              </ScrollView>
            )}

            <View style={styles.sourceRow}>
              <Pressable onPress={addFromCamera} style={styles.sourceButton}>
                <Ionicons name="camera-outline" size={18} color={colors.accent} />
                <Text style={styles.sourceText}>Camera</Text>
              </Pressable>
              <Pressable onPress={addFromGallery} style={styles.sourceButton}>
                <Ionicons name="images-outline" size={18} color={colors.accent} />
                <Text style={styles.sourceText}>From gallery</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Document name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Director ID - Thabo"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Save to</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="Company documents" active={tenderId === null} onPress={() => chooseTarget(null)} />
              {openTenders.map((tender) => (
                <Chip key={tender.id} label={tender.title} active={tenderId === tender.id} onPress={() => chooseTarget(tender.id)} />
              ))}
            </ScrollView>

            <Text style={styles.label}>Category</Text>
            <View style={styles.wrapChips}>
              {categories.map((value) => (
                <Chip key={value} label={DOCUMENT_CATEGORY_LABELS[value]} active={category === value} onPress={() => setCategory(value)} />
              ))}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={pages.length === 0 || isBusy}
              onPress={save}
              style={[styles.save, (pages.length === 0 || isBusy) && styles.saveDisabled]}
            >
              {isBusy ? (
                <>
                  <ActivityIndicator color="#071521" />
                  <Text style={styles.saveText}>{step === 'building' ? 'Creating PDF…' : 'Uploading…'}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#071521" />
                  <Text style={styles.saveText}>
                    Save {pages.length > 0 ? `${pages.length} page${pages.length === 1 ? '' : 's'}` : 'scan'} to Documents
                  </Text>
                </>
              )}
            </Pressable>
            <Text style={styles.footnote}>Saved as a PDF in your company's private document store on TenderPilot AI.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const CORNER = 34;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.fillStrong,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  stage: {
    height: 300,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: glass.borderBright,
    backgroundColor: 'rgba(0, 214, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 30,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.accent,
  },
  cornerTopLeft: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTopRight: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBottomLeft: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBottomRight: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  stageTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  stageHint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  pages: {
    gap: 12,
    paddingVertical: 4,
  },
  page: {
    width: 120,
    height: 165,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  pageNumber: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    color: '#ffffff',
    fontWeight: '800',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  pageRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  addPage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderStyle: 'dashed',
    borderColor: glass.borderBright,
  },
  addPageText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  sourceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
  },
  sourceText: {
    color: colors.text,
    fontWeight: '600',
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
    color: colors.text,
    fontSize: 15,
  },
  chips: {
    gap: 8,
  },
  wrapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    maxWidth: 220,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
  },
  chipActive: {
    borderColor: glass.borderBright,
    backgroundColor: 'rgba(0, 214, 255, 0.14)',
  },
  chipText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.accent,
  },
  error: {
    color: colors.red,
    marginTop: 16,
    lineHeight: 20,
  },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  saveDisabled: {
    opacity: 0.45,
  },
  saveText: {
    color: '#071521',
    fontSize: 16,
    fontWeight: '800',
  },
  footnote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});
