import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {
  ForceUpdateModal,
  SuggestUpdateBanner,
  configureUpdateGate,
  evaluateUpdate,
  type Verdict,
} from '@zethictech/react-native-update-gate';

configureUpdateGate({
  androidPackageName: 'com.example.demo',
  appStoreId: '1234567890',
});

const SCENARIOS: Array<{ label: string; installed: string; minRequired?: string; latestAvailable?: string }> = [
  { label: 'Current — no prompt', installed: '1.7.0', minRequired: '1.6.0', latestAvailable: '1.7.0' },
  { label: 'Suggest update', installed: '1.6.5', minRequired: '1.6.0', latestAvailable: '1.7.0' },
  { label: 'Force update', installed: '1.5.0', minRequired: '1.6.0', latestAvailable: '1.7.0' },
];

export default function App() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const scenario = SCENARIOS[scenarioIdx]!;
  const verdict: Verdict = evaluateUpdate(scenario);

  const showForce = verdict === 'force';
  const showSuggest = verdict === 'suggest' && !bannerDismissed;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.heading}>react-native-update-gate</Text>
        <Text style={styles.subheading}>Demo · pick a scenario</Text>

        <View style={styles.scenarios}>
          {SCENARIOS.map((s, i) => (
            <Pressable
              key={s.label}
              onPress={() => {
                setScenarioIdx(i);
                setBannerDismissed(false);
              }}
              style={[styles.scenarioBtn, scenarioIdx === i && styles.scenarioBtnActive]}
            >
              <Text style={[styles.scenarioText, scenarioIdx === i && styles.scenarioTextActive]}>
                {s.label}
              </Text>
              <Text style={styles.scenarioMeta}>
                installed {s.installed} · min {s.minRequired ?? '—'} · latest {s.latestAvailable ?? '—'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.verdictPill}>
          <Text style={styles.verdictLabel}>verdict</Text>
          <Text style={styles.verdictValue}>{verdict}</Text>
        </View>
      </View>

      <ForceUpdateModal
        visible={showForce}
        title="Update Required"
        message="A new version of this demo app is available with important changes."
        buttonText="Update Now"
        versionLabel={`${scenario.installed} → ${scenario.latestAvailable ?? '—'}`}
      />

      <SuggestUpdateBanner
        visible={showSuggest}
        title="Update available"
        message={`v${scenario.latestAvailable} is ready to install.`}
        onDismiss={() => setBannerDismissed(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, padding: 24 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  subheading: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 24 },
  scenarios: { gap: 12 },
  scenarioBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scenarioBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  scenarioText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  scenarioTextActive: { color: '#1D4ED8' },
  scenarioMeta: { fontSize: 12, color: '#64748B', marginTop: 4, fontVariant: ['tabular-nums'] },
  verdictPill: {
    marginTop: 32,
    alignSelf: 'flex-start',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  verdictLabel: { fontSize: 10, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' },
  verdictValue: { fontSize: 16, color: '#F8FAFC', fontWeight: '600', marginTop: 2 },
});
