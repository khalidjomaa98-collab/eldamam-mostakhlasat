# RUN AND BUILD GUIDE — التشغيل والبناء

> تاريخ الإعداد: 2026-11-09
> الأوامر دي **اتجربت فعلاً** في بيئة Linux: Python 3.13.18 وPillow 12.3.0 وNode 22.23.4 (Node للاختبار بالمتصفح بس).

## 1. المتطلبات
| البرنامج | لازم؟ | ليه |
|---|---|---|
| git | نعم | تنزيل الكود |
| Python 3 (3.9+، واتجرب على 3.13) | نعم للبناء | `src/build.py` |
| Pillow (`pip install pillow`) | اختياري | توليد الأيقونات. من غيره البناء بيكمل وبيسيب الأيقونات القديمة |
| متصفح حديث (Chrome / Edge / Safari) | نعم | التشغيل |
| Node.js + Playwright | اختياري | اختبارات المتصفح الآلية |

**مفيش npm ولا dependencies** للبرنامج نفسه.

## 2. تنزيل المشروع
```bash
git clone https://github.com/khalidjomaa98-collab/eldamam-mostakhlasat.git
```
```bash
cd eldamam-mostakhlasat
```

## 3. البناء
```bash
python3 src/build.py .
```
- **الناتج:** `built <حجم> version <hash>`، والملفات المتحدثة في `site/`.
- **إثبات إن البناء بيطلع نفس النتيجة (VERIFIED 2026-11-09):** البناء من `src/` في فولدر مؤقت طلّع نفس `site/index.html` و`sw.js` والأيقونات والـ manifest بالظبط.

## 4. التشغيل محلياً
البرنامج لازم يتفتح من سيرفر HTTP، مش من ملف مباشر (`file://`)، عشان الـ Service Worker:
```bash
cd site && python3 -m http.server 8766
```
افتح: http://localhost:8766/

- **الاتصال بقاعدة البيانات:** أوتوماتيك. النسخة المحلية **متوصلة بنفس قاعدة البيانات الحقيقية**، وأي حفظ بيعدّل بيانات حقيقية.
- **الدخول:** بحساب عنده صف في `profiles`.

## 5. للتطوير (حلقة العمل)
1. عدّل في `src/app.html` أو `src/shim.js` أو `src/sw.js`.
2. شغّل `python3 src/build.py .`
3. اعمل Refresh. لو النسخة القديمة لسه ظاهرة: اضغط «تحديث الآن»، أو DevTools ← Application ← Service Workers ← Unregister، أو افتح نافذة تصفح خفي.
4. جرب على موبايل بأداة المحاكاة في DevTools: 375 و768 و1366.

## 6. الاختبارات
مفيش اختبارات آلية داخل المستودع. اللي اتعمل أثناء التطوير كان سكريبتات Playwright مؤقتة في بيئة Claude (مش محفوظة)، والتفاصيل في [TESTING_AND_KNOWN_ISSUES](TESTING_AND_KNOWN_ISSUES.md). مثال لفحص سريع إن الصفحة بتفتح من غير أخطاء JavaScript:
```bash
node -e "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8766/');await p.waitForTimeout(1500);console.log('errors',e);await b.close();})()"
```

## 7. أخطاء شائعة
| المشكلة | الحل |
|---|---|
| التعديل مش ظاهر بعد البناء | Service Worker قديم: «تحديث الآن» أو Unregister أو نافذة تصفح خفي |
| «الحساب ده مش مفعّل في البرنامج» | المستخدم ملوش صف في `profiles`. شوف [SECURITY_AND_PERMISSIONS](SECURITY_AND_PERMISSIONS.md) |
| «الإيميل أو كلمة السر غلط» | الحساب مش موجود في Supabase Auth أو كلمة السر غلط |
| مؤشر «تعذرت المزامنة» | النت أو Supabase واقف. المشروع ممكن يكون Paused في الخطة المجانية ← Dashboard ← Restore |
| البناء طبع «PIL مش متسطب» | `pip install pillow`، أو تجاهله لو مش هتغير اللوجو |
| زرار Excel مش شغال من غير نت | المكتبة بتتحمل من cdnjs أول مرة. جربه مرة وانت متصل |
