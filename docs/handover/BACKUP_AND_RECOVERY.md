# BACKUP AND RECOVERY — النسخ الاحتياطي واستعادة النظام

> تاريخ الإعداد: 2026-11-09 · **مفيش أي حاجة من الخطوات دي اتنفذت.** دي خطة للتنفيذ.

## 1. إيه اللي لازم يتحفظ وفين
| المكوّن | المصدر | طريقة النسخ | التكرار المقترح |
|---|---|---|---|
| الكود | GitHub | `git clone --mirror` على جهازك + نسخة ZIP على Google Drive أو OneDrive | بعد كل تحديث |
| قاعدة البيانات (`docs`) | Supabase | (أ) SQL Editor ← `select * from public.docs` ← Download CSV. (ب) `pg_dump`، شوف تحت | أسبوعياً على الأقل |
| المستخدمين (`profiles` + قائمة الإيميلات) | Supabase | CSV من `profiles` + لقطة من Authentication ← Users | مع كل تغيير |
| نص هيكل قاعدة البيانات | [DATABASE_DOCUMENTATION §6](DATABASE_DOCUMENTATION.md) | موجود في المستودع | — |
| الإعدادات | جوه `docs` (`config/main`) | بتتحفظ مع قاعدة البيانات | — |
| الملفات المرفوعة | **مفيش** | — | — |
| الدومين وDNS | **مفيش** | — | — |
| إعداد النشر | `.github/workflows/pages.yml` | في المستودع | — |
| بيانات الدخول للخدمات | مدير كلمات سر (Bitwarden أو 1Password) | يدوي | — |
| ملفات التسليم | `docs/handover/` | في المستودع | — |

**نسخة Excel من جوه البرنامج:** زرار Excel في القائمة الجانبية (`exportBackup`) **ناقص**. فيه المشاريع والمستخلصات والخامات والحركة بس، ومن غير التأمينات وما بعد الختامي والإعدادات وسجل النشاط. ماينفعش يكون النسخة الاحتياطية الوحيدة.

## 2. نسخة كاملة لقاعدة البيانات (pg_dump)
1. Supabase ← Project Settings ← Database ← Connection string (Session pooler) + كلمة سر قاعدة البيانات.
2. على جهاز فيه PostgreSQL client (نفس رقم الإصدار أو أحدث):
   ```bash
   pg_dump "postgresql://postgres.vaoubvghpktwjpdzdjnu:<DB_PASSWORD>@<pooler-host>:5432/postgres" --schema=public --no-owner --no-privileges -f mostakhlasat_public_$(date +%F).sql
   ```
   > متحفظش كلمة السر في ملف أو history. استخدم متغير البيئة `PGPASSWORD` وقت التشغيل بس.
3. البديل بـ Supabase CLI:
   ```bash
   supabase db dump --db-url "<connection-string>" -f schema.sql
   ```
   ```bash
   supabase db dump --db-url "<connection-string>" --data-only -f data.sql
   ```
4. Backups التلقائية: Dashboard ← Database ← Backups. **UNKNOWN** حسب الخطة.

## 3. استعادة المشروع بالكامل (على حسابات جديدة)
**الترتيب:** قاعدة البيانات ← المستخدمين ← الكود ← النشر ← الأجهزة.
1. **Supabase جديد:** اعمل مشروع جديد، والأفضل في منطقة قريبة زي eu-central-1.
2. **الهيكل:** نفّذ SQL الـ Migrations 1 و2 من [DATABASE_DOCUMENTATION §6](DATABASE_DOCUMENTATION.md) في SQL Editor.
3. **البيانات:** استورد `docs` من CSV (Table Editor ← Insert ← Import CSV) أو `psql -f data.sql`.
   - لازم الأعمدة `collection, id, data, version, updated_at, deleted` تتنقل زي ما هي.
   - الـ trigger بيغير `updated_at` و`version` وقت الإدخال، وده مقبول، لأن الأجهزة هتبدأ من صفر على المشروع الجديد.
4. **المستخدمين:** اعمل الحسابات في Authentication بكلمات سر جديدة، وبعدين اعمل صفوف `profiles` بالـ UID الجديد.
   - **تنبيه:** حقول `updatedBy` و`by` و`activity.by` القديمة بتشاور على UIDs قديمة، فالأسماء في السجل هتظهر «مستخدم» إلا لو عملت تحويل بـ SQL `replace` على `data`.
5. **الكود:** عدّل `SB_URL` و`SB_KEY` في `src/shim.js` بقيم المشروع الجديد، ثم:
   ```bash
   python3 src/build.py .
   ```
6. **النشر:** اعمل repo جديد، وفعّل Pages ← Source: GitHub Actions، وارفع الكود. أو أي استضافة ملفات ثابتة.
7. **Realtime:** اتأكد إن `public.docs` في publication `supabase_realtime`. الـ Migration 1 بتعمل ده.
8. **الأجهزة:** كل مستخدم يفتح الرابط الجديد ويدخل ويسطّب البرنامج تاني. البيانات المحلية القديمة مرتبطة بالدومين القديم ومش هتتنقل، فاتأكد قبل النقل إن مفيش تعديلات منتظرة على أي جهاز (المؤشر لازم يبقى «متزامن»).

## 4. التأكد إن النسخة الاحتياطية سليمة
- [ ] عدد صفوف `docs` في النسخة = العدد في Supabase. آخر عدد: 318 صف (67 مشروع + 136 مستخلص + 2 محذوف + 17 تأمينات + 10 ما بعد الختامي + 86 نشاط + 1 إعدادات + 1 اختبار محذوف). وده **بيزيد مع الاستخدام**.
- [ ] استعادة تجريبية على مشروع Supabase مؤقت + تشغيل البرنامج محلياً عليه، ومقارنة أرقام «نظرة عامة».
- [ ] نسخة الكود فيها `src/` و`site/` و`.github/` و`docs/`، و`python3 src/build.py .` بيشتغل عليها.

## 5. ما يجب حفظه خارج Claude
- نسخة من المستودع (ZIP أو clone).
- نسخة دورية من قاعدة البيانات.
- بيانات دخول Supabase وGitHub ورموز الاسترداد (2FA recovery codes).
- فولدر `docs/handover/` كامل.
- **مفيش حاجة في التشغيل محتاجة Claude.** سجل المحادثات مفيد بس مش ضروري، لأن كل القرارات المهمة مكتوبة هنا.

## 6. قائمة استعادة على جهاز جديد وحساب Claude جديد
- [ ] `git clone` شغال.
- [ ] `python3 src/build.py .` بيطلع نفس `site/` (`git status` نضيف).
- [ ] `python3 -m http.server` + دخول ناجح على البيانات الحقيقية.
- [ ] الدخول على Supabase Dashboard للمشروع `vaoubvghpktwjpdzdjnu`.
- [ ] صلاحية push على GitHub، وصفحة Actions بتشتغل.
- [ ] Claude الجديد قرا `docs/handover/START_HERE.md` واتبع [CLAUDE_NEW_ACCOUNT_PROMPT](CLAUDE_NEW_ACCOUNT_PROMPT.md).
