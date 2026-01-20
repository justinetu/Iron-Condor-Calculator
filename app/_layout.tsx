import { Stack } from 'expo-router';
import 'react-native-reanimated';
import stockDisplay from './screens/stockDisplay';

export default function RootLayout() {
  

  return (
    
    <Stack screenOptions={{
      headerTintColor: '#0F141A'
    }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="stockDisplay" options={{ headerShown: false }} />
    </Stack>
  );
}
