import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keychain/Keystore on phones; localStorage in the browser preview (no secure storage there).
export const getItem = async (k: string): Promise<string | null> =>
  Platform.OS === 'web' ? window.localStorage.getItem(k) : SecureStore.getItemAsync(k);

export const setItem = async (k: string, v: string): Promise<void> =>
  Platform.OS === 'web' ? void window.localStorage.setItem(k, v) : SecureStore.setItemAsync(k, v);

export const removeItem = async (k: string): Promise<void> =>
  Platform.OS === 'web' ? void window.localStorage.removeItem(k) : SecureStore.deleteItemAsync(k);
