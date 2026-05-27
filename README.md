# Luti Relogios - E-commerce com Next.js

Projeto completo de e-commerce de relogios com:

- Home com banner, destaques e beneficios
- Catalogo de produtos
- Pagina dinamica de produto em `/produto/[slug]`
- Botao de compra via WhatsApp
- Checkout com Stripe
- Integracao com Supabase (com fallback local para nao quebrar em desenvolvimento)

## Tecnologias

- Next.js (App Router)
- React
- Tailwind CSS
- Supabase
- Stripe

## Estrutura principal

```txt
/app
  /api/checkout/route.js
  /catalogo/page.js
  /produto/[slug]/page.js
  /page.js
/components
/lib
  produtos.js
  stripe.js
  whatsapp.js
```

## 1) Instalar dependencias

```bash
npm install
```

## 2) Configurar variaveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=5500000000000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
STRIPE_ENABLE_PIX=false

# Supabase (opcional em dev; sem isso usa fallback local)
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Auth (NextAuth)
NEXTAUTH_SECRET=gere_um_valor_forte_com_32+_caracteres
NEXTAUTH_URL=http://localhost:3000
<<<<<<< HEAD
=======
# E-mails com acesso ao painel /admin (conta ja cadastrada em /auth/register)
ADMIN_EMAILS=seu@email.com,outro@email.com
>>>>>>> main

# Tiny/Olist OAuth 2
OLIST_CLIENT_ID=seu_client_id
OLIST_CLIENT_SECRET=seu_client_secret
OLIST_REDIRECT_URI=http://localhost:3000/api/olist/oauth/callback
# Opcional (padrao ja configurado no codigo)
# OLIST_TOKEN_URL=https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token
# Token final gerado pela interface
# OLIST_API_TOKEN=cole_o_access_token_gerado
```

## 3) Tabela `produtos` no Supabase (Olist / admin)

O app usa o schema da Olist (`olist_id`, `precos`, `seo`, etc.), **não** o modelo antigo `nome`/`slug` do README.

- **Projeto novo:** rode `produtos.sql` no SQL Editor do Supabase.
- **Já existe `public.produtos` sem todas as colunas:** rode `produtos-migration.sql` no mesmo projeto (corrige erros tipo `column produtos.data_criacao does not exist`).

## 4) Rodar o projeto

```bash
npm run dev
```

Acesse:

- Home: [http://localhost:3000](http://localhost:3000)
- Catalogo: [http://localhost:3000/catalogo](http://localhost:3000/catalogo)
- Produto dinamico (exemplo): [http://localhost:3000/produto/rolex-submariner-black](http://localhost:3000/produto/rolex-submariner-black)

## 5) Criar tabela `usuarios` no Supabase (auth custom)

Use este SQL no editor SQL do Supabase:

```sql
create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  phone text default '',
  document text default '',
<<<<<<< HEAD
=======
  document_type text not null default 'cpf',
>>>>>>> main
  cep text not null,
  street text not null,
  number text not null,
  complement text default '',
  neighborhood text not null,
  city text not null,
  state text not null,
  created_at timestamptz not null default now()
);
```

<<<<<<< HEAD
=======
Se a tabela ja existir, adicione o tipo de documento:

```sql
alter table public.usuarios
  add column if not exists document_type text not null default 'cpf';
```

>>>>>>> main
Fluxo implementado:
- Clique no icone de login do header abre `/auth` em nova aba.
- Em `/auth` ha aba de login (NextAuth Credentials) e aba de cadastro.
- O cadastro busca endereco pelo CEP usando ViaCEP ao sair do campo.

## Observacoes

- A rota dinamica valida `slug` e usa `notFound()` para evitar pagina quebrada.
- Se o Supabase nao estiver configurado, os produtos mock sao usados automaticamente.
- O checkout Stripe funciona quando `STRIPE_SECRET_KEY` estiver configurada.

## OAuth Tiny/Olist (gerar token)

1. Configure `OLIST_CLIENT_ID`, `OLIST_CLIENT_SECRET` e `OLIST_REDIRECT_URI` no `.env.local`.
2. Rode o projeto com `npm run dev`.
3. Acesse [http://localhost:3000/olist/oauth](http://localhost:3000/olist/oauth).
4. Clique em **Conectar com Tiny/Olist** e conclua a autorizacao.
5. Copie o `access_token` exibido na interface e cole no `.env.local` como `OLIST_API_TOKEN`.
6. Reinicie o servidor para garantir leitura das variaveis atualizadas.

## Gestao de produtos Olist (admin)

Nova tela administrativa: [http://localhost:3000/admin/produtos](http://localhost:3000/admin/produtos)

Funcionalidades implementadas:
- Lista paginada de produtos vindo de `GET /produtos` da Olist;
- Filtro fixo no backend para trazer somente:
  - `situacao = "A"`
  - `descricao` iniciando com `relógio`
- Busca por palavra-chave na listagem;
- Clique em um item para abrir modal com detalhes do produto por ID;
- Checkbox para selecionar produtos de destaque (maximo de 3);
- Persistencia dos 3 destaques no Supabase.

### SQL da tabela de destaque

Execute no editor SQL do Supabase:

```sql
create table if not exists public.featured_products (
  id bigint generated always as identity primary key,
  olist_product_id text not null unique,
  descricao text not null,
  preco integer not null default 0,
  estoque integer not null default 0,
  imagem_url text not null default '',
  slug text not null,
  position integer not null check (position between 1 and 3),
  created_at timestamptz not null default now()
);
```

### Variaveis usadas para Olist

No `.env.local`:

```env
OLIST_API_TOKEN=seu_access_token
OLIST_API_BASE_URL=https://api.tiny.com.br/public-api/v3
# opcional
OLIST_PRODUCTS_PATH=/produtos
```
