import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Colors from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@example.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="lock-closed-outline" size={24} color={Colors.colors.primary} />
            <Text style={styles.settingText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.colors.copy} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail-outline" size={24} color={Colors.colors.primary} />
            <Text style={styles.settingText}>Change Email</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.colors.copy} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={24} color={Colors.colors.primary} />
            <Text style={styles.settingText}>Notification Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.colors.copy} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="language-outline" size={24} color={Colors.colors.primary} />
            <Text style={styles.settingText}>Language</Text>
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
    backgroundColor: Colors.colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.copy + '20',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.colors.primary,
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: Colors.colors.copy,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.colors.primary,
    marginBottom: 15,
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