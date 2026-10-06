-- ═══════════════════════════════════════════════════════════════════
--  SORTEO AUTO — Esquema de base de datos para Supabase
--  Pegá TODO este archivo en Supabase → SQL Editor → "Run".
--  Se puede ejecutar más de una vez sin romper nada.
-- ═══════════════════════════════════════════════════════════════════

-- ── Pedidos (una compra = un pedido) ───────────────────────────────
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  session_id       text not null,
  buyer_name       text not null,
  buyer_dni        text not null,
  buyer_email      text not null,
  buyer_phone      text not null,
  ticket_ids       integer[] not null,
  ticket_codes     text[] not null,
  total            integer not null,
  -- pending: esperando pago · paid: pagado · rejected: pago rechazado
  -- conflict: pagado pero algún cartón ya se había vendido (hay que devolver)
  status           text not null default 'pending'
                   check (status in ('pending', 'paid', 'rejected', 'conflict')),
  mp_preference_id text,
  mp_payment_id    text,
  mp_status        text,
  paid_at          timestamptz
);

create index if not exists orders_status_idx on public.orders (status);

-- ── Cartones ───────────────────────────────────────────────────────
create table if not exists public.tickets (
  id             integer primary key check (id between 1 and 99999),
  code           text not null unique,
  grid           smallint[] not null,  -- 27 casilleros (3 filas x 9 columnas), 0 = vacío
  numbers        smallint[] not null,  -- los 15 números, ordenados
  status         text not null default 'available'
                 check (status in ('available', 'reserved', 'sold')),
  reserved_by    text,
  reserved_until timestamptz,
  order_id       uuid references public.orders (id) on delete set null,
  sold_at        timestamptz
);

create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_reserved_by_idx on public.tickets (reserved_by);
create index if not exists tickets_numbers_idx on public.tickets using gin (numbers);

-- ── Vista con el estado "real" (una reserva vencida cuenta como disponible) ──
create or replace view public.tickets_public as
select
  t.id,
  t.code,
  t.grid,
  case
    when t.status = 'reserved' and t.reserved_until < now() then 'available'
    else t.status
  end as status
from public.tickets t;

-- ── Libera reservas vencidas ───────────────────────────────────────
create or replace function public.release_expired_reservations()
returns integer
language sql
as $$
  with released as (
    update public.tickets
       set status = 'available', reserved_by = null, reserved_until = null, order_id = null
     where status = 'reserved' and reserved_until < now()
    returning 1
  )
  select count(*)::int from released;
$$;

-- ── Reserva un cartón para una sesión (atómico: nunca dos personas a la vez) ──
create or replace function public.reserve_ticket(
  p_ticket_id integer,
  p_session   text,
  p_minutes   integer default 15,
  p_max       integer default 30
)
returns table (id integer, code text, reserved_until timestamptz)
language plpgsql
as $$
#variable_conflict use_column
declare
  v_count integer;
begin
  select count(*) into v_count
    from public.tickets t
   where t.reserved_by = p_session
     and t.status = 'reserved'
     and t.reserved_until > now();

  if v_count >= p_max then
    raise exception 'LIMIT_REACHED';
  end if;

  return query
  update public.tickets t
     set status = 'reserved',
         reserved_by = p_session,
         reserved_until = now() + make_interval(mins => p_minutes),
         order_id = null
   where t.id = p_ticket_id
     and (t.status = 'available' or (t.status = 'reserved' and t.reserved_until < now()))
  returning t.id, t.code, t.reserved_until;
end;
$$;

-- ── Crea el pedido con los cartones reservados de la sesión ────────
create or replace function public.create_order(
  p_session       text,
  p_name          text,
  p_dni           text,
  p_email         text,
  p_phone         text,
  p_price_single  integer,
  p_combo_size    integer,
  p_combo_price   integer,
  p_minutes       integer default 15
)
returns table (order_id uuid, ticket_codes text[], total integer, expires_at timestamptz)
language plpgsql
as $$
#variable_conflict use_column
declare
  v_ids     integer[];
  v_codes   text[];
  v_n       integer;
  v_total   integer;
  v_order   uuid;
  v_expires timestamptz := now() + make_interval(mins => p_minutes);
begin
  select array_agg(t.id order by t.id), array_agg(t.code order by t.id)
    into v_ids, v_codes
    from (
      select t.id, t.code
        from public.tickets t
       where t.reserved_by = p_session
         and t.status = 'reserved'
         and t.reserved_until > now()
       for update
    ) t;

  v_n := coalesce(cardinality(v_ids), 0);
  if v_n = 0 then
    raise exception 'EMPTY_CART';
  end if;

  v_total := (v_n / p_combo_size) * p_combo_price + (v_n % p_combo_size) * p_price_single;

  insert into public.orders (session_id, buyer_name, buyer_dni, buyer_email, buyer_phone,
                             ticket_ids, ticket_codes, total)
  values (p_session, p_name, p_dni, p_email, p_phone, v_ids, v_codes, v_total)
  returning id into v_order;

  update public.tickets
     set order_id = v_order, reserved_until = v_expires
   where id = any (v_ids);

  return query select v_order, v_codes, v_total, v_expires;
end;
$$;

-- ── Confirma un pago aprobado: marca los cartones como vendidos ─────
create or replace function public.confirm_order(
  p_order_id   uuid,
  p_payment_id text,
  p_amount     numeric
)
returns text
language plpgsql
as $$
declare
  v_order  public.orders;
  v_sold   integer;
  v_status text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;
  if v_order.status in ('paid', 'conflict') then
    return v_order.status;
  end if;
  if p_amount < v_order.total then
    update public.orders set mp_payment_id = p_payment_id, mp_status = 'amount_mismatch'
     where id = p_order_id;
    return 'amount_mismatch';
  end if;

  -- Un pago aprobado tiene prioridad sobre una simple reserva de otra persona.
  update public.tickets
     set status = 'sold', order_id = p_order_id, reserved_by = null,
         reserved_until = null, sold_at = now()
   where id = any (v_order.ticket_ids)
     and status <> 'sold';

  select count(*) into v_sold
    from public.tickets
   where id = any (v_order.ticket_ids) and status = 'sold' and order_id = p_order_id;

  v_status := case when v_sold = cardinality(v_order.ticket_ids) then 'paid' else 'conflict' end;

  update public.orders
     set status = v_status, mp_payment_id = p_payment_id, mp_status = 'approved', paid_at = now()
   where id = p_order_id;

  return v_status;
end;
$$;

-- ── Búsqueda por números favoritos ────────────────────────────────
create or replace function public.search_favorites(p_numbers smallint[], p_limit integer default 24)
returns table (id integer, code text, grid smallint[], matches integer)
language sql
stable
as $$
  select t.id, t.code, t.grid,
         (select count(*) from unnest(t.numbers) n where n = any (p_numbers))::int as matches
    from public.tickets t
   where (t.status = 'available' or (t.status = 'reserved' and t.reserved_until < now()))
     and t.numbers && p_numbers
   order by matches desc, t.id
   limit p_limit;
$$;

-- ── Números para el panel de administración ───────────────────────
create or replace function public.raffle_stats()
returns json
language sql
stable
as $$
  select json_build_object(
    'total',     (select count(*) from public.tickets),
    'sold',      (select count(*) from public.tickets where status = 'sold'),
    'reserved',  (select count(*) from public.tickets where status = 'reserved' and reserved_until > now()),
    'revenue',   (select coalesce(sum(total), 0) from public.orders where status in ('paid', 'conflict')),
    'orders',    (select count(*) from public.orders where status = 'paid'),
    'conflicts', (select count(*) from public.orders where status = 'conflict')
  );
$$;

-- ── Seguridad: solo el servidor de la web (clave secreta) accede ──
alter table public.tickets enable row level security;
alter table public.orders  enable row level security;

revoke all on public.tickets, public.orders, public.tickets_public from anon, authenticated;
grant all on public.tickets, public.orders, public.tickets_public to service_role;

revoke execute on function public.release_expired_reservations() from public, anon, authenticated;
revoke execute on function public.reserve_ticket(integer, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.create_order(text, text, text, text, text, integer, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.confirm_order(uuid, text, numeric) from public, anon, authenticated;
revoke execute on function public.search_favorites(smallint[], integer) from public, anon, authenticated;
revoke execute on function public.raffle_stats() from public, anon, authenticated;

grant execute on function public.release_expired_reservations() to service_role;
grant execute on function public.reserve_ticket(integer, text, integer, integer) to service_role;
grant execute on function public.create_order(text, text, text, text, text, integer, integer, integer, integer) to service_role;
grant execute on function public.confirm_order(uuid, text, numeric) to service_role;
grant execute on function public.search_favorites(smallint[], integer) to service_role;
grant execute on function public.raffle_stats() to service_role;

-- ── Limpieza automática cada minuto (pg_cron) ─────────────────────
-- Aunque esto falle, la web igual trata las reservas vencidas como disponibles.
do $do$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'liberar-reservas-vencidas',
    '* * * * *',
    'select public.release_expired_reservations()'
  );
exception when others then
  raise notice 'pg_cron no disponible: %', sqlerrm;
end
$do$;

-- Avisa a Supabase que hay tablas y funciones nuevas.
notify pgrst, 'reload schema';
