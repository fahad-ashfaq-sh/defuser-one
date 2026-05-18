import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme';
import TouchScale from '../components/TouchScale';

interface HistoryItem {
  id: string;
  title: string;
  status: 'success' | 'failed' | 'warning';
  statusLabel: string;
  time: string;
}

const HISTORY_DATA: HistoryItem[] = [
  { id: '1', title: 'EU Tax Compliance Update 2024.pdf', status: 'success', statusLabel: 'Processed', time: '10 mins ago' },
  { id: '2', title: 'Q3 Internal Audit Findings.docx', status: 'success', statusLabel: 'Processed', time: '2 hours ago' },
  { id: '3', title: 'Legacy_Vendor_Contracts_Archive.zip', status: 'failed', statusLabel: 'Failed - Format', time: 'Yesterday' },
  { id: '4', title: 'GDPR_Privacy_Policy_Review_v2.pdf', status: 'success', statusLabel: 'Processed', time: '2 days ago' },
  { id: '5', title: 'SEC_Filing_10K_2024.docx', status: 'failed', statusLabel: 'Failed - Parse Error', time: '3 days ago' },
  { id: '6', title: 'Cross_Border_Tariff_Update_H1.pdf', status: 'success', statusLabel: 'Processed', time: '4 days ago' },
  { id: '7', title: 'Vendor_Due_Diligence_Report.xlsx', status: 'warning', statusLabel: 'Partial Match', time: '5 days ago' },
  { id: '8', title: 'Anti_Corruption_Compliance_Check.pdf', status: 'success', statusLabel: 'Processed', time: '1 week ago' },
  { id: '9', title: 'Trade_Sanctions_List_Update.csv', status: 'failed', statusLabel: 'Failed - Encoding', time: '1 week ago' },
  { id: '10', title: 'Internal_Controls_Assessment_Q2.docx', status: 'success', statusLabel: 'Processed', time: '2 weeks ago' },
];

function getStatusColor(status: HistoryItem['status']) {
  switch (status) {
    case 'success':
      return theme.colors.safe;
    case 'failed':
      return theme.colors.risk;
    case 'warning':
      return theme.colors.warning;
  }
}

function getStatusIcon(status: HistoryItem['status']) {
  switch (status) {
    case 'success':
      return 'check-circle';
    case 'failed':
      return 'alert-circle';
    case 'warning':
      return 'alert-triangle';
  }
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const statusColor = getStatusColor(item.status);
  const iconName = getStatusIcon(item.status);

  return (
    <View style={styles.historyRow}>
      <View style={[styles.statusIconContainer, { backgroundColor: `${statusColor}1A` }]}>
        <Feather name={iconName} size={16} color={statusColor} />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyDocName} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.historyMeta}>
          <Text style={[styles.historyStatus, { color: statusColor }]}>
            {item.statusLabel}
          </Text>
          <Text style={styles.historySep}>{'•'}</Text>
          <Text style={styles.historyTime}>{item.time}</Text>
        </View>
      </View>
    </View>
  );
}

interface HistoryScreenProps {
  onBack: () => void;
}

export default function HistoryScreen({ onBack }: HistoryScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <TouchScale onPress={onBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.text} />
          </TouchScale>
          <Text style={styles.headerTitle}>History</Text>
          <View style={styles.topBarRight}>
            <View>
              <Feather name="bell" size={24} color={theme.colors.text} />
            </View>
            <View>
              <Feather name="more-vertical" size={24} color={theme.colors.text} />
            </View>
          </View>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>Recent Ingestions</Text>
          </View>
          <View style={styles.cardBody}>
            {HISTORY_DATA.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0,
    backgroundColor: theme.colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 32,
    color: theme.colors.text,
    letterSpacing: -1.6,
    flex: 1,
    textAlign: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 26,
    paddingTop: 24,
  },
  mainCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardHeaderText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 20,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  cardBody: {
    paddingVertical: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
    gap: 2,
  },
  historyDocName: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 15,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyStatus: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
  },
  historySep: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.muted,
    opacity: 0.4,
  },
  historyTime: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.muted,
  },
});
