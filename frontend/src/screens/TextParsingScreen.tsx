import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Header from "../../Header";
import { theme } from "../../theme";

interface Step {
  label: string;
}

const STEPS: Step[] = [
  { label: "Raw Text Ingestion & Validation" },
  { label: "Extracting Key Entities" },
  { label: "Analyzing Semantic Structure" },
  { label: "Cross-Referencing Directives" },
  { label: "Calculating Exposure Risk" },
];

export default function TextParsingScreen({
  textContent,
  payload,
  onParsingComplete,
}: {
  textContent: string;
  payload?: any;
  onParsingComplete: () => void;
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [animationFinished, setAnimationFinished] = useState(false);
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
    if (activeStepIndex >= STEPS.length - 1) {
      setAnimationFinished(true);
      return;
    }
    const timer = setTimeout(() => {
      setActiveStepIndex((prev) => prev + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeStepIndex]);

  useEffect(() => {
    if (animationFinished && payload?.totals) {
      onParsingComplete();
    }
  }, [animationFinished, payload, onParsingComplete]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.5],
  });

  const textPreview =
    textContent.length > 120
      ? textContent.slice(0, 120) + "..."
      : textContent;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Header />
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroCardInner}>
            <View style={styles.statusIcons}>
              <View style={styles.statusIconBlur} />
              <View style={styles.statusIconSolid} />
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.systemStatusLabel}>System Status</Text>
              <Text style={styles.threatTitle}>Text Analysis In Progress</Text>
              <Text style={styles.statusDescription}>
                AUTONOMOUS PARSING IN PROGRESS
              </Text>
            </View>
          </View>
          <View style={styles.heroGlow} />
        </View>

        <View style={styles.mainCard}>
          <View style={styles.cardTitleBar}>
            <Text style={styles.cardTitle}>Process Raw Directive Text</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.parsingHeader}>
              <Text style={styles.parsingTitle}>Parsing Text</Text>
              <View style={styles.textPreviewRow}>
                <Feather
                  name="file-text"
                  size={14}
                  color="rgba(218,226,253,0.6)"
                />
                <Text style={styles.textPreview} numberOfLines={3}>
                  {textPreview}
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

                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 26,
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
  textPreviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    maxWidth: 330,
  },
  textPreview: {
    flex: 1,
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    color: "rgba(218,226,253,0.6)",
    lineHeight: 20,
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

});
