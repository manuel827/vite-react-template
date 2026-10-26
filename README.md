# Palpite Certo

Site de palpites de futebol com páginas para os jogos de hoje, amanhã e resultados. Os palpites são criados e publicados no painel administrativo e ficam guardados no Supabase.

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No SQL Editor do projeto, execute [`supabase/schema.sql`](./supabase/schema.sql).
   Se já executou uma versão anterior do esquema, execute também [`supabase/migrations/20261026_expand_tip_pick.sql`](./supabase/migrations/20261026_expand_tip_pick.sql) para permitir palpites com várias linhas e até 1000 caracteres.
3. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave publicável (anon) do projeto.
4. Crie o utilizador do administrador em **Authentication → Users** e defina a palavra-passe inicial `qwe123`. Para entrar em `/admin`, use o email dessa conta e a palavra-passe. A autenticação e a verificação da palavra-passe são geridas pelo Supabase Auth; a palavra-passe não é incluída no código do site.
5. No SQL Editor, atribua o papel administrativo apenas ao email de confiança, substituindo o exemplo:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

   A instrução deve atualizar apenas a conta pretendida. Termina e inicia sessão novamente para receber o papel no token. O site não disponibiliza registo público; o acesso e as alterações também são protegidos pelas políticas RLS do Supabase.
6. Reinicie o servidor de desenvolvimento depois de configurar as variáveis.

**Segurança:** `qwe123` é uma palavra-passe inicial fraca. Troque-a por uma palavra-passe forte e única antes de colocar o site em produção. As variáveis `VITE_` são incorporadas no bundle público: use apenas a chave anon/publicável do Supabase, nunca a `service_role`. As políticas RLS do esquema limitam a leitura pública a palpites publicados e reservam as alterações a administradores.

## Utilização

```sh
npm install
npm run dev
```

- `/` — palpites de hoje
- `/palpites-de-amanha` — palpites de amanhã
- `/resultados` — palpites publicados com resultado definido
- `/sobre-nos` — informação sobre o site e o seu conteúdo
- `/termos-de-uso` — termos e aviso sobre o caráter informativo do conteúdo
- `/admin` — início de sessão e gestão de palpites
- `/sitemap.xml` — sitemap das páginas públicas para motores de busca
- `/robots.txt` — regras de rastreamento e localização do sitemap
- `/palpite/:id/:slug` — página pública individual de cada palpite publicado

No painel `/admin`, as secções **Palpites de hoje**, **Palpites de amanhã** e **Publicar resultados** separam as tarefas. O campo **Palpite** aceita várias informações em linhas separadas, até 1000 caracteres. Os palpites ficam persistidos na tabela `public.tips` do Supabase e as quebras de linha são preservadas no site. Ao publicar um palpite, ele aparece na página pública da data selecionada; rascunhos ficam visíveis apenas a administradores. Depois do jogo, abra **Publicar resultados**, escolha o jogo, defina se acertou ou falhou e informe o placar. Essa ação publica o resultado na página pública **Resultados**.

Cada palpite publicado recebe automaticamente uma página individual, com HTML e metadados próprios, adicionada ao sitemap. Estas páginas não são ligadas nos cards nem na navegação normal; quem chega diretamente por uma pesquisa pode consultar o mesmo conteúdo disponível no site e seguir o link para a página principal. Não há versões diferentes para Google e visitantes. Palpites não publicados não são acessíveis publicamente.

Para validar a aplicação e preparar a publicação:

```sh
npm run build
npm run deploy
```

O `wrangler.json` contém `SUPABASE_URL` e `SUPABASE_ANON_KEY` como variáveis públicas do Worker. O `vite.config.ts` reutiliza esses valores no bundle do site, pelo que o build no Cloudflare pode ligar-se ao Supabase sem depender de `.env.local`. Em desenvolvimento local, `.env.local` continua a ser aceite quando os valores não estão definidos no Wrangler. Só coloque aqui a URL do projeto e a chave `anon`/`publishable`: a chave pública é incorporada no site e não é um segredo. Nunca coloque a chave `service_role` neste ficheiro.

Se trocar de projeto Supabase, atualize os dois valores `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `wrangler.json` e publique novamente.

Depois de publicar, envie `https://o-seu-dominio/sitemap.xml` no Google Search Console. O sitemap lista as páginas públicas e todos os palpites publicados; `/admin` é excluída da indexação.

As páginas públicas definem título, descrição e URL canónica próprios; os jogos e clubes referidos no texto SEO são gerados apenas a partir de palpites publicados. Não adicionamos uma lista genérica de clubes ou uma meta tag `keywords`, pois palavras-chave sem relação com o conteúdo não ajudam os visitantes e podem ser tratadas como spam. Estas práticas melhoram a clareza e a indexação, mas nenhuma alteração garante a primeira posição nos resultados do Google.
