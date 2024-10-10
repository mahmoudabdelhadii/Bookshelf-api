import React, { useState } from "react";
import { View, StyleSheet, Text, Button } from "react-native";
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";
import en from "../../locales/en/translation.json";
import ar from "../../locales/ar/translation.json";

// Set the key-value pairs for the different languages you want to support.
const translations = { en, ar };
const i18n = new I18n(translations);

// Enable fallback to English when a translation is missing in the selected language.
i18n.enableFallback = true;

export default function Tab() {
  // Set the initial language to the device's locale or default to English
  const deviceLocale = getLocales()[0].languageCode;
  const [language, setLanguage] = useState(deviceLocale ?? "en");

  // Change i18n locale when language changes
  i18n.locale = language;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {i18n.t("welcome")} {i18n.t("description")}
      </Text>
      <Text>Current locale: {i18n.locale}</Text>
      <Text>Device locale: {deviceLocale}</Text>

      {/* Buttons to Change Language */}
      <View style={styles.buttonContainer}>
        <Button title="English" onPress={() => setLanguage("en")} />
        <Button title="Arabic" onPress={() => setLanguage("ar")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  text: {
    fontSize: 20,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 16,
  },
});
