-- ============================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome_cliente text not null,
  endereco text,
  telefone text,
  descricao_pedido text,
  valor numeric(10,2) default 0,
  taxa_entrega numeric(10,2) default 0,
  forma_pagamento text not null,
  precisa_troco boolean default false,
  troco_para numeric(10,2),
  tipo_pedido text not null check (tipo_pedido in ('entrega', 'retirada')),
  status text not null default 'novo' check (status in ('novo', 'concluido'))
);

create index if not exists pedidos_status_idx on public.pedidos (status);
create index if not exists pedidos_tipo_idx on public.pedidos (tipo_pedido);
create index if not exists pedidos_created_at_idx on public.pedidos (created_at desc);

alter table public.pedidos enable row level security;

-- Permite inserir pedidos (app de atendimento)
create policy "Permitir insert de pedidos"
  on public.pedidos for insert
  to anon, authenticated
  with check (true);

-- Permite ler pedidos (painel)
create policy "Permitir leitura de pedidos"
  on public.pedidos for select
  to anon, authenticated
  using (true);

-- Permite atualizar status (botão Concluído)
create policy "Permitir update de pedidos"
  on public.pedidos for update
  to anon, authenticated
  using (true)
  with check (true);

-- Habilita Realtime na tabela
alter publication supabase_realtime add table public.pedidos;
