import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getItem, removeItem, setItem } from './storage';

const TOKEN_KEY = 'auth_token';

// Browser preview talks to localhost; phones/emulators use app.json's extra.apiUrl.
const baseURL =
  Platform.OS === 'web' ? 'http://localhost:8765' : ((Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://10.0.2.2:8765');

export const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use(async (cfg) => {
  const token = await getItem(TOKEN_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export type Child = { id: number; alias_name: string; unique_id: string; dob: string };
export type Payment = {
  id: number;
  child_id: number;
  amount: number;
  status: string;
  transaction_id: string | null;
  timestamp: string;
};

export const hasToken = async () => !!(await getItem(TOKEN_KEY));
export const logout = () => removeItem(TOKEN_KEY);

async function authenticate(path: string, body: object) {
  const { data } = await api.post(path, body);
  await setItem(TOKEN_KEY, data.access_token);
}

// In development the API also returns `dev_code`, so the login can be tested without SMS/email.
export const requestOtp = async (identifier: string) =>
  (await api.post<{ sent: boolean; dev_code?: string }>('/auth/otp/request', { identifier })).data;
export const verifyOtp = (identifier: string, code: string) => authenticate('/auth/otp/verify', { identifier, code });

export type Me = { id: number; name: string; email: string | null; mobile: string | null };
export const getMe = async () => (await api.get<Me>('/users/me')).data;
export const updateName = async (name: string) => (await api.patch<Me>('/users/me', { name })).data;

export const listChildren = async () => (await api.get<Child[]>('/children/')).data;
export const addChild = async (c: Omit<Child, 'id'>) => (await api.post<Child>('/children/', c)).data;
export const updateChild = async (id: number, c: Omit<Child, 'id'>) => (await api.patch<Child>(`/children/${id}`, c)).data;
export const deleteChild = (id: number) => api.delete(`/children/${id}`);
export const listPayments = async () => (await api.get<Payment[]>('/payments/history')).data;
export const recordPayment = (p: { child_id: number; amount: number; status: string; transaction_id?: string }) =>
  api.post('/payments/record', p);
export const addReminder = (message: string, due_date: string) => api.post('/notifications/', { message, due_date });
export const setPushToken = (push_token: string) => api.put('/users/me/push-token', { push_token });
