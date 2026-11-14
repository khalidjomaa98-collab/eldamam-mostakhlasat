-- منظومة المتابعة — المشروعات والشركات وربطهما
-- القراءة: أي مستخدم نشط · الإضافة والتعديل: مدير أو إدخال وتعديل · الحذف: المدير فقط

-- ---------- دوال الصلاحيات ----------
create or replace function private.is_active_user()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and active); $$;

create or replace function private.can_edit()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and active and role in ('admin','editor')); $$;

revoke all on function private.is_active_user() from public;
revoke all on function private.can_edit() from public;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.can_edit() to authenticated;

-- تحديث updated_at تلقائيًا
create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); new.updated_by := (select auth.uid()); return new; end; $$;

-- ---------- المشروعات ----------
create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (length(trim(code)) > 0),
  name              text not null check (length(trim(name)) > 0),
  location          text not null default '',
  status            text not null default 'planned' check (status in ('planned','active','suspended','completed')),
  progress          numeric(5,2) not null default 0 check (progress between 0 and 100),
  contract_value    numeric(16,2) check (contract_value >= 0),
  start_date        date,
  planned_end_date  date,
  notes             text not null default '',
  created_at        timestamptz not null default now(),
  created_by        uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id) on delete set null,
  check (planned_end_date is null or start_date is null or planned_end_date >= start_date)
);

-- ---------- الشركات ----------
create table public.companies (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null check (length(trim(name)) > 0),
  kind                 text not null default 'contractor' check (kind in ('contractor','subcontractor','supplier')),
  commercial_register  text not null default '',
  phone                text not null default '',
  address              text not null default '',
  notes                text not null default '',
  created_at           timestamptz not null default now(),
  created_by           uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at           timestamptz not null default now(),
  updated_by           uuid references auth.users(id) on delete set null
);
create unique index companies_name_key on public.companies (lower(trim(name)));

-- ---------- ربط الشركات بالمشروعات ----------
create table public.project_companies (
  project_id      uuid not null references public.projects(id) on delete cascade,
  company_id      uuid not null references public.companies(id) on delete restrict,
  role            text not null default 'contractor' check (role in ('contractor','subcontractor','supplier')),
  scope           text not null default '',
  contract_value  numeric(16,2) check (contract_value >= 0),
  created_at      timestamptz not null default now(),
  created_by      uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id) on delete set null,
  primary key (project_id, company_id)
);
create index project_companies_company_idx on public.project_companies (company_id);

create trigger projects_touch before update on public.projects for each row execute function private.touch_updated_at();
create trigger companies_touch before update on public.companies for each row execute function private.touch_updated_at();
create trigger project_companies_touch before update on public.project_companies for each row execute function private.touch_updated_at();

-- ---------- RLS ----------
alter table public.projects enable row level security;
alter table public.companies enable row level security;
alter table public.project_companies enable row level security;

create policy "projects_select" on public.projects for select to authenticated using ((select private.is_active_user()));
create policy "projects_insert" on public.projects for insert to authenticated with check ((select private.can_edit()));
create policy "projects_update" on public.projects for update to authenticated using ((select private.can_edit())) with check ((select private.can_edit()));
create policy "projects_delete" on public.projects for delete to authenticated using ((select private.is_admin()));

create policy "companies_select" on public.companies for select to authenticated using ((select private.is_active_user()));
create policy "companies_insert" on public.companies for insert to authenticated with check ((select private.can_edit()));
create policy "companies_update" on public.companies for update to authenticated using ((select private.can_edit())) with check ((select private.can_edit()));
create policy "companies_delete" on public.companies for delete to authenticated using ((select private.is_admin()));

create policy "pc_select" on public.project_companies for select to authenticated using ((select private.is_active_user()));
create policy "pc_insert" on public.project_companies for insert to authenticated with check ((select private.can_edit()));
create policy "pc_update" on public.project_companies for update to authenticated using ((select private.can_edit())) with check ((select private.can_edit()));
create policy "pc_delete" on public.project_companies for delete to authenticated using ((select private.can_edit()));

-- ---------- عروض للقوائم (بصلاحيات المستخدم نفسه) ----------
create view public.projects_overview with (security_invoker = true) as
  select p.*, (select count(*) from public.project_companies pc where pc.project_id = p.id)::int as companies_count
  from public.projects p;

create view public.companies_overview with (security_invoker = true) as
  select c.*, (select count(*) from public.project_companies pc where pc.company_id = c.id)::int as projects_count
  from public.companies c;
