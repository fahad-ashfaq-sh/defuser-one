import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import Header from './Header';
import { theme } from './theme';
import TouchScale from './src/components/TouchScale';
import axios, { AxiosError } from 'axios';

const ICON_SIZE = 24;

function FileSearchIcon() {
  return (
    <View style={iconStyles.fileSearch}>
      <Feather name="search" size={24} color="#4E88DE" />
    </View>
  );
}

function TriangleAlertIcon() {
  return (
    <View style={iconStyles.triangleAlert}>
      <Feather name="alert-triangle" size={24} color="#DE4E4E" />
    </View>
  );
}

function FileCheckIcon() {
  return (
    <View style={iconStyles.fileCheck}>
      <Feather name="check-circle" size={24} color="#DE9B4E" />
    </View>
  );
}

function MonitorCheckIcon() {
  return (
    <View style={iconStyles.monitorFrame}>
      <Feather name="monitor" size={24} color="#C0C1FF" />
    </View>
  );
}

function UploadIcon() {
  return (
    <View style={iconStyles.uploadContainer}>
      <Feather name="upload" size={32} color={theme.colors.action} />
    </View>
  );
}

export default function HomeScreen({ onNavigate, onViewHistory, onIngestResult }: { onNavigate?: (documentName: string) => void; onViewHistory?: () => void; onIngestResult?: (payload: any) => void }) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf');
  const [textInputValue, setTextInputValue] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [stats, setStats] = useState<{ total_ingested: number; active_alerts: number; regulatory_changes: number; actively_monitored: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('https://defuser-backend-413383043452.asia-southeast1.run.app/api/v1/dashboard/data', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        const { total_ingested, active_alerts, regulatory_changes, actively_monitored } = response.data.data.stats;
        setStats({ total_ingested, active_alerts, regulatory_changes, actively_monitored });
        setLogs(response.data.data.logs);
      } catch (error) {
        console.error('Dashboard fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setIsSubmitting(true);
      onNavigate?.(asset.name);
      const formData = new FormData();
      formData.append('pdf', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/pdf',
      } as any);
      axios.post('https://defuser-backend-413383043452.asia-southeast1.run.app/api/v1/directive/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((response) => {
        onIngestResult?.(response.data);
      }).catch((error) => {
        console.error("Backend Validation Error:", (error as AxiosError)?.response?.data || (error as Error).message);
      });
    }
  };

  const handlePasteText = async () => {
    const text = await Clipboard.getStringAsync();
    setTextInputValue(text);
  };

  const handleSubmitText = () => {
    if (textInputValue.trim().length >= 300) {
      setIsSubmitting(true);
      onNavigate?.(textInputValue);
      axios.post('https://defuser-backend-413383043452.asia-southeast1.run.app/api/v1/directive/ingest', { raw_text: textInputValue }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        onIngestResult?.(response.data);
      }).catch((error) => {
        console.error("Backend Validation Error:", (error as AxiosError)?.response?.data || (error as Error).message);
      });
    }
  };

  const canSubmit = textInputValue.trim().length >= 300;

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
              <View style={styles.statusLineInner} />
              <View style={styles.statusLineOuter} />
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>System Status</Text>
              <Text style={styles.heroTitle}>Secure Operations</Text>
              <Text style={styles.heroStatus}>No Active Regulatory Threats</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <FileSearchIcon />
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Total ingested</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{loading ? '-' : stats?.total_ingested}</Text>
                {!loading && <Text style={styles.metricSuffix}> Circulars</Text>}
              </View>
            </View>
          </View>
          <View style={styles.metricCard}>
            <TriangleAlertIcon />
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>active Alerts</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{loading ? '-' : stats?.active_alerts}</Text>
              </View>
            </View>
          </View>
          <View style={styles.metricCard}>
            <FileCheckIcon />
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Regulatory Changes</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{loading ? '-' : stats?.regulatory_changes}</Text>
                {!loading && <Text style={styles.metricSuffix}> Detected</Text>}
              </View>
            </View>
          </View>
          <View style={styles.metricCard}>
            <MonitorCheckIcon />
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Actively Monitored</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{loading ? '-' : stats?.actively_monitored}</Text>
                {!loading && <Text style={styles.metricSuffix}> SKUs</Text>}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.ingestSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingest Regulatory Directive</Text>
          </View>
          <View style={styles.uploadButtonsRow}>
            <TouchScale
              style={[styles.tabButton, activeTab === 'pdf' && styles.tabButtonActive]}
              onPress={() => setActiveTab('pdf')}
            >
              <Feather name="file" size={14} color={activeTab === 'pdf' ? theme.colors.text : 'rgba(218,226,253,0.6)'} />
              <Text style={[styles.tabButtonText, activeTab === 'pdf' && styles.tabButtonTextActive]}>Upload PDF</Text>
            </TouchScale>
            <TouchScale
              style={[styles.tabButton, activeTab === 'text' && styles.tabButtonActive]}
              onPress={() => setActiveTab('text')}
            >
              <Feather name="edit-3" size={14} color={activeTab === 'text' ? theme.colors.text : 'rgba(218,226,253,0.6)'} />
              <Text style={[styles.tabButtonText, activeTab === 'text' && styles.tabButtonTextActive]}>Paste Raw Text</Text>
            </TouchScale>
          </View>
          {activeTab === 'pdf' ? (
            <TouchScale style={styles.dropzone} onPress={handlePickDocument} disabled={isSubmitting}>
              <View style={styles.dropzoneContent}>
                <UploadIcon />
                <Text style={styles.dropzoneTitle}>Upload regulatory document</Text>
                <View style={styles.dropzoneDesc}>
                  <Text style={styles.dropzoneDescText}>
                    Supported formats: PDF.
                  </Text>
                  <Text style={styles.dropzoneDescText}>
                    Secure high-precision processing
                  </Text>
                  <Text style={styles.dropzoneDescText}>enabled.</Text>
                </View>
                <View style={styles.selectDocumentButton}>
                  <Text style={styles.selectDocumentButtonText}>Select Document</Text>
                </View>
              </View>
            </TouchScale>
          ) : (
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Paste regulatory text content here..."
                placeholderTextColor="rgba(218,226,253,0.4)"
                textAlignVertical="top"
                value={textInputValue}
                onChangeText={setTextInputValue}
              />
              <View style={styles.textInputButtons}>
                <TouchScale style={styles.pasteButton} onPress={handlePasteText}>
                  <Feather name="clipboard" size={16} color={theme.colors.text} />
                  <Text style={styles.pasteButtonText}>Paste Text</Text>
                </TouchScale>
                <TouchScale
                  style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                  onPress={handleSubmitText}
                  disabled={!canSubmit || isSubmitting}
                >
                  <Feather name="send" size={16} color={theme.colors.text} />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchScale>
              </View>
            </View>
          )}
        </View>

        <View style={styles.recentActivity}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Ingestions</Text>
          </View>
          {logs.slice(0, 3).map((log: any, index: number) => {
            const isFailed = log.status === 'failed';
            return (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Feather name={isFailed ? 'alert-circle' : 'file'} size={16} color={isFailed ? theme.colors.risk : '#dae2fd'} style={{ opacity: 0.7 }} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityDocName} numberOfLines={1} ellipsizeMode="tail">
                    {log.file_name}
                  </Text>
                  <View style={styles.activityMeta}>
                    <Text style={[styles.activityStatus, { color: isFailed ? theme.colors.risk : theme.colors.safe }]}>
                      {isFailed ? 'Dismissed' : 'Processed'}
                    </Text>
                    <Text style={styles.activitySep}>•</Text>
                    <Text style={styles.activityTime}>{log.time}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          <TouchScale style={styles.viewLogsButton} onPress={onViewHistory}>
            <View style={styles.viewLogsGradient} pointerEvents="none" />
            <Text style={styles.viewLogsText}>View Audit Logs</Text>
          </TouchScale>
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
    paddingBottom: 140,
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
  },
  heroLabel: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 14,
    color: '#ccc',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 24,
    color: theme.colors.safe,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroStatus: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    color: '#dae2fd',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: 380,
  },
  metricCard: {
    width: 185,
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  metricContent: {
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
  metricSuffix: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 16,
    color: theme.colors.muted,
    lineHeight: 25,
  },
  ingestSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 20,
    color: '#dae2fd',
    letterSpacing: -0.5,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 17,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.action,
    borderWidth: 1,
    borderColor: theme.colors.action,
  },
  tabButtonText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    color: 'rgba(218,226,253,0.6)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tabButtonTextActive: {
    color: theme.colors.text,
  },
  pdfIcon: {
    width: 12,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    color: theme.colors.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  uploadButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  uploadButtonTextSecondary: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    color: 'rgba(218,226,253,0.6)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  textIcon: {
    width: 13.5,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropzone: {
    padding: 24,
    minHeight: 348,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropzoneContent: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 33,
    backgroundColor: 'rgba(255,255,255,0.02)',
    minHeight: 300,
  },
  dropzoneTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 20,
    color: '#dae2fd',
    letterSpacing: -0.5,
    textAlign: 'center',
    paddingBottom: 4,
  },
  dropzoneDesc: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  dropzoneDescText: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 14,
    color: 'rgba(218,226,253,0.6)',
    textAlign: 'center',
    letterSpacing: -0.35,
    lineHeight: 20,
  },
  selectDocumentButton: {
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
  selectDocumentButtonText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: theme.colors.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  textInputContainer: {
    padding: 24,
    minHeight: 348,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    width: '100%',
    minHeight: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    color: '#dae2fd',
    lineHeight: 20,
  },
  textInputButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  pasteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pasteButtonText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 14,
    color: theme.colors.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.action,
  },
  submitButtonText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 14,
    color: theme.colors.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  recentActivity: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
    overflow: 'hidden',
    paddingBottom: 9,
  },
  recentHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  recentTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 20,
    color: '#dae2fd',
    letterSpacing: -0.5,
    textTransform: 'capitalize',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activityIcon: {
    width: 29.33,
    height: 32.67,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityDocName: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: '#dae2fd',
    letterSpacing: -0.4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityStatus: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    color: theme.colors.safe,
  },
  activitySep: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    color: 'rgba(218,226,253,0.5)',
    opacity: 0.3,
  },
  activityTime: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    color: 'rgba(218,226,253,0.5)',
  },
  viewLogsButton: {
    width: 362,
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  viewLogsGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  viewLogsText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: theme.colors.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

const iconStyles = StyleSheet.create({
  fileSearch: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  triangleAlert: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fileCheck: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  monitorFrame: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  uploadContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
