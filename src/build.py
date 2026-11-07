import re, os, shutil, sys
S = sys.argv[1]
app = open(f"{S}/src/app.html", encoding="utf-8").read()
shim = open(f"{S}/src/shim.js", encoding="utf-8").read()
logo = re.search(r'LOGO_NAVY *= *"(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"', app).group(1)

# page title/links/style come first in the artifact; keep them in <head>
i = app.index("</style>") + len("</style>")
head_part, body_part = app[:i], app[i:]

login = f'''
<section class="login" id="login" hidden>
  <form class="lg-card" id="lgForm" autocomplete="on">
    <img src="{logo}" alt="" class="lg-logo">
    <h1>متابعة المستخلصات</h1>
    <p class="lg-sub">شركة الدمام للمقاولات العامة</p>
    <label for="lgEmail">الإيميل</label>
    <input id="lgEmail" type="email" required autocomplete="username" dir="ltr" placeholder="name@example.com">
    <label for="lgPass">كلمة السر</label>
    <input id="lgPass" type="password" required autocomplete="current-password" dir="ltr">
    <div class="lg-err" id="lgErr" hidden></div>
    <button type="submit" id="lgBtn">دخول</button>
    <p class="lg-note">لو نسيت كلمة السر أو محتاج حساب، كلّم مدير البرنامج.</p>
  </form>
</section>
<div class="pwbox" id="pwBox" hidden>
  <form class="lg-card" id="pwForm">
    <h1 style="font-size:1.15rem">تغيير كلمة السر</h1>
    <label for="pwNew">كلمة السر الجديدة</label><input id="pwNew" type="password" autocomplete="new-password" dir="ltr">
    <label for="pwNew2">اكتبها تاني</label><input id="pwNew2" type="password" autocomplete="new-password" dir="ltr">
    <div class="lg-err" id="pwErr" hidden></div>
    <div style="display:flex;gap:8px"><button type="submit">حفظ</button><button type="button" id="pwCancel" class="lg-ghost">إلغاء</button></div>
  </form>
</div>'''

css = '''<style>
[hidden]{display:none!important}
body.auth-out .app,body.auth-out .fab,body.auth-out .bulk,body.auth-out .toast{display:none!important}
.login,.pwbox{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:16px;background:radial-gradient(circle at 70% 20%,#1c2a6e 0,#0b1550 55%,#070d36 100%)}
.pwbox{background:rgba(5,10,30,.55)}
.lg-card{width:min(400px,100%);background:var(--surface,#fff);color:var(--fg,#14222a);border-radius:18px;padding:28px 26px;display:flex;flex-direction:column;gap:8px;box-shadow:0 30px 80px rgba(0,0,0,.35)}
.lg-logo{height:72px;width:auto;align-self:center;margin-bottom:4px}
.lg-card h1{font-family:"Readex Pro","IBM Plex Sans Arabic",sans-serif;font-size:1.45rem;text-align:center;margin:0}
.lg-sub{text-align:center;color:var(--muted,#5f6f78);margin:0 0 10px;font-size:.88rem}
.lg-card label{font-size:.8rem;font-weight:600;color:var(--muted,#5f6f78);margin-top:6px}
.lg-card input{padding:11px 12px;border:1px solid var(--line,#dde3e7);border-radius:10px;background:var(--sunk,#f4f6f8);font:inherit;font-size:1rem;color:inherit}
.lg-card input:focus{outline:2px solid var(--accent,#1f7a8c);outline-offset:1px}
.lg-card button{margin-top:12px;padding:12px;border:0;border-radius:10px;background:var(--accent,#1f7a8c);color:#fff;font:inherit;font-weight:700;font-size:1rem;cursor:pointer;flex:1}
.lg-card button:disabled{opacity:.6}
.lg-card .lg-ghost{background:var(--sunk,#f4f6f8);color:var(--fg,#14222a)}
.lg-err{background:var(--bad-soft,#fbe4e1);color:var(--bad,#c0392b);border-radius:8px;padding:8px 10px;font-size:.85rem;font-weight:600}
.side .ficons{flex-wrap:wrap;row-gap:4px}
.lg-note{font-size:.76rem;color:var(--faint,#8a99a1);text-align:center;margin:6px 0 0}
</style>'''

html = f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
{head_part}
{css}
<script src="supabase.js"></script>
<script>{shim}</script>
</head>
<body class="auth-out">
{login}
{body_part}
</body>
</html>'''
out = f"{S}/site"
os.makedirs(out, exist_ok=True)
open(f"{out}/index.html", "w", encoding="utf-8").write(html)
pass  # supabase.js (v2.45.4) محفوظ جاهز في site/
open(f"{out}/_headers", "w").write("/*\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n  X-Robots-Tag: noindex\n")
print("built", len(html))
