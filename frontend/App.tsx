import { useFonts } from 'expo-font';
import { IBMPlexSans_400Regular, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { LayoutAnimation, Platform, UIManager, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from './theme';
import HomeScreen from './HomeScreen';
import ParsingScreen from './ParsingScreen';
import CriticalThreatScreen from './src/screens/CriticalThreatScreen';
import CompletedScreen from './src/screens/CompletedScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import BottomNav from './src/components/BottomNav';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LAYOUT_CONFIG = {
  duration: 300,
  create: { type: 'easeInEaseOut' as const, property: 'opacity' as const },
  update: { type: 'easeInEaseOut' as const },
};

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'parsing' | 'results' | 'completed' | 'history'>('home');
  const [documentName, setDocumentName] = useState('');
  const [ingestPayload, setIngestPayload] = useState<any>(null);

  const navigate = (screen: typeof currentScreen) => {
    LayoutAnimation.configureNext(LAYOUT_CONFIG);
    setCurrentScreen(screen);
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    });
    if (!result.canceled && result.assets?.[0]) {
      setDocumentName(result.assets[0].name);
      navigate('parsing');
    }
  };
  const [fontsLoaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      {currentScreen === 'home' && (
        <HomeScreen
          onNavigate={(name) => {
            setDocumentName(name);
            navigate('parsing');
          }}
          onViewHistory={() => navigate('history')}
          onIngestResult={setIngestPayload}
        />
      )}
      {currentScreen === 'parsing' && (
        <ParsingScreen
          documentName={documentName}
          payload={ingestPayload}
          onParsingComplete={() => navigate('results')}
        />
      )}
      {currentScreen === 'results' && (
        <CriticalThreatScreen
          key={ingestPayload ? 'live' : 'loading'}
          payload={ingestPayload}
          onDeployComplete={() => navigate('completed')}
          onDismiss={() => navigate('home')}
        />
      )}
      {currentScreen === 'completed' && (
        <CompletedScreen
          onNavigateHome={() => navigate('home')}
        />
      )}
      {currentScreen === 'history' && (
        <HistoryScreen
          onBack={() => navigate('home')}
        />
      )}
      {(currentScreen === 'home' || currentScreen === 'history') && (
        <BottomNav
          activeTab={currentScreen === 'history' ? 'history' : 'home'}
          onHomePress={() => navigate('home')}
          onHistoryPress={() => navigate('history')}
          onPickDocument={handlePickDocument}
        />
      )}
    </View>
  );
}
