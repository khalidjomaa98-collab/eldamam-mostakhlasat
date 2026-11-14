/* Service worker: يخلي البرنامج يفتح من غير إنترنت، ويجيب التحديثات لما النت يرجع */
const VERSION = "37b361f9794f";
const SHELL = "shell-" + VERSION;
const RUNTIME = "runtime-v1";
const CORE = ["./", "./index.html", "./supabase.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./favicon.png"];
// مكتبات Excel (lib/) كبيرة (~1.8 ميجا): بتتنزل أول مرة تحتاجها بس، وبتفضل محفوظة حتى بعد تحديث البرنامج
// لو غيّرت نسخة المكتبات في lib/ غيّر الرقم ده عشان تتنزل من جديد
const LIBCACHE = "lib-v1";

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // cache:"reload" عشان ياخد الملفات الجديدة من السيرفر مش من كاش المتصفح القديم
    await c.addAll(CORE.map(u => new Request(u, { cache: "reload" })));
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for(const k of await caches.keys()) if((k.startsWith("shell-") && k !== SHELL) || (k.startsWith("lib-") && k !== LIBCACHE)) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("message", e => { if(e.data === "skip") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.hostname.endsWith("supabase.co")) return;              // البيانات: دايماً من السيرفر (والمزامنة بتتعامل مع النت)
  if(url.origin === location.origin && /\/lib\/[^/]+\.js$/.test(url.pathname)){
    // مكتبات Excel: من الكاش الدائم، ولو مش موجودة تتنزل مرة واحدة وتتحفظ
    e.respondWith((async () => {
      const c = await caches.open(LIBCACHE);
      const hit = await c.match(req, { ignoreSearch: true }); if(hit) return hit;
      const res = await fetch(req); if(res.ok) c.put(req, res.clone()); return res;
    })());
    return;
  }
  if(url.origin === location.origin){
    // ملفات البرنامج: من الكاش على طول (سريع وأوفلاين)، والنسخة الجديدة بتتنزل في الخلفية
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await c.match("./index.html") : null);
      if(hit) return hit;
      try{ const res = await fetch(req); if(res.ok) c.put(req, res.clone()); return res; }
      catch{ return (await c.match("./index.html")) || Response.error(); }
    })());
    return;
  }
  // خطوط ومكتبات خارجية: كاش أولاً
  e.respondWith((async () => {
    const r = await caches.open(RUNTIME);
    const hit = await r.match(req); if(hit) return hit;
    try{ const res = await fetch(req); if(res && (res.ok || res.type === "opaque")) r.put(req, res.clone()); return res; }
    catch{ return Response.error(); }
  })());
});
