# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

uter |
| Authentication | Google OAuth (예정) |

---

# 🐹 MyHealthBuddy

> **건강 검진 데이터와 생활 습관을 분석해 챌린지로 연결하는 AI 기반 건강 관리 웹 서비스**

단순히 건강 수치를 보여주는 데 그치지 않고,
**입력 → 분석 → 피드백 → 실천 → 지속**의 흐름을 경험할 수 있도록 설계

---

## 🛠 Tech Stack

| 분야 | 기술 |
|------|------|
| Framework | React |
| Build Tool | Vite |
| Language | TypeScript |
| Styling | CSS |
| Routing | React Router |
| Authentication | Google OAuth |
| Deployment | Vercel |

---

## 🗺 서비스 흐름

```text
Landing → Login → Health Input → Health Result → Dashboard → Challenge
```

건강 정보 입력 → 건강 분석 → 챌린지 기반 건강 관리 구조로 설계

사용자는 건강 정보를 입력한 뒤 분석 결과를 확인하고,
Dashboard에서 건강 상태 요약과 챌린지를 확인하며
지속적인 건강 관리 습관을 형성하도록 설계했습니다.

---

## 📁 Project Structure

```text
src
 ├─ api
 │   ├─ client.ts        # Axios 공통 설정 (baseURL, 인터셉터)
 │   ├─ auth.ts          # 인증 관련 API
 │   ├─ health.ts        # 건강 입력 및 AI 분석 관련 API
 │   ├─ user.ts          # 사용자 관련 API
 │   └─ endpoints.ts     # API 엔드포인트 관리
 ├─ components
 │   ├─ Bottom           # BottomCTASection
 │   ├─ Feature          # FeatureSection
 │   ├─ Header           # Header
 │   ├─ Hero             # HeroSection
 │   └─ Layout           # Layout, Sidebar
 ├─ pages
 │   ├─ Landing          # 서비스 소개
 │   ├─ Login            # Google OAuth 로그인
 │   ├─ HealthInput      # 건강 정보 입력
 │   ├─ Result           # 건강 분석 결과
 │   ├─ Dashboard        # 건강 대시보드
 │   └─ Challenge        # 챌린지 관리
 ├─ types
 │   └─ auth.ts          # 인증 타입 정의
 ├─ utils
 │   └─ storage.ts       # 로컬 스토리지 유틸
 ├─ App.tsx
 ├─ main.tsx
 └─ index.css
```

---

## 🎨 Design System

건강 서비스의 신뢰감과 안정감을 위해 **그린 계열 컬러**를 사용합니다.

| 용도 | 컬러 |
|------|------|
| Primary | `#6DBA7B` |
| Secondary | `#4C9A5F` |
| Background | `#E8F5EA` |

초록 계열 색상은 건강, 안정감, 긍정적인 행동 변화를 상징하며
사용자가 지속적으로 서비스를 이용할 때 시각적 피로도를 줄이는 장점이 있습니다.

---

## 🚀 시작하기

```bash
# 프로젝트 생성
npm create vite@latest frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

- 개발 서버: `http://localhost:5173`
- 배포 주소: `https://frontend-one-omega-59.vercel.app`

---

## 📅 개발 일지

---

## 🌱 Day 1 — 프론트엔드 환경 구축

### 진행 내용
- Vite + React + TypeScript 초기 세팅
- 폴더 구조 설계 (components / pages 분리)
- Landing 페이지 기본 컴포넌트 제작 (Header, Hero, Feature)

### 구조 설계 이유

- **컴포넌트 기반 UI 구조** — React의 장점을 활용해 UI를 컴포넌트 단위로 분리하여 재사용 가능하도록 설계
- **Pages / Components 분리** — 페이지와 UI 컴포넌트를 분리하여 확장 시 유지보수성 향상
- **Vite 선택** — 빠른 개발 서버와 빌드 속도, React 프로젝트 개발에 최적화

---

## 🔐 Day 2 — 로그인 페이지 제작

### 진행 내용
- Google OAuth 기반 로그인 UI 설계
- 서비스 소개(좌) + 로그인 카드(우) 2단 레이아웃 구성

```bash
npm install @react-oauth/google
```

```bash
# .env
VITE_GOOGLE_CLIENT_ID=your_client_id
```

### 설계 이유

- **회원가입 과정 최소화** — Google OAuth를 활용해 별도의 회원가입 없이 빠른 로그인 경험 제공
- **인증 시스템 확장 고려** — 추후 Apple, 카카오, 네이버 등 소셜 로그인 확장 가능성 고려

---

## 🏥 Day 3 — HealthInput 페이지 구현

### 입력 항목

| 카테고리 | 항목 |
|---------|------|
| 기본 정보 | 닉네임, 나이, 성별, 키, 체중 |
| 건강 수치 | 수축기 혈압, 이완기 혈압, 총 콜레스테롤, 공복 혈당 |
| 생활 습관 | 흡연 여부, 음주 여부, 운동 여부 |

생활 습관 항목은 선택형 버튼 UI로 구성 — `예` 선택 시 추가 입력 가능

### 설계 이유

- **건강 데이터 입력 간소화** — 건강 데이터를 한 화면에서 입력할 수 있도록 구성하여 사용자 입력 흐름 단순화
- **선택형 UI 도입** — 생활 습관 항목을 예 / 아니오 버튼 형태로 구성하여 모바일 환경에서도 빠른 입력 가능
- **데이터 확장 고려** — 추후 운동 시간, 식단 기록, 수면 데이터 등 추가 입력 항목 확장 가능하도록 구조 설계

---

## 🎨 Day 4 — Landing 및 Result 페이지 제작

### Landing 구성

| 영역 | 설명 |
|------|------|
| Hero | 서비스 소개 |
| Feature | 주요 기능 소개 (건강 분석, AI 건강 코멘트, 맞춤 챌린지, 캐릭터 성장) |
| CTA | 서비스 시작 버튼 |

### 설계 이유

- **서비스 핵심 기능 전달** — Landing 페이지에서 서비스 목적과 주요 기능을 명확하게 전달하여 사용자의 서비스 이해도 향상
- **CTA 중심 구조** — Landing 페이지의 최종 목표는 로그인 유도이므로 서비스 설명 → 기능 소개 → 로그인 CTA 구조로 설계

### Result 표시 정보
- 건강 지표 요약 (혈압 / 콜레스테롤 / 혈당)
- 심혈관 위험도
- AI 건강 코멘트 영역 (추후 연동)
- 추천 챌린지

### 설계 이유

- **건강 정보 가독성 확보** — 건강 데이터를 카드 형태로 표현하여 사용자가 쉽게 이해할 수 있도록 UI 설계
- **AI 분석 확장 고려** — 추후 AI 모델을 연동하여 심혈관 질환 위험도, 생활 습관 개선 코멘트 등을 제공할 수 있도록 분석 영역 구조 설계

---

## 📊 Day 5 — Dashboard 구현 및 UI 개선

### 공통 Layout 구조 도입

```text
Layout
 ├─ Sidebar
 └─ Main Content
```

### 도입 이유

- **UI 일관성 유지** — 모든 페이지에서 동일한 구조 사용
- **재사용성 확보** — 새로운 페이지 추가 시 Layout + Page 구조만 적용하면 되도록 설계
- **확장성 고려** — 서비스 규모가 커질 경우에도 Layout 구조 유지 가능

### CSS 파일 분리 구조

각 컴포넌트마다 개별 CSS 파일 분리 (예: `Header.tsx` + `Header.css`)

- **컴포넌트 단위 스타일 관리** — UI 수정 시 영향 범위를 최소화
- **스타일 충돌 방지** — 모든 스타일을 하나의 CSS에 작성할 경우 클래스 충돌 발생 가능
- **유지보수 편의성** — 특정 UI 수정 시 해당 컴포넌트 CSS만 수정 가능

### Dashboard 구성

| 영역 | 기능 |
|------|------|
| 인사 영역 | 사용자 환영 메시지 (`안녕하세요, {사용자명}님 👋`) |
| 건강 점수 카드 | 오늘의 건강 점수 |
| 건강 지표 카드 | 혈압 / 혈당 / 콜레스테롤 |
| 오늘의 챌린지 | 건강 습관 체크 |

Dashboard는 사용자가 서비스에 접속했을 때 가장 먼저 확인하는 핵심 화면이므로
건강 상태 요약과 오늘의 챌린지를 한 화면에서 바로 확인할 수 있도록 구성했습니다.

### 로그인 UI 개선
- Google 로그인 버튼 중앙 정렬 및 레이아웃 정리
- UI 간격 및 정렬 개선
- 사용자 이름 기반 개인화 인사 메시지 적용

### 적용 이유

- **사용자 맞춤 경험 제공** — 개인화된 인사 메시지로 서비스 몰입도 향상
- **개인화 서비스 확장 기반 구축** — 추후 맞춤형 건강 데이터 및 챌린지 추천 기반 마련

---

## 🚀 Day 6 — Vercel 배포 및 GitHub 연동

### 진행 내용
- GitHub Repository 생성
- Vercel 프로젝트 생성
- GitHub 연동 자동 배포 설정
- 환경 변수 설정

### Vercel 도입 이유

| 이유 | 설명 |
|------|------|
| 자동 배포 | GitHub push 시 자동 빌드 및 배포 |
| 프론트 최적화 | React / Vite 프로젝트에 최적화 |
| 서버 관리 불필요 | nginx / docker 설정 불필요 |
| 협업 효율 | GitHub 기반 배포 관리 |

### 배포 구조

```text
Local Development → GitHub Repository → Vercel Build → Production Deployment
```

### 배포 과정

```bash
# 1. GitHub 코드 업로드
git init
git add .
git commit -m "initial frontend setup"
git push origin main
```

```text
# 2. Vercel 프로젝트 생성 후 Build 설정 자동 인식
Framework      : Vite
Build Command  : npm run build
Output Dir     : dist

# 3. 자동 Deploy
GitHub 코드 다운로드 → npm install → npm run build → dist 생성 → CDN 배포
```

### 시스템 구조

```text
User
 ↓
Frontend (Vercel · React + Vite)
 ↓
FastAPI Backend
 ↓
Database
```

---

## 🔗 Day 7 — Google OAuth 로그인 연동 및 환경 설정 디버깅

### 진행 내용
- Frontend와 Backend를 실제로 연결하여 Google OAuth 로그인 테스트 진행
- Google OAuth Client 설정 및 승인 주소 등록
- Frontend API 구조 기능별 분리
- 환경 변수 설정 및 배포 환경 변수 점검
- 로그인 실패 원인을 단계적으로 분석 (CORS, 환경 변수, Mixed Content 등)

---

### API 통신 구조 정리

Google OAuth 로그인 이후 Backend API 호출이 늘어날 것을 고려하여 API 구조를 기능별로 분리했습니다.

```text
src
 ├─ api
 │   ├─ client.ts       # Axios 공통 설정 (baseURL 관리)
 │   ├─ auth.ts         # 인증 요청
 │   ├─ health.ts       # 건강 입력 및 AI 분석 요청
 │   ├─ user.ts         # 사용자 요청
 │   └─ endpoints.ts    # 엔드포인트 상수 관리
 ├─ types
 │   └─ auth.ts         # 인증 타입 정의
 └─ utils
     └─ storage.ts      # 토큰 저장 유틸
```

**구조 분리 이유**
- Backend base URL 공통 관리
- 인증 요청과 사용자 요청 분리
- 건강 입력 및 AI 분석 요청 별도 모듈화
- API 확장 시 유지보수 용이

---

### 환경 변수 설정

Frontend와 Backend 간 통신을 위해 환경 변수를 설정했습니다.

```bash
# .env
VITE_GOOGLE_CLIENT_ID=...
VITE_API_BASE_URL=...
```

| 변수 | 역할 |
|------|------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 로그인 요청 |
| `VITE_API_BASE_URL` | Backend API 요청 기본 주소 |

로컬 개발 환경과 배포 환경을 분리하여 관리하도록 설계했습니다.

---

### Google OAuth Client 설정

Google Cloud Console에서 OAuth Client를 생성하고 승인 주소를 등록했습니다.

| 항목 | 등록 예시 |
|------|---------|
| 승인된 JavaScript 원본 | `http://localhost:포트번호`, `https://배포도메인` |
| 승인된 Redirect URI | `http://localhost:포트번호`, `https://배포도메인` |

> OAuth 인증은 등록된 주소에서만 로그인 요청을 허용하기 때문에
> 로컬 환경과 배포 환경 주소를 모두 등록해야 정상 동작합니다.

---

### Day 7 기준 로그인 흐름

```text
User
 ↓
Frontend
 ↓
Google OAuth 로그인
 ↓
Authorization Code 반환
 ↓
Backend 로그인 API 호출
 ↓
Backend → Google Token 교환
 ↓
Access Token 발급
 ↓
Frontend 저장
 ↓
Dashboard 이동
```

---

### 디버깅 과정

Google OAuth 로그인 테스트 중 로그인 실패가 발생했고, 다음 항목들을 순차적으로 확인했습니다.

#### 1. API 요청 경로 문제

배포 환경에서 API 요청이 Backend가 아닌 Frontend 주소로 전송되는 문제가 발생했습니다.

```text
# 잘못된 요청 경로 예시
https://frontend-domain/api/v1/auth/login/google
```

**원인** — `VITE_API_BASE_URL` 환경 변수가 배포 환경에 적용되지 않음

**조치**
- Axios 설정 확인
- Vercel 배포 환경 변수 추가
- 재배포 후 API 요청 경로 정상 확인

---

#### 2. CORS 문제

브라우저에서 preflight 요청이 차단되는 현상을 확인했습니다.

```text
OPTIONS /auth/login/google
405 Method Not Allowed
```

**원인** — Frontend와 Backend의 Origin이 서로 달라 브라우저가 요청을 차단

**조치** — Backend에 CORS 설정 추가

```python
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:포트번호",
    "https://배포도메인",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

#### 3. Mixed Content 문제

배포 환경에서 HTTPS → HTTP 요청 시 브라우저 보안 정책에 의해 차단되는 문제를 확인했습니다.

```text
HTTPS Frontend → HTTP Backend 호출 → Mixed Content 차단
```

**조치** — Day 7 단계에서는 배포 환경 대신 로컬 환경 기준으로 OAuth 로그인 테스트를 진행했습니다.

---

### Day 7 정리

| 확인한 문제 | 결과 |
|------------|------|
| API baseURL 환경 변수 미적용 | 배포 환경 변수 추가로 해결 |
| Backend CORS 미설정 | CORS 미들웨어 추가로 해결 |
| Mixed Content (HTTPS → HTTP) | 로컬 환경 기준으로 우선 테스트 |
| Google OAuth 승인 주소 설정 | redirect URI 영역으로 원인 범위 좁힘 |

---

## ⚙️ Day 8 — OAuth 문제 해결 및 AI 분석 기능 연동

### 진행 내용
- Redirect URI 문제 해결 및 Google OAuth 로그인 성공
- Challenge 페이지 구현
- 로그인 이후 사용자 흐름 분기 설계
- HealthInput 페이지 Backend API 연동
- AI 분석 요청 구현
- AI 분석 로딩 페이지 구현

---

### 1. Redirect URI 문제 해결

Day 7에서 Backend OAuth redirect URI가 Backend callback 주소 기준으로 설정되어 있었습니다.

```bash
# Day 7 설정
GOOGLE_REDIRECT_URI=http://backend-domain/auth/callback
```

하지만 실제 로그인 흐름이 `Frontend → Google → Frontend → Backend` 구조였기 때문에
redirect URI를 **Frontend 기준**으로 맞추는 방향으로 테스트를 진행했습니다.

#### 테스트 과정

**배포 환경 테스트**

```bash
GOOGLE_REDIRECT_URI=https://frontend-domain
```

Mixed Content, API 호출 차단, OAuth redirect 흐름 문제가 동시에 발생하여
로컬 환경 기준으로 다시 변경했습니다.

**로컬 환경 테스트**

```bash
GOOGLE_REDIRECT_URI=http://localhost:5173/
```

로컬 주소로 변경했지만, Google token 교환 단계에서 여전히 오류가 발생했습니다.

**문자열 차이 확인 및 최종 해결**

OAuth 인증에서는 redirect URI가 **문자열 기준으로 완전히 일치**해야 합니다.

```text
http://localhost:5173/   ← 슬래시 있음  ❌
http://localhost:5173    ← 슬래시 없음  ✅
```

슬래시(/)를 제거한 주소로 통일한 후 Google OAuth 로그인이 정상 동작했습니다.

```bash
GOOGLE_REDIRECT_URI=http://localhost:5173
```

---

### 2. Challenge 페이지 구현

건강 분석 결과 이후 사용자의 행동 변화를 유도하기 위한 챌린지 페이지 UI를 구현했습니다.

#### 챌린지 카드 구성

| 항목 | 설명 |
|------|------|
| 챌린지 제목 | 미션 이름 |
| 설명 | 실천 방법 |
| 추천 이유 | 건강 개선 효과 |
| 시작 버튼 | 챌린지 시작 |

#### 비로그인 사용자 접근 처리

비로그인 사용자가 챌린지를 클릭할 경우, 로그인 후 원래 보던 챌린지 페이지로 돌아올 수 있도록 설계했습니다.

```text
챌린지 클릭 (비로그인)
 ↓
로그인 페이지 이동
 ↓
로그인 완료
 ↓
챌린지 페이지로 복귀  ← postLoginRedirectPath 활용
```

---

### 3. 로그인 이후 사용자 흐름 분기

Google OAuth는 로그인과 회원가입이 동시에 처리되기 때문에
사용자 상태에 따라 화면 이동을 분기하도록 설계했습니다.

```text
최초 사용자          기존 사용자
    ↓                    ↓
로그인              로그인
    ↓                    ↓
건강검진 입력        Dashboard
    ↓
AI 분석
    ↓
챌린지
```

---

### 4. HealthInput 페이지 API 연동

건강검진 입력 데이터를 Backend API와 연결했습니다.

```text
POST /api/v1/health/records
```

**요청 데이터**

| 필드 | 설명 |
|------|------|
| `systolic_bp` | 수축기 혈압 |
| `diastolic_bp` | 이완기 혈압 |
| `total_cholesterol` | 총 콜레스테롤 |
| `glucose` | 공복 혈당 |
| `height` | 신장 |
| `weight` | 체중 |
| `smoke_yn` | 흡연 여부 |
| `alcohol_yn` | 음주 여부 |
| `exercise_yn` | 운동 여부 |

**응답** — `record_id` 반환 → 이후 AI 분석 요청에 활용

---

### 5. 비로그인 사용자 흐름 문제 발생

서비스에서 로그인 없이도 건강 분석을 체험할 수 있는 구조를 고려했습니다.

**목표 흐름**

```text
Landing → 건강검진 입력 → AI 분석 → 결과 → 로그인
```

하지만 구현 과정에서 비로그인 상태에서는 `accessToken`이 없어 분석 API 요청이 실패하는 문제가 발생했습니다.

**원인** — 현재 API 구조가 인증 기반으로 설계되어 있어, 비로그인 상태의 분석 요청을 지원하지 않음

→ 비로그인 체험 흐름은 서비스 구조 재설계가 필요한 부분으로 확인되었습니다. 따라서 현재 구조에서는 분석 기능을 로그인 사용자 전용으로 제한하고, 추후 체험 기능을 별도 API로 분리하는 방향을 검토하고 있습니다.

---

### 6. AI 분석 요청 구현

건강 기록 생성 후 AI 분석 요청을 수행하도록 구현했습니다.

```text
POST /api/v1/health/analysis/{record_id}
```

**응답** — `task_id`, `status` 반환 → 이후 폴링으로 결과 조회

---

### 7. AI 분석 로딩 페이지 구현

AI 분석이 비동기 작업이기 때문에 사용자 경험을 위한 로딩 페이지 UI를 구현했습니다.

#### 로딩 페이지 구성

| 요소 | 설명 |
|------|------|
| 로고 | MyHealthBuddy 브랜딩 |
| 애니메이션 | 햄스터 쳇바퀴 |
| 메시지 | 분석 진행 안내 |
| 진행률 | 퍼센트 표시 |

로딩 중에는 `task_id`를 기반으로 백엔드에 분석 완료 여부를 반복 조회(polling)하는 구조로 구현했습니다.

#### 문제 발생 — 로딩 92%에서 멈춤

AI 분석 연결 과정에서 로딩이 약 92%에서 멈추는 문제가 발생했습니다.

```text
분석 요청 → polling 시작 → 완료 신호 미수신 → 92%에서 중단
```

실제 테스트에서는 분석 진행률이 약 92%까지 증가한 뒤 더 이상 상태 업데이트가 발생하지 않았고, 결과 페이지로 이동하지 않는 현상이 확인되었습니다.

**원인 후보**
- 백엔드 분석 완료 상태가 polling 응답에 반영되지 않음
- polling 응답의 `status` 값 처리 로직 미흡
- 분석 완료 후 결과 페이지로의 라우팅 조건 누락

→ Day 8에서는 로딩 페이지 UI 및 polling 구조 구현까지 완료되었으며, AI 분석 결과 페이지 연결은 미완성 상태입니다.

---

### Day 8 결과

| 항목 | 결과 |
|------|------|
| Google OAuth 로그인 | ✅ 정상 동작 |
| redirect URI 문제 해결 | ✅ 슬래시 제거로 해결 |
| Challenge 페이지 구현 | ✅ 완료 |
| 건강검진 입력 API 연동 | ✅ 완료 |
| AI 분석 요청 구현 | ✅ 완료 |
| AI 분석 로딩 페이지 | ✅ UI 및 polling 구조 완료 |
| AI 분석 결과 페이지 연결 | ❌ 미완성 (로딩 92% 중단) |
| 비로그인 체험 흐름 | ❌ 미완성 (구조 재설계 필요) |

---

### 이번 작업에서 얻은 인사이트

- **OAuth에서 redirect URI는 문자열 완전 일치** — 슬래시(/) 하나 차이도 인증 실패 원인이 될 수 있다
- **Google이 비교하는 기준은 Backend가 실제로 보내는 값** — Google Console 등록 여부와 별개로, Backend 코드 내 redirect URI 값이 일관되게 통일되어 있어야 한다
- **OAuth 디버깅 시 세 영역을 동시에 확인해야 한다**

```text
Frontend 설정
 ↕
Backend 설정
 ↕
Google Cloud Console
```

---

## 🔜 Future Work

- [ ] AI 분석 상태 polling 로직 개선 (로딩 92% 문제 해결) 및 결과 페이지 연결 완료
- [ ] 비로그인 체험 흐름 구조 재설계
- [ ] 배포 환경 Google OAuth 연동 완료 (Mixed Content 해결)
- [ ] Dashboard 실데이터 연동
- [ ] Result 페이지 데이터 시각화 개선
- [ ] 식단 분석 페이지 구현
- [ ] AI 건강 분석 기능 전체 연동