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
| Authentication | Google OAuth (구현 진행 중) |
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
 ├─ components
 │   ├─ Bottom       # BottomCTASection
 │   ├─ Feature      # FeatureSection
 │   ├─ Header       # Header
 │   ├─ Hero         # HeroSection
 │   └─ Layout       # Layout, Sidebar
 │
 ├─ pages
 │   ├─ Landing      # 서비스 소개
 │   ├─ Login        # Google OAuth 로그인
 │   ├─ HealthInput  # 건강 정보 입력
 │   ├─ Result       # 건강 분석 결과
 │   ├─ Dashboard    # 건강 대시보드
 │   └─ Challenge    # 챌린지 관리
 │
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

# 📅 개발 일지

## Day 1 — 프론트엔드 환경 구축

### 진행 내용
- Vite + React + TypeScript 초기 세팅
- 폴더 구조 설계 (components / pages 분리)
- Landing 페이지 기본 컴포넌트 제작 (Header, Hero, Feature)

### 구조 설계 이유

- **컴포넌트 기반 UI 구조** — React의 장점을 활용해 UI를 컴포넌트 단위로 분리하여 재사용 가능하도록 설계
- **Pages / Components 분리** — 페이지와 UI 컴포넌트를 분리하여 확장 시 유지보수성 향상
- **Vite 선택** — 빠른 개발 서버와 빌드 속도, React 프로젝트 개발에 최적화

---

## Day 2 — 로그인 페이지 제작

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

## Day 3 — HealthInput 페이지 구현

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

## Day 4 — Landing 및 Result 페이지 제작

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

## Day 5 — Dashboard 구현 및 UI 개선

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

## Day 6 — Vercel 배포 및 GitHub 연동

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

## 🔜 Future Work

- [ ] Google OAuth 로그인 연동 완료
- [ ] 백엔드 API endpoint 연결
- [ ] Dashboard 실데이터 연동
- [ ] 챌린지 페이지 구현
- [ ] 식단 분석 페이지 구현
- [ ] AI 건강 분석 기능 연동
