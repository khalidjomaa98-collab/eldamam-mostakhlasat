/* متابعة المستخلصات — طبقة البيانات (أوفلاين أولاً) + المزامنة مع Supabase + شاشة الدخول
   - كل البيانات بتتخزن على الجهاز (IndexedDB) والبرنامج بيشتغل منها على طول.
   - أي تعديل بيتحفظ على الجهاز فوراً ويدخل «طابور المزامنة»، ويتبعت لما النت يبقى متاح.
   - لو حد تاني عدّل نفس المستخلص: دمج على مستوى الخانة (اللي انت غيرته يكسب في خاناته، والباقي من تعديله).
*/
(function(){
  const SB_URL = "https://vaoubvghpktwjpdzdjnu.supabase.co";
  const SB_KEY = "sb_publishable_rK2i_giFQdiMu7SAlJROtQ_f5Yd2rGb";
  const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  window.__sb = sb;

  let profile = null, session = null, uid = "";
  let resolveReady; const ready = new Promise(r => resolveReady = r);

  /* ---------- IndexedDB ---------- */
  let idbP = null;
  const idbOpen = () => idbP ||= new Promise((res, rej) => {
    const r = indexedDB.open("mostakhlasat-offline", 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("server", { keyPath: "k" }); d.createObjectStore("pending", { keyPath: "k" }); d.createObjectStore("meta"); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const idbAll = async store => { const d = await idbOpen(); return new Promise((res, rej) => { const q = d.transaction(store).objectStore(store).getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error); }); };
  const idbWrite = async (store, fn) => { const d = await idbOpen(); return new Promise((res, rej) => { const t = d.transaction(store, "readwrite"); fn(t.objectStore(store)); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); };
  const idbMetaGet = async key => { const d = await idbOpen(); return new Promise(res => { const q = d.transaction("meta").objectStore("meta").get(key); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }); };
  const idbMetaSet = (key, val) => idbWrite("meta", s => s.put(val, key));

  /* ---------- طبقتين: نسخة السيرفر + تعديلات الجهاز المنتظرة ---------- */
  const server = new Map();   // k -> {k, collection, id, data, version, updated_at, deleted}
  const pending = new Map();  // k -> {k, collection, id, op:'set'|'delete', data, base:{version, data}|null, at}
  const K = (c, id) => c + "/" + id;
  let lastSync = "";
  const subs = new Map();     // collection -> Set(sub)
  const dirty = new Set(); let emitQueued = false;
  const view = k => { const p = pending.get(k); if(p) return p.op === "delete" ? null : p.data; const s = server.get(k); return s && !s.deleted ? s.data : null; };
  const rowsOf = collection => { const out = []; const seen = new Set();
    for(const [k, p] of pending) if(p.collection === collection){ seen.add(k); if(p.op !== "delete") out.push({ id: p.id, data: p.data }); }
    for(const [k, s] of server) if(s.collection === collection && !seen.has(k) && !s.deleted) out.push({ id: s.id, data: s.data });
    return out; };
  const touch = collection => { dirty.add(collection); if(!emitQueued){ emitQueued = true; queueMicrotask(() => { emitQueued = false; const cs = [...dirty]; dirty.clear(); cs.forEach(c => subs.get(c)?.forEach(s => s.emit())); updateSyncUi(); }); } };

  /* ---------- واجهة قاعدة البيانات اللي البرنامج متعود عليها ---------- */
  const genId = () => Array.from(crypto.getRandomValues(new Uint8Array(15)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  const snap = rows => ({ docs: rows.map(r => ({ id: r.id, exists: true, data: () => r.data })), metadata: { fromCache: false, hasPendingWrites: false } });
  function live(collection, opts, cb){
    const sub = { emit(){ let arr = rowsOf(collection);
      if(opts.order){ const [f, d] = opts.order; arr.sort((a,b) => { const x = a.data?.[f] ?? "", y = b.data?.[f] ?? ""; return (x > y ? 1 : x < y ? -1 : 0) * (d === "desc" ? -1 : 1); }); }
      if(opts.limit) arr = arr.slice(0, opts.limit);
      cb(snap(arr)); } };
    if(!subs.has(collection)) subs.set(collection, new Set());
    subs.get(collection).add(sub);
    if(loadedLocal) sub.emit();
    return () => subs.get(collection)?.delete(sub);
  }
  async function writeLocal(collection, id, op, data){
    const k = K(collection, id), prev = pending.get(k), s = server.get(k);
    const base = prev ? prev.base : (s ? { version: s.version, data: s.data, deleted: s.deleted } : null);
    const p = { k, collection, id, op, data: op === "delete" ? null : JSON.parse(JSON.stringify(data)), base, at: new Date().toISOString() };
    pending.set(k, p);
    await idbWrite("pending", st => st.put(p));
    touch(collection);
    scheduleFlush(300);
  }
  class DocRef {
    constructor(c, id){ this.collection = c; this.id = id; }
    async set(data){ if(profile && !["admin","editor"].includes(profile.role)){ const e = new Error("no"); e.code = "invalid_argument"; throw e; } await writeLocal(this.collection, this.id, "set", data); }
    async delete(){ await writeLocal(this.collection, this.id, "delete", null); }
    onSnapshot(cb){ const id = this.id; return live(this.collection, {}, s => { const d = s.docs.find(x => x.id === id); cb(d ? { id, exists: true, data: d.data } : { id, exists: false, data: () => undefined }); }); }
  }
  class Coll {
    constructor(n, o = {}){ this.name = n; this.opts = o; }
    orderBy(f, d){ return new Coll(this.name, { ...this.opts, order: [f, d] }); }
    limit(n){ return new Coll(this.name, { ...this.opts, limit: n }); }
    doc(id){ return new DocRef(this.name, id || genId()); }
    async add(data){ const r = this.doc(); await r.set(data); return { id: r.id }; }
    onSnapshot(cb){ return live(this.name, this.opts, cb); }
  }
  const db = { collection: n => new Coll(n), doc: path => { const [c, id] = path.split("/"); return new DocRef(c, id); } };

  /* ---------- المزامنة ---------- */
  const online = () => navigator.onLine !== false;
  let syncing = false, lastErr = "", flushTimer = null, conflictsNote = [];
  const J = x => JSON.stringify(x ?? null);
  const UNION = new Set(["stageLog", "log", "requests"]);
  function merge3(base, mine, theirs, fieldsOut){
    base = base || {}; theirs = theirs || {}; const out = { ...theirs };
    const keys = new Set([...Object.keys(base), ...Object.keys(mine)]);
    for(const k of keys){
      if(J(mine[k]) === J(base[k])) continue;            // انت مغيرتهاش: سيب نسخة السيرفر
      if(J(theirs[k]) !== J(base[k]) && J(theirs[k]) !== J(mine[k])){
        if(UNION.has(k) && Array.isArray(mine[k]) && Array.isArray(theirs[k])){ const seen = new Set(); out[k] = [...theirs[k], ...mine[k]].filter(x => { const s = J(x); if(seen.has(s)) return false; seen.add(s); return true; }); continue; }
        fieldsOut.push(k);
      }
      if(k in mine) out[k] = mine[k]; else delete out[k];
    }
    return out;
  }
  function applyServerRow(r){
    const k = K(r.collection, r.id), cur = server.get(k);
    if(cur && cur.version > r.version) return false;
    const row = { k, collection: r.collection, id: r.id, data: r.data, version: r.version, updated_at: r.updated_at, deleted: !!r.deleted };
    server.set(k, row); if(r.updated_at && r.updated_at > lastSync) lastSync = r.updated_at;
    return row;
  }
  async function pull(){
    const rows = []; let from = 0; const step = 1000;
    const since = lastSync ? new Date(new Date(lastSync).getTime() - 5000).toISOString() : "";
    for(;;){
      let q = sb.from("docs").select("collection,id,data,version,updated_at,deleted").order("updated_at", { ascending: true }).range(from, from + step - 1);
      if(since) q = q.gte("updated_at", since);
      const { data, error } = await q; if(error) throw error;
      rows.push(...data); if(data.length < step) break; from += step;
    }
    const changed = []; rows.forEach(r => { const row = applyServerRow(r); if(row) changed.push(row); });
    if(changed.length){ await idbWrite("server", st => changed.forEach(x => st.put(x))); new Set(changed.map(x => x.collection)).forEach(touch); }
    await idbMetaSet("lastSync:" + uid, lastSync);
  }
  async function flushOne(p){
    const { data: cur, error } = await sb.from("docs").select("data,version,deleted").eq("collection", p.collection).eq("id", p.id).maybeSingle();
    if(error) throw error;
    let data = p.data, deleted = p.op === "delete", fields = [];
    if(cur && p.base && cur.version !== p.base.version){
      if(!deleted && !cur.deleted) data = merge3(p.base.data, p.data, cur.data, fields);
      if(deleted && !cur.deleted && J(cur.data) !== J(p.base.data)) { deleted = true; }
    }
    if(deleted && !cur) return { row: null };
    const payload = { data: data ?? (cur ? cur.data : {}), deleted };
    let res;
    if(!cur) res = await sb.from("docs").insert({ collection: p.collection, id: p.id, ...payload }).select("collection,id,data,version,updated_at,deleted").maybeSingle();
    else res = await sb.from("docs").update(payload).eq("collection", p.collection).eq("id", p.id).eq("version", cur.version).select("collection,id,data,version,updated_at,deleted").maybeSingle();
    if(res.error) throw res.error;
    if(!res.data) return { retry: true };
    if(fields.length) conflictsNote.push({ c: p.collection, id: p.id, fields });
    return { row: res.data };
  }
  async function flush(){
    if(syncing || !online() || !session) return; syncing = true; updateSyncUi();
    try{
      for(const p of [...pending.values()]){
        let r; try{ r = await flushOne(p); if(r.retry) r = await flushOne(p); }
        catch(e){
          if(e?.code === "42501" || /row-level security|permission/i.test(e?.message || "")){ pending.delete(p.k); await idbWrite("pending", st => st.delete(p.k)); touch(p.collection); toastSafe("مالكش صلاحية تعديل — اتلغى تعديل على «" + p.id + "»"); continue; }
          throw e;
        }
        if(r.retry) continue;
        const cp = pending.get(p.k); if(cp && cp.at !== p.at){ if(r.row){ const row = applyServerRow(r.row); if(row) await idbWrite("server", st => st.put(row)); cp.base = { version: r.row.version, data: r.row.data }; await idbWrite("pending", st => st.put(cp)); } continue; }
        pending.delete(p.k); await idbWrite("pending", st => st.delete(p.k));
        if(r.row){ const row = applyServerRow(r.row); if(row) await idbWrite("server", st => st.put(row)); }
        touch(p.collection);
      }
      await pull();
      lastErr = "";
      if(conflictsNote.length){ toastSafe(`اتدمجت تعديلاتك مع تعديلات حد تاني على ${conflictsNote.length} مستند — راجع الخانات اللي اتعدلت من الطرفين`); conflictsNote = []; }
    }catch(e){ lastErr = online() ? "تعذرت المزامنة، هتتعاد تلقائياً" : ""; }
    finally{ syncing = false; updateSyncUi(); }
  }
  function scheduleFlush(ms){ clearTimeout(flushTimer); flushTimer = setTimeout(() => flush(), ms); }
  let rtChannel = null;
  function subscribeRealtime(){
    if(rtChannel) return;
    rtChannel = sb.channel("docs-all-" + genId()).on("postgres_changes", { event: "*", schema: "public", table: "docs" }, async p => {
      const r = p.new && p.new.id ? p.new : null; if(!r) return;
      const row = applyServerRow(r); if(row){ await idbWrite("server", st => st.put(row)); touch(row.collection); }
    }).subscribe();
  }
  window.addEventListener("online", () => { updateSyncUi(); scheduleFlush(200); });
  window.addEventListener("offline", updateSyncUi);
  document.addEventListener("visibilitychange", () => { if(!document.hidden) scheduleFlush(200); });
  setInterval(() => { if(online() && session) flush(); }, 60000);

  /* ---------- مؤشر المزامنة ---------- */
  function updateSyncUi(){
    const el = document.getElementById("syncPill"); if(!el) return;
    const n = pending.size;
    let cls = "ok", txt = "متزامن";
    if(!online()){ cls = "off"; txt = n ? `بدون إنترنت · ${n} تعديل محفوظ على الجهاز` : "بدون إنترنت · شغال من الجهاز"; }
    else if(syncing){ cls = "busy"; txt = "جارٍ المزامنة…"; }
    else if(lastErr){ cls = "warn"; txt = lastErr; }
    else if(n){ cls = "busy"; txt = `${n} تعديل منتظر الإرسال`; }
    el.className = "syncpill " + cls; el.textContent = txt; el.title = "آخر مزامنة: " + (lastSync ? new Date(lastSync).toLocaleString("ar-EG") : "لسه");
  }
  const toastSafe = m => { try{ if(typeof window.toast === "function") window.toast(m); else console.log(m); }catch{} };

  /* ---------- المستخدم والتنزيلات ---------- */
  const userApi = {
    id: async () => uid,
    me: async () => ({ name: profile?.name || session?.user?.email || "مستخدم" }),
    can: async n => n === "data.write" ? ["admin","editor"].includes(profile?.role) : null,
    isOwner: () => profile?.role === "admin", canEdit: () => profile?.role === "admin",
    profiles: async ids => {
      const out = {}; const cache = JSON.parse(localStorage.getItem("profilesCache") || "{}");
      if(online()){ try{ const { data } = await sb.from("profiles").select("id,name").in("id", ids); (data || []).forEach(p => cache[p.id] = p.name || ""); localStorage.setItem("profilesCache", JSON.stringify(cache)); }catch{} }
      (ids || []).forEach(id => out[id] = { name: cache[id] || "" }); return out;
    }
  };
  const downloadsApi = { save: async ({ filename, data }) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: /\.html?$/i.test(filename) ? "text/html;charset=utf-8" : "application/octet-stream" });
    const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return { status: "saved" }; } };
  window.claude = { use: async n => { await ready; return n === "db" ? db : n === "user" ? userApi : n === "downloads" ? downloadsApi : null; } };

  /* ---------- الدخول ---------- */
  let loadedLocal = false;
  const $ = s => document.querySelector(s);
  async function loadLocal(){
    const [srv, pen] = await Promise.all([idbAll("server"), idbAll("pending")]);
    server.clear(); pending.clear();
    srv.forEach(r => server.set(r.k, r)); pen.forEach(p => pending.set(p.k, p));
    lastSync = (await idbMetaGet("lastSync:" + uid)) || "";
    if(lastSync && ![...server.values()].length) lastSync = "";
    loadedLocal = true;
    new Set([...server.values(), ...pending.values()].map(x => x.collection)).forEach(touch);
    ["projects","invoices","insurance","activity","config"].forEach(touch);
  }
  function showLogin(msg){ document.body.classList.add("auth-out"); $("#login").hidden = false; const e = $("#lgErr"); e.textContent = msg || ""; e.hidden = !msg; setTimeout(() => $("#lgEmail")?.focus(), 50); }
  async function enter(s){
    session = s; uid = s.user.id;
    const owner = await idbMetaGet("owner");
    if(owner && owner !== uid){ await idbWrite("server", st => st.clear()); await idbWrite("pending", st => st.clear()); }
    await idbMetaSet("owner", uid);
    let prof = JSON.parse(localStorage.getItem("profile:" + uid) || "null");
    if(online()){
      const { data, error } = await sb.from("profiles").select("id,name,role").eq("id", uid).maybeSingle();
      if(!error){ prof = data; if(data) localStorage.setItem("profile:" + uid, JSON.stringify(data)); }
    }
    if(!prof){ await sb.auth.signOut(); session = null; showLogin("الحساب ده مش مفعّل في البرنامج. كلّم المدير يضيفك."); return; }
    profile = prof;
    document.body.classList.remove("auth-out"); $("#login").hidden = true;
    addAccountButtons();
    await loadLocal();
    try{ if(navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); }catch{}
    resolveReady();
    if(online()){ subscribeRealtime(); flush(); }
    updateSyncUi();
  }
  function addAccountButtons(){
    const f = document.querySelector(".side .ficons"); if(!f || f.querySelector("#btnPw")) return;
    const foot = document.querySelector(".side .foot"); if(foot && !document.getElementById("syncPill")) foot.insertAdjacentHTML("afterbegin", `<div class="syncpill ok" id="syncPill">متزامن</div>`);
    f.insertAdjacentHTML("beforeend", `<button type="button" class="lnk" id="btnInstall" hidden title="تثبيت البرنامج على الجهاز"><svg class="i" viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 19h16"/></svg><span>تثبيت</span></button><button type="button" class="lnk" id="btnPw" title="تغيير كلمة السر"><svg class="i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><span>كلمة السر</span></button><button type="button" class="lnk" id="btnOut" title="تسجيل الخروج"><svg class="i" viewBox="0 0 24 24"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg><span>خروج</span></button>`);
    document.getElementById("btnOut").onclick = async () => {
      if(pending.size && !confirmOut()) return;
      await sb.auth.signOut().catch(() => {}); await idbWrite("server", st => st.clear()); await idbWrite("pending", st => st.clear()); location.reload(); };
    document.getElementById("btnPw").onclick = () => { if(!online()){ toastSafe("تغيير كلمة السر محتاج إنترنت"); return; } $("#pwBox").hidden = false; $("#pwNew").value = ""; $("#pwNew2").value = ""; $("#pwErr").hidden = true; $("#pwNew").focus(); };
    document.getElementById("btnInstall").onclick = async () => { if(!window.__installEvt) return; window.__installEvt.prompt(); await window.__installEvt.userChoice.catch(() => {}); window.__installEvt = null; document.getElementById("btnInstall").hidden = true; };
    if(window.__installEvt) document.getElementById("btnInstall").hidden = false;
  }
  let outArmed = 0;
  function confirmOut(){ if(Date.now() - outArmed < 4000) return true; outArmed = Date.now(); toastSafe(`فيه ${pending.size} تعديل لسه ماتبعتش. الخروج هيمسحهم — اضغط «خروج» تاني للتأكيد`); return false; }
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); window.__installEvt = e; const b = document.getElementById("btnInstall"); if(b) b.hidden = false; });

  document.addEventListener("DOMContentLoaded", async () => {
    $("#lgForm").addEventListener("submit", async e => {
      e.preventDefault();
      if(!online()){ showLogin("أول دخول محتاج إنترنت. بعد كده البرنامج بيشتغل من غير نت."); return; }
      const btn = $("#lgBtn"); btn.disabled = true; btn.textContent = "جارٍ الدخول…";
      const { data, error } = await sb.auth.signInWithPassword({ email: $("#lgEmail").value.trim(), password: $("#lgPass").value });
      btn.disabled = false; btn.textContent = "دخول";
      if(error){ showLogin(/invalid/i.test(error.message) ? "الإيميل أو كلمة السر غلط." : "تعذر الدخول. تحقق من الإنترنت وحاول تاني."); return; }
      enter(data.session);
    });
    $("#pwForm").addEventListener("submit", async e => {
      e.preventDefault(); const a = $("#pwNew").value, b = $("#pwNew2").value, er = $("#pwErr");
      if(a.length < 6){ er.textContent = "كلمة السر لازم تكون 6 حروف أو أرقام على الأقل."; er.hidden = false; return; }
      if(a !== b){ er.textContent = "كلمتين السر مش زي بعض."; er.hidden = false; return; }
      const { error } = await sb.auth.updateUser({ password: a });
      if(error){ er.textContent = "تعذر تغيير كلمة السر: " + error.message; er.hidden = false; return; }
      $("#pwBox").hidden = true; toastSafe("اتغيرت كلمة السر");
    });
    $("#pwCancel").onclick = () => $("#pwBox").hidden = true;
    const { data } = await sb.auth.getSession();
    if(data?.session) enter(data.session); else showLogin(online() ? "" : "أول دخول محتاج إنترنت.");
  });
  sb.auth.onAuthStateChange((ev, s) => { if(s) session = s; });

  /* ---------- تحديثات البرنامج نفسه ---------- */
  if("serviceWorker" in navigator && location.protocol !== "file:"){
    navigator.serviceWorker.register("sw.js").then(reg => { window.__swReg = reg; if(reg.waiting && navigator.serviceWorker.controller){ const b = document.getElementById("updBar"); if(b) b.hidden = false; }
      reg.addEventListener("updatefound", () => { const w = reg.installing; w && w.addEventListener("statechange", () => {
        if(w.state === "installed" && navigator.serviceWorker.controller){ const b = document.getElementById("updBar"); if(b) b.hidden = false; } }); });
      setInterval(() => reg.update().catch(() => {}), 30 * 60000);
    }).catch(() => {});
  }
  let reloading = false;
  if("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("controllerchange", () => { if(reloading) location.reload(); });
  window.__applyUpdate = async () => { reloading = true; if(pending.size && online()) await flush().catch(() => {}); const w = window.__swReg?.waiting; if(w) w.postMessage("skip"); else location.reload(); };
})();
