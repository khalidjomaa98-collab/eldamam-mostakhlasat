# HANDOVER CHECKLIST — قائمة التحقق النهائية

> تاريخ الإعداد: 2026-11-09. علّم على كل بند ✓ بعد ما تنفذه.

## أ. قبل ما تسيب حساب Claude القديم
- [ ] فولدر `docs/handover/` موجود على GitHub في فرع `main`.
- [ ] نزّلت نسخة ZIP من المستودع على جهازك + نسخة سحابية (Drive/OneDrive).
- [ ] نسخة احتياطية من قاعدة البيانات: CSV لجدول `docs` و`profiles` من SQL Editor. شوف [BACKUP_AND_RECOVERY](BACKUP_AND_RECOVERY.md).
- [ ] المؤشر في البرنامج على كل الأجهزة «متزامن»، ومفيش تعديلات منتظرة.
- [ ] (اختياري) حفظت سجل المحادثات المهمة. مش ضروري، لأن القرارات مكتوبة في [PROJECT_STATUS_AND_ROADMAP](PROJECT_STATUS_AND_ROADMAP.md).

## ب. الحسابات (مستقلة عن Claude)
- [ ] **Supabase:** دخلت https://supabase.com/dashboard وشايف مشروع `mostakhlasat` (ref `vaoubvghpktwjpdzdjnu`). سجّل إيميل الحساب: ____________
- [ ] Supabase: 2FA متفعّل.
- [ ] Supabase: عرفت الخطة (Free/Pro): ______، وحالة Backups: ______
- [ ] Supabase: Authentication ← «Allow new users to sign up» = OFF.
- [ ] **GitHub:** دخلت بحساب `khalidjomaa98-collab` وعندك صلاحية على `eldamam-mostakhlasat`. سجّل الإيميل: ____________
- [ ] GitHub: 2FA متفعّل، ورموز الاسترداد محفوظة.
- [ ] Netlify: اتأكدت لو فيه موقع `eldammam` ومسحته لو مش محتاجه.
- [ ] كل بيانات الدخول متخزنة في مدير كلمات سر، **مش في ملف أو محادثة**.

## ج. الأمان
- [ ] غيّرت كلمة سر حساب البرنامج `eldamamfacility@gmail.com`. **لسه افتراضية لحد 2026-11-09.**
- [ ] غيّرت أو اتأكدت من كلمة سر `k_elgindy@yahoo.com`.
- [ ] راجعت قائمة المستخدمين في Authentication ← Users، وجدول `profiles`.

## د. حساب Claude الجديد
- [ ] ربطت مستودع GitHub في Claude Code، أو رفعت فولدر المشروع.
- [ ] (اختياري) ربطت Supabase connector **بالحساب المالك لـ mostakhlasat**.
- [ ] لصقت البرومبت من [CLAUDE_NEW_ACCOUNT_PROMPT](CLAUDE_NEW_ACCOUNT_PROMPT.md).
- [ ] Claude لخّص المشروع صح: البرنامج، والكود، وقاعدة البيانات، والنشر، وآخر حالة.
- [ ] Claude عمل build محلي وطلع `site/` من غير تغيير (`git status` نضيف).
- [ ] أول تعديل صغير اتعمل على فرع واتجرب **قبل** النشر.

## هـ. اختبار النجاح
| السؤال | فين الإجابة |
|---|---|
| البرنامج إيه؟ | [PROJECT_MASTER](PROJECT_MASTER.md) |
| بيشتغل إزاي؟ | [SYSTEM_ARCHITECTURE](SYSTEM_ARCHITECTURE.md) |
| فين الكود؟ | [SOURCE_CODE_MAP](SOURCE_CODE_MAP.md) |
| فين قاعدة البيانات؟ | [DATABASE_DOCUMENTATION](DATABASE_DOCUMENTATION.md) |
| فين الملفات المرفوعة؟ | مفيش، شوف [STORAGE_DOCUMENTATION](STORAGE_DOCUMENTATION.md) |
| إزاي أدخل على الخدمات؟ | [ACCOUNTS_AND_ACCESS](ACCOUNTS_AND_ACCESS.md) |
| إزاي أشغّله؟ | [RUN_AND_BUILD_GUIDE](RUN_AND_BUILD_GUIDE.md) |
| إزاي أنشر تحديث؟ | [DEPLOYMENT_GUIDE](DEPLOYMENT_GUIDE.md) |
| إزاي أحافظ على الصلاحيات والبيانات؟ | [SECURITY_AND_PERMISSIONS](SECURITY_AND_PERMISSIONS.md) و[BACKUP_AND_RECOVERY](BACKUP_AND_RECOVERY.md) |
| آخر حالة؟ | [PROJECT_STATUS_AND_ROADMAP](PROJECT_STATUS_AND_ROADMAP.md) |
| إزاي أكمل من غير ما أبوّظ حاجة؟ | [CLAUDE_NEW_ACCOUNT_PROMPT](CLAUDE_NEW_ACCOUNT_PROMPT.md) |

## و. اللي اتعمل في التوثيق وما اتأكدش منه (تقرير نهائي)
**اتأكدت منه (VERIFIED):**
- هيكل المستودع، وكل الكود، وعملية البناء (بتطلع نفس النتيجة).
- النشر وعنوان الموقع.
- مشروع Supabase: الـ ref والعنوان.
- نص الـ migrations، والجداول، والـ RLS.
- عدد البيانات وحقولها (قراءة حية 2026-11-09).
- المستخدمين وأدوارهم، وغياب رفع الملفات والأسرار.
- إن حساب `eldamamfacility@gmail.com` لسه بكلمة السر الافتراضية.

**ما اتأكدش منه (UNKNOWN / NEEDS VERIFICATION):**
- إيميل حساب Supabase المالك (الأرجح `eldamamfacility@gmail.com`).
- خطة Supabase والـ Backups.
- إصدار Postgres.
- إعداد الـ sign-up.
- إيميل حساب GitHub.
- وجود موقع Netlify.
- حساب Claude المستخدم.
- الحالة الحالية للـ migrations على الخادم: موصّل Supabase في جلسة Claude متوصل بحساب تاني، فالقراءة المباشرة من الكتالوج ما اتعملتش.
