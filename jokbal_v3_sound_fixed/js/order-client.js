import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  getDatabase,
  push,
  ref,
  serverTimestamp,
  set
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';
import {
  FIREBASE_CONFIG,
  STORE_ID,
  isFirebaseConfigured
} from './firebase-config.js';

const TABLE_KEY = 'jokbal_table_label';
const DEVICE_KEY = 'jokbal_device_id';

let auth = null;
let database = null;
let authReadyPromise = null;
let configured = false;

function getOrCreateDeviceId() {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
}

function waitForAuthUser() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async user => {
        if (user) {
          unsubscribe();
          resolve(user);
          return;
        }
        try {
          const credential = await signInAnonymously(auth);
          unsubscribe();
          resolve(credential.user);
        } catch (error) {
          unsubscribe();
          reject(error);
        }
      }, reject);
    });
  }
  return authReadyPromise;
}

function initialize() {
  configured = isFirebaseConfigured();
  if (!configured) {
    window.dispatchEvent(new CustomEvent('jokbal:realtime-ready', { detail: { configured: false } }));
    return;
  }

  try {
    const app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    database = getDatabase(app);
    waitForAuthUser()
      .then(() => window.dispatchEvent(new CustomEvent('jokbal:realtime-ready', { detail: { configured: true } })))
      .catch(error => {
        console.error('Firebase anonymous sign-in failed:', error);
        window.dispatchEvent(new CustomEvent('jokbal:realtime-error', { detail: error }));
      });
  } catch (error) {
    configured = false;
    console.error('Firebase initialization failed:', error);
    window.dispatchEvent(new CustomEvent('jokbal:realtime-error', { detail: error }));
  }
}

async function submitOrder(payload) {
  if (!configured || !database || !auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const user = await waitForAuthUser();
  const orderRef = push(ref(database, `stores/${STORE_ID}/orders`));
  const orderId = orderRef.key;
  const order = {
    ...payload,
    id: orderId,
    storeId: STORE_ID,
    customerUid: user.uid,
    deviceId: getOrCreateDeviceId(),
    status: 'new',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    submittedAtLocal: new Date().toISOString()
  };

  await set(orderRef, order);
  return { id: orderId, ...order };
}

function getTableLabel() {
  return (localStorage.getItem(TABLE_KEY) || '').trim();
}

function setTableLabel(value) {
  const normalized = String(value || '').trim().slice(0, 30);
  if (normalized) localStorage.setItem(TABLE_KEY, normalized);
  else localStorage.removeItem(TABLE_KEY);
  window.dispatchEvent(new CustomEvent('jokbal:table-changed', { detail: { tableLabel: normalized } }));
  return normalized;
}

window.JokbalRealtime = {
  isConfigured: () => configured,
  submitOrder,
  getTableLabel,
  setTableLabel,
  clearLastOrderId: () => {}
};

initialize();
