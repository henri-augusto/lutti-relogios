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
```

## 3) Criar tabela `produtos` no Supabase

Use este SQL no editor SQL do Supabase:

```sql
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco integer not null,
  imagem_url text not null,
  descricao text not null,
  slug text not null unique
);
```

## 4) Rodar o projeto

```bash
npm run dev
```

Acesse:

- Home: [http://localhost:3000](http://localhost:3000)
- Catalogo: [http://localhost:3000/catalogo](http://localhost:3000/catalogo)
- Produto dinamico (exemplo): [http://localhost:3000/produto/rolex-submariner-black](http://localhost:3000/produto/rolex-submariner-black)

## Observacoes

- A rota dinamica valida `slug` e usa `notFound()` para evitar pagina quebrada.
- Se o Supabase nao estiver configurado, os produtos mock sao usados automaticamente.
- O checkout Stripe funciona quando `STRIPE_SECRET_KEY` estiver configurada.
