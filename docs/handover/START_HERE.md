# ابدأ من هنا — START HERE

> **تاريخ إعداد التوثيق:** 2026-11-09
> **آخر commit موثّق على `main`:** `07e8ad8` (2026-11-08) — **وتحديثات 2026-11-11 لحد `ca2f488` في [UPDATE_2026-11-11](UPDATE_2026-11-11.md). اقراه بعد الملف ده على طول.**
> **مستوى الثقة:** كل معلومة في ملفات التسليم موسومة بـ `VERIFIED` (اتأكدت من الكود أو من نظام شغّال) أو `INFERRED` (استنتاج محتاج تأكيد) أو `UNKNOWN` (مش متاحة).

## البرنامج ده إيه في سطرين
**«متابعة المستخلصات»** برنامج ويب عربي (RTL) لشركة **الدمام للمقاولات العامة** وشركاتها (الرباط لأعمال الطرق، عمرو كمال عليان الديب). بيتابع مستخلصات المقاولات مع جهات الإسناد الحكومية من أول تقديمها، مروراً بمكانها وصرفها وشهادات التأمينات الاجتماعية والقوة العاملة، لحد استرداد ضمان الأعمال والتأمين النهائي بعد الختامي.

## خريطة سريعة (VERIFIED)
| السؤال | الإجابة | التفاصيل |
|---|---|---|
| البرنامج المنشور | https://khalidjomaa98-collab.github.io/eldamam-mostakhlasat/ | [DEPLOYMENT_GUIDE](DEPLOYMENT_GUIDE.md) |
| الكود | GitHub: `khalidjomaa98-collab/eldamam-mostakhlasat` (فرع `main`) | [SOURCE_CODE_MAP](SOURCE_CODE_MAP.md) |
| قاعدة البيانات | Supabase، مشروع `mostakhlasat`، ref `vaoubvghpktwjpdzdjnu` | [DATABASE_DOCUMENTATION](DATABASE_DOCUMENTATION.md) |
| لوحة تحكم القاعدة | https://supabase.com/dashboard/project/vaoubvghpktwjpdzdjnu | [ACCOUNTS_AND_ACCESS](ACCOUNTS_AND_ACCESS.md) |
| ملفات مرفوعة من المستخدمين | **مفيش** — البرنامج مفيهوش رفع ملفات | [STORAGE_DOCUMENTATION](STORAGE_DOCUMENTATION.md) |
| تسجيل الدخول | Supabase Auth (إيميل + كلمة سر) + جدول `profiles` للأدوار | [SECURITY_AND_PERMISSIONS](SECURITY_AND_PERMISSIONS.md) |
| النشر | تلقائي: أي push على `main` ← GitHub Actions ← GitHub Pages | [DEPLOYMENT_GUIDE](DEPLOYMENT_GUIDE.md) |
| البناء | `python3 src/build.py .` بيولّد `site/` من `src/` | [RUN_AND_BUILD_GUIDE](RUN_AND_BUILD_GUIDE.md) |

## أهم 7 حاجات لازم تعرفها قبل أي تعديل
1. **عدّل في `src/` بس، وبعدين ابني.** ملفات `site/` متولّدة. أي تعديل يدوي في `site/index.html` هيتمسح مع أول build.
2. **`window.claude.use(...)` جوه الكود مش بيكلم Claude.** ده اسم قديم من أيام ما البرنامج كان Artifact على claude.ai، وحالياً بيتنفذ بالكامل في `src/shim.js` على Supabase. البرنامج **مش معتمد على Claude إطلاقاً وقت التشغيل**.
3. **قاعدة البيانات جدول واحد للبيانات (`public.docs`) بنظام مستندات JSON.** كل «مجموعة» (projects, invoices, …) هي قيمة في عمود `collection`. إضافة حقل جديد **مش محتاجة migration**.
4. **البرنامج أوفلاين أولاً.** كل جهاز عنده نسخة في IndexedDB، والتعديلات بتتبعت بالمزامنة مع دمج على مستوى الحقل. أي تغيير في شكل البيانات لازم يراعي الأجهزة اللي عليها تعديلات منتظرة.
5. **أي push على `main` بينزل للمستخدمين فوراً.** صاحب البرنامج طلب صراحة: **مفيش نشر من غير موافقته**. اشتغل على فرع، واعرض التجربة، واستنى كلمة «ارفع».
6. **اللغة:** صاحب البرنامج بيكتب بالعامية المصرية وبيحب الردود والواجهة بالعربي. أسلوب الواجهة عربي واضح.
7. **ممنوع تكتب أسرار في الكود أو التوثيق.** المفتاح الموجود في `src/shim.js` هو مفتاح Supabase **publishable** (معمول عشان يبقى عام، والحماية بالـ RLS)، لكن متنسخوش في أي توثيق.

## ترتيب القراءة المقترح
1. [PROJECT_MASTER](PROJECT_MASTER.md): البرنامج كله في ملف واحد.
2. [SYSTEM_ARCHITECTURE](SYSTEM_ARCHITECTURE.md): الرسومات.
3. [SOURCE_CODE_MAP](SOURCE_CODE_MAP.md): فين أي وظيفة في الكود.
4. [DATABASE_DOCUMENTATION](DATABASE_DOCUMENTATION.md) و[SECURITY_AND_PERMISSIONS](SECURITY_AND_PERMISSIONS.md).
5. [FEATURES_AND_WORKFLOWS](FEATURES_AND_WORKFLOWS.md): كل شاشة وكل معادلة.
6. [RUN_AND_BUILD_GUIDE](RUN_AND_BUILD_GUIDE.md) ثم [DEPLOYMENT_GUIDE](DEPLOYMENT_GUIDE.md).
7. [PROJECT_STATUS_AND_ROADMAP](PROJECT_STATUS_AND_ROADMAP.md) و[TESTING_AND_KNOWN_ISSUES](TESTING_AND_KNOWN_ISSUES.md).
8. لو انت Claude على حساب جديد: [CLAUDE_NEW_ACCOUNT_PROMPT](CLAUDE_NEW_ACCOUNT_PROMPT.md).
9. قبل نقل أي حساب: [HANDOVER_CHECKLIST](HANDOVER_CHECKLIST.md) و[BACKUP_AND_RECOVERY](BACKUP_AND_RECOVERY.md).

## قائمة الملفات
| الملف | المحتوى |
|---|---|
| [START_HERE](START_HERE.md) | الملف ده |
| [PROJECT_MASTER](PROJECT_MASTER.md) | المرجع الرئيسي |
| [SYSTEM_ARCHITECTURE](SYSTEM_ARCHITECTURE.md) | المعمارية والرسومات |
| [SOURCE_CODE_MAP](SOURCE_CODE_MAP.md) | خريطة الكود |
| [DATABASE_DOCUMENTATION](DATABASE_DOCUMENTATION.md) | قاعدة البيانات |
| [STORAGE_DOCUMENTATION](STORAGE_DOCUMENTATION.md) | أماكن تخزين البيانات والملفات |
| [ACCOUNTS_AND_ACCESS](ACCOUNTS_AND_ACCESS.md) | الحسابات والخدمات |
| [FEATURES_AND_WORKFLOWS](FEATURES_AND_WORKFLOWS.md) | الوظائف ودورات العمل |
| [SECURITY_AND_PERMISSIONS](SECURITY_AND_PERMISSIONS.md) | الدخول والصلاحيات |
| [ENVIRONMENT_CONFIGURATION](ENVIRONMENT_CONFIGURATION.md) | الإعدادات |
| [RUN_AND_BUILD_GUIDE](RUN_AND_BUILD_GUIDE.md) | التشغيل والبناء |
| [DEPLOYMENT_GUIDE](DEPLOYMENT_GUIDE.md) | النشر والرجوع لنسخة سابقة |
| [BACKUP_AND_RECOVERY](BACKUP_AND_RECOVERY.md) | النسخ الاحتياطي والاستعادة |
| [APIS_AND_INTEGRATIONS](APIS_AND_INTEGRATIONS.md) | الخدمات الخارجية |
| [TESTING_AND_KNOWN_ISSUES](TESTING_AND_KNOWN_ISSUES.md) | الاختبارات والمشاكل |
| [PROJECT_STATUS_AND_ROADMAP](PROJECT_STATUS_AND_ROADMAP.md) | الحالة والمهام القادمة |
| [CLAUDE_NEW_ACCOUNT_PROMPT](CLAUDE_NEW_ACCOUNT_PROMPT.md) | برومبت جاهز لحساب Claude جديد |
| [HANDOVER_CHECKLIST](HANDOVER_CHECKLIST.md) | قائمة التحقق النهائية |
