# SYSTEM ARCHITECTURE — المعمارية

> تاريخ الإعداد: 2026-11-09 · كل اللي في الملف ده **VERIFIED** من الكود إلا لو اتكتب غير كده.

## 1. الصورة الكاملة
```mermaid
flowchart TB
  subgraph Device["جهاز المستخدم (متصفح / برنامج متسطب PWA)"]
    UI["index.html<br/>الواجهة + منطق العمل (من src/app.html)"]
    SHIM["طبقة البيانات (من src/shim.js)<br/>window.claude.use('db')"]
    IDB[("IndexedDB<br/>mostakhlasat-offline")]
    SW["Service Worker (sw.js)<br/>كاش البرنامج"]
    UI <--> SHIM
    SHIM <--> IDB
  end
  subgraph GH["GitHub"]
    REPO["Repo: khalidjomaa98-collab/eldamam-mostakhlasat"]
    ACT["GitHub Actions: pages.yml"]
    PAGES["GitHub Pages<br/>khalidjomaa98-collab.github.io/eldamam-mostakhlasat/"]
    REPO --> ACT --> PAGES
  end
  subgraph SB["Supabase — مشروع mostakhlasat (vaoubvghpktwjpdzdjnu)"]
    AUTH["Auth (إيميل/كلمة سر)"]
    REST["PostgREST API"]
    RT["Realtime"]
    PG[("PostgreSQL<br/>public.docs / public.profiles")]
    AUTH --> PG
    REST --> PG
    RT --> PG
  end
  CDN["cdnjs (ExcelJS, SheetJS)<br/>Google Fonts"]
  PAGES -- "تحميل الملفات" --> SW --> UI
  SHIM -- "تسجيل الدخول" --> AUTH
  SHIM -- "قراءة/كتابة (HTTPS)" --> REST
  RT -- "تغييرات لحظية (WebSocket)" --> SHIM
  UI -- "عند التصدير" --> CDN
```

**مفيش Backend خاص بالبرنامج.** المنطق كله في المتصفح، وSupabase بيقدم قاعدة البيانات والدخول والـ API والـ Realtime. والأمان معتمد على Row Level Security جوه Postgres.

## 2. طبقات الواجهة (Frontend)
```mermaid
flowchart LR
  subgraph app["src/app.html (ملف واحد)"]
    CSS["CSS: التصميم + طبقة التجاوب"]
    HTML["HTML: القائمة الجانبية + 8 صفحات + نوافذ"]
    STATE["state (كائن واحد)"]
    CALC["calc / projStats / mpRow / coCompute"]
    RENDER["render() → renderHome/Sat/Moves/Inv/Proj/Ins/Co/Mp"]
    DLG["نوافذ: invDialog, projDialog, insDialog, coDialog, mpDialog, moveDialog, settingsDialog"]
    EXP["تصدير: Excel/HTML"]
  end
  DBAPI["db API (shim): collection().doc().set/delete/onSnapshot"]
  DBAPI -- onSnapshot --> STATE --> RENDER
  CALC --> RENDER
  DLG -- save() --> DBAPI
```
- **إدارة الحالة:** كائن واحد اسمه `state` (المشاريع والمستخلصات والتأمينات والمتابعات والإعدادات والفلاتر). أي تغيير في البيانات بيعمل `render()` كامل، وفيه كاش `memo` للحسابات.
- **مفيش Router:** التبويب في `state.tab` وبيتحفظ في `localStorage`.

## 3. طبقة البيانات والمزامنة (`src/shim.js`)
```mermaid
sequenceDiagram
  participant UI as الواجهة
  participant S as shim
  participant I as IndexedDB
  participant P as Supabase (docs)
  UI->>S: doc.set(data)
  S->>I: pending.put(op, base=version قديم)
  S-->>UI: تحديث فوري للعرض
  Note over S: بعد 300ms أو لما النت يرجع أو كل دقيقة
  S->>P: select version الحالي
  alt version زي base
    S->>P: update ... where version = current
  else حد تاني عدّل
    S->>S: merge3(base, mine, theirs) على مستوى الحقل<br/>stageLog/log/requests بتتجمع
    S->>P: update بالنتيجة المدموجة
  end
  P-->>S: الصف الجديد (version+1 من trigger)
  S->>I: server.put / pending.delete
  P-->>S: Realtime: تغييرات الأجهزة التانية
  S->>P: pull: كل الصفوف updated_at >= آخر مزامنة − 5 ثواني
```
- **الحذف ناعم** (`deleted=true`) عشان يوصل لكل الأجهزة.
- **لو المستخدم اتغير على نفس الجهاز** بيتمسح التخزين المحلي (`meta.owner`).
- **عند الخروج:** بيتمسح التخزين المحلي، وبيحذّر لو فيه تعديلات لسه ماتبعتتش.

## 4. معمارية قاعدة البيانات
التفاصيل والـ ERD في [DATABASE_DOCUMENTATION](DATABASE_DOCUMENTATION.md):
- جدول بيانات واحد (`docs`) بمفتاح مركب (collection, id) وقيمة JSONB.
- جدول `profiles` مربوط بـ `auth.users`.
- العلاقات بين المستندات منطقية جوه JSON (زي `invoices.data.projectId` اللي بيشاور على `projects.id`) ومش Foreign Keys.

## 5. تسجيل الدخول
```mermaid
sequenceDiagram
  participant U as المستخدم
  participant S as shim
  participant A as Supabase Auth
  participant DB as profiles
  U->>S: إيميل + كلمة سر
  S->>A: signInWithPassword
  A-->>S: session (JWT) — بتتحفظ في localStorage
  S->>DB: select id,name,role where id = uid
  alt مفيش صف في profiles
    S->>A: signOut
    S-->>U: «الحساب ده مش مفعّل في البرنامج»
  else فيه
    S->>S: تحميل IndexedDB + Realtime + مزامنة
    S-->>U: فتح البرنامج (viewer = عرض فقط)
  end
```
**أوفلاين:** لو فيه جلسة محفوظة وprofile متخزن في `localStorage`، البرنامج بيفتح من غير نت.

## 6. API
كل الاتصال من المتصفح لـ Supabase مباشرة بمكتبة supabase-js:
- **REST:** `/rest/v1/docs` و`/rest/v1/profiles` (select / insert / update مع شرط version).
- **Auth:** `/auth/v1` (token, user).
- **Realtime:** WebSocket على `postgres_changes` لجدول `docs`.

مفيش APIs تانية. التفاصيل في [APIS_AND_INTEGRATIONS](APIS_AND_INTEGRATIONS.md).

## 7. رفع وتنزيل الملفات
- **رفع ملفات:** مش موجود.
- **التنزيل:** ملفات Excel وHTML بتتولد في المتصفح وبتتنزل على جهاز المستخدم. التفاصيل في [STORAGE_DOCUMENTATION](STORAGE_DOCUMENTATION.md).

```mermaid
flowchart LR
  D[بيانات state] --> X["ExcelJS/SheetJS من cdnjs<br/>أو قالب HTML"] --> B[Blob في المتصفح] --> F["تنزيل على الجهاز<br/>(مش بيتخزن على أي سيرفر)"]
```

## 8. النشر
```mermaid
flowchart LR
  DEV["تعديل src/*"] --> BUILD["python3 src/build.py ."] --> SITE["site/*"] --> GIT["git push origin main"] --> GA["GitHub Actions<br/>upload-pages-artifact(site) → deploy-pages"] --> LIVE["GitHub Pages"]
  LIVE --> SWU["sw.js بنسخة جديدة"] --> BAR["شريط «نسخة جديدة… تحديث الآن» عند المستخدم"]
```
التفاصيل في [DEPLOYMENT_GUIDE](DEPLOYMENT_GUIDE.md).

## 9. الكاش والـ Service Worker (`src/sw.js`)
| الطلب | الاستراتيجية |
|---|---|
| ملفات البرنامج (نفس الموقع) | من الكاش الأول (`shell-<version>`)، وأي فتحة صفحة غير معروفة بترجع `index.html` |
| Supabase | مش بيتكاش؛ بيروح للشبكة دايماً |
| cdnjs وGoogle Fonts | من الكاش الأول (`runtime-v1`) |

- **رقم النسخة:** hash بيتحسب في `build.py` من محتوى `index.html` و`shim.js` و`sw.js` والأيقونات والـ manifest.
- **التحديث:** التثبيت بيستخدم `cache:"reload"` عشان النسخة الجديدة متتاخدش من كاش المتصفح القديم.
- **تنبيه:** طالما الـ Service Worker الأساسي متسطب، أي صفحة جديدة تحت نفس المسار بتفتح بـ `index.html` القديم من الكاش (اللي اتعمل بيه رابط `/preview/` واتشال بعد كده).
