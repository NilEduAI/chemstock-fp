-- 1. Tablas de Inventario

-- Productos Químicos
create table chemicals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  formula text,
  cas text,
  quantity numeric default 0,
  unit text default 'ml',
  min_quantity numeric default 0,
  location text,
  hazards text[],
  precautions text[],
  manufacturer text
);

-- Equipamiento
create table equipment (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  brand text,
  model text,
  serial_number text,
  status text default 'Operativo',
  location text
);

-- 2. Perfiles de Usuario (Roles)

create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  role text check (role in ('alumno', 'profe')) default 'alumno'
);

-- 3. Seguridad (RLS)

alter table chemicals enable row level security;
alter table equipment enable row level security;
alter table profiles enable row level security;

-- Políticas para Productos Químicos (Lectura pública, escritura autenticada)
create policy "Lectura pública de productos" on chemicals for select using (true);
create policy "Solo profes insertan productos" on chemicals for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'profe')
);
create policy "Usuarios autenticados actualizan stock" on chemicals for update using (auth.role() = 'authenticated');
create policy "Solo profes eliminan productos" on chemicals for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'profe')
);

-- Políticas para Equipos
create policy "Lectura pública de equipos" on equipment for select using (true);
create policy "Solo profes gestionan equipos" on equipment for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'profe')
);

-- Políticas para Perfiles
create policy "Perfiles visibles por todos" on profiles for select using (true);
create policy "Usuarios actualizan su propio perfil" on profiles for update using (auth.uid() = id);

-- 4. Trigger para nuevos usuarios (Crear perfil automáticamente)

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'alumno');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
