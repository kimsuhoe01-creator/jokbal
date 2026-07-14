# 족발신선생 박닌점 실시간 주문 연결 설정

이 프로젝트는 GitHub Pages 같은 정적 호스팅에서도 작동하도록 Firebase Realtime Database를 사용합니다.
고객 태블릿은 익명 로그인으로 주문을 생성하고, 카운터 태블릿은 직원 계정으로 전체 주문을 읽고 상태를 변경합니다.

## 1. Firebase 프로젝트 만들기

1. Firebase Console에서 새 프로젝트를 만듭니다.
2. 웹 앱(</>)을 추가합니다.
3. 웹 앱 설정에 표시되는 `firebaseConfig` 값을 복사합니다.
4. `js/firebase-config.js` 파일의 `PASTE_...` 값을 실제 값으로 교체합니다.

`databaseURL`은 반드시 Realtime Database 생성 후 표시되는 주소를 사용해야 합니다.

## 2. Authentication 켜기

Firebase Console → Authentication → 로그인 방법에서 다음 2개를 활성화합니다.

- 익명(Anonymous): 고객 태블릿용
- 이메일/비밀번호: 카운터 직원용

Authentication → 사용자에서 카운터 직원 계정을 하나 만듭니다.

Authentication → Settings → Authorized domains에 GitHub Pages 도메인(예: `kimsuhoe01-creator.github.io`)도 추가합니다.

## 3. Realtime Database 만들기

Firebase Console → Realtime Database → 데이터베이스 만들기.
리전은 매장과 가까운 아시아 리전을 선택합니다.

## 4. 보안 규칙 적용

Realtime Database → 규칙에서 프로젝트의 `database.rules.json` 내용을 그대로 붙여넣고 게시합니다.

## 5. 직원 UID 등록

1. Authentication → 사용자에서 직원 계정의 UID를 복사합니다.
2. Realtime Database → 데이터 화면에서 아래 구조를 직접 만듭니다.

```json
{
  "staff": {
    "직원_UID": true
  }
}
```

예: UID가 `abc123`이면 `/staff/abc123` 값을 boolean `true`로 저장합니다.

## 6. 배포 및 실행

- 고객 태블릿: 기존 사이트의 `index.html`을 설치해 사용합니다.
- 카운터 태블릿: 사이트 주소 뒤에 `/counter.html`을 붙여 접속한 뒤 PWA로 설치합니다.

예:

```text
https://계정명.github.io/저장소명/counter.html
```

카운터 화면에서 직원 이메일과 비밀번호로 로그인하고 `알림 켜기`를 한 번 누릅니다.
브라우저의 소리 및 알림 권한을 허용합니다.

## 7. 고객 태블릿 번호 설정

고객 태블릿 상단의 `테이블 설정` 버튼에서 고정 번호를 한 번 저장합니다.
예: `T1`, `T2`, `VIP룸`, `카운터 대여 1`.
이 값은 해당 태블릿에 저장되며 이후 주문에 자동 포함됩니다.

## 주문 처리 흐름

1. 손님이 메뉴를 장바구니에 담습니다.
2. 장바구니의 `주문 완료 · 직원에게 전송`을 누릅니다.
3. 카운터 태블릿에 소리·진동·화면 알림이 뜹니다.
4. 직원이 `주문 접수`를 누릅니다.
5. POS 입력 후 `POS 입력 완료`를 누릅니다.
6. 처리 후 `주문 완료`를 누릅니다.
7. 고객 태블릿에는 각 상태가 실시간으로 표시됩니다.

## 참고

카운터 PWA가 열려 있는 동안 실시간 알림, 소리, 진동, 브라우저 알림이 작동합니다.
앱이 완전히 종료된 상태에서도 푸시 알림을 받으려면 Firebase Cloud Messaging과 서버/Cloud Functions 설정을 별도로 추가해야 합니다.
