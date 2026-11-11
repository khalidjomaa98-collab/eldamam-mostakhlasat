# SECURITY AND PERMISSIONS — الدخول والصلاحيات والحماية

> تاريخ الإعداد: 2026-11-09

## 1. تسجيل الدخول (VERIFIED: `src/shim.js`)
| البند | التفاصيل |
|---|---|
| الطريقة | إيميل + كلمة سر عن طريق Supabase Auth (`signInWithPassword`) |
| Social Login | مفيش |
| فين المستخدمين | `auth.users` (حسابات الدخول) + `public.profiles` (الاسم والدور) |
| الجلسة | JWT من Supabase بيتحفظ في localStorage وبيتجدد لوحده (`persistSession`, `autoRefreshToken`) |
| أوفلاين | لو فيه جلسة محفوظة، البرنامج بيفتح من غير نت بالـ profile المتخزن |
| تغيير كلمة السر | زرار «كلمة السر» في القائمة (`auth.updateUser`)، 6 حروف على الأقل |
| نسيت كلمة السر | **مش موجود في البرنامج.** الأدمن يغيّرها من Supabase Dashboard ← Authentication ← Users ← المستخدم ← Send password recovery / Reset |
| الخروج | `signOut` + مسح البيانات المحلية (مع تحذير لو فيه تعديلات منتظرة) |
| تسجيل حساب جديد من البرنامج | مش موجود في الواجهة |
| Supabase sign-up | **UNKNOWN** هل مقفول. حتى لو حد عمل حساب، من غير صف في `profiles` مش هيشوف أي بيانات (RLS) والبرنامج بيخرّجه. الأفضل تقفله من Authentication ← Sign In / Providers |

## 2. الأدوار والصلاحيات
| الدور | قراءة | تعديل البيانات | إدارة المستخدمين (`profiles`) | في الواجهة |
|---|---|---|---|---|
| `admin` | ✓ | ✓ | ✓ (على مستوى قاعدة البيانات) | زي `editor` |
| `editor` | ✓ | ✓ | ✗ | تعديل كامل |
| `viewer` | ✓ | ✗ | ✗ | «عرض فقط» والحفظ بيترفض |
| من غير `profile` | ✗ | ✗ | ✗ | خروج تلقائي |

مفيش أدوار أدق (Manager أو Employee) ولا صلاحيات على مستوى الشاشة أو الشركة: **كل الأعضاء بيشوفوا كل البيانات.**

**فين بيتحدد ده في الكود:**
- قاعدة البيانات: RLS policies، ونصها في [DATABASE_DOCUMENTATION §6](DATABASE_DOCUMENTATION.md).
- الواجهة: `DocRef.set` في `src/shim.js` بيرفض الكتابة لغير admin/editor، و`userApi.can("data.write")` بيحدد `state.canWrite`.

## 3. Row Level Security (VERIFIED من نص الـ migration)
- RLS متفعّل على `docs` و`profiles`.
- **القراءة:** لأي مستخدم داخل عنده صف في `profiles` (`my_role() is not null`).
- **الكتابة في `docs`:** للـ admin والـ editor بس.
- **`profiles`:** الأدمن يضيف ويعدّل ويمسح. وكل مستخدم يقدر يعدّل **اسمه** بس من غير ما يغير دوره.
- **دور `anon`** (من غير دخول): كل الصلاحيات متشالة.
- **`my_role()`:** `security definer` عشان تقرا `profiles` من غير ما تعمل حلقة RLS.

## 4. إضافة مستخدم جديد (الطريقة الحالية)
1. Supabase Dashboard ← Authentication ← Users ← **Add user** ← إيميل + كلمة سر مؤقتة. علّم على «Auto confirm».
2. انسخ الـ User UID.
3. SQL Editor:
   ```sql
   insert into public.profiles (id, name, role)
   values ('<USER_UID>', 'اسم المستخدم', 'editor');  -- admin / editor / viewer
   ```
4. ابعت للمستخدم الرابط والإيميل، وقوله يغيّر كلمة السر من البرنامج أول ما يدخل.

## 5. تعطيل مستخدم
- **سحب الوصول للبيانات:** `delete from public.profiles where id = '<USER_UID>';` وده بيمنعه من البيانات على طول، حتى لو جلسته لسه شغالة.
- **تعطيل الدخول نهائياً:** Authentication ← Users ← المستخدم ← Ban أو Delete user. والمسح بيمسح الـ profile كمان (cascade).
- **نسخة البيانات اللي على جهازه:** بتفضل موجودة في IndexedDB لحد ما يعمل خروج أو المتصفح يتمسح. ده قيد طبيعي للشغل من غير نت.

## 6. المفاتيح والأسرار
| المفتاح | مكانه | هل هو سر؟ |
|---|---|---|
| Supabase URL + **publishable key** | `src/shim.js` (السطور 7–8) ومدموجين في `site/index.html` | **لأ.** معمول عشان يبقى في المتصفح، والحماية بالـ RLS. لو اتغير لازم تعدّل `src/shim.js` وتعمل build ونشر |
| Supabase secret / service_role key | Dashboard ← Project Settings ← API Keys | **سر.** مش موجود في المستودع. **متحطوش أبداً في الكود** |
| كلمة سر قاعدة البيانات | Dashboard ← Project Settings ← Database | سر، ومش موجودة في المستودع |
| كلمات سر المستخدمين | Supabase Auth (متشفرة) | سر |

اتأكدت إن المستودع مفيهوش `service_role` ولا JWT ولا `sb_secret`. VERIFIED بالبحث في 2026-11-09.

## 7. حماية إضافية
- **HTTPS:** إجباري (GitHub Pages وSupabase).
- `<meta name="robots" content="noindex,nofollow">` في الصفحة.
- `site/_headers` (X-Frame-Options وغيره) **مش متطبق** على GitHub Pages. ده ملف خاص بـ Netlify.
- **الكود عام (Public repo):** أي حد يقدر يشوف الكود، لكن من غير حساب مفعّل مش هيشوف البيانات.

## 8. ملاحظات أمنية مفتوحة
1. **عاجل:** حساب `eldamamfacility@gmail.com` في البرنامج لسه شغال بكلمة السر الافتراضية (اتأكدت في 2026-11-09). غيّرها.
2. حساب `k_elgindy@yahoo.com` اتعمل بنفس كلمة السر الافتراضية، وتغييرها UNKNOWN.
3. Supabase sign-up: اتأكد إنه مقفول.
4. فعّل 2FA على حسابات Supabase وGitHub.
5. مفيش سجل مراجعة على مستوى قاعدة البيانات غير `updated_by` و`activity` (اللي بيكتبه البرنامج). أي حد عنده صلاحية `editor` يقدر يعدّل `activity` نظرياً.
