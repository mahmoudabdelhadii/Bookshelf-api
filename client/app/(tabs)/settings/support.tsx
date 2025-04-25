import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help & Support</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <Text style={styles.text}>
          • How do I scan a book?{'\n'}
          • How do I add a book manually?{'\n'}
          • How do I organize my books?{'\n'}
          • How do I track my reading progress?
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="mail-outline" size={24} color={Colors.colors.primary} />
          <Text style={styles.contactText}>Email Support</Text>
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
  text: {
    fontSize: 16,
    color: Colors.colors.copy,
    lineHeight: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.colors.background,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.colors.primary,
  },
  contactText: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.colors.primary,
  },
}); 