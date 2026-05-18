import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Header from "./Header";
import { theme } from "./theme";

interface Step {
  label: string;
  subtitle?: string;
}

const STEPS: Step[] = [
  { label: "Directive Ingestion & Validation" },
  { label: "Extracting Fiscal Entities" },
  { label: "Mapping Tariff Changes", subtitle: "ANALYZING STRUCTURE..." },
  { label: "Matching Affected Inventory" },
  { label: "Calculating Exposure Risk" },
];

export default function ParsingScreen({
  documentName,
  onParsingComplete,
}: {
  documentName: string;
  onParsingComplete: () => void;
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeStepIndex < STEPS.length - 1) {
        setActiveStepIndex((prev) => prev + 1);
      } else {
        onParsingComplete();
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeStepIndex, onParsingComplete]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.5],
  });

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
            <View style={styles.statusIcons}>
              <View style={styles.statusIconBlur} />
              <View style={styles.statusIconSolid} />
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.systemStatusLabel}>System Status</Text>
              <Text style={styles.threatTitle}>Threat Analysis In Progress</Text>
              <Text style={styles.statusDescription}>
                AUTONOMOUS PARSING IN PROGRESS
              </Text>
            </View>
          </View>
          <View style={styles.heroGlow} />
        </View>

        <View style={styles.mainCard}>
          <View style={styles.cardTitleBar}>
            <Text style={styles.cardTitle}>Ingest Regulatory Directive</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.parsingHeader}>
              <Text style={styles.parsingTitle}>Parsing Document</Text>
              <View style={styles.documentRow}>
                <Feather
                  name="file-text"
                  size={14}
                  color="rgba(218,226,253,0.6)"
                />
                <Text style={styles.documentName} numberOfLines={1}>
                  {documentName}
                </Text>
              </View>
            </View>

            <View style={styles.stepsPanel}>
              <View style={styles.stepsInner}>
                {STEPS.map((step, index) => {
                  const isCompleted = index < activeStepIndex;
                  const isActive = index === activeStepIndex;
                  const isPending = index > activeStepIndex;

                  return (
                    <View key={index} style={styles.stepItem}>
                      {index > 0 && (
                        <View
                          style={[
                            styles.connector,
                            {
                              backgroundColor:
                                index - 1 < activeStepIndex
                                  ? "rgba(78,222,163,0.3)"
                                  : "rgba(255,255,255,0.1)",
                            },
                          ]}
                        />
                      )}

                      <View style={styles.stepRow}>
                        <View style={styles.iconColumn}>
                          {isCompleted && (
                            <View style={styles.iconCompleted}>
                              <Feather
                                name="check"
                                size={14}
                                color={theme.colors.safe}
                              />
                            </View>
                          )}
                          {isActive && (
                            <Animated.View
                              style={[
                                styles.iconActiveOuter,
                                { opacity: glowOpacity as unknown as number },
                              ]}
                            >
                              <View style={styles.activeDot} />
                            </Animated.View>
                          )}
                          {isPending && (
                            <View style={styles.iconPending}>
                              <View style={styles.pendingDot} />
                            </View>
                          )}
                        </View>

                        <View style={styles.textColumn}>
                          <Text
                            style={[
                              styles.stepLabel,
                              isCompleted && styles.stepLabelCompleted,
                              isActive && styles.stepLabelActive,
                              isPending && styles.stepLabelPending,
                            ]}
                          >
                            {step.label}
                          </Text>
                          {isActive && step.subtitle && (
                            <Text style={styles.stepSubtitle}>
                              {step.subtitle}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 26,
    paddingBottom: 128,
  },

  /* ── Hero Status Card ── */
  heroCard: {
    backgroundColor: "#000",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
    overflow: "hidden",
    shadowColor: theme.colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  heroCardInner: {
    flexDirection: "row",
    padding: 25,
    gap: 8,
  },
  statusIcons: {
    width: 2,
    alignSelf: "stretch",
    position: "relative",
  },
  statusIconBlur: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    borderRadius: 99,
    backgroundColor: theme.colors.warning,
    opacity: 0.5,
  },
  statusIconSolid: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    borderRadius: 99,
    backgroundColor: theme.colors.warning,
  },
  heroContent: {
    flex: 1,
    gap: 8,
  },
  systemStatusLabel: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 14,
    color: "#ccc",
    textTransform: "capitalize",
  },
  threatTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 26,
    color: theme.colors.warning,
  },
  statusDescription: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.85,
    textTransform: "uppercase",
  },
  heroGlow: {
    position: "absolute",
    top: "50%",
    left: -10,
    width: 256,
    height: 256,
    borderRadius: 12,
    marginTop: -128,
    backgroundColor: "transparent",
    // Match the Figma gradient overlay idea with a semi-transparent risk-colored layer
  },

  /* ── Main Card ── */
  mainCard: {
    backgroundColor: "#000",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  cardTitleBar: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 17,
  },
  cardTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 20,
    color: theme.colors.text,
    letterSpacing: -0.5,
    opacity: 0.9,
  },
  cardBody: {
    padding: 24,
    alignItems: "center",
  },

  /* ── Parsing Header ── */
  parsingHeader: {
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  parsingTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 20,
    color: theme.colors.text,
    letterSpacing: -0.5,
    opacity: 0.9,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    maxWidth: 330,
  },
  documentName: {
    flex: 1,
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    color: "rgba(218,226,253,0.6)",
  },

  /* ── Steps Panel ── */
  stepsPanel: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 17,
    width: "100%",
  },
  stepsInner: {
    minHeight: 266,
    justifyContent: "space-between",
  },

  /* ── Step Item ── */
  stepItem: {
    position: "relative",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },

  /* ── Connector ── */
  connector: {
    position: "absolute",
    left: 15,
    top: -24,
    width: 2,
    height: 24,
  },

  /* ── Icon Column ── */
  iconColumn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Completed Icon */
  iconCompleted: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(78,222,163,0.2)",
    borderWidth: 1,
    borderColor: "rgba(78,222,163,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Active Icon */
  iconActiveOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(56,189,248,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.action,
  },

  /* Pending Icon */
  iconPending: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },

  /* ── Text Column ── */
  textColumn: {
    flex: 1,
    paddingTop: 4,
  },
  stepLabel: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 16,
    color: theme.colors.muted,
    letterSpacing: -0.4,
  },
  stepLabelCompleted: {
    fontFamily: theme.fonts.sansBold,
    color: theme.colors.text,
    opacity: 0.9,
  },
  stepLabelActive: {
    fontFamily: theme.fonts.sansBold,
    color: theme.colors.action,
  },
  stepLabelPending: {
    fontFamily: theme.fonts.sansRegular,
    color: theme.colors.muted,
    opacity: 0.4,
  },
  stepSubtitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    color: theme.colors.action,
    opacity: 0.6,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 2,
  },
});
