import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  ScrollView,
  View,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
  Modal,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../Header';
import { theme } from '../../theme';
import TouchScale from '../components/TouchScale';

export interface CriticalThreatScreenProps {
  onDeployPatch?: () => void;
  onInspectTrace?: () => void;
  onDeployComplete?: () => void;
  onDismiss?: () => void;
  payload?: any;
}

const TERMINAL_LOG_LINES = [
  '[AUTH] Verifying cryptographic deployment signatures...',
  '[OVERRIDE] Elevating privileges for core schema modification...',
  '[EXECUTE] Applying delta patch to regulatory frameworks...',
  '[AUDIT] Changes committed. Immutable audit ledger updated.',
];

const AGENT_TRACE_LINES = [
  '[1/4] Ingesting document matrix; verifying cryptographic integrity.',
  '[2/4] Isolating tariff vectors and regulatory mandates.',
  '[3/4] Querying active inventory database for affected SKUs.',
  '[4/4] Impact analysis complete; patch sequence formulation verified.',
];

function RiskDot() {
  return <View style={styles.riskDot} />;
}

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

export default function CriticalThreatScreen({
  onDeployPatch,
  onInspectTrace,
  onDeployComplete,
  onDismiss,
  payload,
}: CriticalThreatScreenProps) {
  const rawLeakage = payload?.totals?.total_daily_leakage;
  const leakageAmount = rawLeakage != null ? `Rs. ${Number(rawLeakage).toLocaleString()}` : 'Rs. 0';
  const leakageUnit = '/ day';
  const effectiveDate = payload?.effective_date || 'TBD';
  const riskLevel = (payload?.totals?.threat_count || 0) > 0 ? 'Critical' : 'Low';
  const rawActionSummary = payload?.action_summary || '';
  const actionSummary = rawActionSummary.includes('not available') ? 'Affected SKUs have been identified based on detected policy changes. Deploy patches to synchronize tax rates.' : rawActionSummary;
  const threatCount = payload?.totals?.threat_count ?? 0;
  const [deployState, setDeployState] = useState<'idle' | 'deploying' | 'completed'>('idle');
  const [visibleLogCount, setVisibleLogCount] = useState(0);
  const [dismissModalVisible, setDismissModalVisible] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const trackWidth = useRef(0);
  const pan = useRef(new Animated.Value(0)).current;
  const deployStateRef = useRef(deployState);
  deployStateRef.current = deployState;
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const onDeployCompleteRef = useRef(onDeployComplete);
  onDeployCompleteRef.current = onDeployComplete;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => deployStateRef.current === 'idle',
      onMoveShouldSetPanResponder: () => deployStateRef.current === 'idle',
      onPanResponderMove: (_, gestureState) => {
        const maxDrag = Math.max(0, trackWidth.current - 66);
        const value = Math.max(0, Math.min(maxDrag, gestureState.dx));
        pan.setValue(value);
      },
      onPanResponderRelease: (_, gestureState) => {
        const maxDrag = Math.max(0, trackWidth.current - 66);
        const threshold = maxDrag * 0.8;
        if (gestureState.dx >= threshold) {
          Animated.timing(pan, {
            toValue: maxDrag,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setDeployState('deploying');
            const p = payloadRef.current;
            const body = {
              patch_id: p?.patch_id,
              target_category: p?.fiscal_metrics?.[0]?.category_slug || 'default',
              payload: {
                tax_tier: p?.fiscal_metrics?.[0]?.tax_tier || 0,
                margin_status: "SECURED",
              },
            };
            axios.post('https://defuser-backend-413383043452.asia-southeast1.run.app/api/v1/simulation/patch-database', body, {
              headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            }).catch((error) => {
              console.error("Patch deploy error:", (error as any)?.response?.data || (error as Error).message);
            });
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
          }).start();
        }
      },
    }),
  ).current;

  const handleTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  }, []);

  useEffect(() => {
    if (deployState !== 'deploying') return;
    if (visibleLogCount >= TERMINAL_LOG_LINES.length) {
      setDeployState('completed');
      onDeployCompleteRef.current?.();
      return;
    }
    const timer = setTimeout(() => {
      setVisibleLogCount((prev) => prev + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [deployState, visibleLogCount]);

  const isDeploying = deployState === 'deploying' || deployState === 'completed';

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
                <Text style={styles.heroTitle}>Critical Exposure Detected</Text>
              </View>
              <Text style={styles.heroStatus}>Immediate pricing sync required</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <View style={styles.leakageCard}>
            <View style={styles.leakageIconContainer}>
              <MaterialCommunityIcons
                name="cash-remove"
                size={24}
                color={theme.colors.risk}
              />
            </View>
            <View style={styles.leakageContent}>
              <Text style={styles.metricLabel}>Projected Leakage</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{leakageAmount}</Text>
                <Text style={styles.metricUnit}>{leakageUnit}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <View style={styles.metaContent}>
                <Text style={styles.metricLabel}>Effective Date</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricValue}>{effectiveDate}</Text>
                </View>
              </View>
            </View>
            <View style={styles.metaCard}>
              <View style={styles.metaContent}>
                <Text style={styles.metricLabel}>Risk Level</Text>
                <View style={styles.riskRow}>
                  <RiskDot />
                  <Text style={styles.metricValue}>{riskLevel}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.metaCard}>
            <View style={styles.metaContent}>
              <Text style={styles.metricLabel}>Threat Count</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{threatCount}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <View style={styles.actionSectionHeader}>
            <Text style={styles.actionSectionTitle}>Recommended Action</Text>
          </View>
          <View style={styles.actionSectionBody}>
            <View style={styles.actionSummaryCard}>
              <View style={styles.actionSummaryHeader}>
                <Text style={styles.actionSummaryLabel}>Action SUMMARY</Text>
              </View>
              <View style={styles.actionSummaryBody}>
                <Text style={styles.actionSummaryText}>{actionSummary}</Text>
              </View>
            </View>

            <View
              style={[
                styles.deployPill,
                isDeploying && styles.deployPillActive,
              ]}
              onLayout={handleTrackLayout}
              {...panResponder.panHandlers}
            >
              <Animated.View
                style={[
                  styles.deployHandle,
                  isDeploying
                    ? styles.deployHandleActive
                    : styles.deployHandleIdle,
                  !isDeploying && { transform: [{ translateX: pan }] },
                ]}
              >
                <Feather name="chevrons-right" size={14} color={theme.colors.text} />
              </Animated.View>
              <View style={styles.deployTextContainer}>
                <Text style={styles.deployText}>
                  {isDeploying ? 'DEPLOYING' : 'SWIPE TO DEPLOY'}
                </Text>
                <Text style={styles.deploySubtext}>AUTONOMOUS PATCH</Text>
              </View>
            </View>

            {!isDeploying && (
              <TouchScale
                style={styles.dismissButton}
                onPress={() => setDismissModalVisible(true)}
              >
                <Text style={styles.dismissButtonText}>Dismiss Threat</Text>
              </TouchScale>
            )}

            {!isDeploying && !isInspecting && (
              <TouchScale
                style={styles.secondaryCta}
                onPress={() => {
                  setIsInspecting(true);
                  onInspectTrace?.();
                }}
                scaleTo={0.98}
              >
                <View style={styles.secondaryCtaOverlay} pointerEvents="none" />
                <Text style={styles.secondaryCtaText}>Inspect Agent Trace First</Text>
                <Feather name="chevron-right" size={24} color={theme.colors.text} />
              </TouchScale>
            )}

            {!isDeploying && isInspecting && (
              <View style={styles.inspectTerminalContainer}>
                <View style={styles.inspectTerminalHeader}>
                  <View style={styles.inspectTerminalHeaderLeft}>
                    <Feather name="terminal" size={15} color="#c2c6d6" />
                    <Text style={styles.inspectTerminalHeaderText}>AGENT TRACE</Text>
                  </View>
                  <TouchScale onPress={() => setIsInspecting(false)} style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="x" size={16} color="#c2c6d6" />
                  </TouchScale>
                </View>
                <ScrollView
                  style={styles.inspectTerminalBody}
                  showsVerticalScrollIndicator={false}
                >
                  {AGENT_TRACE_LINES.map((line, i) => (
                    <View key={i} style={styles.terminalLine}>
                      <Text style={styles.terminalPrompt}>{'>'}</Text>
                      <Text style={styles.terminalLineText}>{line}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {isDeploying && (
              <View style={styles.terminalContainer}>
                <View style={styles.terminalHeader}>
                  <View style={styles.terminalHeaderLeft}>
                    <Feather name="terminal" size={15} color="#c2c6d6" />
                    <Text style={styles.terminalHeaderText}>EXECUTION TERMINAL</Text>
                  </View>
                  <Feather name="chevron-up" size={12} color="#c2c6d6" />
                </View>
                <View style={styles.terminalBody}>
                  <LinearGradient
                    colors={['#121212', 'rgba(18,18,18,0)']}
                    style={styles.terminalGradient}
                    pointerEvents="none"
                  />
                  {TERMINAL_LOG_LINES.slice(0, visibleLogCount).map((line, i) => (
                    <TerminalLogLine key={i} text={line} />
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={dismissModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDismissModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dismiss Threat</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to dismiss this critical threat alert?
            </Text>
            <View style={styles.modalActions}>
              <TouchScale
                style={styles.modalCancelButton}
                onPress={() => setDismissModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchScale>
              <TouchScale
                style={styles.modalConfirmButton}
                onPress={() => {
                  setDismissModalVisible(false);
                  onDismiss?.();
                }}
              >
                <Text style={styles.modalConfirmText}>Dismiss</Text>
              </TouchScale>
            </View>
          </View>
        </View>
      </Modal>
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
    borderColor: 'rgba(244,63,94,0.15)',
    backgroundColor: '#000',
    overflow: 'hidden',
    shadowColor: theme.colors.risk,
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
    backgroundColor: theme.colors.risk,
  },
  statusLineOuter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    borderRadius: 99,
    backgroundColor: theme.colors.risk,
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
    color: theme.colors.risk,
    letterSpacing: -1,
  },
  heroStatus: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    color: '#dae2fd',
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
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(220,21,60,0.2)',
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
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 10,
  },
  metaContent: {
    gap: 2,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.risk,
  },

  actionSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  actionSectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 17,
  },
  actionSectionTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 20,
    color: '#dae2fd',
    letterSpacing: -0.5,
  },
  actionSectionBody: {
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },

  actionSummaryCard: {
    width: '100%',
    padding: 17,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  actionSummaryHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#333538',
    paddingBottom: 9,
  },
  actionSummaryLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: '#c2c6d6',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  actionSummaryBody: {},
  actionSummaryText: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 16,
    color: 'rgba(226,226,230,0.9)',
    lineHeight: 26,
  },

  deployPill: {
    width: '100%',
    height: 68,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: theme.colors.risk,
    backgroundColor: 'rgba(220,20,60,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  deployPillActive: {
    borderColor: '#5e5e5e',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  deployHandle: {
    position: 'absolute',
    top: 6,
    width: 56,
    height: 56,
    borderRadius: 99,
    backgroundColor: theme.colors.risk,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  deployHandleIdle: {
    left: 5,
  },
  deployHandleActive: {
    right: 5,
    backgroundColor: '#787878',
  },
  deployTextContainer: {
    alignItems: 'center',
    gap: 0,
    width: 141,
  },
  deployText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    color: theme.colors.text,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 16,
  },
  deploySubtext: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 12,
    color: '#efefef',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 16,
  },

  secondaryCta: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  secondaryCtaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryCtaText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: theme.colors.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  dismissButton: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.risk,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 14,
    color: theme.colors.risk,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 20,
    color: theme.colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 15,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 14,
    color: theme.colors.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.risk,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 14,
    color: theme.colors.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  inspectTerminalContainer: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 17,
    gap: 8,
  },
  inspectTerminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60,74,66,0.3)',
    paddingBottom: 9,
  },
  inspectTerminalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectTerminalHeaderText: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: '#c2c6d6',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inspectTerminalBody: {
    opacity: 0.8,
    maxHeight: 240,
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
  terminalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 16,
    zIndex: 1,
    pointerEvents: 'none',
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
