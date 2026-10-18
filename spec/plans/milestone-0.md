# תוכנית — Milestone 0: הקמת הפרויקט ופריסה אוטומטית

מבוסס על: `MILESTONES.md` (Milestone 0), `ARCHITECTURE.md` (§1, §6, §7, §8), `DESIGN.md` (Style Guide, החלטות 3 ו-5).

**מטרה:** שלד פרויקט Vite + TypeScript שרץ מקומית, עם בדיקה אחת שעוברת, דף זמני בעברית („סימון”) ברקע כהה, ו-Workflow שמפרסם אוטומטית ל-GitHub Pages בכל Push ל-`main`.

**מחוץ לטווח של Milestone זה:** לוח המשחק, לוגיקת משחק, צלילים, Local Storage, PWA/Service Worker, אייקונים. רק תשתית + דף זמני.

---

## 0. תנאים מקדימים (פעולות משתמשת)

1. **התקנת Node.js** — כרגע Node.js ו-npm **אינם מותקנים** במחשב (נבדק). לפני הבנייה, המשתמשת מתקינה את גרסת ה-LTS העדכנית מ-https://nodejs.org (Windows Installer, ברירות מחדל), ואז סוגרת ופותחת מחדש את אפליקציית Claude. Claude ידריך צעד אחר צעד בתחילת הבנייה ויוודא עם `node -v` ו-`npm -v`.
2. **GitHub Repository** — ה-repo המקומי כבר מחובר ל-`https://github.com/annaknovak-ai/Simon.git`. בזמן הדחיפה Claude יוודא שה-Repository קיים ב-GitHub; אם לא — ידריך ליצור אותו (ריק, בלי README).
3. **הגדרת GitHub Pages** (אחרי הדחיפה הראשונה, בהדרכה): Settings ← Pages ← Source: **GitHub Actions**.

אין צורך במפתחות או בסודות — לא נוצר `.env` / `.env.example` (ARCHITECTURE.md §8: אין משתני סביבה סודיים).

---

## 1. מבנה הקבצים שייווצרו

```
Simon/
├─ .github/workflows/deploy.yml   # Build + test + deploy to GitHub Pages
├─ index.html                     # lang="he" dir="rtl", mobile viewport
├─ package.json
├─ package-lock.json              # created by npm install (needed for npm ci)
├─ tsconfig.json
├─ vite.config.ts                 # base: '/Simon/' + Vitest config
├─ src/
│  ├─ main.ts                     # entry: imports styles, renders placeholder page
│  ├─ appInfo.ts                  # tiny pure module (APP_TITLE = 'סימון') used by the test
│  └─ styles/
│     ├─ tokens.css               # design tokens (CSS variables)
│     └─ base.css                 # reset, dark background, font, RTL layout
└─ tests/
   └─ appInfo.test.ts             # one basic passing test
```

`.gitignore` הקיים כבר מכסה `node_modules/` ו-`dist/` — אין צורך לשנות אותו.

---

## 2. פרטי מימוש

### 2.1 package.json
- `"type": "module"`, `"private": true`, שם: `simon`.
- Scripts:
  - `"dev": "vite"`
  - `"build": "tsc --noEmit && vite build"` (בדיקת טיפוסים לפני Build)
  - `"preview": "vite preview"` (לתצוגה מקומית בלבד — לא Production, לפי §7.2)
  - `"test": "vitest run"`
- devDependencies: `vite`, `typescript`, `vitest` (גרסאות יציבות עדכניות, נעולות ב-`package-lock.json`).
- dependencies: `@fontsource/rubik` — קובצי הגופן נארזים בפרויקט ומוגשים מאותו אתר (ולא מ-Google Fonts), לפי החלטה 3 — כך שיעבדו Offline ב-Milestone 4. ייבוא המשקלים הנדרשים בלבד: 400, 500, 600, 700.

### 2.2 vite.config.ts
- `base: '/Simon/'` — האתר יפורסם ב-`https://annaknovak-ai.github.io/Simon/` (שם ה-Repository: `Simon`, ARCHITECTURE.md §7.4).
- הגדרת Vitest באותו קובץ (`test: { environment: 'node' }`) — אין צורך ב-DOM לבדיקה הזו.
- `vite-plugin-pwa` **לא** מותקן עכשיו (Milestone 4).

### 2.3 tsconfig.json
הגדרות סטנדרטיות של Vite ל-Vanilla TS: `strict: true`, `target`/`lib` ES2020 + DOM, `moduleResolution: "bundler"`, `noEmit: true`, `include: ["src", "tests"]`, `types: ["vite/client"]`.

### 2.4 index.html
- `<html lang="he" dir="rtl">`
- `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `<meta name="theme-color" content="#111827">`
- `<title>סימון</title>`
- `<div id="app"></div>` + `<script type="module" src="/src/main.ts">`

### 2.5 src/styles/tokens.css — Design tokens (מ-DESIGN.md)
משתני CSS על `:root`:

| קבוצה | משתנים |
|---|---|
| צבעי משחק | `--color-red: #FF3B30`, `--color-yellow: #FFC107`, `--color-green: #4CD964`, `--color-blue: #3B82F6` |
| ניטרליים | `--color-charcoal: #1F2937`, `--color-gray: #6B7280`, `--color-light-gray: #E5E7EB`, `--color-white: #F8FAFC` |
| סמנטיים | `--color-success: #10B981`, `--color-error: #EF4444`, `--color-warning: #F59E0B`, `--color-info: #3B82F6` |
| רקע | `--color-bg: #111827` (החלטה 5) |
| גופן | `--font-family: 'Rubik', system-ui, sans-serif` |
| טיפוגרפיה | לכל רמה גודל/משקל/גובה שורה: H1 700 32px/1.2; H2 600 24px/1.3; H3 500 18px/1.4; Body 400 16px/1.5; Caption 400 14px/1.4 (למשל `--h1-size`, `--h1-weight`, `--h1-line`) |
| פינות | `--radius-main: 12px`, `--radius-card: 8px`, `--radius-pill: 999px` |
| קווים | `--border-thin: 1px`, `--border-thick: 2px` |
| צללים | `--shadow-soft: 0 2px 8px rgba(0,0,0,0.1)` |
| מרווחים | `--space-x: 16px`, `--space-y: 24px` |

(גוונים עמומים/בהירים של המקטעים ו-Glow ייגזרו ב-Milestone 1, כשבונים את הלוח.)

### 2.6 src/styles/base.css
- Reset בסיסי (`box-sizing: border-box`, `margin: 0`).
- `body`: רקע `var(--color-bg)`, צבע טקסט `var(--color-white)`, גופן Rubik, `min-height: 100dvh`.
- `#app`: עמודה אחת ממורכזת, ריפוד `var(--space-y) var(--space-x)`.
- `h1`: לפי טוקני H1.

### 2.7 src/appInfo.ts + src/main.ts
- `appInfo.ts`: `export const APP_TITLE = 'סימון';` (מודול טהור, ללא DOM).
- `main.ts`: מייבא את `@fontsource/rubik` (המשקלים שנבחרו), `tokens.css`, `base.css`; מכניס ל-`#app` כותרת `<h1>` עם `APP_TITLE`. זה כל הדף הזמני.

### 2.8 tests/appInfo.test.ts
בדיקה אחת: `APP_TITLE` שווה ל-`'סימון'`. מטרתה לוודא ש-Vitest מוגדר ועובד, ולשמש לבדיקת "כשל עוצר פריסה".

### 2.9 .github/workflows/deploy.yml
- **Triggers:** `push` ל-`main` + `workflow_dispatch` (הפעלה ידנית).
- **Permissions (מינימליות, ברמת ה-Workflow):** `contents: read`, `pages: write`, `id-token: write`.
- **concurrency:** `group: pages`, `cancel-in-progress: false`.
- **Job `build`** (ubuntu-latest):
  1. `actions/checkout`
  2. `actions/setup-node` — Node LTS, `cache: npm`
  3. `npm ci`
  4. `npm test`
  5. `npm run build`
  6. `actions/configure-pages`
  7. `actions/upload-pages-artifact` — `path: dist`
- **Job `deploy`** — `needs: build` (לכן כשל בבדיקות או ב-Build עוצר את הפריסה), `environment: github-pages` עם `url` מתוצר הפריסה, צעד `actions/deploy-pages`.
- **נעילת גרסאות:** כל Action נעול ל-**SHA מלא** של הגרסה היציבה האחרונה, עם הערה שמציינת את מספר הגרסה (למשל `# v4.2.2`). ה-SHA נקבע בזמן הבנייה מתוך ה-tags הרשמיים (`git ls-remote`), ולא מומצא.

---

## 3. החלטות טכניות לתיעוד כ-ADR (ב-ARCHITECTURE.md, בסוף הבנייה)

- **ADR-1: גופן Rubik דרך `@fontsource/rubik`** — הקשר: החלטה 3 דורשת קובצי גופן מקומיים שיעבדו Offline. החלטה: חבילת npm שקובציה נארזים ע"י Vite ומוגשים מאותו מקור. השלכות: אין תלות ב-Google Fonts; ב-Milestone 4 הקבצים ייכנסו ל-Cache של ה-Service Worker.
- **ADR-2: `base: '/Simon/'`** — לפי שם ה-Repository ב-GitHub. השלכות: אם ה-Repository ישנה שם או יעבור לדומיין מותאם — יש לעדכן את `base`.

---

## 4. סדר עבודה בבנייה

1. הדרכת המשתמשת להתקנת Node.js ווידוא `node -v` / `npm -v`.
2. יצירת `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, קובצי `src/` ו-`tests/`.
3. `npm install` (מייצר `package-lock.json`).
4. הרצת `npm test` ו-`npm run build` — חייבים לעבור.
5. הרצת `npm run dev`, פתיחה בדפדפן המובנה ובדיקה: כותרת „סימון”, רקע כהה `#111827`, כיוון RTL, גופן Rubik, תצוגת מובייל (375px). סגירת השרת בסיום.
6. כתיבת `.github/workflows/deploy.yml` עם SHA מלאים.
7. הוספת ADR-1, ADR-2 ל-ARCHITECTURE.md; מילוי „פקודות הרצה” ב-CLAUDE.md (`npm run dev`, `npm test`).
8. סימון 🟡 ליד Milestone 0 ב-MILESTONES.md. **בלי commit.**

### אחרי אישור — „דחוף שינויים לגיטהאב”
1. וידוא שה-Repository קיים ב-GitHub; commit + push ל-`main`.
2. הדרכה: Settings ← Pages ← Source: GitHub Actions (אם ה-Workflow הראשון נכשל כי Pages עוד לא הוגדר — הפעלה מחדש דרך „Run workflow” אחרי ההגדרה).
3. בדיקה שה-Workflow הצליח והאתר זמין ב-`https://annaknovak-ai.github.io/Simon/`; המשתמשת פותחת בטלפון Android וב-iPhone.
4. **בדיקת "כשל עוצר פריסה"** — רק באישור נפרד של המשתמשת (דורשת שתי דחיפות נוספות): commit שמשנה את הבדיקה כך שתיכשל ← push ← וידוא שה-job `deploy` לא רץ והאתר לא השתנה ← commit שמחזיר את הבדיקה ← push ← וידוא שהפריסה חזרה לעבוד.

---

## 5. בדיקה מול Definition of Done

| תנאי | איך נבדק | מתי |
|---|---|---|
| `npm run dev` מציג את הדף מקומית | Claude מריץ ופותח בדפדפן המובנה | בבנייה |
| `npm test` ו-`npm run build` עוברים | הרצה מקומית | בבנייה |
| Push ל-`main` מפעיל Workflow שמצליח | לשונית Actions ב-GitHub | אחרי הדחיפה |
| כשל בבדיקות עוצר את הפריסה | בדיקה שנכשלת בכוונה ואז מוחזרת | אחרי הדחיפה, באישור |
| הדף זמין ב-HTTPS ונפתח ב-Android וב-iPhone | המשתמשת פותחת בטלפונים | אחרי הדחיפה |
| מימין לשמאל, רקע כהה, כותרת „סימון” | בדיקה ויזואלית מקומית + בטלפון | בבנייה + אחרי הדחיפה |
