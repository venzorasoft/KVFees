import { Alert as RNAlert, AlertButton, Platform } from 'react-native';

// react-native-web's Alert is a no-op, so fall back to window.alert / window.confirm in the browser.
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') return RNAlert.alert(title, message, buttons);
    const text = message ? `${title}\n\n${message}` : title;
    const action = buttons?.find((b) => b.style !== 'cancel');
    if (buttons && buttons.length > 1) {
      if (window.confirm(text)) action?.onPress?.();
    } else {
      window.alert(text);
    }
  },
};
