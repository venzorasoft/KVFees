import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { rememberChild } from '../launch';
import { Linking } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { RootStack } from '../../App';
import { recordPayment } from '../api';
import { PORTAL_HOST, PORTAL_URL, RECEIPT_SCRIPT, buildFillScript } from '../autofill';

export default function PayScreen({ route }: NativeStackScreenProps<RootStack, 'Pay'>) {
  const { child } = route.params;
  const recorded = useRef(new Set<string>());
  useEffect(() => {
    rememberChild(child.id);
  }, [child.id]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'receipt' && !recorded.current.has(msg.txn)) {
        recorded.current.add(msg.txn);
        recordPayment({ child_id: child.id, amount: msg.amount, status: 'success', transaction_id: msg.txn }).catch(() => {});
      }
    } catch {}
  };

  return (
    <WebView
      source={{ uri: PORTAL_URL }}
      originWhitelist={[`https://${PORTAL_HOST}`]}
      // Anything off the bank's host opens in the system browser, never inside the app.
      onShouldStartLoadWithRequest={(req) => {
        if (new URL(req.url).hostname.endsWith(PORTAL_HOST)) return true;
        Linking.openURL(req.url);
        return false;
      }}
      onLoadEnd={() => {}}
      injectedJavaScript={buildFillScript(child.unique_id, child.dob) + RECEIPT_SCRIPT}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      incognito
    />
  );
}
