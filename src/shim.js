/* طبقة الربط بين البرنامج و Supabase + شاشة الدخول */
(function(){
  const SB_URL = "https://vaoubvghpktwjpdzdjnu.supabase.co";
  const SB_KEY = "sb_publishable_rK2i_giFQdiMu7SAlJROtQ_f5Yd2rGb";
  const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  window.__sb = sb;

  let profile = null, session = null;
  let resolveReady; const ready = new Promise(r => resolveReady = r);

  /* ---------- قاعدة البيانات بنفس واجهة البرنامج ---------- */
  const subs = new Map(); // collection -> Set of live subscriptions
  const genId = () => Array.from(crypto.getRandomValues(new Uint8Array(15)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  const err = e => { const x = new Error(e?.message || "error"); x.code = (e?.code === "42501" || /row-level security|permission/i.test(e?.message||"")) ? "invalid_argument" : "unavailable"; return x; };
  const snap = rows => ({ docs: rows.map(r => ({ id: r.id, exists: true, data: () => r.data })), metadata: { fromCache: false, hasPendingWrites: false } });

  async function loadAll(collection){
    const out = []; let from = 0; const step = 1000;
    for(;;){
      const { data, error } = await sb.from("docs").select("id,data").eq("collection", collection).range(from, from + step - 1);
      if(error) throw err(error);
      out.push(...data); if(data.length < step) break; from += step;
    }
    return out;
  }
  function liveCollection(collection, opts, cb, onErr){
    const rows = new Map(); let alive = true;
    const emit = () => {
      if(!alive) return;
      let arr = [...rows.values()];
      if(opts.order){ const [f, d] = opts.order; arr.sort((a,b) => { const x = a.data?.[f] ?? "", y = b.data?.[f] ?? ""; return (x > y ? 1 : x < y ? -1 : 0) * (d === "desc" ? -1 : 1); }); }
      if(opts.limit) arr = arr.slice(0, opts.limit);
      cb(snap(arr));
    };
    const sub = { apply(id, data){ if(data === null) rows.delete(id); else rows.set(id, { id, data }); emit(); } };
    if(!subs.has(collection)) subs.set(collection, new Set());
    subs.get(collection).add(sub);
    const load = () => loadAll(collection).then(list => { rows.clear(); list.forEach(r => rows.set(r.id, r)); emit(); }).catch(e => onErr && onErr(e));
    const ch = sb.channel("docs-" + collection + "-" + genId())
      .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: "collection=eq." + collection }, p => {
        if(p.eventType === "DELETE") rows.delete(p.old?.id); else if(p.new) rows.set(p.new.id, { id: p.new.id, data: p.new.data });
        emit();
      })
      .subscribe(st => { if(st === "SUBSCRIBED") load(); });
    load();
    return () => { alive = false; subs.get(collection)?.delete(sub); sb.removeChannel(ch); };
  }
  const local = (collection, id, data) => subs.get(collection)?.forEach(s => s.apply(id, data));

  class DocRef {
    constructor(collection, id){ this.collection = collection; this.id = id; }
    async set(data){
      const clean = JSON.parse(JSON.stringify(data));
      const { error } = await sb.from("docs").upsert({ collection: this.collection, id: this.id, data: clean }, { onConflict: "collection,id" });
      if(error) throw err(error);
      local(this.collection, this.id, clean);
    }
    async delete(){
      const { error } = await sb.from("docs").delete().eq("collection", this.collection).eq("id", this.id);
      if(error) throw err(error);
      local(this.collection, this.id, null);
    }
    onSnapshot(cb, onErr){
      const id = this.id;
      return liveCollection(this.collection, {}, s => { const d = s.docs.find(x => x.id === id); cb(d ? { id, exists: true, data: d.data } : { id, exists: false, data: () => undefined }); }, onErr);
    }
  }
  class Coll {
    constructor(name, opts = {}){ this.name = name; this.opts = opts; }
    orderBy(f, d){ return new Coll(this.name, { ...this.opts, order: [f, d] }); }
    limit(n){ return new Coll(this.name, { ...this.opts, limit: n }); }
    doc(id){ return new DocRef(this.name, id || genId()); }
    async add(data){ const ref = this.doc(); await ref.set(data); return { id: ref.id }; }
    onSnapshot(cb, onErr){ return liveCollection(this.name, this.opts, cb, onErr); }
  }
  const db = {
    collection: name => new Coll(name),
    doc: path => { const [c, id] = path.split("/"); return new DocRef(c, id); }
  };

  /* ---------- المستخدم ---------- */
  const userApi = {
    id: async () => session?.user?.id || "",
    me: async () => ({ name: profile?.name || session?.user?.email || "مستخدم" }),
    can: async name => name === "data.write" ? ["admin","editor"].includes(profile?.role) : null,
    isOwner: () => profile?.role === "admin",
    canEdit: () => profile?.role === "admin",
    profiles: async ids => {
      const out = {}; if(!ids?.length) return out;
      const { data } = await sb.from("profiles").select("id,name").in("id", ids);
      (data || []).forEach(p => out[p.id] = { name: p.name || "" });
      return out;
    }
  };
  /* ---------- تنزيل الملفات ---------- */
  const downloadsApi = {
    save: async ({ filename, data }) => {
      const blob = data instanceof Blob ? data : new Blob([data], { type: /\.html?$/i.test(filename) ? "text/html;charset=utf-8" : "application/octet-stream" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return { status: "saved" };
    }
  };
  window.claude = { use: async name => { await ready; return name === "db" ? db : name === "user" ? userApi : name === "downloads" ? downloadsApi : null; } };

  /* ---------- شاشة الدخول ---------- */
  const $ = s => document.querySelector(s);
  function showLogin(msg){
    document.body.classList.add("auth-out");
    $("#login").hidden = false; $("#lgErr").textContent = msg || ""; $("#lgErr").hidden = !msg;
    setTimeout(() => $("#lgEmail")?.focus(), 50);
  }
  async function enter(s){
    session = s;
    const { data, error } = await sb.from("profiles").select("id,name,role").eq("id", s.user.id).maybeSingle();
    if(error || !data){ await sb.auth.signOut(); session = null; showLogin("الحساب ده مش مفعّل في البرنامج. كلّم المدير يضيفك."); return; }
    profile = data;
    document.body.classList.remove("auth-out"); $("#login").hidden = true;
    addAccountButtons();
    resolveReady();
  }
  function addAccountButtons(){
    const f = document.querySelector(".side .ficons"); if(!f || f.querySelector("#btnPw")) return;
    f.insertAdjacentHTML("beforeend", `<button type="button" class="lnk" id="btnPw" title="تغيير كلمة السر"><svg class="i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><span>كلمة السر</span></button><button type="button" class="lnk" id="btnOut" title="تسجيل الخروج"><svg class="i" viewBox="0 0 24 24"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg><span>خروج</span></button>`);
    document.getElementById("btnOut").onclick = async () => { await sb.auth.signOut(); location.reload(); };
    document.getElementById("btnPw").onclick = () => { $("#pwBox").hidden = false; $("#pwNew").value = ""; $("#pwNew2").value = ""; $("#pwErr").hidden = true; $("#pwNew").focus(); };
  }
  document.addEventListener("DOMContentLoaded", async () => {
    $("#lgForm").addEventListener("submit", async e => {
      e.preventDefault();
      const btn = $("#lgBtn"); btn.disabled = true; btn.textContent = "جارٍ الدخول…";
      const { data, error } = await sb.auth.signInWithPassword({ email: $("#lgEmail").value.trim(), password: $("#lgPass").value });
      btn.disabled = false; btn.textContent = "دخول";
      if(error){ showLogin(/invalid/i.test(error.message) ? "الإيميل أو كلمة السر غلط." : "تعذر الدخول. تحقق من الإنترنت وحاول تاني."); return; }
      enter(data.session);
    });
    $("#pwForm").addEventListener("submit", async e => {
      e.preventDefault();
      const a = $("#pwNew").value, b = $("#pwNew2").value, er = $("#pwErr");
      if(a.length < 6){ er.textContent = "كلمة السر لازم تكون 6 حروف أو أرقام على الأقل."; er.hidden = false; return; }
      if(a !== b){ er.textContent = "كلمتين السر مش زي بعض."; er.hidden = false; return; }
      const { error } = await sb.auth.updateUser({ password: a });
      if(error){ er.textContent = "تعذر تغيير كلمة السر: " + error.message; er.hidden = false; return; }
      $("#pwBox").hidden = true; if(window.toast) window.toast("اتغيرت كلمة السر");
    });
    $("#pwCancel").onclick = () => $("#pwBox").hidden = true;
    const { data } = await sb.auth.getSession();
    if(data?.session) enter(data.session); else showLogin();
  });
})();
