# Aurestride Digital — site institucional e painel administrativo

Site comercial da Aurestride Digital (marketing, sites e sistemas web para pequenos negócios), com painel em `/admin` para editar praticamente todo o conteúdo sem mexer em código.

- **Stack:** Next.js 16 (App Router) + TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth e Storage) e hospedagem na Vercel.
- **Conteúdo:** fica no banco de dados. Os preços, planos, textos, fotos e serviços **não estão fixados no código**.
- **Segurança:** as políticas RLS deixam o visitante ler só o que está publicado, e somente administradores cadastrados podem alterar conteúdo.

---

## Sumário

1. [Estrutura](#estrutura)
2. [Rodar localmente](#rodar-localmente)
3. [Configurar o Supabase](#configurar-o-supabase)
4. [Publicar em produção (Vercel)](#publicar-em-produção-vercel)
5. [Guia da Maria: como editar o site](#guia-da-maria-como-editar-o-site)
6. [Verificações e manutenção técnica](#verificações-e-manutenção-técnica)
7. [Decisões e limites conhecidos](#decisões-e-limites-conhecidos)

---

## Estrutura

```
src/app/(site)/            Site público (página principal, portfólio, privacidade)
src/app/admin/             Painel: login, módulos de edição e ações do servidor
src/components/site/       Seções do site (hero, serviços, planos, FAQ, contato…)
src/components/admin/      Componentes do painel (formulários, upload, listas)
src/lib/admin/resources.ts Campos e validação de cada módulo do painel
src/lib/admin/settings-fields.ts  Campos das configurações (textos, cores, SEO, contatos)
src/proxy.ts               Renova a sessão e protege /admin
supabase/migrations/       Migrações SQL versionadas (tabelas, RLS, storage)
supabase/seed/content.json Dados iniciais (fonte única)
supabase/seed.sql          Gerado a partir do JSON (npm run seed:build)
```

### Tabelas

| Tabela | Conteúdo |
| --- | --- |
| `site_settings` | Identidade, cores, contatos, SEO, textos das seções, rodapé e privacidade (JSON) |
| `team_members` | Perfis da equipe (Maria, Lukas…) |
| `services` | Serviços de marketing, criação de sites e sistemas web |
| `marketing_plans` + `plan_items` | Planos e seus entregáveis |
| `web_pricing` | Tabela de preços de desenvolvimento web |
| `portfolio_projects` + `project_images` | Portfólio e galerias |
| `process_steps`, `faqs` | "Como funciona" e perguntas frequentes |
| `media` | Registro das imagens enviadas pelo painel |
| `leads` | Mensagens do formulário de contato |
| `clients` | Ficha de cada cliente (situação, contrato, próximo contato, observações) |
| `client_tasks`, `client_activities` | Tarefas e histórico de atendimento de cada cliente |
| `admins` | Quem pode editar o site |

---

## Rodar localmente

Requisitos: Node.js 20 ou superior.

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev                  # http://localhost:3000  ·  painel em /admin
```

**Sem Supabase configurado**, o site abre em *modo demonstração*: mostra os dados iniciais, exibe um aviso amarelo e não permite edição. O formulário de contato recusa o envio, sem fingir que a mensagem foi enviada. Para conferir a interface do painel sem banco, rode `ADMIN_PREVIEW=1 npm run dev`. Esse modo só funciona em desenvolvimento e não salva nada.

---

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com). A região São Paulo (`sa-east-1`) é a mais próxima.
2. Aplique as migrações. Há dois caminhos:
   - **Pelo painel do Supabase:** abra o SQL Editor e execute, nesta ordem, o conteúdo de `supabase/migrations/20261027000001_schema.sql`, `…0002_security.sql`, `…0003_storage.sql`, `20261028000001_hero_texto.sql`, `20261028000002_clientes.sql` e, por fim, `supabase/seed.sql`.
   - **Banco já configurado antes de 28/10/2026:** rode apenas `20261028000001_hero_texto.sql` (troca o título e a descrição do topo, se ainda forem os antigos) e `20261028000002_clientes.sql` (cria a gestão de clientes). Não rode o `seed.sql` de novo.
   - **Pela CLI:** `npx supabase link --project-ref SEU_REF`, depois `npx supabase db push` e, por último, rode `supabase/seed.sql` no SQL Editor.
3. Copie as chaves em **Project Settings → API** para o `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (públicas)
   - `SUPABASE_SERVICE_ROLE_KEY` (secreta; nunca use o prefixo `NEXT_PUBLIC_`)
4. Crie o login da Maria em **Authentication → Users → Add user** (e-mail e senha forte, com "Auto Confirm User" marcado).
5. Torne esse usuário administrador, no SQL Editor:

   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'email-da-maria@exemplo.com';
   ```

   Repita para o Lukas, se ele também for editar. Para remover um acesso: `delete from public.admins where email = '...';`
6. Em **Authentication → Sign In / Providers**, desative "Allow new users to sign up". Assim ninguém cria conta sozinho; mesmo que crie, não vira administrador.
7. Em **Authentication → URL Configuration**, defina o *Site URL* com o endereço oficial do site.

> As migrações e as políticas foram verificadas com `npm run db:verify`, que roda tudo num Postgres embutido. São 21 checagens, entre elas: o visitante não vê rascunhos, não lê leads e não altera preços; um usuário comum não envia arquivos; o admin publica projetos.

---

## Publicar em produção (Vercel)

1. Suba o código para um repositório no GitHub.
2. Na [Vercel](https://vercel.com), use **Add New → Project** e importe o repositório. O framework é detectado como Next.js.
3. Em **Environment Variables**, cadastre as mesmas variáveis do `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` e `LEAD_HASH_SALT`.
4. Clique em **Deploy**. Depois, em **Settings → Domains**, conecte o domínio próprio.
5. Atualize o *Site URL* no Supabase (passo 7 acima) e o "Endereço oficial do site" no painel (Identidade e SEO).
6. Teste em produção: entre em `/admin`, edite um texto, salve e confira o site. Envie uma mensagem de teste pelo formulário e veja se ela aparece em **Contatos recebidos**.

Cada novo `git push` na branch principal publica automaticamente.

---

## Guia da Maria: como editar o site

Acesse **seudominio.com.br/admin** e entre com seu e-mail e senha. Toda alteração salva aparece no site em poucos segundos. Uma mensagem verde confirma o salvamento; se aparecer uma mensagem vermelha, nada foi alterado e o motivo vem descrito.

### Clientes (acompanhamento)
- Em **Clientes** ficam todos os clientes, com busca e filtros: *Em atendimento*, *Precisam de atenção* (contato vencido, tarefa atrasada ou relacionamento “Em risco”), *Em negociação*, *Pausado* e *Encerrado*. O topo mostra a receita mensal dos clientes em atendimento.
- Cada cliente tem duas abas:
  - **Acompanhamento:** data do **próximo contato** (com atalhos de amanhã, 1 semana, 15 dias e 1 mês), **tarefas e entregas** com prazo, **registro de atendimento** (WhatsApp, reunião, ligação, entrega, pagamento, retorno do cliente) e o **histórico** completo.
  - **Ficha do cliente:** contato, situação, como está o relacionamento, serviços contratados, plano, valor mensal, vencimento, datas do contrato e anotações fixas (aparecem no topo como “Lembrar sempre”). Não guarde senhas.
- Em **Contatos recebidos**, o botão **Transformar em cliente** cria a ficha com os dados da mensagem e agenda o primeiro retorno para hoje.
- O **Painel** inicial lista os clientes com contato vencido ou nos próximos 3 dias.
- Esses dados são internos: só administradores conseguem ver (RLS).

### Estrutura da página
- Em **Estrutura da página**, mude a ordem das seções com as setas e mostre ou oculte cada uma com o ícone de olho. O topo fica sempre primeiro.
- Ocultar uma seção também tira o link correspondente do menu (Sobre nós, Serviços, Portfólio, Contato).
- Sem WhatsApp cadastrado, a seção Contato não pode ser ocultada, porque os botões de orçamento levam até ela.

### Trocar fotos
- **Sua foto ou a do Lukas:** abra **Equipe**, clique no lápis do perfil e use **Trocar imagem**. Prefira fotos verticais, com o rosto bem enquadrado.
- **Foto principal do topo:** em **Textos da página → Apresentação principal → Foto principal**.
- **Logo:** em **Identidade e SEO → Marca → Logo** (PNG com fundo transparente).
- Formatos aceitos: JPG, PNG, WebP ou AVIF, com até 5 MB cada.

### Alterar textos
- **Textos da página** reúne o título e o subtítulo do topo, o "Sobre nós", a missão, a visão e os valores, os títulos de cada seção, o rodapé e a política de privacidade.
- O botão **Pré-visualizar** mostra como o topo e o "Sobre nós" vão ficar antes de você salvar.
- Os textos marcados como **[Texto provisório]** ou **[Editar]** precisam ser substituídos. O Painel inicial lista os que ainda faltam.

### Serviços
- Em **Serviços**, escolha a aba (Marketing, Sites ou Sistemas). Lá você pode criar, editar, mudar a ordem com as setas, ocultar com o ícone de olho ou excluir.
- **Ocultar** tira o serviço do site sem apagar nada; você pode reativá-lo depois.
- Tráfego pago só aparece no site se for cadastrado aqui, com o escopo descrito.

### Planos e preços
- Em **Planos de marketing**, edite o nome, o preço, a quantidade de conteúdos, a quantidade de vídeos (que fazem parte do total de conteúdos), os entregáveis e as observações.
- **Destacar como recomendado:** só um plano por vez fica em destaque.
- **Duplicar** cria uma cópia inativa, útil para montar um plano novo a partir de outro.
- Em **Preços web**, escolha *faixa*, *a partir de*, *preço fixo* ou *sob consulta*, e se o valor aparece no site.

### Portfólio
1. Em **Portfólio**, clique em **Novo projeto**, preencha os campos e envie a capa e a galeria.
2. O projeto nasce como **rascunho**. Use o botão de pré-visualização para conferir a página, que só administradores conseguem ver.
3. Clique em **Publicar** **somente** depois que o cliente autorizar a divulgação. Não publique resultados ou métricas que não possam ser comprovados.
4. A **Ambrozio Car** já está cadastrada como rascunho, aguardando o preenchimento e a autorização.

### Contatos e WhatsApp
- Em **Contatos e WhatsApp**, informe o número com DDD, o e-mail e as redes sociais.
- Enquanto o WhatsApp estiver vazio, os botões "Solicitar orçamento" levam à seção de contato do site.
- As mensagens automáticas aceitam `{plano}` e `{servico}`, que são trocados pelo nome do plano ou do serviço clicado.
- As mensagens do formulário ficam em **Contatos recebidos**. O site não envia e-mail automático, então confira essa página com frequência.

### Cores e SEO
- Em **Identidade e SEO**, você pode mudar as 4 cores principais, o título e a descrição que aparecem no Google e a imagem de compartilhamento (1200 × 630 px).

---

## Verificações e manutenção técnica

```bash
npm run check        # tipos + lint + banco/RLS (PGlite) + utilitários de formatação
npm run build        # build de produção
npm run seed:build   # regenera supabase/seed.sql depois de editar seed/content.json
```

- **Novas migrações:** crie um novo arquivo `supabase/migrations/AAAAMMDDHHMMSS_descricao.sql`. Nunca edite migrações que já foram aplicadas.
- **Novo campo de texto no painel:** adicione-o em `supabase/seed/content.json` (valor padrão), em `src/lib/admin/settings-fields.ts` (formulário e validação) e use-o no componente da seção.
- **Novo campo de um módulo** (serviço, plano…): crie a coluna numa migração, depois adicione o campo e a validação em `src/lib/admin/resources.ts`.

---

## Decisões e limites conhecidos

- **Formulário de contato:** grava no banco com validação no cliente e no servidor, um campo-armadilha anti-robô, tempo mínimo de preenchimento e limite de 3 envios a cada 15 minutos por IP (anonimizado). **Não envia e-mail.** Para receber alertas por e-mail, é preciso integrar um serviço como Resend ou SendGrid, o que exige uma conta e uma chave.
- **Contraste:** o cinza `#64748B` sobre o fundo `#0B1220` não atinge o contraste mínimo para textos pequenos. Ele é usado em detalhes e rótulos; os textos secundários usam um tom mais claro derivado dele.
- **Tipografia:** Inter para textos e Fraunces (serifada) nos títulos, seguindo a referência visual. As duas são servidas pelo próprio site, sem depender do Google Fonts.
- **Fotos iniciais:** são recortes das fotos enviadas, ficam em `public/images` e podem ser trocadas pelo painel.
- **Imagens externas:** o painel aceita apenas imagens enviadas por ele (Supabase Storage) ou arquivos locais do projeto. SVG não é aceito no upload, por segurança.
