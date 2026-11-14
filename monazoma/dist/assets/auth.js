/* منظومة المتابعة — الربط مع Supabase (تسجيل الدخول والجلسة والصلاحيات) */
(function () {
  const SB_URL = "https://pbufzaowmoigdeiusjin.supabase.co";
  const SB_KEY = "sb_publishable_XTdoBAA7rIcgXter4YrN-Q_gWUABcpe";
  const USER_DOMAIN = "monazoma.local"; // اسم المستخدم بدون @ يتحول لـ <الاسم>@monazoma.local

  // «تذكرني»: الجلسة في localStorage، غير كده في sessionStorage وتنتهي بقفل المتصفح
  const REMEMBER_KEY = "monazoma-remember";
  const safe = (fn, fb) => { try { return fn(); } catch { return fb; } };
  const remembered = () => safe(() => localStorage.getItem(REMEMBER_KEY) === "1", false);
  const storage = {
    getItem: k => safe(() => (remembered() ? localStorage : sessionStorage).getItem(k), null),
    setItem: (k, v) => safe(() => (remembered() ? localStorage : sessionStorage).setItem(k, v)),
    removeItem: k => { safe(() => localStorage.removeItem(k)); safe(() => sessionStorage.removeItem(k)); },
  };

  const sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storage },
  });

  const ROLE_LABEL = { admin: "مدير المنظومة", editor: "إدخال وتعديل", viewer: "اطلاع فقط" };
  const toEmail = u => (u.includes("@") ? u : `${u}@${USER_DOMAIN}`).toLowerCase();

  async function loadProfile(userId) {
    const { data, error } = await sb.from("profiles").select("id,name,role,active").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  /* ---------- صفحة الدخول ---------- */
  async function initLogin() {
    const form = document.getElementById("login-form");
    const msg = document.getElementById("message");
    const btn = form.querySelector("button[type=submit]");
    const remember = document.getElementById("remember");
    remember.checked = remembered();

    const { data: { session } } = await sb.auth.getSession();
    if (session) { location.replace("dashboard.html"); return; }

    document.getElementById("forgot").addEventListener("click", e => {
      e.preventDefault();
      msg.className = "message info";
      msg.textContent = "لإعادة تعيين كلمة المرور تواصل مع مدير المنظومة.";
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const user = form.user.value.trim(), pass = form.password.value;
      if (!user || !pass) return;
      safe(() => remember.checked ? localStorage.setItem(REMEMBER_KEY, "1") : localStorage.removeItem(REMEMBER_KEY));
      msg.className = "message"; msg.textContent = "";
      btn.disabled = true; btn.dataset.label ||= btn.textContent; btn.textContent = "جارٍ التحقق…";
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email: toEmail(user), password: pass });
        if (error) throw error;
        const profile = await loadProfile(data.user.id);
        if (!profile || !profile.active) {
          await sb.auth.signOut();
          throw Object.assign(new Error("inactive"), { code: "inactive" });
        }
        location.replace("dashboard.html");
      } catch (err) {
        msg.textContent =
          err.code === "inactive" ? "هذا الحساب موقوف. تواصل مع مدير المنظومة." :
          err.code === "invalid_credentials" || err.status === 400 ? "اسم المستخدم أو كلمة المرور غير صحيحة." :
          !navigator.onLine ? "لا يوجد اتصال بالإنترنت." :
          "تعذّر تسجيل الدخول، حاول مرة أخرى.";
        btn.disabled = false; btn.textContent = btn.dataset.label;
      }
    });
  }

  /* ---------- الصفحات المحمية ---------- */
  async function guard() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { location.replace("index.html"); return null; }
    let profile;
    try { profile = await loadProfile(session.user.id); } catch { profile = null; }
    if (!profile || !profile.active) { await sb.auth.signOut(); location.replace("index.html"); return null; }

    const name = profile.name || session.user.email.replace(`@${USER_DOMAIN}`, "");
    document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = name);
    document.querySelectorAll("[data-user-role]").forEach(el => el.textContent = ROLE_LABEL[profile.role] || profile.role);
    document.querySelectorAll("[data-user-initial]").forEach(el => el.textContent = name.trim().charAt(0) || "م");
    if (profile.role === "viewer") document.querySelectorAll("[data-needs-edit]").forEach(el => el.hidden = true);
    let leaving = false;
    const leave = () => { if (!leaving) { leaving = true; location.replace("index.html"); } };
    document.querySelectorAll("[data-logout]").forEach(el => el.addEventListener("click", async () => {
      el.disabled = true; await sb.auth.signOut(); leave();
    }));
    sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") leave(); });
    document.documentElement.classList.remove("auth-pending");
    return { session, profile };
  }

  window.monazoma = { sb, initLogin, guard };
})();
