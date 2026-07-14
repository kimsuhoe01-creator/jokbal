/**
 * Firebase 실시간 주문 연결 설정
 * Firebase Console > 프로젝트 설정 > 내 앱 > SDK 설정 및 구성에서 값을 복사해 넣으세요.
 * 이 설정 값 자체는 비밀번호가 아닙니다. 실제 접근 권한은 database.rules.json으로 제어합니다.
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBJfGWOr4nvn9wjzPHeey2Ba29vd_FMp-U",
  authDomain: "jokbal-tablet.firebaseapp.com",
  databaseURL: "https://jokbal-tablet-default-rtdb.firebaseio.com",
  projectId: "jokbal-tablet",
  storageBucket: "jokbal-tablet.firebasestorage.app",
  messagingSenderId: "766915189072",
  appId: "1:766915189072:web:d260e859f68d82f4803455",
  measurementId: "G-9ZGHQN9SW6"
};

export const STORE_ID = "bacninh";
export const STORE_NAME = "족발신선생 박닌점";

export function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.databaseURL &&
    !Object.values(FIREBASE_CONFIG).some(value => String(value || "").includes("PASTE_"))
  );
}
