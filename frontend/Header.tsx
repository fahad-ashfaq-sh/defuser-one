import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from './theme';

export default function Header() {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>Defuser One</Text>
        <View style={styles.topBarRight}>
          <View style={styles.notificationBell}>
            <Feather name="bell" size={24} color={theme.colors.text} />
          </View>
          <View style={styles.menuButton}>
            <Feather name="more-vertical" size={24} color={theme.colors.text} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  appTitle: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 32,
    color: theme.colors.text,
    letterSpacing: -1.6,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBell: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
