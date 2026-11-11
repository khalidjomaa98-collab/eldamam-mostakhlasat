# SOURCE CODE MAP — خريطة الكود

> تاريخ الإعداد: 2026-11-09 · أرقام السطور من commit `07e8ad8` وممكن تتحرك مع التعديل. دوّر باسم الدالة. **الدوال الجديدة (2026-11-11):** `invSteps`, `stepperHtml`, `lockFields`, `renderAct`, `acFiltered`, `waDialog`, `waText`, `navInd`, `closeAllDlg`, `qMatch` — جدولها في [UPDATE_2026-11-11](UPDATE_2026-11-11.md).
> كل اللي هنا **VERIFIED** من الملفات.

## 1. شجرة المستودع
```
eldamam-mostakhlasat/
├── .github/workflows/pages.yml   ← النشر التلقائي على GitHub Pages (أساسي)
├── README.md                     ← وصف قصير وقديم (بيقول Netlify؛ الصح GitHub Pages)
├── netlify.toml                  ← بقايا محاولة Netlify (مش مستخدم حالياً)
├── docs/handover/                ← ملفات التسليم دي
├── src/                          ← المصدر: التعديل بيبقى هنا بس
│   ├── app.html   (~448 KB, 3992 سطر) ← البرنامج كله: CSS + HTML + JS
│   ├── shim.js    (~22 KB)  ← طبقة البيانات + المزامنة + الدخول + تحديثات البرنامج
│   ├── sw.js      (~2.6 KB) ← Service Worker (فيه __VERSION__ بيتبدل وقت البناء)
│   └── build.py   (~8.4 KB) ← بيولّد site/ من src/
└── site/                         ← الناتج المنشور (متولّد، متعدلش فيه يدوي)
    ├── index.html  ← app.html + شاشة الدخول + CSS إضافي + shim.js مدموجين
    ├── sw.js       ← src/sw.js برقم النسخة
    ├── supabase.js ← مكتبة supabase-js (UMD) — **ملف ثابت مش بيتولد**؛ اتنزل يدوياً وقت الإعداد
    ├── manifest.webmanifest, icon-192.png, icon-512.png, icon-maskable.png, favicon.png ← بيتولدوا في build.py
    ├── _headers   ← هيدرز أمان بصيغة Netlify (GitHub Pages بيتجاهلها)
    └── .nojekyll  ← يمنع Jekyll في GitHub Pages
```

| الملف | أساسي للتشغيل؟ | ينفع يتعدل من غير ما يأثر على حاجة؟ | حساسية |
|---|---|---|---|
| `src/app.html` | نعم | لأ، كل حاجة مترابطة | عالية: الحسابات والحفظ |
| `src/shim.js` | نعم | لأ | **عالية جداً**: المزامنة والدمج والدخول. أي غلطة ممكن تضيّع تعديلات |
| `src/sw.js` | نعم (للأوفلاين والتحديث) | بحذر | عالية: غلطة فيه ممكن تثبّت نسخة قديمة عند المستخدمين |
| `src/build.py` | نعم (للبناء) | نعم | متوسطة |
| `site/supabase.js` | نعم | استبداله بإصدار تاني محتاج اختبار | متوسطة |
| `.github/workflows/pages.yml` | نعم (للنشر) | بحذر | متوسطة |
| `netlify.toml`, `site/_headers`, `README.md` | لأ | نعم | منخفضة |

## 2. `src/app.html` بالتفصيل
### أ. الأقسام الكبيرة
| السطور تقريباً | القسم |
|---|---|
| 1–1377 | `<style>`: التصميم كله. آخره «طبقة التجاوب» (≤900 درج، ≤820 الجداول كروت، ≤640 موبايل، ≤345) وCSS مستحقات ما بعد الختامي |
| 1378–1630 | HTML: `aside.side` (القائمة)، و`main` فيه 8 صفحات `#v-home, #v-sat, #v-moves, #v-inv, #v-proj, #v-ins, #v-co, #v-mp`، وشريط العمليات الجماعية `#bulk`، والبحث `#cmd`، والنافذة العامة `#dlg` |
| 1631–3992 | `<script>`: كل المنطق جوه IIFE واحدة |

### ب. خريطة الوظائف (دوّر باسم الدالة)
| المجال | الدوال | السطر تقريباً |
|---|---|---|
| ثوابت وأدوات | `$`, `ico`, `esc`, `num`, `has`, `fmt`, `money`, `today`, `dmy`, `proj`, `pName`, `certLabel`, `uniq` | 1642–1665 |
| الإعدادات الافتراضية والحالة | `DEF_CFG`, `state`, `memo` | ~1636–1640 |
| **الحسابات** | `isWork`, `contractVal`, `prevWork`, `calc`, `mpRow` | 1658–1708 |
| شارات الحالة | `paidChip`, `insChip`, `mpChip`, `stageColor`, `stageCell`, `daysCell` | 1709–1732 |
| المستخدمين وسجل النشاط | `who`, `initials`, `ago`, `logAct`, `resolveNames` | 1735–1751 |
| نظرة عامة | `renderHome`, `goReg`, `hbars` | 1752–1802 |
| العمليات الجماعية | `renderBulk`, `clearSel`, `runBulk`, `askBulk` | 1803–1862, ~3804 |
| الرسم العام | `render` | ~1898 |
| كشف المتابعة | `satBase`, `satRows`, `renderSat`, `rowHtml`, `satLevels`, `stageSplit` | 1917–2047, ~2568 |
| المشاريع | `projStats`, `renderProj`, `projDialog` | 2050, 2170, 2455 |
| سجل المستخلصات | `invBase`, `renderInv` | 2066–2158 |
| القوة العاملة | `renderMp`, `mpDialog` | 2222, 2653 |
| **النوافذ (إطار عام)** | `openDlg`, `minimizeDlg`, `restoreDlg`, `lockScroll`, `fld`, `sfld`, `val`, `nval`, `footBtns`, **`save`** | 2244–2312 |
| نافذة المستخلص | `invDialog` (الحفظ والتحقق من سبب تعديل تاريخ الختامي) | 2315 |
| الإعدادات | `settingsDialog` (الجهات والأماكن والأنواع والشركات والنسب) | 2512 |
| تغيير سريع للحالة | `quickStage`, `quickPaid`, `openStPop`, `saveStPop`, `statusBtn`, `miniSt` | 2553–2650 |
| الحركة | `stageLogOf`, `dayDiff`, `moveEvents`, `stayStats`, `timelineHtml`, `undoMove`, `moveDialog`, `renderMoves` | 2698–2811 |
| التصدير | `loadXLSX`, `loadExcelJS`, `offer`, `xSheet...`, `exportSatXlsx`, `exportSatHtml`, `buildSatPdf`, `exportInvXlsx`, `exportMovesXlsx`, `exportSelXlsx` | 2812–3130 |
| التأمينات | `insTone`, `insInv`, `raiseOrigGuess`, `raiseReady`, `insCertDone`, `insFiltered`, `renderIns`, `insDialog`, `exportInsXlsx`, `exportInsHtml` | 3131–3346, 3654+ |
| **مستحقات ما بعد الختامي** | `isFinalInv`, `isoDate`, `addYear`, `coCompute`, `coState`, `coAll`, `coAlerts`, `coKpisHtml`, `renderCo`, `coSummaryHtml`, `coDialog`, `exportCoXlsx`, `exportCoHtml` | 3349–3653 |
| النسخة الاحتياطية Excel | `exportBackup` (المشاريع والمستخلصات والخامات والحركة) | 3687 |
| القائمة الجانبية والبحث | `applySide`, `openCmd`, `runCmd` | 3738–3840 |
| ربط الأحداث (click delegation) | `document.addEventListener("click", …)` | ~3843–3880 |
| **تحميل البيانات** | `claude.use("db")` و`onSnapshot` لكل مجموعة | ~3885–3905 |
| تحسينات الإدخال | البحث برقم العقد (`data-cpick`)، خانات التاريخ (`.dwrap`)، أسماء أعمدة الجداول على الموبايل | ~3906–3990 |

### ج. فين أعدّل …؟
| عايز | روح لـ |
|---|---|
| معادلة صافي المستخلص أو نسبة التنفيذ | `calc()`, `contractVal()` |
| حقل جديد في المستخلص | `invDialog()`: الـ HTML في `body`، والحفظ في `onSubmit`، وبعدين العرض في `rowHtml()` |
| حقل جديد في المشروع | `projDialog()` |
| قائمة الأماكن أو الأنواع أو الشركات | من الواجهة: «الإعدادات» (`settingsDialog`). بتتحفظ في `config/main` |
| شكل الكشف أو التجميع | `renderSat()`, `satLevels()`, `rowHtml()` |
| تقرير PDF أو Excel للكشف | `buildSatPdf()`, `exportSatXlsx()` |
| قواعد التأمينات | `insDialog()`, `raiseReady()`, `insCertDone()` |
| قواعد ما بعد الختامي | `coCompute()`, `coAlerts()` |
| الموبايل | آخر `<style>`: «طبقة التجاوب» |
| المزامنة أو الأوفلاين | `src/shim.js` (`flush`, `merge3`, `pull`) |
| شاشة الدخول | `src/build.py` (HTML/CSS) و`src/shim.js` (المنطق) |

## 3. `src/shim.js`
| الجزء | الوظيفة |
|---|---|
| `SB_URL`, `SB_KEY` | عنوان مشروع Supabase ومفتاح publishable (السطور 7–8) |
| IndexedDB (`mostakhlasat-offline` v1: `server`, `pending`, `meta`) | التخزين المحلي |
| `db` API (`collection/doc/set/delete/onSnapshot/add/orderBy/limit`) | نفس الواجهة اللي `app.html` متعود عليها |
| `merge3`, `flushOne`, `flush`, `pull`, `subscribeRealtime` | المزامنة والدمج |
| `updateSyncUi` | مؤشر «متزامن» |
| `userApi`, `downloadsApi`, `window.claude` | المستخدم وصلاحية الكتابة والتنزيل |
| `enter`, `showLogin`, `addAccountButtons` | الدخول والخروج وتغيير كلمة السر وزرار التثبيت |
| تسجيل الـ Service Worker و`__applyUpdate` | شريط «نسخة جديدة» |

## 4. `src/build.py`
1. بيقرا `src/app.html` و`src/shim.js` و`src/sw.js`.
2. بيطلع لوجو الشركة (`LOGO_NAVY` base64) ويعمل منه الأيقونات بـ Pillow.
3. بيكتب `manifest.webmanifest`.
4. بيولّد `site/index.html` = رأس `app.html` + CSS شاشة الدخول + `<script src="supabase.js">` + `shim.js` + HTML شاشة الدخول وتغيير كلمة السر وشريط التحديث + جسم `app.html`.
5. بيحسب رقم النسخة (hash) ويكتب `site/sw.js`.

## 5. حاجات مش موجودة (VERIFIED)
- مفيش Backend ولا API Server ولا Models ولا Repositories ولا Hooks ولا Components منفصلة.
- مفيش `package.json` ولا npm.
- مفيش ملفات `.env`.
- مفيش اختبارات داخل المستودع. التفاصيل في [TESTING_AND_KNOWN_ISSUES](TESTING_AND_KNOWN_ISSUES.md).
- مفيش migrations داخل المستودع. اتطبقت على Supabase مباشرة، ونصها كامل في [DATABASE_DOCUMENTATION](DATABASE_DOCUMENTATION.md).
