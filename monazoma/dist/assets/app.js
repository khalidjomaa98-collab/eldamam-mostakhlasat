/* منظومة المتابعة — شاشات المنظومة (لوحة التحكم، المشروعات، الشركات) */
(function () {
  const sb = monazoma.sb;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const view = $("#view"), crumb = $("#crumb"), dlg = $("#dlg"), toastEl = $("#toast");
  let ctx = null; // { profile, canEdit, isAdmin }
  let actions = {}; // أزرار الشاشة الحالية: data-action → دالة
  let seq = 0; // رقم الشاشة الحالية — الشاشة اللي اتحملت متأخر بعد التنقل ما تكتبش فوق الجديدة

  /* ---------- أدوات ---------- */
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const svg = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    proj: '<path d="M4 21 9 3"/><path d="M20 21 15 3"/><path d="M12 5v2M12 11v2M12 17v2"/>',
    co: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5"/><path d="M9 10h.01M15 10h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="m9 18 6-6-6-6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  };
  const nf = new Intl.NumberFormat("ar-EG");
  const money = v => v == null || v === "" ? "—" : nf.format(Number(v)) + " ج.م";
  const date = v => v ? new Date(v + "T00:00:00").toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const STATUS = { planned: ["لم يبدأ", "gray"], active: ["جارٍ التنفيذ", "blue"], suspended: ["متوقف", "red"], completed: ["مكتمل", "green"] };
  const KIND = { contractor: "مقاول رئيسي", subcontractor: "مقاول باطن", supplier: "مورّد" };
  const pill = s => `<span class="pill ${STATUS[s]?.[1] || ""}">${esc(STATUS[s]?.[0] || s)}</span>`;
  const progress = v => `<div class="prog"><div class="progress"><i style="width:${Math.max(0, Math.min(100, Number(v) || 0))}%"></i></div><span>${nf.format(Number(v) || 0)}٪</span></div>`;
  const opts = (map, sel) => Object.entries(map).map(([k, v]) => `<option value="${k}"${k === sel ? " selected" : ""}>${esc(Array.isArray(v) ? v[0] : v)}</option>`).join("");

  function toast(msg, bad) {
    toastEl.textContent = msg; toastEl.className = "show" + (bad ? " bad" : "");
    clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.className = "", 3200);
  }
  function errText(e) {
    if (!navigator.onLine) return "لا يوجد اتصال بالإنترنت.";
    if (e?.code === "23505") return e.message.includes("companies_name_key") ? "توجد شركة مسجلة بنفس الاسم." : e.message.includes("projects_code_key") ? "يوجد مشروع مسجل بنفس الرقم." : "هذه الشركة مرتبطة بالمشروع بالفعل.";
    if (e?.code === "23503") return "لا يمكن الحذف: الشركة مرتبطة بمشروعات. احذف الارتباط أولًا.";
    if (e?.code === "23514") return "تحقق من القيم المدخلة (النسب بين 0 و100، وتاريخ الانتهاء بعد البدء).";
    if (e?.code === "42501" || e?.code === "PGRST301") return "ليس لديك صلاحية لهذا الإجراء.";
    return "تعذّر تنفيذ العملية، حاول مرة أخرى.";
  }
  async function q(promise) { const { data, error, count } = await promise; if (error) throw error; return count ?? data; }

  const loading = () => { view.innerHTML = `<div class="loading"><span></span>جارٍ التحميل…</div>`; };
  const failed = e => { view.innerHTML = `<div class="panel"><div class="empty"><b>تعذّر تحميل البيانات</b><p>${esc(errText(e))}</p><button class="btn ghost" onclick="location.reload()">إعادة المحاولة</button></div></div>`; };
  const empty = (icon, title, text) => `<div class="empty"><span class="empty-ico">${svg(ICON[icon])}</span><b>${esc(title)}</b><p>${esc(text)}</p></div>`;
  const head = (title, sub, actions = "") => `<section class="head"><div><h1>${esc(title)}</h1>${sub ? `<p class="welcome">${sub}</p>` : ""}</div><div class="head-actions">${actions}</div></section>`;
  const editBtn = (action, label, icon = "plus", cls = "add") => ctx.canEdit ? `<button class="${cls}" data-action="${action}">${svg(ICON[icon])}<span>${esc(label)}</span></button>` : "";

  /* ---------- النوافذ (إضافة/تعديل) ---------- */
  function field(f, val) {
    const v = val ?? f.value ?? "";
    const attrs = `id="f-${f.name}" name="${f.name}"${f.required ? " required" : ""}${f.min != null ? ` min="${f.min}"` : ""}${f.max != null ? ` max="${f.max}"` : ""}${f.step ? ` step="${f.step}"` : ""}${f.maxlength ? ` maxlength="${f.maxlength}"` : ""}`;
    let input;
    if (f.type === "select") input = `<select ${attrs}>${f.options}</select>`;
    else if (f.type === "textarea") input = `<textarea ${attrs} rows="3">${esc(v)}</textarea>`;
    else input = `<input ${attrs} type="${f.type || "text"}" value="${esc(v)}"${f.type === "number" ? ' inputmode="decimal"' : ""} />`;
    return `<label class="f${f.wide ? " wide" : ""}" for="f-${f.name}"><span>${esc(f.label)}${f.required ? ' <em>*</em>' : ""}</span>${input}${f.hint ? `<small>${esc(f.hint)}</small>` : ""}</label>`;
  }
  function openForm({ title, fields, data = {}, submitLabel = "حفظ", onSubmit, danger }) {
    dlg.innerHTML = `<form method="dialog" class="dlg-form" novalidate>
      <header><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="إغلاق">${svg(ICON.x)}</button></header>
      <div class="fields">${fields.map(f => field(f, data[f.name])).join("")}</div>
      <p class="form-err" role="alert"></p>
      <footer>${danger ? `<button type="button" class="btn danger" data-danger>${svg(ICON.trash)}<span>${esc(danger.label)}</span></button>` : ""}<span class="sp"></span><button type="button" class="btn ghost" data-close>إلغاء</button><button type="submit" class="btn primary">${esc(submitLabel)}</button></footer>
    </form>`;
    const form = $("form", dlg), err = $(".form-err", dlg), submit = $("[type=submit]", dlg);
    $$("[data-close]", dlg).forEach(b => b.onclick = () => dlg.close());
    const busy = on => $$("button", dlg).forEach(b => b.disabled = on);
    if (danger) $("[data-danger]", dlg).onclick = async () => {
      if (!confirm(danger.confirm)) return;
      busy(true); err.textContent = "";
      try { await danger.run(); dlg.close(); } catch (e) { err.textContent = errText(e); } finally { busy(false); }
    };
    form.onsubmit = async ev => {
      ev.preventDefault(); err.textContent = "";
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const out = {};
      for (const f of fields) {
        let v = form.elements[f.name].value;
        if (f.type === "number" || f.type === "date") v = v === "" ? null : (f.type === "number" ? Number(v) : v);
        else v = v.trim();
        out[f.name] = v;
      }
      busy(true); submit.textContent = "جارٍ الحفظ…";
      try { await onSubmit(out); dlg.close(); }
      catch (e) { err.textContent = errText(e); }
      finally { busy(false); submit.textContent = submitLabel; }
    };
    dlg.showModal();
    setTimeout(() => $("input,select,textarea", dlg)?.focus(), 30);
  }

  const PROJECT_FIELDS = [
    { name: "code", label: "رقم المشروع", required: true, maxlength: 40 },
    { name: "name", label: "اسم المشروع", required: true, maxlength: 200, wide: true },
    { name: "location", label: "الموقع / الطريق", maxlength: 200, wide: true },
    { name: "status", label: "الحالة", type: "select" },
    { name: "progress", label: "نسبة الإنجاز ٪", type: "number", min: 0, max: 100, step: "0.01", value: 0 },
    { name: "contract_value", label: "قيمة التعاقد (ج.م)", type: "number", min: 0, step: "0.01" },
    { name: "start_date", label: "تاريخ البدء", type: "date" },
    { name: "planned_end_date", label: "تاريخ الانتهاء المخطط", type: "date" },
    { name: "notes", label: "ملاحظات", type: "textarea", wide: true, maxlength: 2000 },
  ];
  const COMPANY_FIELDS = [
    { name: "name", label: "اسم الشركة", required: true, maxlength: 200, wide: true },
    { name: "kind", label: "التصنيف", type: "select" },
    { name: "commercial_register", label: "رقم السجل التجاري", maxlength: 60 },
    { name: "phone", label: "هاتف الشركة", type: "tel", maxlength: 40 },
    { name: "address", label: "العنوان", maxlength: 300, wide: true },
    { name: "notes", label: "ملاحظات", type: "textarea", wide: true, maxlength: 2000 },
  ];
  const withOptions = (fields, data) => fields.map(f =>
    f.name === "status" ? { ...f, options: opts(STATUS, data.status || "planned") } :
    f.name === "kind" ? { ...f, options: opts(KIND, data.kind || "contractor") } : f);

  function projectForm(p = {}, after) {
    openForm({
      title: p.id ? "تعديل بيانات المشروع" : "إضافة مشروع", fields: withOptions(PROJECT_FIELDS, p), data: p,
      submitLabel: p.id ? "حفظ التعديلات" : "إضافة المشروع",
      onSubmit: async v => {
        const row = await q(p.id ? sb.from("projects").update(v).eq("id", p.id).select().single() : sb.from("projects").insert(v).select().single());
        toast(p.id ? "تم حفظ التعديلات." : "تمت إضافة المشروع."); after ? after(row) : route();
      },
      danger: p.id && ctx.isAdmin ? { label: "حذف المشروع", confirm: `حذف المشروع «${p.name}» وكل ارتباطاته بالشركات؟ لا يمكن التراجع.`, run: async () => { await q(sb.from("projects").delete().eq("id", p.id)); toast("تم حذف المشروع."); location.hash = "#/projects"; } } : null,
    });
  }
  function companyForm(c = {}, after) {
    openForm({
      title: c.id ? "تعديل بيانات الشركة" : "إضافة شركة", fields: withOptions(COMPANY_FIELDS, c), data: c,
      submitLabel: c.id ? "حفظ التعديلات" : "إضافة الشركة",
      onSubmit: async v => {
        const row = await q(c.id ? sb.from("companies").update(v).eq("id", c.id).select().single() : sb.from("companies").insert(v).select().single());
        toast(c.id ? "تم حفظ التعديلات." : "تمت إضافة الشركة."); after ? after(row) : route();
      },
      danger: c.id && ctx.isAdmin ? { label: "حذف الشركة", confirm: `حذف الشركة «${c.name}»؟ لا يمكن التراجع.`, run: async () => { await q(sb.from("companies").delete().eq("id", c.id)); toast("تم حذف الشركة."); location.hash = "#/companies"; } } : null,
    });
  }
  function linkForm(projectId, link = null, companies = []) {
    const fields = [
      link ? null : { name: "company_id", label: "الشركة", type: "select", required: true, wide: true,
        options: `<option value="">اختر الشركة…</option>` + companies.map(c => `<option value="${c.id}">${esc(c.name)} — ${esc(KIND[c.kind])}</option>`).join("") },
      { name: "role", label: "دورها في المشروع", type: "select", options: opts(KIND, link?.role || "contractor") },
      { name: "contract_value", label: "قيمة تعاقدها (ج.م)", type: "number", min: 0, step: "0.01" },
      { name: "scope", label: "نطاق الأعمال", type: "textarea", wide: true, maxlength: 1000 },
    ].filter(Boolean);
    openForm({
      title: link ? `تعديل ارتباط ${link.companies.name}` : "ربط شركة بالمشروع", fields, data: link || {},
      submitLabel: link ? "حفظ" : "ربط الشركة",
      onSubmit: async v => {
        if (link) await q(sb.from("project_companies").update(v).eq("project_id", projectId).eq("company_id", link.company_id));
        else await q(sb.from("project_companies").insert({ ...v, project_id: projectId }));
        toast(link ? "تم حفظ التعديلات." : "تم ربط الشركة بالمشروع."); route();
      },
      danger: link ? { label: "إلغاء الربط", confirm: `إلغاء ربط «${link.companies.name}» بهذا المشروع؟`, run: async () => { await q(sb.from("project_companies").delete().eq("project_id", projectId).eq("company_id", link.company_id)); toast("تم إلغاء الربط."); route(); } } : null,
    });
  }

  /* ---------- الشاشات ---------- */
  async function dashboard() {
    const my = seq;
    crumb.innerHTML = `<b>الرئيسية</b> / لوحة التحكم`;
    view.replaceChildren($("#tpl-dashboard").content.cloneNode(true));
    $$("[data-needs-edit]", view).forEach(el => el.hidden = !ctx.canEdit);
    try {
      const [pc, cc, active] = await Promise.all([
        q(sb.from("projects").select("id", { count: "exact", head: true })),
        q(sb.from("companies").select("id", { count: "exact", head: true })),
        q(sb.from("projects").select("progress").eq("status", "active")),
      ]);
      if (my !== seq) return;
      $('[data-stat="projects"]', view).textContent = nf.format(pc);
      $('[data-stat-note="projects"]', view).textContent = pc ? `منها ${nf.format(active.length)} جارٍ التنفيذ` : "لم تُسجَّل مشروعات بعد";
      $('[data-stat="companies"]', view).textContent = nf.format(cc);
      $('[data-stat-note="companies"]', view).textContent = cc ? "شركات منفذة ومقاولون وموردون" : "لم تُسجَّل شركات بعد";
      if (active.length) {
        const avg = active.reduce((s, r) => s + Number(r.progress), 0) / active.length;
        $('[data-stat="progress"]', view).textContent = nf.format(Math.round(avg)) + "٪";
        $("[data-stat-bar]", view).style.width = avg + "%";
      }
    } catch (e) { if (my === seq) toast(errText(e), true); }
  }

  async function projectsList() {
    const my = seq;
    crumb.innerHTML = `<a href="#/">الرئيسية</a> / المشروعات`;
    loading();
    let rows;
    try { rows = await q(sb.from("projects_overview").select("*").order("code")); } catch (e) { return my === seq && failed(e); }
    if (my !== seq) return;
    const f = projectsList.f ||= { text: "", status: "" };
    view.innerHTML = head("المشروعات", `مشروعات الطرق المسجلة وحالتها ونسبة الإنجاز.`, editBtn("add-project", "إضافة مشروع")) +
      `<section class="panel">
        <div class="filters">
          <label class="search">${svg(ICON.search)}<input type="search" id="q" placeholder="بحث برقم المشروع أو الاسم أو الموقع" value="${esc(f.text)}" /></label>
          <select id="st" aria-label="الحالة"><option value="">كل الحالات</option>${opts(STATUS, f.status)}</select>
          <span class="count" id="cnt"></span>
        </div>
        <div id="list"></div>
      </section>`;
    const draw = () => {
      const t = f.text.trim().toLowerCase();
      const list = rows.filter(r => (!f.status || r.status === f.status) && (!t || [r.code, r.name, r.location].some(x => (x || "").toLowerCase().includes(t))));
      $("#cnt").textContent = rows.length ? `${nf.format(list.length)} من ${nf.format(rows.length)}` : "";
      $("#list").innerHTML = !rows.length ? empty("proj", "لا توجد مشروعات مسجلة", ctx.canEdit ? "ابدأ بإضافة أول مشروع من زر «إضافة مشروع»." : "ستظهر المشروعات هنا بعد أن يضيفها المسؤول عن الإدخال.")
        : !list.length ? empty("search", "لا توجد نتائج", "غيّر كلمات البحث أو الحالة المختارة.")
        : `<table class="table cards"><thead><tr><th>رقم المشروع</th><th>المشروع</th><th>الحالة</th><th>الإنجاز</th><th>الشركات</th><th>الانتهاء المخطط</th></tr></thead><tbody>${list.map(r => `
          <tr class="row-link" data-href="#/projects/${r.id}" tabindex="0">
            <td data-label="رقم المشروع" class="mono">${esc(r.code)}</td>
            <td data-label="المشروع" class="title"><span class="company">${esc(r.name)}</span>${r.location ? `<span class="sub">${esc(r.location)}</span>` : ""}</td>
            <td data-label="الحالة">${pill(r.status)}</td>
            <td data-label="الإنجاز">${progress(r.progress)}</td>
            <td data-label="الشركات">${nf.format(r.companies_count)}</td>
            <td data-label="الانتهاء المخطط">${date(r.planned_end_date)}</td>
          </tr>`).join("")}</tbody></table>`;
    };
    $("#q").oninput = e => { f.text = e.target.value; draw(); };
    $("#st").onchange = e => { f.status = e.target.value; draw(); };
    draw();
  }

  async function projectDetail(id) {
    const my = seq;
    crumb.innerHTML = `<a href="#/">الرئيسية</a> / <a href="#/projects">المشروعات</a> / …`;
    loading();
    let p, links;
    try {
      [p, links] = await Promise.all([
        q(sb.from("projects").select("*").eq("id", id).maybeSingle()),
        q(sb.from("project_companies").select("*, companies(id,name,kind)").eq("project_id", id)),
      ]);
    } catch (e) { return my === seq && failed(e); }
    if (my !== seq) return;
    if (!p) { view.innerHTML = `<div class="panel">${empty("proj", "المشروع غير موجود", "ربما حُذف. ارجع لقائمة المشروعات.")}</div>`; return; }
    links.sort((a, b) => a.companies.name.localeCompare(b.companies.name, "ar"));
    crumb.innerHTML = `<a href="#/">الرئيسية</a> / <a href="#/projects">المشروعات</a> / <b>${esc(p.code)}</b>`;
    const total = links.reduce((s, l) => s + (Number(l.contract_value) || 0), 0);
    view.innerHTML = head(p.name, `<span class="mono">${esc(p.code)}</span>${p.location ? ` · ${esc(p.location)}` : ""}`, editBtn("edit-project", "تعديل البيانات", "edit", "btn ghost")) +
      `<section class="info panel">
        <div><span>الحالة</span>${pill(p.status)}</div>
        <div><span>نسبة الإنجاز</span>${progress(p.progress)}</div>
        <div><span>قيمة التعاقد</span><b>${money(p.contract_value)}</b></div>
        <div><span>تاريخ البدء</span><b>${date(p.start_date)}</b></div>
        <div><span>الانتهاء المخطط</span><b>${date(p.planned_end_date)}</b></div>
        <div><span>عدد الشركات</span><b>${nf.format(links.length)}</b></div>
        ${p.notes ? `<div class="wide"><span>ملاحظات</span><p>${esc(p.notes)}</p></div>` : ""}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>الشركات المرتبطة بالمشروع</h2>${editBtn("link-company", "ربط شركة", "link", "btn ghost sm")}</div>
        ${!links.length ? empty("co", "لا توجد شركات مرتبطة", ctx.canEdit ? "اربط الشركات المنفذة والموردين من زر «ربط شركة»." : "لم تُربط شركات بهذا المشروع بعد.") :
        `<table class="table cards"><thead><tr><th>الشركة</th><th>الدور</th><th>نطاق الأعمال</th><th>قيمة التعاقد</th>${ctx.canEdit ? "<th></th>" : ""}</tr></thead><tbody>${links.map((l, i) => `
          <tr>
            <td data-label="الشركة" class="title"><a class="company" href="#/companies/${l.company_id}">${esc(l.companies.name)}</a></td>
            <td data-label="الدور">${esc(KIND[l.role])}</td>
            <td data-label="نطاق الأعمال" class="scope">${esc(l.scope) || "—"}</td>
            <td data-label="قيمة التعاقد">${money(l.contract_value)}</td>
            ${ctx.canEdit ? `<td class="act"><button class="icon-btn" data-action="edit-link" data-i="${i}" aria-label="تعديل الارتباط">${svg(ICON.edit)}</button></td>` : ""}
          </tr>`).join("")}</tbody>${links.length > 1 ? `<tfoot><tr><td colspan="3">إجمالي تعاقدات الشركات</td><td>${money(total)}</td>${ctx.canEdit ? "<td></td>" : ""}</tr></tfoot>` : ""}</table>`}
      </section>`;
    Object.assign(actions, {
      "edit-project": () => projectForm(p),
      "link-company": async () => {
        try {
          const all = await q(sb.from("companies").select("id,name,kind").order("name"));
          const linked = new Set(links.map(l => l.company_id));
          const free = all.filter(c => !linked.has(c.id));
          if (!free.length) { toast(all.length ? "كل الشركات المسجلة مرتبطة بهذا المشروع بالفعل." : "لا توجد شركات مسجلة. أضف الشركة أولًا من صفحة الشركات.", true); return; }
          linkForm(id, null, free);
        } catch (e) { toast(errText(e), true); }
      },
      "edit-link": el => linkForm(id, links[+el.dataset.i]),
    });
  }

  async function companiesList() {
    const my = seq;
    crumb.innerHTML = `<a href="#/">الرئيسية</a> / الشركات`;
    loading();
    let rows;
    try { rows = await q(sb.from("companies_overview").select("*").order("name")); } catch (e) { return my === seq && failed(e); }
    if (my !== seq) return;
    const f = companiesList.f ||= { text: "", kind: "" };
    view.innerHTML = head("الشركات", "الشركات المنفذة والمقاولون والموردون وعدد المشروعات المرتبطة بكل شركة.", editBtn("add-company", "إضافة شركة")) +
      `<section class="panel">
        <div class="filters">
          <label class="search">${svg(ICON.search)}<input type="search" id="q" placeholder="بحث باسم الشركة أو السجل التجاري" value="${esc(f.text)}" /></label>
          <select id="kd" aria-label="التصنيف"><option value="">كل التصنيفات</option>${opts(KIND, f.kind)}</select>
          <span class="count" id="cnt"></span>
        </div>
        <div id="list"></div>
      </section>`;
    const draw = () => {
      const t = f.text.trim().toLowerCase();
      const list = rows.filter(r => (!f.kind || r.kind === f.kind) && (!t || [r.name, r.commercial_register].some(x => (x || "").toLowerCase().includes(t))));
      $("#cnt").textContent = rows.length ? `${nf.format(list.length)} من ${nf.format(rows.length)}` : "";
      $("#list").innerHTML = !rows.length ? empty("co", "لا توجد شركات مسجلة", ctx.canEdit ? "أضف الشركات المنفذة والموردين من زر «إضافة شركة»." : "ستظهر الشركات هنا بعد أن يضيفها المسؤول عن الإدخال.")
        : !list.length ? empty("search", "لا توجد نتائج", "غيّر كلمات البحث أو التصنيف المختار.")
        : `<table class="table cards"><thead><tr><th>الشركة</th><th>التصنيف</th><th>السجل التجاري</th><th>الهاتف</th><th>المشروعات</th></tr></thead><tbody>${list.map(r => `
          <tr class="row-link" data-href="#/companies/${r.id}" tabindex="0">
            <td data-label="الشركة" class="title"><span class="company">${esc(r.name)}</span>${r.address ? `<span class="sub">${esc(r.address)}</span>` : ""}</td>
            <td data-label="التصنيف">${esc(KIND[r.kind])}</td>
            <td data-label="السجل التجاري" class="mono">${esc(r.commercial_register) || "—"}</td>
            <td data-label="الهاتف" class="mono" dir="ltr">${esc(r.phone) || "—"}</td>
            <td data-label="المشروعات">${nf.format(r.projects_count)}</td>
          </tr>`).join("")}</tbody></table>`;
    };
    $("#q").oninput = e => { f.text = e.target.value; draw(); };
    $("#kd").onchange = e => { f.kind = e.target.value; draw(); };
    draw();
  }

  async function companyDetail(id) {
    const my = seq;
    crumb.innerHTML = `<a href="#/">الرئيسية</a> / <a href="#/companies">الشركات</a> / …`;
    loading();
    let c, links;
    try {
      [c, links] = await Promise.all([
        q(sb.from("companies").select("*").eq("id", id).maybeSingle()),
        q(sb.from("project_companies").select("*, projects(id,code,name,status,progress)").eq("company_id", id)),
      ]);
    } catch (e) { return my === seq && failed(e); }
    if (my !== seq) return;
    if (!c) { view.innerHTML = `<div class="panel">${empty("co", "الشركة غير موجودة", "ربما حُذفت. ارجع لقائمة الشركات.")}</div>`; return; }
    links.sort((a, b) => a.projects.code.localeCompare(b.projects.code, "ar"));
    crumb.innerHTML = `<a href="#/">الرئيسية</a> / <a href="#/companies">الشركات</a> / <b>${esc(c.name)}</b>`;
    view.innerHTML = head(c.name, esc(KIND[c.kind]), editBtn("edit-company", "تعديل البيانات", "edit", "btn ghost")) +
      `<section class="info panel">
        <div><span>التصنيف</span><b>${esc(KIND[c.kind])}</b></div>
        <div><span>السجل التجاري</span><b class="mono">${esc(c.commercial_register) || "—"}</b></div>
        <div><span>الهاتف</span><b class="mono" dir="ltr">${esc(c.phone) || "—"}</b></div>
        <div><span>عدد المشروعات</span><b>${nf.format(links.length)}</b></div>
        ${c.address ? `<div class="wide"><span>العنوان</span><p>${esc(c.address)}</p></div>` : ""}
        ${c.notes ? `<div class="wide"><span>ملاحظات</span><p>${esc(c.notes)}</p></div>` : ""}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>المشروعات التي تعمل بها الشركة</h2></div>
        ${!links.length ? empty("proj", "غير مرتبطة بأي مشروع", "يتم الربط من صفحة المشروع ← «ربط شركة».") :
        `<table class="table cards"><thead><tr><th>المشروع</th><th>الدور</th><th>الحالة</th><th>الإنجاز</th><th>قيمة التعاقد</th></tr></thead><tbody>${links.map(l => `
          <tr class="row-link" data-href="#/projects/${l.project_id}" tabindex="0">
            <td data-label="المشروع" class="title"><span class="company">${esc(l.projects.name)}</span><span class="sub mono">${esc(l.projects.code)}</span></td>
            <td data-label="الدور">${esc(KIND[l.role])}</td>
            <td data-label="الحالة">${pill(l.projects.status)}</td>
            <td data-label="الإنجاز">${progress(l.projects.progress)}</td>
            <td data-label="قيمة التعاقد">${money(l.contract_value)}</td>
          </tr>`).join("")}</tbody></table>`}
      </section>`;
    Object.assign(actions, { "edit-company": () => companyForm(c) });
  }

  function soon(title) {
    crumb.innerHTML = `<a href="#/">الرئيسية</a> / ${esc(title)}`;
    view.innerHTML = head(title, "") + `<section class="panel">${empty("tool", "هذه الشاشة لم تُبنَ بعد", "ستتاح في مرحلة قادمة من المنظومة.")}</section>`;
  }

  /* ---------- التوجيه ---------- */
  const SOON = { extracts: "المستخلصات", statuses: "المواقف التنفيذية", reports: "التقارير", settings: "الإعدادات" };
  function route() {
    const [, sec = "", id] = (location.hash || "#/").split("/");
    seq++;
    actions = {
      "add-project": () => projectForm(),
      "add-company": () => companyForm(),
    };
    $$(".nav a").forEach(a => {
      const on = a.getAttribute("href") === "#/" + sec;
      a.classList.toggle("active", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
      if (on && matchMedia("(max-width:700px)").matches) a.scrollIntoView({ block: "nearest", inline: "center" });
    });
    if (sec === "projects") id ? projectDetail(id) : projectsList();
    else if (sec === "companies") id ? companyDetail(id) : companiesList();
    else if (SOON[sec]) soon(SOON[sec]);
    else dashboard();
    window.scrollTo(0, 0);
  }

  view.addEventListener("click", e => {
    const a = e.target.closest("[data-action]");
    if (a) { e.preventDefault(); actions[a.dataset.action]?.(a); return; }
    const r = e.target.closest("tr[data-href]");
    if (r && !e.target.closest("a,button")) location.hash = r.dataset.href;
  });
  view.addEventListener("keydown", e => {
    const r = e.target.closest?.("tr[data-href]");
    if (r && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); location.hash = r.dataset.href; }
  });
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

  monazoma.guard().then(r => {
    if (!r) return;
    ctx = { profile: r.profile, canEdit: ["admin", "editor"].includes(r.profile.role), isAdmin: r.profile.role === "admin" };
    window.addEventListener("hashchange", route);
    route();
  });
})();
