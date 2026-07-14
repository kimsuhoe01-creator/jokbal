import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  get,
  getDatabase,
  limitToLast,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onValue,
  orderByChild,
  query,
  ref,
  serverTimestamp,
  update
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';
import { FIREBASE_CONFIG, STORE_ID, isFirebaseConfigured } from './firebase-config.js';

const $ = selector => document.querySelector(selector);
const fmt = value => Number(value || 0).toLocaleString('vi-VN') + '₫';
const ACTIVE_STATUSES = new Set(['new', 'accepted', 'pos_done']);
const STATUS_LABELS = {
  new: '대기',
  accepted: '대기',
  pos_done: '대기',
  completed: '완료',
  cancelled: '취소'
};
const FILTER_TITLES = {
  active: '대기 주문',
  completed: '완료된 주문',
  all: '전체 주문'
};

let auth;
let database;
let currentFilter = 'active';
let orders = new Map();
let knownOrderIds = new Set();
let unsubscribeListeners = [];
let activeAlertOrderId = '';
let pendingAlerts = [];
let alarmEnabled = false;
let audioContext = null;
let alarmTimer = null;
let orderAudio = new Audio('sounds/order.mp3');
orderAudio.preload='auto';

function setConnection(online) {
  const badge = $('#connectionBadge');
  badge.className = `connection-badge ${online ? 'online' : 'offline'}`;
  badge.textContent = online ? '● 실시간 연결됨' : '● 연결 끊김';
}

function updateAlarmButton() {
  const button = $('#alarmButton');
  button.classList.toggle('enabled', alarmEnabled);
  button.textContent = alarmEnabled ? '🔔 알림 켜짐' : '🔕 알림 켜기';
}

async function enableAlarm() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') await audioContext.resume();
    alarmEnabled = true;
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    updateAlarmButton();
    playAlarmPattern();
  } catch (error) {
    console.error(error);
  }
}

function beep(frequency = 880, duration = 0.16, delay = 0) {
  if (!alarmEnabled || !audioContext) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playAlarmPattern() {
  if (!alarmEnabled) return;
  try {
    orderAudio.currentTime = 0;
    orderAudio.play().catch(()=>{});
  } catch(e){}
  navigator.vibrate?.([200,100,200]);
}

function startRepeatingAlarm() {
  clearInterval(alarmTimer);
  playAlarmPattern();
  alarmTimer = setInterval(() => {
    if (!activeAlertOrderId) {
      clearInterval(alarmTimer);
      return;
    }
    playAlarmPattern();
  }, 6500);
}

function stopRepeatingAlarm() {
  clearInterval(alarmTimer);
  alarmTimer = null;
}

function safeOrderTime(order) {
  const serverTime = Number(order.createdAt);
  if (Number.isFinite(serverTime) && serverTime > 0) return serverTime;
  const localTime = Date.parse(order.submittedAtLocal || '');
  return Number.isFinite(localTime) ? localTime : Date.now();
}

function formatTime(order) {
  return new Date(safeOrderTime(order)).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function elapsedText(order) {
  const minutes = Math.max(0, Math.floor((Date.now() - safeOrderTime(order)) / 60000));
  return minutes < 1 ? '방금 전' : `${minutes}분 전`;
}

function optionText(option) {
  const label = option?.ko || option?.vi || option?.en || option?.zh || '';
  return option?.kind === 'hallGift' ? `🎁 홀 무료 서비스: ${label}` : label;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[char]);
}

function isActive(order) {
  return ACTIVE_STATUSES.has(order.status || 'new');
}

function renderOrderCard(order) {
  const itemRows = (order.items || []).map(item => {
    const optionLines = (item.options || []).map(optionText).filter(Boolean);
    const size = item.sizeKo || item.size || '';
    return `
      <div class="order-item">
        <div>
          <strong>${escapeHtml(item.nameKo || item.name || '')}</strong>
          ${size && size !== '단품' && size !== 'single' ? `<small>사이즈: ${escapeHtml(size)}</small>` : ''}
          ${optionLines.length ? `<small>${optionLines.map(escapeHtml).join('<br>')}</small>` : ''}
        </div>
        <span class="order-item-qty">× ${Number(item.qty || 0)}</span>
      </div>`;
  }).join('');

  const status = order.status || 'new';
  const actions = isActive(order)
    ? `<button class="primary" data-action="completed">완료 처리</button><button class="secondary" data-action="cancelled">취소 · 숨김</button>`
    : `<button class="secondary restore-button" data-action="new">대기 목록으로 복원</button>`;

  const card = document.createElement('article');
  card.className = `order-card ${isActive(order) ? 'is-new' : ''}`;
  card.dataset.orderId = order.id;
  card.innerHTML = `
    <div class="order-card-head">
      <div>
        <div class="order-table">${escapeHtml(order.tableLabel || '테이블 미설정')}</div>
        <div class="order-meta">#${escapeHtml(String(order.id || '').slice(-6).toUpperCase())} · ${formatTime(order)} · ${elapsedText(order)}</div>
      </div>
      <span class="status-pill status-${status}">${STATUS_LABELS[status] || status}</span>
    </div>
    <div class="order-items">${itemRows || '<div>메뉴 정보 없음</div>'}</div>
    <div class="order-total"><span>${Number(order.itemCount || 0)}개 메뉴</span><strong>${fmt(order.total)}</strong></div>
    <div class="order-actions ${isActive(order) ? '' : 'single-order-action'}">${actions}</div>`;

  card.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => updateOrderStatus(order.id, button.dataset.action));
  });
  return card;
}

function filteredOrders() {
  return [...orders.values()]
    .filter(order => {
      if (currentFilter === 'active') return isActive(order);
      if (currentFilter === 'completed') return order.status === 'completed';
      return true;
    })
    .sort((a, b) => safeOrderTime(b) - safeOrderTime(a));
}

function updateCounts() {
  const list = [...orders.values()];
  $('#countActive').textContent = list.filter(isActive).length;
  $('#countCompleted').textContent = list.filter(order => order.status === 'completed').length;
  $('#countAll').textContent = list.length;
}

function renderAll() {
  updateCounts();
  $('#listTitle').textContent = FILTER_TITLES[currentFilter];
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });

  const list = $('#orderList');
  list.innerHTML = '';
  const visible = filteredOrders();
  if (!visible.length) {
    list.innerHTML = `<div class="order-empty">현재 표시할 주문이 없습니다.</div>`;
    return;
  }
  visible.forEach(order => list.appendChild(renderOrderCard(order)));
}

async function updateOrderStatus(orderId, status) {
  if (!orderId || !database) return;
  try {
    await update(ref(database, `stores/${STORE_ID}/orders/${orderId}`), {
      status,
      updatedAt: serverTimestamp(),
      [`${status}At`]: serverTimestamp()
    });
    if (activeAlertOrderId === orderId) acknowledgeAlert();
  } catch (error) {
    alert(`상태 변경 실패: ${error.message}`);
  }
}

function notifyNewOrder(order) {
  pendingAlerts.push(order.id);
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(`새 주문 · ${order.tableLabel || '테이블 미설정'}`, {
      body: `${order.itemCount || 0}개 메뉴 · ${fmt(order.total)}`,
      icon: './icons/icon-192.png',
      tag: `order-${order.id}`,
      renotify: true
    });
    notification.onclick = () => {
      window.focus();
      showAlert(order.id);
    };
  }
  if (!activeAlertOrderId) showAlert(order.id);
}

function showAlert(orderId) {
  const order = orders.get(orderId);
  if (!order || !isActive(order)) return;
  activeAlertOrderId = orderId;
  pendingAlerts = pendingAlerts.filter(id => id !== orderId);
  $('#alertTable').textContent = order.tableLabel || '테이블 미설정';
  $('#alertSummary').textContent = `${order.itemCount || 0}개 메뉴 · ${fmt(order.total)}`;
  $('#newOrderAlert').classList.remove('hidden');
  startRepeatingAlarm();
}

function acknowledgeAlert() {
  $('#newOrderAlert').classList.add('hidden');
  activeAlertOrderId = '';
  stopRepeatingAlarm();
  const nextId = pendingAlerts.shift();
  if (nextId) setTimeout(() => showAlert(nextId), 250);
}

function clearListeners() {
  unsubscribeListeners.forEach(unsubscribe => unsubscribe?.());
  unsubscribeListeners = [];
  orders.clear();
  knownOrderIds.clear();
}

async function loadOrders() {
  if (!database) return;
  clearListeners();
  const ordersRef = ref(database, `stores/${STORE_ID}/orders`);
  const recentQuery = query(ordersRef, orderByChild('createdAt'), limitToLast(200));
  const initial = await get(recentQuery);

  if (initial.exists()) {
    initial.forEach(child => {
      const value = { id: child.key, ...child.val() };
      orders.set(child.key, value);
      knownOrderIds.add(child.key);
    });
  }
  renderAll();

  unsubscribeListeners.push(onChildAdded(recentQuery, snapshot => {
    const id = snapshot.key;
    const value = { id, ...snapshot.val() };
    const isNewArrival = !knownOrderIds.has(id);
    knownOrderIds.add(id);
    orders.set(id, value);
    renderAll();
    if (isNewArrival && isActive(value)) notifyNewOrder(value);
  }));

  unsubscribeListeners.push(onChildChanged(recentQuery, snapshot => {
    const value = { id: snapshot.key, ...snapshot.val() };
    orders.set(snapshot.key, value);
    if (!isActive(value)) pendingAlerts = pendingAlerts.filter(id => id !== snapshot.key);
    renderAll();
  }));

  unsubscribeListeners.push(onChildRemoved(recentQuery, snapshot => {
    orders.delete(snapshot.key);
    knownOrderIds.delete(snapshot.key);
    pendingAlerts = pendingAlerts.filter(id => id !== snapshot.key);
    renderAll();
  }));
}

function bindUi() {
  $('#alarmButton').addEventListener('click', enableAlarm);
  $('#refreshButton').addEventListener('click', () => loadOrders().catch(console.error));
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      renderAll();
    });
  });
  $('#alertAcknowledge').addEventListener('click', acknowledgeAlert);
}

async function initialize() {
  bindUi();
  updateAlarmButton();
  renderAll();

  if (!isFirebaseConfigured()) {
    $('#setupWarning').classList.remove('hidden');
    setConnection(false);
    return;
  }

  try {
    const app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    database = getDatabase(app);
    await signInAnonymously(auth);
    onValue(ref(database, '.info/connected'), snapshot => setConnection(snapshot.val() === true));
    await loadOrders();
  } catch (error) {
    console.error(error);
    setConnection(false);
    $('#setupWarning').classList.remove('hidden');
    $('#setupWarning').innerHTML = `<strong>Firebase 연결에 실패했습니다.</strong><p>${escapeHtml(error.message || '설정을 확인해주세요.')}</p>`;
  }
}

initialize();
