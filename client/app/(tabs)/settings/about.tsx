import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About Bookshelf</Text>
      <Text style={styles.text}>
        Bookshelf is a modern app for managing your book collection. 
        Scan barcodes, organize your books, and keep track of your reading progress.
      </Text>
      <Text style={styles.version}>Version 1.0.0</Text>
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
  text: {
    fontSize: 16,
    color: Colors.colors.copy,
    lineHeight: 24,
    marginBottom: 20,
  },
  version: {
    fontSize: 14,
    color: Colors.colors.copy,
    opacity: 0.7,
  },
}); 