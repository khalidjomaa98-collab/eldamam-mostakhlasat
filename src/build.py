"""بناء الموقع: python3 src/build.py .
بيطلع site/ فيه: index.html (البرنامج + شاشة الدخول + طبقة الأوفلاين) و sw.js و manifest و الأيقونات.
"""
import re, os, sys, json, hashlib, base64, io
S = sys.argv[1] if len(sys.argv) > 1 else "."
app = open(f"{S}/src/app.html", encoding="utf-8").read()
shim = open(f"{S}/src/shim.js", encoding="utf-8").read()
sw = open(f"{S}/src/sw.js", encoding="utf-8").read()
logo_uri = re.search(r'LOGO_NAVY *= *"(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"', app).group(1)
out = f"{S}/site"; os.makedirs(out, exist_ok=True)

# ---------- الأيقونات من لوجو الشركة ----------
try:
    from PIL import Image
    from PIL import ImageDraw
    logo = Image.open(io.BytesIO(base64.b64decode(logo_uri.split(",", 1)[1]))).convert("RGBA")
    logo = logo.crop(logo.split()[3].getbbox())
    white = Image.new("RGBA", logo.size, (255, 255, 255, 255)); white.putalpha(logo.split()[3])
    def tile(size, fill_h, radius):
        # مربع كحلي بزوايا مدورة واللوجو أبيض في النص وبيملا أغلب المساحة
        ss = size * 4
        bg = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
        top, bot = (0x23, 0x35, 0x8f), (0x0b, 0x15, 0x50)
        grad = Image.new("RGBA", (ss, ss))
        gd = ImageDraw.Draw(grad)
        for y in range(ss):
            t = y / (ss - 1); gd.line([(0, y), (ss, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
        mask = Image.new("L", (ss, ss), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, ss - 1, ss - 1], radius=int(ss * radius), fill=255)
        bg.paste(grad, (0, 0), mask)
        h = int(ss * fill_h); w = int(white.width * h / white.height)
        lg = white.resize((w, h), Image.LANCZOS)
        bg.alpha_composite(lg, ((ss - w) // 2, (ss - h) // 2))
        return bg.resize((size, size), Image.LANCZOS)
    tile(192, .72, .22).save(f"{out}/icon-192.png", optimize=True)
    tile(512, .72, .22).save(f"{out}/icon-512.png", optimize=True)
    tile(512, .56, 0).save(f"{out}/icon-maskable.png", optimize=True)
    tile(64, .76, .22).save(f"{out}/favicon.png", optimize=True)
except ImportError:
    print("PIL مش متسطب: الأيقونات القديمة هتفضل زي ما هي")

manifest = {
  "name": "مستخلصات الدمام", "short_name": "مستخلصات الدمام",
  "description": "متابعة مستخلصات شركة الدمام للمقاولات العامة",
  "lang": "ar", "dir": "rtl", "start_url": "./", "scope": "./", "display": "standalone",
  "background_color": "#0b1550", "theme_color": "#0b1550",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]
}
open(f"{out}/manifest.webmanifest", "w", encoding="utf-8").write(json.dumps(manifest, ensure_ascii=False, indent=1))


splash = f'''<div class="splash" id="splash" aria-hidden="true">
  <div class="sp-orb o1"></div><div class="sp-orb o2"></div><div class="sp-orb o3"></div>
  <div class="sp-c">
    <div class="sp-logo"><span class="sp-ring"></span><img src="{logo_uri}" alt=""></div>
    <div class="sp-t">متابعة المستخلصات</div>
    <div class="sp-s">شركة الدمام للمقاولات العامة</div>
    <div class="sp-bar"><i></i></div>
  </div>
</div>
<script>
(function(){{
  var t0=Date.now(), el=document.getElementById("splash"), done=false;
  function hide(){{ if(done||!el) return; done=true; el.classList.add("out"); setTimeout(function(){{ el.remove(); }},700); }}
  function ready(){{ var lg=document.getElementById("login"); if(lg && !lg.hidden) return true;
    if(document.body.classList.contains("auth-out")) return false; var c=document.getElementById("cInv"); return !!(c && c.textContent && c.textContent!=="0"); }}
  var iv=setInterval(function(){{ if(Date.now()-t0>1300 && ready()){{ clearInterval(iv); hide(); }} if(Date.now()-t0>9000){{ clearInterval(iv); hide(); }} }},80);
}})();
</script>'''
splash_css = '''<style>
.splash{position:fixed;inset:0;z-index:200;display:grid;place-items:center;overflow:hidden;background:radial-gradient(120% 90% at 70% 15%,#1c2a6e 0,#0b1550 50%,#060b2e 100%);transition:opacity .6s ease,visibility .6s ease,transform .6s ease}
.splash.out{opacity:0;visibility:hidden;transform:scale(1.04)}
.sp-orb{position:absolute;border-radius:50%;filter:blur(60px);opacity:.55;animation:spFloat 6s ease-in-out infinite alternate}
.sp-orb.o1{width:46vmax;height:46vmax;background:#1f7a8c;top:-18vmax;left:-12vmax}
.sp-orb.o2{width:38vmax;height:38vmax;background:#4b4fd8;bottom:-16vmax;right:-10vmax;animation-delay:-2s}
.sp-orb.o3{width:24vmax;height:24vmax;background:#8a4fd0;top:40%;left:55%;opacity:.35;animation-delay:-4s}
@keyframes spFloat{to{transform:translate(4vmax,3vmax) scale(1.08)}}
.sp-c{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;padding:34px 46px;border-radius:28px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);box-shadow:0 30px 80px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.15);animation:spIn .9s cubic-bezier(.16,1,.3,1) both;color:#fff;font-family:"Readex Pro","IBM Plex Sans Arabic",Tahoma,sans-serif;text-align:center}
@keyframes spIn{from{opacity:0;transform:translateY(18px) scale(.94)}}
.sp-logo{position:relative;width:118px;height:118px;display:grid;place-items:center}
.sp-logo img{height:84px;width:auto;filter:brightness(0) invert(1) drop-shadow(0 6px 18px rgba(91,182,201,.55));animation:spLogo 1.1s cubic-bezier(.34,1.56,.64,1) .15s both}
@keyframes spLogo{from{opacity:0;transform:scale(.6) rotate(-8deg)}}
.sp-ring{position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:#5bb6c9;border-inline-end-color:rgba(91,182,201,.35);animation:spSpin 1.1s linear infinite}
@keyframes spSpin{to{transform:rotate(360deg)}}
.sp-t{font-size:1.5rem;font-weight:700;letter-spacing:-.01em;margin-top:6px;animation:spIn .9s .25s cubic-bezier(.16,1,.3,1) both}
.sp-s{font-size:.9rem;color:#b9c3e6;animation:spIn .9s .35s cubic-bezier(.16,1,.3,1) both}
.sp-bar{width:180px;height:4px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:12px}
.sp-bar i{display:block;height:100%;width:40%;border-radius:4px;background:linear-gradient(90deg,transparent,#5bb6c9,#fff,#5bb6c9,transparent);animation:spLoad 1.2s ease-in-out infinite}
@keyframes spLoad{from{transform:translateX(260%)}to{transform:translateX(-160%)}}
@media (prefers-reduced-motion:reduce){.sp-orb,.sp-ring,.sp-bar i{animation:none}}
</style>'''

i = app.index("</style>") + len("</style>")
head_part, body_part = app[:i], app[i:]

login = f'''
<section class="login" id="login" hidden>
  <form class="lg-card" id="lgForm" autocomplete="on">
    <img src="{logo_uri}" alt="" class="lg-logo">
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
</div>
<div class="updbar" id="updBar" hidden>نسخة جديدة من البرنامج جاهزة <button type="button" onclick="window.__applyUpdate()">تحديث الآن</button></div>'''

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
.syncpill{display:flex;align-items:center;gap:7px;font-size:.74rem;font-weight:600;border-radius:999px;padding:4px 10px;background:rgba(255,255,255,.08);color:var(--side-fg,#dde3f5)}
.syncpill::before{content:"";width:8px;height:8px;border-radius:50%;flex:none;background:#3fbf7f}
body.side-mini .syncpill{font-size:0;gap:0;padding:7px;justify-content:center}
.syncpill.busy::before{background:#e8b74a}
.syncpill.off::before{background:#9aa6c4}
.syncpill.warn::before{background:#e5655b}
.updbar{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:90;background:#0b1550;color:#fff;border-radius:12px;padding:10px 14px;display:flex;gap:12px;align-items:center;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.3)}
.updbar button{border:0;border-radius:8px;background:#fff;color:#0b1550;font:inherit;font-weight:700;padding:6px 12px;cursor:pointer}
</style>'''

html = f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0b1550">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="favicon.png">
<link rel="apple-touch-icon" href="icon-192.png">
{splash_css}
{head_part}
{css}
<script src="supabase.js"></script>
<script>{shim}</script>
</head>
<body class="auth-out">
{splash}
{login}
{body_part}
</body>
</html>'''
open(f"{out}/index.html", "w", encoding="utf-8").write(html)
h = hashlib.sha256((html + shim + sw).encode())
for n in ("icon-192.png", "icon-512.png", "icon-maskable.png", "favicon.png", "manifest.webmanifest"):
    if os.path.exists(f"{out}/{n}"): h.update(open(f"{out}/{n}", "rb").read())
ver = h.hexdigest()[:12]
open(f"{out}/sw.js", "w", encoding="utf-8").write(sw.replace("__VERSION__", ver))
open(f"{out}/.nojekyll", "w").write("")
print("built", len(html), "version", ver)
