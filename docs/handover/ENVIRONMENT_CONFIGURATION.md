# ENVIRONMENT CONFIGURATION — الإعدادات ومتغيرات البيئة

> تاريخ الإعداد: 2026-11-09

## 1. الخلاصة (VERIFIED)
- **مفيش ملفات `.env` ولا `.env.example`** في المستودع، ومفيش أي متغيرات بيئة وقت البناء أو التشغيل.
- الإعدادات **مكتوبة جوه الكود** أو **متخزنة في قاعدة البيانات** (`config/main`).
- **بيئة واحدة بس (Production):** مفيش Development أو Staging منفصلين، ونفس قاعدة البيانات بتستخدم في التجربة.

## 2. الإعدادات المكتوبة في الكود
| الاسم (الثابت) | الملف | الوظيفة | لازم؟ | منين يتجاب | البيئة |
|---|---|---|---|---|---|
| `SB_URL` | `src/shim.js` سطر 7 | عنوان مشروع Supabase | نعم | Supabase ← Project Settings ← API ← Project URL | Production |
| `SB_KEY` | `src/shim.js` سطر 8 | مفتاح publishable (عام بطبيعته) | نعم | Supabase ← Project Settings ← API Keys ← Publishable key | Production |
| روابط ExcelJS / SheetJS | `src/app.html` (`loadExcelJS`, `loadXLSX`)، و`src/sw.js` (`LIBS`) | مكتبات التصدير | للتصدير | cdnjs | الكل |
| رابط Google Fonts | `src/app.html` `<head>` | الخطوط | لأ | — | الكل |
| `__VERSION__` | `src/sw.js` | رقم النسخة، بيتبدل بالـ hash في `build.py` | نعم (أوتوماتيك) | — | — |
| `manifest` (الاسم، الألوان، الأيقونات) | `src/build.py` | تثبيت البرنامج كتطبيق | نعم | — | — |
| `DEF_CFG` | `src/app.html` | القيم الافتراضية لو `config/main` مش موجود | نعم | — | — |

**لو نقلت لمشروع Supabase جديد:** عدّل `SB_URL` و`SB_KEY` في `src/shim.js`، وبعدين `python3 src/build.py .`، وبعدين انشر. الخطوات في [BACKUP_AND_RECOVERY](BACKUP_AND_RECOVERY.md).

## 3. إعدادات العمل في قاعدة البيانات (`docs` ← `collection='config'`, `id='main'`)
بتتعدل من الواجهة: «الإعدادات». VERIFIED (القيم الحالية):
| المفتاح | القيمة الحالية |
|---|---|
| `title` | عنوان الكشف |
| `currency` | ج.م |
| `lateDays` | 30 |
| `mpPct` | 0.03 |
| `defWage` | 0.2 |
| `mpBase` | «الصافي» |
| `stages` | الإدارة، فرع مالي، مركزية، لم يتم التسليم للإدارة، الإدارة (ميزانية)، الإدارة (تموين) |
| `types` | مستخلص أعمال، تعلية تأمينات اجتماعية، رد ضمان أعمال، رد تأمين نهائي، فرق مصرح بصرفة |
| `companies` | عمرو كمال عليان الديب، شركة الدمام للمقاولات العامة، شركة الرباط لأعمال الطرق |
| `depts` | 7 جهات، ولكل جهة `{name, hasStages, mp}` |
| `insStatuses` | 9 حالات |

**تحذير:** البرنامج بيتعرف على بعض الأنواع بالنص الحرفي. لو غيّرت اسم واحد منهم هتبوّظ القواعد:
- «مستخلص أعمال»
- «رد ضمان أعمال»
- «رد تأمين نهائي»
- «تعلية تأمينات اجتماعية»
- «فرق مصرح بصرفة»
- وكلمة «ختامي» في رقم المستخلص

## 4. إعدادات البناء والنشر
| البند | القيمة | الملف |
|---|---|---|
| أمر البناء | `python3 src/build.py .` | — |
| فولدر الناتج | `site/` | `.github/workflows/pages.yml` (`path: site`) |
| الفرع المنشور | `main` | نفس الملف |
| Netlify (مش مستخدم) | `publish = "site"` | `netlify.toml` |

## 5. إعدادات خارج المستودع (لازم تتراجع من لوحات التحكم)
| المكان | الإعداد |
|---|---|
| Supabase ← Authentication ← URL Configuration | Site URL و Redirect URLs: **UNKNOWN**، ومش مستخدمين لأن مفيش تحويلات |
| Supabase ← Authentication ← Sign In / Providers | Email مفعّل. **Allow new users to sign up: UNKNOWN** |
| Supabase ← Database ← Publications | `supabase_realtime` فيها `public.docs` (VERIFIED وقت الإعداد) |
| GitHub ← Settings ← Pages | Source = GitHub Actions |
| GitHub ← Settings ← Environments | `github-pages` (بيتعمل لوحده) |
