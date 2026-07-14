import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
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
const STATUS_LABELS = { new: '신규', accepted: '접수', pos_done: 'POS 입력', completed: '완료', cancelled: '취소' };
const FILTER_TITLES = { new: '신규 주문', accepted: '접수된 주문', pos_done: 'POS 입력 완료', completed: '완료된 주문', all: '전체 주문' };

let app;
let auth;
let database;
let currentFilter = 'new';
let orders = new Map();
let knownOrderIds = new Set();
let unsubscribeListeners = [];
let activeAlertOrderId = '';
let pendingAlerts = [];
let alarmEnabled = false;
let audioContext = null;
let alarmTimer = null;

function setConnection(online) {
  const badge = $('#connectionBadge');
  badge.className = `connection-badge ${online ? 'online' : 'offline'}`;
  badge.textContent = online ? '● 실시간 연결됨' : '● 연결 끊김';
}

function showLogin(message = '') {
  $('#dashboard').classList.add('hidden');
  $('#loginPanel').classList.remove('hidden');
  $('#logoutButton').classList.add('hidden');
  $('#loginError').textContent = message;
}

function showDashboard() {
  $('#loginPanel').classList.add('hidden');
  $('#dashboard').classList.remove('hidden');
  $('#logoutButton').classList.remove('hidden');
  renderAll();
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
  beep(880, 0.16, 0);
  beep(1040, 0.16, 0.22);
  beep(1320, 0.22, 0.44);
  navigator.vibrate?.([180, 90, 180, 90, 260]);
}

function startRepeatingAlarm() {
  clearInterval(alarmTimer);
  playAlarmPattern();
  alarmTimer = setInterval(() => {
    if (!activeAlertOrderId) return clearInterval(alarmTimer);
    playAlarmPattern();
  }, 6500);
}

function stopRepeatingAlarm() {
  clearInterval(alarmTimer);
  alarmTimer = null;
}

function formatTime(order) {
  const date = order.createdAt ? new Date(order.createdAt) : new Date(order.submittedAtLocal || Date.now());
  return date.toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}

function elapsedText(order) {
  const time = Number(order.createdAt) || Date.parse(order.submittedAtLocal || '') || Date.now();
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  return minutes < 1 ? '방금 전' : `${minutes}분 전`;
}

function optionText(option) {
  const label = option?.ko || option?.vi || option?.en || option?.zh || '';
  return option?.kind === 'hallGift' ? `🎁 ${label}` : label;
}

function renderOrderCard(order) {
  const itemRows = (order.items || []).map(item => {
    const optionLines = (item.options || []).map(option => optionText(option)).filter(Boolean);
    const size = item.sizeKo || item.size || '';
    return `<div class="order-item"><div><strong>${escapeHtml(item.nameKo || item.name || '')}</strong>${size && size !== '단품' ? `<small>사이즈: ${escapeHtml(size)}</small>` : ''}${optionLines.length ? `<small>${optionLines.map(escapeHtml).join('<br>')}</small>` : ''}</div><span class="order-item-qty">× ${Number(item.qty || 0)}</span></div>`;
  }).join('');
  const status = order.status || 'new';
  const nextAction = status === 'new'
    ? `<button class="primary" data-action="accepted">주문 접수</button>`
    : status === 'accepted'
      ? `<button class="primary" data-action="pos_done">POS 입력 완료</button>`
      : status === 'pos_done'
        ? `<button class="primary" data-action="completed">주문 완료</button>`
        : `<button class="secondary" data-action="accepted">접수 상태로 복원</button>`;
  const card = document.createElement('article');
  card.className = `order-card ${status === 'new' ? 'is-new' : ''}`;
  card.dataset.orderId = order.id;
  card.innerHTML = `
    <div class="order-card-head">
      <div><div class="order-table">${escapeHtml(order.tableLabel || '테이블 미설정')}</div><div class="order-meta">#${escapeHtml(String(order.id || '').slice(-6).toUpperCase())} · ${formatTime(order)} · ${elapsedText(order)}</div></div>
      <span class="status-pill status-${status}">${STATUS_LABELS[status] || status}</span>
    </div>
    <div class="order-items">${itemRows || '<div>메뉴 정보 없음</div>'}</div>
    <div class="order-total"><span>${Number(order.itemCount || 0)}개 메뉴</span><strong>${fmt(order.total)}</strong></div>
    <div class="order-actions">${nextAction}<button class="secondary" data-action="cancelled">취소 처리</button></div>`;
  card.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => updateOrderStatus(order.id, button.dataset.action));
  });
  return card;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function filteredOrders() {
  return [...orders.values()]
    .filter(order => currentFilter === 'all' || order.status === currentFilter)
    .sort((a, b) => (Number(b.createdAt) || Date.parse(b.submittedAtLocal || '') || 0) - (Number(a.createdAt) || Date.parse(a.submittedAtLocal || '') || 0));
}

function updateCounts() {
  const list = [...orders.values()];
  ['new','accepted','pos_done','completed'].forEach(status => {
    const target = document.getElementById(`count${status === 'pos_done' ? 'PosDone' : status[0].toUpperCase() + status.slice(1)}`);
    if (target) target.textContent = list.filter(order => order.status === status).length;
  });
  $('#countAll').textContent = list.length;
}

function renderAll() {
  updateCounts();
  $('#listTitle').textContent = FILTER_TITLES[currentFilter];
  document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === currentFilter));
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
  if (!orderId) return;
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
    notification.onclick = () => { window.focus(); showAlert(order.id); };
  }
  if (!activeAlertOrderId) showAlert(order.id);
}

function showAlert(orderId) {
  const order = orders.get(orderId);
  if (!order) return;
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
  clearListeners();
  const ordersRef = ref(database, `stores/${STORE_ID}/orders`);
  const recentQuery = query(ordersRef, orderByChild('createdAt'), limitToLast(150));
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
    if (isNewArrival && value.status === 'new') notifyNewOrder(value);
  }));

  unsubscribeListeners.push(onChildChanged(recentQuery, snapshot => {
    orders.set(snapshot.key, { id: snapshot.key, ...snapshot.val() });
    renderAll();
  }));

  unsubscribeListeners.push(onChildRemoved(recentQuery, snapshot => {
    orders.delete(snapshot.key);
    knownOrderIds.delete(snapshot.key);
    renderAll();
  }));
}

async function verifyStaff(user) {
  const staffSnapshot = await get(ref(database, `staff/${user.uid}`));
  if (staffSnapshot.val() !== true) {
    await signOut(auth);
    throw new Error('이 계정은 직원 권한이 없습니다. Firebase의 staff 목록에 UID를 등록하세요.');
  }
}

async function handleSignedIn(user) {
  try {
    await verifyStaff(user);
    showDashboard();
    await loadOrders();
  } catch (error) {
    showLogin(error.message);
  }
}

function bindUi() {
  $('#alarmButton').addEventListener('click', enableAlarm);
  $('#logoutButton').addEventListener('click', () => signOut(auth));
  $('#refreshButton').addEventListener('click', loadOrders);
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => { currentFilter = button.dataset.filter; renderAll(); });
  });
  $('#alertAcknowledge').addEventListener('click', acknowledgeAlert);
  $('#alertAccept').addEventListener('click', async () => {
    const id = activeAlertOrderId;
    if (id) await updateOrderStatus(id, 'accepted');
  });
  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    $('#loginError').textContent = '';
    $('#loginButton').disabled = true;
    try {
      await signInWithEmailAndPassword(auth, $('#loginEmail').value.trim(), $('#loginPassword').value);
    } catch (error) {
      $('#loginError').textContent = '로그인 정보를 확인해주세요.';
      console.error(error);
    } finally {
      $('#loginButton').disabled = false;
    }
  });
}

function initialize() {
  bindUi();
  updateAlarmButton();
  if (!isFirebaseConfigured()) {
    $('#setupWarning').classList.remove('hidden');
    showLogin('Firebase 설정값이 아직 입력되지 않았습니다.');
    $('#loginButton').disabled = true;
    return;
  }

  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  database = getDatabase(app);
  onValue(ref(database, '.info/connected'), snapshot => setConnection(snapshot.val() === true));
  onAuthStateChanged(auth, user => {
    clearListeners();
    if (user) handleSignedIn(user);
    else showLogin();
  });
}

initialize();
