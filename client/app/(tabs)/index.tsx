import React from 'react';
import { View, Text, Button } from 'react-native';
import { useLocalization } from '@/hooks/useLocalization';

export default function Tab() {

  const { language, setLanguage, t } = useLocalization();
  return (
    <View className="bg-background dark:bg-copy items-center justify-center flex-1">
      <Text className="text-lg mb-5">
        {t('welcome')} {t('description')}
      </Text>
      <Text>Current locale: {language}</Text>
      <Text>Device locale: {language}</Text>
      <View className="flex flex-row mt-4">
        <Button
          title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          onPress={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        />
      </View>
    </View>
  );
}
