# APIS AND INTEGRATIONS — الخدمات الخارجية وواجهات API

> تاريخ الإعداد: 2026-11-09 · كل اللي هنا VERIFIED من الكود.

## 1. Supabase (التكامل الوحيد للبيانات)
| البند | التفاصيل |
|---|---|
| الغرض | قاعدة البيانات، والدخول، والـ Realtime |
| التوثيق الرسمي | https://supabase.com/docs |
| مكتبة العميل | `site/supabase.js` (supabase-js UMD، بداخله أرقام إصدارات 2.45.4 و2.65.0) |
| الملفات اللي بتستدعيه | `src/shim.js` بس |
| المصادقة | مفتاح publishable في الهيدر + JWT المستخدم بعد الدخول |

### الطلبات الفعلية
| الطلب | الغرض | المكان في `src/shim.js` |
|---|---|---|
| `auth.signInWithPassword({email,password})` | الدخول | معالج `#lgForm` |
| `auth.getSession()` / `onAuthStateChange` | استرجاع الجلسة | `DOMContentLoaded` |
| `auth.updateUser({password})` | تغيير كلمة السر | `#pwForm` |
| `auth.signOut()` | الخروج | `btnOut` |
| `from('profiles').select('id,name,role').eq('id',uid)` | الدور | `enter()` |
| `from('profiles').select('id,name').in('id',ids)` | أسماء سجل النشاط | `userApi.profiles` |
| `from('docs').select('collection,id,data,version,updated_at,deleted').order('updated_at').range(...)` + `gte('updated_at', since)` | سحب التغييرات (صفحات كل واحدة 1000) | `pull()` |
| `from('docs').select('data,version,deleted').eq('collection').eq('id').maybeSingle()` | قراءة الإصدار قبل الكتابة | `flushOne()` |
| `from('docs').insert({...})` | مستند جديد | `flushOne()` |
| `from('docs').update(payload).eq(...).eq('version', cur.version)` | تحديث مشروط (Optimistic locking) | `flushOne()` |
| `channel(...).on('postgres_changes', {table:'docs'})` | تغييرات لحظية | `subscribeRealtime()` |

- **حدود الاستخدام:** حسب خطة Supabase. على الخطة المجانية: حجم قاعدة البيانات وعدد الاتصالات محدودين، والمشروع بيتوقف لو مفيش نشاط لفترة. **NEEDS VERIFICATION** على https://supabase.com/pricing.
- **الاستبدال:** كل الاتصال محصور في `src/shim.js` ورا API بسيط (`collection().doc().set/delete/onSnapshot`). أي Backend تاني يقدم «جدول مستندات بإصدار + Realtime + Auth» ينفع يتحط مكانه بتعديل الملف ده بس.

## 2. cdnjs: مكتبات Excel
| المكتبة | الرابط | الدالة | الاستخدام |
|---|---|---|---|
| ExcelJS 4.4.0 | `https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js` | `loadExcelJS()` | كشف المتابعة Excel المنسّق، والمحدد |
| SheetJS xlsx 0.18.5 | `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` | `loadXLSX()` | باقي ملفات Excel والنسخة الاحتياطية |

- **التحميل:** بتتحمل وقت أول استخدام، والـ Service Worker بيكاشها (`runtime-v1`).
- **الاستبدال:** حط الملفات في `site/` وغيّر الروابط في `src/app.html` و`src/sw.js`.

## 3. Google Fonts
`fonts.googleapis.com` (IBM Plex Sans Arabic، Readex Pro). تجميلية بس.

## 4. واجهات داخلية تستحق التوثيق
| الواجهة | الوصف |
|---|---|
| `window.claude.use("db" \| "user" \| "downloads")` | **واجهة داخلية بينفذها `src/shim.js`، ومش بتتصل بـ Claude.** اسمها جاي من أيام ما البرنامج كان Artifact |
| `window.__sb` | عميل Supabase (للتشخيص والاختبار) |
| `window.toast(msg)` | رسالة للمستخدم |
| `window.__applyUpdate()` | تطبيق نسخة جديدة من البرنامج |

## 5. خدمات غير موجودة
- إيميل.
- دفع إلكتروني.
- Analytics.
- مراقبة أخطاء.
- AI وقت التشغيل.
- APIs حكومية.
- Webhooks.
- Cron jobs.

VERIFIED بالبحث في الكود.
