# 🧩 Task 067 — Avatar por proxy do proprio dashboard, em vez de o navegador falar com o gravatar

- Status: pending
- Type: feat
- Priority: 255
- Assignee: Sidarta Veloso

## Description
Hoje a URL absoluta do gravatar e gravada no dado de dominio e o navegador de quem abre o dashboard busca a imagem em gravatar.com. Isso vaza IP e referrer para terceiro, quebra sem internet e impede CSP restritiva.

## Tasks
- [ ] Decidir o que o dominio guarda: a identidade (o hash) em vez da URL de um provedor
- [ ] Rota de avatar no servidor do dashboard, com cache e limite de tempo
- [ ] O dashboard passa a pedir caminho relativo
- [ ] `Avatar.vue` cai para as iniciais quando a imagem falha, e nao so quando falta `src`
- [ ] Atualizar o contrato de registro de usuarios, que hoje afirma a URL do gravatar
- [ ] Documentar o comportamento sem internet

## Notes
**Como e hoje.** `getGravatarUrl` em
`packages/file-system-task-provider/src/user-registry.ts:35` monta
`https://www.gravatar.com/avatar/<md5 do email>?d=mp` e grava isso em
`user.avatar`. A URL viaja pelo provider, pelo `ITaskManager` e pelo dashboard
ate virar `<img :src>` em `Avatar.vue`. Quem abre o dashboard tem o **proprio
navegador** buscando a imagem em `gravatar.com`.

**Por que trocar, alem da higiene de URL.**

- **Privacidade.** Cada pessoa que abre o painel entrega IP e referrer a um
  terceiro, e o faz uma vez por avatar — o que correlaciona o hash do email de
  cada membro da equipe com quem esta olhando o painel. Num dashboard interno
  isso e vazamento silencioso.
- **Funciona sem internet.** Hoje, numa rede fechada ou offline, o painel abre
  com imagens quebradas.
- **Permite CSP restritiva.** Com tudo relativo, o `img-src` pode ser `'self'`.
- **Da lugar para cache e para um plano B** quando o gravatar nao responde.

**A decisao de desenho, e ela vem antes do codigo.** O incomodo nao esta so no
HTML: a URL absoluta de um provedor especifico esta gravada no **dado de
dominio**. Reescrever a URL na hora de renderizar resolveria o sintoma e criaria
uma traducao mantida a mao entre duas formas — a forma de defeito que mais
aparece neste repositorio.

O caminho coerente com a arquitetura e o dominio guardar a **identidade** (o
hash do email) e cada superficie decidir como renderiza-la: o dashboard pede
`/avatar/<hash>` ao proprio servidor, e outra superficie pode escolher outra
coisa. Isso e o mesmo principio que faz `ITaskProvider` ser generico — o nucleo
nao decide onde as coisas moram.

Atencao: `user-registry.contract.ts` e `user-registry.test.ts` afirmam
explicitamente o formato da URL do gravatar. Sao eles que precisam mudar
primeiro, e a mudanca deles e a especificacao desta task.

**Um defeito de brinde, que esta task deve corrigir.** `Avatar.vue` cai para as
iniciais com `v-if="src"` / `v-else` — ou seja, so quando **falta** a URL. Se a
imagem existir e falhar ao carregar (offline, gravatar fora, 404), nao ha
`@error`, e o resultado e um icone de imagem quebrada em vez das iniciais. Sem
proxy isso e comum; com proxy ainda pode acontecer, entao o tratamento vale de
qualquer forma.

**Onde a rota entra.** O servidor do dashboard e express, em
`packages/cli/src/commands/dashboard.ts`, e ja registra middlewares — a rota
nova fica ao lado. Pontos a resolver ali: limite de tempo para nao pendurar a
requisicao, cache em memoria para nao repetir a busca a cada carga, e o que
devolver quando o provedor nao responde.
