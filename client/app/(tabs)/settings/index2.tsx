import React, { useState } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';


export default function Tab() {
  // Set the initial language to the device's locale or default to English
  const deviceLocale = getLocales()[0].languageCode;
  const [language, setLanguage] = useState(deviceLocale ?? 'en');

 
  return (
    <View style={styles.container}>
      
      <Text>Device locale: {deviceLocale}</Text>

      {/* Buttons to Change Language */}
      <View style={styles.buttonContainer}>
        <Button title="English" onPress={() => setLanguage('en')} />
        <Button title="Arabic" onPress={() => setLanguage('ar')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  text: {
    fontSize: 20,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
});
