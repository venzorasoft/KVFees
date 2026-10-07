import { Child, hasToken, listChildren, logout } from './api';
import { getItem, setItem } from './storage';

const LAST_CHILD_KEY = 'last_child_id';

export const rememberChild = (id: number) => setItem(LAST_CHILD_KEY, String(id));

type Route = { name: string; params?: object };

/**
 * Decide where the app opens. Signed in + a saved child => straight to the payment screen
 * (last-used child first), with the Dashboard underneath so Back lets you switch children.
 */
export async function resolveLaunchRoutes(): Promise<Route[]> {
  if (!(await hasToken())) return [{ name: 'Login' }];
  let children: Child[];
  try {
    children = await listChildren();
  } catch (e: any) {
    if (e?.response?.status === 401) {
      await logout();
      return [{ name: 'Login' }];
    }
    return [{ name: 'Main' }]; // offline: the home screen shows its own error
  }
  if (children.length === 0) return [{ name: 'Main' }, { name: 'AddChild' }];
  const lastId = Number(await getItem(LAST_CHILD_KEY));
  const child = children.find((c) => c.id === lastId) ?? children[0];
  return [{ name: 'Main' }, { name: 'Pay', params: { child } }];
}
