# متابعة المستخلصات — شركة الدمام

- `site/` : الموقع اللي بينشره Netlify (index.html + supabase.js).
- `src/app.html` : مصدر البرنامج. `src/shim.js` : الربط مع Supabase وشاشة الدخول.
- البناء: `python3 src/build.py .` بيطلع `site/index.html` من المصدر.
- البيانات وتسجيل الدخول على Supabase (مشروع mostakhlasat).
- `monazoma/` : مشروع منفصل — «منظومة المتابعة» لفرع الطرق بكتيبة 91 (واجهة أولية، غير منشورة). التفاصيل في `monazoma/HANDOVER.md`.
