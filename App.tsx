import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type TabKey = 'home' | 'tenders' | 'nova' | 'alerts';

type TenderItem = {
  title: string;
  value: string;
  stage: string;
  accent: string;
  due: string;
  score: number;
  confidence: string;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'tenders', label: 'Tenders' },
  { key: 'nova', label: 'NOVA' },
  { key: 'alerts', label: 'Alerts' },
];

const stats = [
  { label: 'Opportunities', value: '14', tone: '#4dd7a3' },
  { label: 'Win rate', value: '31%', tone: '#44d4ff' },
  { label: 'Ready', value: '6', tone: '#ffb454' },
];

const pipeline: TenderItem[] = [
  { title: 'City transport fleet', value: '£2.4M', stage: 'Bid review', accent: '#44d4ff', due: 'Due in 2 days', score: 82, confidence: 'High fit' },
  { title: 'School catering works', value: '£840k', stage: 'Compliance', accent: '#4dd7a3', due: 'Checklist due today', score: 74, confidence: 'Good match' },
  { title: 'Solar retrofit package', value: '£1.9M', stage: 'Due today', accent: '#ffb454', due: 'Response due today', score: 68, confidence: 'Needs review' },
];

const novaActions = [
  'Summarize tender brief',
  'Draft response outline',
  'Check compliance gaps',
];

const aiMessages = [
  { speaker: 'NOVA', text: 'This tender aligns with your current portfolio and has a strong route-to-market fit.' },
  { speaker: 'You', text: 'Can you flag the biggest compliance risk?' },
  { speaker: 'NOVA', text: 'Safety accreditation and carbon reporting are the main gaps; I can draft the response.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedTender, setSelectedTender] = useState<TenderItem>(pipeline[0]);

  const activeTabLabel = useMemo(() => {
    switch (activeTab) {
      case 'tenders':
        return 'Live tender view';
      case 'nova':
        return 'AI co-pilot';
      case 'alerts':
        return 'Action queue';
      default:
        return 'Opportunity overview';
    }
  }, [activeTab]);

  const renderHomeScreen = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroLabel}>Live pipeline</Text>
            <Text style={styles.heroValue}>£12.8M</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => setActiveTab('tenders')}>
            <Text style={styles.primaryButtonText}>Review</Text>
          </Pressable>
        </View>

        <Text style={styles.heroMeta}>17% ahead of last month</Text>
      </View>

      <View style={styles.metricsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.metricCard}>
            <View style={[styles.dot, { backgroundColor: stat.tone }]} />
            <Text style={styles.metricLabel}>{stat.label}</Text>
            <Text style={styles.metricValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{activeTabLabel}</Text>
        <Text style={styles.sectionAction}>View all</Text>
      </View>

      <View style={styles.listCard}>
        {pipeline.map((item) => (
          <Pressable key={item.title} style={styles.listItem} onPress={() => {
            setSelectedTender(item);
            setActiveTab('tenders');
          }}>
            <View style={styles.listItemHeader}>
              <View>
                <Text style={styles.listTitle}>{item.title}</Text>
                <Text style={styles.listStage}>{item.stage}</Text>
              </View>
              <Text style={styles.listAmount}>{item.value}</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: item.accent, width: `${item.score}%` }]} />
          </Pressable>
        ))}
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTag}>AI insight</Text>
        <Text style={styles.noticeText}>
          Three opportunities match your team’s recent bid profile and risk profile.
        </Text>
      </View>
    </>
  );

  const renderTenderScreen = () => (
    <>
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTag}>Tender detail</Text>
          <Text style={styles.detailScore}>{selectedTender.score}/100</Text>
        </View>

        <Text style={styles.detailTitle}>{selectedTender.title}</Text>
        <Text style={styles.detailValue}>{selectedTender.value}</Text>

        <View style={styles.detailMetaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillLabel}>Stage</Text>
            <Text style={styles.metaPillValue}>{selectedTender.stage}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillLabel}>Fit</Text>
            <Text style={styles.metaPillValue}>{selectedTender.confidence}</Text>
          </View>
        </View>

        <Text style={styles.detailDue}>{selectedTender.due}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Why NOVA recommends this</Text>
        <Text style={styles.infoText}>
          The tender aligns with your team’s recent delivery track record, the scope matches your current capability, and procurement timing is favourable for a competitive bid.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Key actions</Text>
        {['Review framework requirements', 'Confirm compliance attachments', 'Assign bid leadership'].map((item) => (
          <View key={item} style={styles.actionRow}>
            <View style={styles.check} />
            <Text style={styles.actionText}>{item}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryButtonWide} onPress={() => setActiveTab('nova')}>
        <Text style={styles.primaryButtonText}>Ask NOVA to draft response</Text>
      </Pressable>
    </>
  );

  const renderNovaScreen = () => (
    <>
      <View style={styles.novaCard}>
        <Text style={styles.novaTitle}>NOVA AI</Text>
        <Text style={styles.novaSubtitle}>Your tender co-pilot is ready.</Text>

        {novaActions.map((action) => (
          <Pressable key={action} style={styles.actionChip}>
            <Text style={styles.actionChipText}>{action}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chatCard}>
        {aiMessages.map((message) => (
          <View key={`${message.speaker}-${message.text}`} style={[
            styles.chatBubble,
            message.speaker === 'You' ? styles.chatBubbleSelf : styles.chatBubbleNova,
          ]}>
            <Text style={message.speaker === 'You' ? styles.chatTextSelf : styles.chatTextNova}>{message.speaker}</Text>
            <Text style={message.speaker === 'You' ? styles.chatTextSelf : styles.chatTextNova}>{message.text}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'tenders':
        return renderTenderScreen();
      case 'nova':
        return renderNovaScreen();
      case 'alerts':
        return (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Action queue</Text>
            <Text style={styles.alertText}>2 submissions due soon • 1 compliance gap • 1 supplier clarification pending</Text>
          </View>
        );
      default:
        return renderHomeScreen();
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.appShell}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>Good morning</Text>
            <Text style={styles.title}>Maya</Text>
          </View>

          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>M</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchText}>Search tender, supplier or client</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {renderContent()}
        </ScrollView>

        <View style={styles.bottomNav}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.navItem, isActive && styles.navItemActive]}
              >
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071521',
  },
  appShell: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    backgroundColor: '#071521',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eyebrow: {
    color: '#87a6bd',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ecf7ff',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#44d4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#071521',
    fontWeight: '800',
    fontSize: 18,
  },
  searchBar: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#153349',
    backgroundColor: '#0d1f2d',
    marginBottom: 18,
  },
  searchText: {
    color: '#7d9ab0',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: '#0d1f2d',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#153349',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: '#8aa8bc',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    color: '#eefaff',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#44d4ff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  primaryButtonWide: {
    backgroundColor: '#44d4ff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginTop: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#071521',
    fontWeight: '700',
    fontSize: 14,
  },
  heroMeta: {
    color: '#7dd7b0',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#0d1f2d',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#18344d',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  metricLabel: {
    color: '#8caec3',
    fontSize: 11,
  },
  metricValue: {
    color: '#edfaff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ecf7ff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionAction: {
    color: '#44d4ff',
    fontWeight: '600',
    fontSize: 12,
  },
  listCard: {
    backgroundColor: '#0d1f2d',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#18344d',
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16334a',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listTitle: {
    color: '#eef7ff',
    fontSize: 15,
    fontWeight: '700',
    maxWidth: 185,
  },
  listStage: {
    color: '#87a6bd',
    fontSize: 12,
    marginTop: 6,
  },
  listAmount: {
    color: '#eef7ff',
    fontSize: 15,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 20,
    marginTop: 12,
    backgroundColor: '#44d4ff',
  },
  noticeCard: {
    backgroundColor: '#102e3d',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#1a3d57',
  },
  noticeTag: {
    color: '#44d4ff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  noticeText: {
    color: '#d8ebf9',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  detailCard: {
    backgroundColor: '#0d1f2d',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#18344d',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTag: {
    color: '#44d4ff',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailScore: {
    color: '#7dd7b0',
    fontWeight: '700',
    fontSize: 14,
  },
  detailTitle: {
    color: '#eef7ff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  detailValue: {
    color: '#44d4ff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  metaPill: {
    flex: 1,
    backgroundColor: '#10293b',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1c3e56',
  },
  metaPillLabel: {
    color: '#8caec3',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  metaPillValue: {
    color: '#edfaff',
    marginTop: 6,
    fontWeight: '700',
  },
  detailDue: {
    color: '#ffb454',
    marginTop: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#0d1f2d',
    borderRadius: 20,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#18344d',
  },
  infoTitle: {
    color: '#edfaff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoText: {
    color: '#cfe5f4',
    lineHeight: 22,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  check: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4dd7a3',
    marginRight: 10,
  },
  actionText: {
    color: '#dfeef9',
    fontSize: 14,
  },
  novaCard: {
    backgroundColor: '#0d1f2d',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#18344d',
  },
  novaTitle: {
    color: '#44d4ff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  novaSubtitle: {
    color: '#cbe5f7',
    marginTop: 6,
    marginBottom: 14,
    fontSize: 14,
  },
  actionChip: {
    backgroundColor: '#10293b',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e3d55',
  },
  actionChipText: {
    color: '#edfaff',
    fontWeight: '600',
    fontSize: 14,
  },
  chatCard: {
    backgroundColor: '#0d1f2d',
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#18344d',
  },
  chatBubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  chatBubbleNova: {
    backgroundColor: '#10293b',
    alignSelf: 'flex-start',
  },
  chatBubbleSelf: {
    backgroundColor: '#44d4ff',
    alignSelf: 'flex-end',
  },
  chatTextNova: {
    color: '#edfaff',
    fontSize: 13,
    lineHeight: 20,
  },
  chatTextSelf: {
    color: '#071521',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#0d1f2d',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#18344d',
  },
  alertTitle: {
    color: '#edfaff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  alertText: {
    color: '#cfe5f4',
    lineHeight: 22,
  },
  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    backgroundColor: '#0d1f2d',
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: '#193751',
  },
  navItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#10293b',
  },
  navLabel: {
    color: '#89a9ba',
    fontWeight: '600',
    fontSize: 12,
  },
  navLabelActive: {
    color: '#44d4ff',
  },
});
