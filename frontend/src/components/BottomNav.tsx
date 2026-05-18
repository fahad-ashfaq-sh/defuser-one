import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme';

type BottomNavProps = {
  activeTab: 'home' | 'history';
  onHomePress: () => void;
  onHistoryPress: () => void;
  onPickDocument: () => void;
};

export default function BottomNav({ activeTab, onHomePress, onHistoryPress, onPickDocument }: BottomNavProps) {
  return (
    <View style={styles.container}>
      <View style={styles.menuRow}>
        <TouchableOpacity style={styles.menuItem} onPress={onHomePress} activeOpacity={1}>
          <Feather name="home" size={24} color={activeTab === 'home' ? theme.colors.action : theme.colors.muted} />
          <Text style={[styles.label, activeTab === 'home' && styles.labelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} disabled activeOpacity={1}>
          <Feather name="git-branch" size={24} color={theme.colors.muted} />
          <Text style={styles.label}>Trace</Text>
        </TouchableOpacity>
        <View style={styles.centerColumn}>
          <TouchableOpacity style={styles.fab} onPress={onPickDocument} activeOpacity={0.8}>
            <Feather name="file-text" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={onHistoryPress} activeOpacity={1}>
          <Feather name="clock" size={24} color={activeTab === 'history' ? theme.colors.action : theme.colors.muted} />
          <Text style={[styles.label, activeTab === 'history' && styles.labelActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} disabled activeOpacity={1}>
          <Feather name="user" size={24} color={theme.colors.muted} />
          <Text style={styles.label}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: theme.colors.card,
    paddingBottom: 24,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    paddingHorizontal: 12,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontFamily: theme.fonts.sansRegular,
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 16,
  },
  labelActive: {
    color: theme.colors.action,
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.action,
    borderWidth: 5,
    borderColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
});
