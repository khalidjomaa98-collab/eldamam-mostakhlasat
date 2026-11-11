# ACCOUNTS AND ACCESS — الحسابات والخدمات الخارجية

> تاريخ الإعداد: 2026-11-09
> **مفيش كلمات سر في الملف ده.** الحسابات اللي مكتوبة اتعرفت من الإعداد أو من الكود. أي حاجة مش متأكد منها مكتوب عليها UNKNOWN، ومكتوب جنبها طريقة معرفتها.

## 1. ملخص الاعتماديات
| الخدمة | لازمة لتشغيل البرنامج؟ | لو ضاع الحساب |
|---|---|---|
| **Supabase** (قاعدة البيانات + الدخول) | **حرجة** | البرنامج يقف والبيانات تضيع لو مفيش نسخة احتياطية |
| **GitHub** (الكود + النشر) | حرجة للتحديثات والاستضافة | الموقع ممكن يفضل شغال، لكن مفيش تحديثات، والكود موجود بس في النسخ المحلية |
| cdnjs | لازمة للتصدير لـ Excel بس | التصدير يقف (البرنامج متاخد كاش عند المستخدمين اللي استخدموه قبل كده) |
| Google Fonts | تجميلية | البرنامج يشتغل بخط النظام |
| Claude.ai | **مش لازمة للتشغيل** | تفقد سجل المحادثات وبيئة التطوير السحابية بس |
| Netlify | مش مستخدم | — |

## 2. تفاصيل كل خدمة

### 2.1 Supabase
| البند | التفاصيل |
|---|---|
| الوظيفة | PostgreSQL، وتسجيل الدخول، والـ API، والـ Realtime |
| رابط الدخول | https://supabase.com/dashboard |
| رابط المشروع | https://supabase.com/dashboard/project/vaoubvghpktwjpdzdjnu |
| المشروع / Workspace | مشروع `mostakhlasat`، ref `vaoubvghpktwjpdzdjnu`، وorganization id `gjvloclurhutretebrwi` (VERIFIED وقت الإنشاء) |
| الحساب المالك | INFERRED: `eldamamfacility@gmail.com`. صاحب البرنامج دخل بالحساب ده وقت الإنشاء. **NEEDS VERIFICATION** |
| البيانات | كل بيانات البرنامج والمستخدمين |
| استعادة الوصول | «Forgot password» في صفحة دخول Supabase على إيميل الحساب، أو دخول GitHub لو الحساب معمول بـ GitHub (UNKNOWN) |
| الأهمية | حرجة |
| بيعتمد على Claude؟ | لأ. لكن ربط Claude بـ Supabase (MCP connector) **حالياً متوصل بحساب Supabase تاني** فيه مشاريع `yawmeya` و`taqsit`، فمش شايف المشروع ده |

### 2.2 GitHub (الكود + الاستضافة)
| البند | التفاصيل |
|---|---|
| الوظيفة | المستودع، وGitHub Actions للبناء والنشر، وGitHub Pages للاستضافة |
| رابط المستودع | https://github.com/khalidjomaa98-collab/eldamam-mostakhlasat (**عام Public**، اتعمل عام عشان GitHub Pages المجاني) |
| الموقع المنشور | https://khalidjomaa98-collab.github.io/eldamam-mostakhlasat/ |
| إعدادات Pages | Repo ← Settings ← Pages ← Source: **GitHub Actions** (VERIFIED: الموقع بيتنشر من الـ workflow) |
| الحساب | مستخدم GitHub `khalidjomaa98-collab` (VERIFIED). **إيميل الحساب UNKNOWN** وتعرفه من GitHub ← Settings ← Emails |
| الفروع | `main` = المنشور. و`closeout-module` و`contract-reduction` فروع اندمجت وممكن تتمسح |
| مستودع تاني باسم مشابه | `khalidjomaa98-collab/mostakhlasat` موجود ومنفصل. **مش تبع البرنامج ده ومتعدلش فيه** (INFERRED: نسخة أو تجربة قديمة) |
| استعادة الوصول | استعادة حساب GitHub بالإيميل أو 2FA recovery codes |
| الأهمية | حرجة |
| بيعتمد على Claude؟ | لأ. Claude كان بيعمل push بتصريح GitHub App المربوط بجلسة Claude |

### 2.3 مستخدمين البرنامج (Supabase Auth)
| الاسم في البرنامج | الإيميل | الدور |
|---|---|---|
| خالد | `k_elgindy@yahoo.com` | admin |
| المدير | `eldamamfacility@gmail.com` | admin |

> **تنبيه أمني (VERIFIED في 2026-11-09):** حساب `eldamamfacility@gmail.com` لسه شغال بكلمة السر الافتراضية اللي اتعملت وقت الإنشاء. **غيّرها فوراً** من زرار «كلمة السر» جوه البرنامج. حساب `k_elgindy@yahoo.com` اتعمل بنفس كلمة السر الافتراضية، وتغييرها **UNKNOWN**.

### 2.4 cdnjs (Cloudflare)
| البند | التفاصيل |
|---|---|
| الوظيفة | تحميل ExcelJS 4.4.0 وSheetJS 0.18.5 وقت التصدير |
| الحساب | مفيش، خدمة عامة |
| الاستبدال | نزّل الملفين وحطهم في `site/` وعدّل الروابط في `src/app.html` و`src/sw.js` |

### 2.5 Google Fonts
خطوط IBM Plex Sans Arabic وReadex Pro. من غير حساب.

### 2.6 Claude.ai (أدوات التطوير بس)
| البند | التفاصيل |
|---|---|
| الحساب المستخدم في التطوير | UNKNOWN في الملفات. صاحب الحساب يعرفه |
| Artifact قديم | https://claude.ai/artifact/MoXvaLtcAY1V97sFi3enNP: النسخة الأولى للبرنامج قبل Supabase، وبياناتها نسخة قديمة. **مش مستخدم** |
| بيئة سحابية | Claude Code cloud environment باسم «eldamam-mostakhlasat» (id `env_01MYAMKK9Kc3u2a1wncqXFpR`)، بتسمح بالاتصال بـ Supabase وgithub.io |
| بيعتمد عليه البرنامج؟ | **لأ.** `window.claude` في الكود اسم داخلي بينفذه `src/shim.js` |

### 2.7 Netlify (مش مستخدم)
| البند | التفاصيل |
|---|---|
| الحالة | اتجرب للنشر يوم 2026-11-07، لكن مكنش بيفتح على شبكة المستخدم، فاتنقلنا لـ GitHub Pages. فيه بقايا: `netlify.toml` و`site/_headers` |
| موقع محتمل | `eldammam.netlify.app`، INFERRED من إعدادات الشبكة. **NEEDS VERIFICATION**: لو موجود ومش محتاجينه احذفه من https://app.netlify.com |

### 2.8 خدمات غير موجودة (VERIFIED بالبحث في الكود)
| الخدمة | موجودة؟ |
|---|---|
| دومين خاص أو DNS | **لأ**: مفيش ملف `CNAME`، والعنوان `github.io` |
| مزود إيميل (SMTP) | لأ. البرنامج مش بيبعت إيميلات (Supabase Auth عنده إيميلات افتراضية، لكن البرنامج مفيهوش «نسيت كلمة السر») |
| بوابة دفع | لأ |
| Analytics | لأ |
| مراقبة أخطاء (Sentry وغيره) | لأ |
| خدمات AI وقت التشغيل | لأ |

## 3. المعلومات اللي محتاجة تدخلك
1. تأكيد إيميل حساب Supabase المالك لمشروع `mostakhlasat`، وتفعيل 2FA عليه.
2. خطة Supabase (Free/Pro) وهل فيه Backups.
3. إيميل حساب GitHub `khalidjomaa98-collab` وتفعيل 2FA وحفظ recovery codes.
4. تغيير كلمة سر `eldamamfacility@gmail.com` في البرنامج، والتأكد من `k_elgindy@yahoo.com`.
5. Supabase ← Authentication ← Sign In / Providers: التأكد إن **Allow new users to sign up = OFF**.
6. هل فيه موقع Netlify اسمه `eldammam`؟ احذفه لو مش محتاجه.
7. إعادة ربط Supabase connector في Claude بالحساب الصح، لو عايز Claude يدير قاعدة البيانات مباشرة.
