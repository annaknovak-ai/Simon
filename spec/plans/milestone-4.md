# תוכנית Milestone 4 — PWA ועבודה Offline

מקורות: MILESTONES.md (Milestone 4), PRD.md §2 (User Story „Offline”), §4.6 (PWA ו-Offline), Edge Cases (אין אינטרנט; יכולות PWA משתנות), §5; ARCHITECTURE.md §1.1, §1.5 (סיכוני התקנה ו-Cache), §2.2 (E. PWA Runtime), §4.4, §6, §7.4, §9; DESIGN.md (Style Guide — צבעים, החלטות 3, 5, 10, 11); ADR-1, ADR-2, ADR-6.

## 1. מטרה והיקף

לאפשר התקנה של המשחק בטלפון (Android ו-iPhone), ומשחק מלא בלי אינטרנט אחרי טעינה ראשונה — כולל צלילים, גופן ושמירת ניקוד.

**בתוך ההיקף:** `vite-plugin-pwa` עם Workbox, Web App Manifest, Service Worker, Cache לכל משאבי האפליקציה, התאמה לנתיב `/Simon/`, מדיניות עדכון גרסה, אייקון אפליקציה, תגיות `<head>` להתקנה ב-iPhone, בדיקה אוטומטית לתוצר ה-Build.

**מחוץ להיקף:**
- הוראות התקנה או כפתור „התקן” בתוך המשחק (DESIGN החלטה 10). ההסבר ניתן בצ'אט.
- הודעה בתוך המשחק על „גרסה חדשה זמינה” — לא מוגדרת ב-spec (סעיף 4).
- חיווי „אתה Offline” — לא מוגדר ב-spec.
- כל שינוי במסכים, בלוגיקת המשחק, בשמע או באחסון.

## 2. ספריות

| חבילה | גרסה | סוג | תפקיד |
|---|---|---|---|
| `vite-plugin-pwa` | `2.0.0` (פורסמה 03.10.2026, תומכת ב-Vite 8) | devDependency | יוצר Manifest ו-Service Worker בזמן ה-Build |
| `@vite-pwa/assets-generator` | `^1` או `^2` (לפי peerDependency של התוסף) | devDependency | הרצה חד-פעמית: הפקת קובצי ה-PNG של האייקון מתוך קובץ SVG |

`workbox-build` / `workbox-window` מגיעים כתלויות של התוסף. אין שימוש ב-Workbox בזמן ריצה מעבר למה שהתוסף מייצר.

## 3. Manifest

מוגדר בתוך `vite.config.ts` (שדה `manifest` של התוסף):

| שדה | ערך | מקור |
|---|---|---|
| `name` | `סימון` | `<title>` הקיים / `APP_TITLE` |
| `short_name` | `סימון` | כנ"ל |
| `lang` | `he` | PRD — ממשק בעברית |
| `dir` | `rtl` | כנ"ל |
| `start_url` / `scope` | `/Simon/` | ADR-2, ARCHITECTURE §7.4 |
| `display` | `standalone` | חוויית אפליקציה בלי שורת כתובת |
| `orientation` | `portrait` | Mobile-First; המסכים מעוצבים לאורך |
| `background_color` | `#111827` | רקע המסך (DESIGN החלטה 5) |
| `theme_color` | `#111827` | תואם ל-`<meta name="theme-color">` הקיים |
| `icons` | 192×192, 512×512, ו-512×512 `maskable` | סעיף 5 |

`description` לא נכלל — אין ב-spec טקסט תיאור למוצר, ולא אמציא אחד.

## 4. Service Worker ומדיניות Cache

- **מצב:** `generateSW` (Workbox מייצר את הקובץ; אין קוד Service Worker ידני).
- **Precache:** כל קובצי ה-Build — `**/*.{html,js,css,svg,png,ico,woff2,woff}`. כך נכנסים HTML, JavaScript, CSS, האייקונים וקובצי הגופן Rubik (ADR-1). אין קובצי שמע (ADR-6).
- **ניווט Offline:** `navigateFallback` ל-`index.html` (ברירת המחדל של התוסף), כך שפתיחה מהמסך הראשי במצב טיסה טוענת את המשחק.
- **ללא Runtime Caching** ובלי בקשות לשרתים חיצוניים — אין כאלה באפליקציה.
- **רישום:** `injectRegister: 'auto'` — התוסף מוסיף סקריפט רישום קטן ל-HTML. אין צורך לשנות את `src/main.ts`.
- **נתיבים:** התוסף משתמש ב-`base: '/Simon/'` הקיים, כך שה-Manifest, האייקונים וה-Service Worker מוגשים תחת `/Simon/` וה-scope הוא `/Simon/`.

### מדיניות עדכון גרסה (מניעת קבצים מעורבים)

`registerType: 'prompt'` **בלי** הצגת הודעה, כלומר בלי `skipWaiting` ובלי `clientsClaim` — התנהגות ברירת המחדל של Service Worker:
1. כשיוצאת גרסה חדשה, הטלפון מוריד אותה ברקע בפעם הבאה שהמשחק נפתח עם אינטרנט.
2. הגרסה הישנה ממשיכה לפעול עד שהמשחק נסגר לגמרי.
3. בפתיחה הבאה — כל הקבצים מהגרסה החדשה בבת אחת.

**למה:** כל קובץ מתוצר ה-Build נשמר יחד עם „טביעת אצבע” של הגרסה, וגרסה חדשה נכנסת לשימוש רק כשלמה. כך אף פעם לא מעורבבים קבצים מגרסאות שונות, ולא קורה רענון אוטומטי באמצע משחק (שהיה מאפס את המשחק). **המחיר:** העדכון נראה רק בפתיחה השנייה אחרי הפרסום. ב-iPhone ייתכן שצריך לסגור את האפליקציה מרשימת האפליקציות הפתוחות.

`cleanupOutdatedCaches: true` — מוחק מה-Cache קבצים של גרסאות קודמות אחרי שהחדשה נכנסה.

## 5. אייקון האפליקציה (DESIGN החלטה 11)

- **מקור:** `public/icon.svg` — ריבוע ברקע `#111827`, ובמרכזו לוח המשחק: ארבעה משולשים הנפגשים במרכז, באותו סידור כמו ב-`src/ui/board.ts` (צהוב למעלה, ירוק מימין, כחול למטה, אדום משמאל), בצבעי המשחק מ-`tokens.css` (`#FFC107`, `#4CD964`, `#3B82F6`, `#FF3B30`), עם פינות מעוגלות קלות למשולשים. בלי טקסט.
- **אזור בטוח:** הלוח תופס בערך 60% מהרוחב, כדי שגרסת ה-`maskable` (שאנדרואיד חותך לעיגול/צורה) לא תחתוך את המשולשים.
- **הפקה:** `@vite-pwa/assets-generator` עם preset `minimal-2023`, הרצה חד-פעמית דרך סקריפט `npm run icons` (קובץ `pwa-assets.config.ts`). התוצרים נשמרים ב-`public/` ונכנסים ל-Git:
  - `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`
  - `apple-touch-icon-180x180.png` (iPhone)
  - `favicon.ico`
- רקע ה-apple-touch-icon וה-maskable: `#111827` (iPhone מוסיף רקע לבן לשקיפות).

## 6. שינויים ב-`index.html`

הוספה ל-`<head>` (נתיבים יחסיים ל-`base`, Vite משלים אותם):
- `<link rel="icon" href="/favicon.ico" sizes="48x48">` ו-`<link rel="icon" href="/icon.svg" type="image/svg+xml">`
- `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">`
- `<meta name="apple-mobile-web-app-title" content="סימון">` — השם מתחת לאייקון ב-iPhone.
- `<meta name="apple-mobile-web-app-capable" content="yes">` ו-`<meta name="mobile-web-app-capable" content="yes">` — פתיחה במסך מלא מהמסך הראשי.
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` — שורת הסטטוס על הרקע הכהה (ה-`viewport-fit=cover` כבר קיים). בבנייה אבדוק שהתוכן העליון לא מוסתר; אם כן — אוסיף ריווח עליון לפי `env(safe-area-inset-top)` ב-`base.css`.

ה-`<link rel="manifest">` נוסף אוטומטית על ידי התוסף.

## 7. קבצים

| קובץ | פעולה |
|---|---|
| `package.json` / `package-lock.json` | הוספת שתי ה-devDependencies, וסקריפט `icons` |
| `vite.config.ts` | הוספת `VitePWA({...})` לפי סעיפים 3–4 |
| `pwa-assets.config.ts` | חדש — הגדרת הפקת האייקונים |
| `public/icon.svg` | חדש — מקור האייקון |
| `public/*.png`, `public/favicon.ico` | חדשים — תוצרי ההפקה |
| `index.html` | תגיות לפי סעיף 6 |
| `src/styles/base.css` | רק אם נדרש ריווח עליון (סעיף 6) |
| `tests/pwaBuild.test.ts` | חדש — סעיף 8 |
| `.gitignore` | ללא שינוי (`dist/` כבר קיים; קובצי ה-Service Worker נוצרים בתוך `dist/`) |
| `spec/ARCHITECTURE.md` | ADR-9 (סעיף 10) |
| `spec/MILESTONES.md` | סימון 🟡 בסיום |

## 8. בדיקות

### 8.1 אוטומטיות — `tests/pwaBuild.test.ts`
הבדיקה מריצה את ה-Build של Vite לתיקייה זמנית (דרך ה-API של Vite, `build()` עם `outDir` זמני) ובודקת:
- נוצר `manifest.webmanifest` תקין (JSON) עם: `name` = `סימון`, `lang` = `he`, `dir` = `rtl`, `start_url` ו-`scope` = `/Simon/`, `display` = `standalone`, הצבעים `#111827`, ואייקונים 192 ו-512 כולל `maskable`; כל קובץ אייקון שמופיע ב-Manifest קיים בתוצר.
- נוצר `sw.js`, ורשימת ה-Precache שלו כוללת את `index.html`, קובץ JS, קובץ CSS, לפחות קובץ גופן `.woff2` אחד, ואת האייקונים.
- `index.html` בתוצר מכיל קישור ל-Manifest תחת `/Simon/` וקישור ל-`apple-touch-icon`.

כך גם ה-Workflow ב-GitHub Actions (שמריץ `npm test` לפני הפריסה) יעצור פריסה שבה ה-PWA שבור. אם ה-Build בתוך הבדיקה איטי מדי (מעל ~30 שניות) — אעביר את הבדיקה לסקריפט נפרד שרץ אחרי `npm run build` ב-Workflow, ואדווח.

### 8.2 בדיקה שלי מקומית (לפני 🟡)
Service Worker לא פועל ב-`npm run dev` (ברירת המחדל של התוסף), ולכן:
1. `npm run build` ואז `npm run preview` (תצוגה מקומית של התוצר — לבדיקה בלבד, ARCHITECTURE §7.2).
2. בדפדפן המובנה: בדיקה שה-Service Worker רשום ופעיל, שה-Manifest נטען בלי שגיאות, ושה-Cache מכיל את כל הקבצים.
3. כיבוי השרת (כמו מצב טיסה) ורענון: המשחק נטען, הגופן Rubik מוצג, אפשר לשחק, והניקוד נשמר.
4. עדכון גרסה: שינוי זמני קטן, Build מחדש, פתיחה — בדיקה שהגרסה הישנה ממשיכה לעבוד שלמה, ושאחרי סגירה ופתיחה נטענת החדשה בשלמותה. השינוי הזמני מוחזר.
5. `npm test` — כל הבדיקות (קודמות וחדשות) עוברות.

### 8.3 בדיקות שרק המשתמשת יכולה לעשות (אחרי דחיפה ל-GitHub Pages)
התקנה ב-Android וב-iPhone, משחק במצב טיסה עם צלילים, ועדכון גרסה באפליקציה מותקנת. אסביר בצ'אט צעד אחר צעד:
- **Android (Chrome):** תפריט ⋮ ← „הוספה למסך הבית” / „התקנת אפליקציה”.
- **iPhone (Safari):** כפתור השיתוף ← „הוספה למסך הבית”.

לבדיקת העדכון צריך פרסום נוסף אחרי ההתקנה (שינוי קטן כלשהו) — רק באישור המשתמשת, כמו ב-Milestone 0.

## 9. סדר עבודה

1. התקנת החבילות (סעיף 2).
2. יצירת `public/icon.svg` והפקת האייקונים (סעיף 5); בדיקה ויזואלית של התוצאה.
3. הגדרת `VitePWA` ב-`vite.config.ts` (סעיפים 3–4).
4. עדכון `index.html` (סעיף 6).
5. כתיבת `tests/pwaBuild.test.ts` (סעיף 8.1).
6. בדיקות מקומיות (סעיף 8.2) ותיקון מה שנכשל.
7. ADR-9, סימון 🟡 ב-MILESTONES.md, וסגירת השרת המקומי.

## 10. ADR להוספה ב-ARCHITECTURE.md

### ADR-9: PWA עם `vite-plugin-pwa`, Precache מלא ועדכון בפתיחה הבאה
**הקשר:** §2.2 (E), §1.5 ו-§4.4 דורשים Cache לכל משאבי האפליקציה, עבודה תחת `/Simon/`, ועדכון בלי קבצים מעורבים. ב-spec אין הודעת „גרסה חדשה” בתוך המשחק.
**החלטה:** `vite-plugin-pwa` במצב `generateSW`. כל קובצי ה-Build נכנסים ל-Precache (כולל הגופן והאייקונים). אין `skipWaiting`/`clientsClaim` ואין הודעת עדכון: גרסה חדשה מורדת ברקע ונכנסת לשימוש בפתיחה הבאה אחרי שהאפליקציה נסגרה. האייקון נוצר מ-`public/icon.svg` בעזרת `@vite-pwa/assets-generator`, וקובצי ה-PNG נשמרים ב-Git.
**השלכות:** אין רענון אוטומטי באמצע משחק ואין ערבוב גרסאות. עדכון נראה רק בפתיחה השנייה אחרי פרסום. Service Worker לא פועל ב-`npm run dev`; בדיקת Offline מקומית נעשית מול `npm run build` + `npm run preview`. שינוי באייקון דורש להריץ שוב `npm run icons`.

## 11. בדיקה מול Definition of Done

| תנאי | איך ייבדק |
|---|---|
| ה-Build מייצר Manifest ו-Service Worker תקינים | `tests/pwaBuild.test.ts` + בדיקה בדפדפן המובנה (8.2) |
| Android ניתן להתקנה; iPhone — הוספה למסך הבית | המשתמשת, אחרי פרסום (8.3); אני מוודא מקומית שה-Manifest עומד בדרישות ההתקנה של Chrome |
| במצב טיסה: נפתח, משחקים, צלילים, גופן, ניקוד נשמר | אני — Offline מקומי (8.2 שלב 3, בלי צלילים שאינם נשמעים לי); המשתמשת — בטלפון (8.3) |
| עדכון גרסה באפליקציה מותקנת בלי קבצים מעורבים | אני — מקומית (8.2 שלב 4); המשתמשת — בטלפון אחרי פרסום נוסף, באישורה |
| כל הבדיקות הקודמות עוברות והגרסה פורסמה | `npm test`; הפרסום — בדחיפה, לפי בקשת המשתמשת |
