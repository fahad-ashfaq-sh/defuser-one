import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../Header';
import { theme } from '../../theme';
import TouchScale from '../components/TouchScale';

const TERMINAL_LOG_LINES = [
  '[AUTH] Verifying cryptographic deployment signatures...',
  '[OVERRIDE] Elevating privileges for core schema modification...',
  '[EXECUTE] Applying delta patch to regulatory frameworks...',
  '[AUDIT] Changes committed. Immutable audit ledger updated.',
];

function TerminalLogLine({ text }: { text: string }) {
  const successMatch = text.match(/^(SUCCESS: )(\d+)(.*)$/);
  if (successMatch) {
    return (
      <View style={styles.terminalLine}>
        <Text style={styles.terminalPrompt}>{'>'}</Text>
        <Text style={styles.terminalLineText}>
          <Text>{successMatch[1]}</Text>
          <Text style={styles.terminalSuccessCode}>{successMatch[2]}</Text>
          <Text>{successMatch[3]}</Text>
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.terminalLine}>
      <Text style={styles.terminalPrompt}>{'>'}</Text>
      <Text style={styles.terminalLineText}>{text}</Text>
    </View>
  );
}

interface CompletedScreenProps {
  onNavigateHome: () => void;
}

export default function CompletedScreen({ onNavigateHome }: CompletedScreenProps) {
  const [terminalExpanded, setTerminalExpanded] = useState(true);

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
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroCardInner}>
            <View style={styles.heroStatusLine}>
              <View style={styles.statusLineOuter} />
              <View style={styles.statusLineInner} />
            </View>
            <View style={styles.heroContent}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroLabel}>System Status</Text>
                <Text style={styles.heroTitle}>SYSTEM RECALIBRATED</Text>
              </View>
              <Text style={styles.heroStatus}>AUTONOMOUS PATCH DEPLOYED SUCCESSFULLY</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <View style={styles.leakageCard}>
            <View style={styles.leakageIconContainer}>
              <MaterialCommunityIcons
                name="shield-check"
                size={24}
                color={theme.colors.safe}
              />
            </View>
            <View style={styles.leakageContent}>
              <Text style={styles.metricLabel}>Projected Leakage</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>Rs. 0</Text>
                <Text style={styles.metricUnit}>/ day</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <View style={styles.metaContent}>
                <Text style={styles.metricLabel}>Active Threats</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricValue}>0</Text>
                </View>
              </View>
            </View>
            <View style={styles.metaCard}>
              <View style={styles.metaContent}>
                <Text style={styles.metricLabel}>Risk Level</Text>
                <View style={styles.riskRow}>
                  <View style={styles.safeDot} />
                  <Text style={styles.metricValue}>Safe</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <TouchScale
          style={styles.continueButton}
          onPress={onNavigateHome}
        >
          <Text style={styles.continueButtonText}>Continue Monitoring Operations</Text>
          <Feather name="chevron-right" size={20} color={theme.colors.text} />
        </TouchScale>

        <View style={styles.terminalContainer}>
          <TouchableOpacity
            style={styles.terminalHeader}
            activeOpacity={0.7}
            onPress={() => setTerminalExpanded((prev) => !prev)}
          >
            <View style={styles.terminalHeaderLeft}>
              <Feather name="terminal" size={15} color="#c2c6d6" />
              <Text style={styles.terminalHeaderText}>EXECUTION TERMINAL</Text>
            </View>
            <Feather
              name={terminalExpanded ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#c2c6d6"
            />
          </TouchableOpacity>
          {terminalExpanded && (
            <View style={styles.terminalBody}>
              {TERMINAL_LOG_LINES.map((line, i) => (
                <TerminalLogLine key={i} text={line} />
              ))}
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 128,
    gap: 26,
  },

  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    backgroundColor: '#000',
    overflow: 'hidden',
    shadowColor: theme.colors.safe,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  heroCardInner: {
    flexDirection: 'row',
    padding: 25,
    gap: 8,
  },
  heroStatusLine: {
    width: 2,
    alignSelf: 'stretch',
    position: 'relative',
  },
  statusLineInner: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    borderRadius: 99,
    backgroundColor: theme.colors.safe,
  },
  statusLineOuter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    borderRadius: 99,
    backgroundColor: theme.colors.safe,
    opacity: 0.5,
  },
  heroContent: {
    flex: 1,
    gap: 8,
  },
  heroTextBlock: {},
  heroLabel: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 14,
    color: '#ccc',
    textTransform: 'capitalize',
  },
  heroTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 24,
    color: theme.colors.safe,
    letterSpacing: -1,
  },
  heroStatus: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    color: theme.colors.safe,
    textTransform: 'uppercase',
  },

  metricsSection: {
    gap: 8,
  },
  leakageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
  },
  leakageIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  leakageContent: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 13,
    color: '#ccc',
    textTransform: 'capitalize',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  metricValue: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 24,
    color: theme.colors.text,
    letterSpacing: -1.6,
  },
  metricUnit: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 16,
    color: '#b3b3b3',
    lineHeight: 25,
  },

  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaCard: {
    flex: 1,
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  metaContent: {
    gap: 2,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.safe,
  },

  continueButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.action,
    paddingHorizontal: 32,
    paddingVertical: 17,
    borderRadius: 8,
    shadowColor: 'rgba(192,193,255,0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: theme.colors.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  terminalContainer: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 17,
    gap: 8,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60,74,66,0.3)',
    paddingBottom: 9,
  },
  terminalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  terminalHeaderText: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: '#c2c6d6',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  terminalBody: {
    opacity: 0.8,
    gap: 4,
  },
  terminalLine: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  terminalPrompt: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    color: '#5de6ff',
    lineHeight: 18.2,
  },
  terminalLineText: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    color: '#c7c4d7',
    lineHeight: 18,
    flex: 1,
  },
  terminalSuccessCode: {
    color: '#42b586',
  },
});
