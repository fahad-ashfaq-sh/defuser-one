import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
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

interface LogEntry {
  file_name: string;
  status: 'proceed' | 'failed';
  time: string;
}

function getStatusColor(status: LogEntry['status']) {
  return status === 'failed' ? theme.colors.risk : theme.colors.safe;
}

function getStatusIcon(status: LogEntry['status']) {
  return status === 'failed' ? 'alert-circle' : 'check-circle';
}

function getStatusLabel(status: LogEntry['status']) {
  return status === 'failed' ? 'Dismissed' : 'Processed';
}

function HistoryRow({ item }: { item: LogEntry }) {
  const statusColor = getStatusColor(item.status);
  const iconName = getStatusIcon(item.status);

  return (
    <View style={styles.historyRow}>
      <View style={[styles.statusIconContainer, { backgroundColor: `${statusColor}1A` }]}>
        <Feather name={iconName} size={16} color={statusColor} />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyDocName} numberOfLines={1} ellipsizeMode="tail">
          {item.file_name}
        </Text>
        <View style={styles.historyMeta}>
          <Text style={[styles.historyStatus, { color: statusColor }]}>
            {getStatusLabel(item.status)}
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
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('https://defuser-backend-413383043452.asia-southeast1.run.app/api/v1/dashboard/data');
        setLogs(response.data.data.logs || []);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };
    fetchLogs();
  }, []);

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
            {logs.map((item, index) => (
              <HistoryRow key={index} item={item} />
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
