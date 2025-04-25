import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon-outline" size={24} color={Colors.colors.primary} />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            value={false}
            onValueChange={() => {}}
            trackColor={{ false: Colors.colors.copy, true: Colors.colors.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/about')}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.colors.primary} />
            <Text style={styles.settingText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.colors.copy} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/support')}>
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.colors.primary} />
            <Text style={styles.settingText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.colors.copy} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.colors.primary,
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.colors.primary,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.copy + '20',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.colors.copy,
  },
});
