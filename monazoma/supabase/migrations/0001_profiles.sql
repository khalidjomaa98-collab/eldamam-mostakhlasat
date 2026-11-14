-- منظومة المتابعة — جدول المستخدمين والصلاحيات
-- الأدوار: admin (إدارة المستخدمين والبيانات) · editor (إدخال وتعديل) · viewer (اطلاع فقط)

create schema if not exists private;

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  role        text not null default 'viewer' check (role in ('admin','editor','viewer')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- دالة مساعدة: هل المستخدم الحالي مدير نشط؟ (في مخطط private عشان ما تتعرضش في الـ API)
create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active
  );
$$;
revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- أي مستخدم مسجّل يقرأ ملفه، والمدير يقرأ الكل
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

-- التعديل والحذف للمدير فقط (المستخدم ما يقدرش يرفع صلاحيته بنفسه)
create policy "profiles_admin_update" on public.profiles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "profiles_admin_delete" on public.profiles for delete to authenticated
  using ((select private.is_admin()));

-- أي حساب جديد في auth.users ياخد ملف بصلاحية اطلاع فقط
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
