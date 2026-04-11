# Mage Select Data Engine

Monorepository completo do engine `mage-select-data-engine` para select assíncrono com infinite scroll e entity hydration.

## 📦 Estrutura

- `packages/mage-select-data-engine`: Core agnóstico do data engine logic.
- `packages/mage-react`: Adaptador React usando subscriptions (sem renders desnecessários).
- `packages/mage-react-hook-form`: Integração limpa e direta via `useMageSelectController`.
- `apps/backend`: Node.js Express API mock consumindo o banco.
- `apps/frontend`: Vite React App com formulário de teste, estilização otimizada.
- `prisma`: Configuração global do SQLite, schema e seeds.

## 🛠 Como iniciar

Para iniciar e testar o projeto, siga estes comandos a partir da raiz do repositório:

### 1. Instalar dependências
```bash
npx pnpm install
```

### 2. Preparar Banco de Dados (SQLite)
Gere as tabelas e popule 1500+ registros via script de seed:
```bash
npx pnpm --filter mage-prisma run db:push
npx pnpm --filter mage-prisma run db:seed
```

### 3. Build completo (Opcional, mas recomendado)
Para garantir que todos os pacotes `.d.ts` esão amarrados:
```bash
npx pnpm build
```

### 4. Modo de Desenvolvimento Paralelo
Nós configuramos o **TurboRepo** para permitir que toda a stack do monorepo suba com apenas um comando e ative o recarregamento automático nativo (Hot Reload):

```bash
npx pnpm dev
```

or

```bash
bun dev
```
Isso vai:
- Rodar o TSUP em watch mode para os `packages` (mage-select-data-engine, mage-react, etc).
- Iniciar o backend na porta **3001** (Node Express/Prisma).
- Iniciar o frontend na porta **5173** (Vite + React).

Acesse [http://localhost:5173](http://localhost:5173).

## 🚀 Como funciona o React Adapter?

Para usar o core, crie as opções conectando aos endpoints do seu projeto. O backend precisa fornecer endpoints isolados para paginação e busca por ID (para Hydration automático no Edit Mode).

O `MageSelect` da raiz deste monorepo no frontend demonstra fielmente o comportamento agnóstico!
