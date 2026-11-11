# DEPLOYMENT GUIDE — النشر والاستضافة

> تاريخ الإعداد: 2026-11-09

## 1. الوضع الحالي (VERIFIED)
| البند | القيمة |
|---|---|
| الاستضافة | GitHub Pages |
| الرابط | https://khalidjomaa98-collab.github.io/eldamam-mostakhlasat/ |
| لوحة التحكم | https://github.com/khalidjomaa98-collab/eldamam-mostakhlasat/settings/pages |
| سجل عمليات النشر | https://github.com/khalidjomaa98-collab/eldamam-mostakhlasat/actions |
| Backend | مفيش Backend خاص. Supabase هو اللي بيقدم كل حاجة |
| قاعدة البيانات | Supabase `vaoubvghpktwjpdzdjnu`، والتفاصيل في [DATABASE_DOCUMENTATION](DATABASE_DOCUMENTATION.md) |
| دومين خاص أو DNS | مفيش (عنوان github.io) |
| CI/CD | `.github/workflows/pages.yml`: مع أي push على `main` (أو تشغيل يدوي) ← `actions/checkout@v4` ← `configure-pages@v5` ← `upload-pages-artifact@v3 (path: site)` ← `deploy-pages@v4` |
| أمر البناء | **مش بيتنفذ في CI.** البناء بيتعمل محلياً بـ `python3 src/build.py .`، وبيترفع `site/` جاهز |
| فولدر الناتج | `site/` |
| متغيرات بيئة للإنتاج | مفيش. شوف [ENVIRONMENT_CONFIGURATION](ENVIRONMENT_CONFIGURATION.md) |

## 2. نشر تحديث جديد
> **قاعدة صاحب البرنامج:** مفيش نشر من غير موافقته الصريحة («ارفع»). اشتغل على فرع، وورّيه التجربة الأول.
1. اعمل فرع وعدّل:
   ```bash
   git checkout -b my-change
   ```
2. عدّل في `src/` وبعدين ابني:
   ```bash
   python3 src/build.py .
   ```
3. جرب محلياً. شوف [RUN_AND_BUILD_GUIDE](RUN_AND_BUILD_GUIDE.md).
4. بعد الموافقة:
   ```bash
   git checkout main
   ```
   ```bash
   git merge --ff-only my-change
   ```
   ```bash
   git push origin main
   ```
5. تابع الـ workflow في Actions، وعادة بيخلص في أقل من دقيقة.
6. اتأكد إن التعديل وصل (بيرجع رقم أكبر من صفر):
   ```bash
   curl -s "https://khalidjomaa98-collab.github.io/eldamam-mostakhlasat/?x=$RANDOM" | grep -c "<كلمة مميزة من التعديل>"
   ```
7. المستخدمين هيظهرلهم شريط «نسخة جديدة… تحديث الآن» خلال دقايق. الـ Service Worker بيدور على تحديثات كل 30 دقيقة ومع كل فتحة للبرنامج.

## 3. نسخة تجربة للعميل
- **اللي اتعمل قبل كده:** فولدر `site/preview/` بنسخة مبنية من فرع التجربة، واتفتح في نافذة تصفح خفي، وبعدين اتشال.
- **قيد مهم:** الـ Service Worker الأساسي بيرد على أي صفحة جديدة بـ `index.html` القديم، فلازم تتفتح في نافذة تصفح خفي.
- **البيانات حقيقية في التجربة.**

## 4. الرجوع لنسخة سابقة (Rollback)
```bash
git log --oneline
```
```bash
git revert <commit-السيء>
```
```bash
git push origin main
```
أو تقدر ترجع ملفات `site/` لنسخة commit معيّن:
```bash
git checkout <commit-سليم> -- site src
```
```bash
git commit -m "rollback" && git push origin main
```
- `site/sw.js` الجديد هيبقى برقم مختلف، فالمستخدمين هياخدوا النسخة المرجّعة.
- **البيانات مش بترجع مع الكود.** بيانات Supabase منفصلة.

## 5. لو ضاع حساب الاستضافة
| اللي ضاع | الأثر | البديل |
|---|---|---|
| حساب GitHub | الموقع غالباً يفضل شغال لحد ما يتقفل، لكن مفيش تحديثات | انشر `site/` من نسخة محلية على أي استضافة ملفات ثابتة: GitHub تاني، Cloudflare Pages، Netlify، Vercel، أو أي HTTPS. **الرابط هيتغير**، والمستخدمين محتاجين يسطّبوا البرنامج من الرابط الجديد ويدخلوا تاني |
| GitHub Pages اتقفل | نفس اللي فوق | نفس اللي فوق |

**ملاحظة:**
- البرنامج مش معتمد على المسار `/eldamam-mostakhlasat/`، لأن كل الروابط نسبية (`./`)، فيشتغل من أي مسار أو دومين.
- لو الدومين اتغير: الجلسات والبيانات المحلية بتبقى مرتبطة بالدومين القديم، فالمستخدم هيدخل من الأول، والبيانات هتتنزل من Supabase.
