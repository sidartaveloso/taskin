# Sandcastle na prática: o que custou caro descobrir

Notas de quem colocou o [Sandcastle](https://github.com/ai-hero-dev/sandcastle)
do Matt Pocock para rodar num monorepo pnpm real, com o
[Taskin](https://github.com/sidartaveloso/taskin) como rastreador de tarefas.
São seis defeitos de ambiente e três de prompt, cada um escondendo o seguinte.
O objetivo aqui é que a sua primeira execução funcione, em vez de custar uma
tarde.

O texto vale para qualquer repositório. A seção final é específica de **macOS com
Colima**, onde a diferença entre a configuração padrão e a correta foi de *vinte
minutos sem terminar* para *sessenta e oito segundos*.

---

## 1. Silêncio não é lentidão

O primeiro sintoma foi um hook morrendo no tempo limite. A reação natural —
aumentar o limite — foi errada duas vezes seguidas: 60s virou 10min, 10min virou
20min, e morreu igual.

O que separou as hipóteses não foi o tempo, foi a **quantidade de saída**:

> Um processo lento imprime pouco. Um processo travado não imprime nada.

Zero linhas em dez minutos nunca é lentidão. Antes de mexer no tempo limite,
pergunte se houve *alguma* saída. Se não houve, procure um processo esperando
por algo — um prompt, um lock, uma conexão.

## 2. Não esconda a saída atrás de um cano

Esse erro me custou duas conclusões falsas. Diagnosticando com

```bash
docker run ... -c 'pnpm install 2>&1 | tail -30'
```

o `tail` só libera quando o cano fecha. Enquanto o processo roda, você vê
**nada** — e conclui "travou" sobre um processo perfeitamente vivo.

Para observar um container em andamento, olhe por fora:

```bash
docker logs <container>                      # saída até agora
docker exec <container> ps -eo pid,etime,stat,comm --sort=-etime
```

O estado `R` na coluna `stat` responde a pergunta da seção 1 em um segundo.

## 3. O corepack pergunta, e ninguém responde

Se o seu `package.json` fixa o gerenciador em `packageManager`, o corepack
**pergunta antes de baixá-lo**. Num container sem terminal, a pergunta espera uma
resposta que nunca chega — e não imprime nada enquanto espera.

```dockerfile
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
```

Não use `CI=1` para isso. Funciona, mas muda o comportamento de dezenas de
ferramentas de uma vez; a variável acima desliga exatamente o que incomoda.

## 4. Os hooks do array podem não ser sequenciais

Isto:

```ts
onSandboxReady: [
  { command: 'pnpm install' },
  { command: 'pnpm build' },
]
```

não garante que o build comece depois de o install terminar. O sintoma é
traiçoeiro: o build encontra o `node_modules` pela metade, dispara um install
próprio, e **o erro aponta para o build** quando o problema estava no install.

Quando a ordem importa, encadeie num comando só:

```ts
onSandboxReady: [
  { command: 'pnpm install && pnpm build', timeoutMs: 30 * 60_000 },
]
```

## 5. O store do pnpm precisa ficar fora da montagem

Este foi o mais difícil, e a solução errada funcionava a ponto de enganar.

Deixado a si, o pnpm percebe que o store padrão está em outro dispositivo que o
`node_modules` e **move o store para dentro da worktree montada**, para poder
usar hardlink. Sobre virtiofs, o hardlink falha:

```
ERR_PNPM_ENOENT [importPackage .../node_modules/.pnpm/<pacote>] ENOENT
```

A correção intuitiva — forçar cópia — resolve o install e cria um problema pior
uma iteração depois:

```
sh: 1: turbo: Permission denied
```

porque os binários copiados chegam **sem bit de execução**.

A correção certa é apontar o store para o sistema de arquivos do próprio
container:

```ts
command: 'pnpm install --config.store-dir=/home/agent/.pnpm-store && ...'
```

Aí o pnpm percebe sozinho que origem e destino estão em dispositivos diferentes,
**escolhe copiar por conta própria**, e as permissões chegam certas. Menos
configuração, não mais.

Pelo mesmo motivo, **não** use `copyToWorktree: ['node_modules']` com pnpm, como
o template sugere: o `node_modules` do pnpm é quase todo symlink para o store do
host, e esses links chegam pendurados no container.

## 6. O turbo acha a raiz do repositório pelo `.git`

O Sandcastle trabalha numa **git worktree**, cujo `.git` é um arquivo apontando
para o caminho absoluto do repositório **no host**. O turbo lê isso para achar a
raiz e tenta escrever o cache lá dentro — onde o repositório real está montado
como somente-leitura:

```
IO error: failed to create directory `/Users/você/repo/.turbo/cache`
Permission denied (os error 13)
```

Mande o cache para dentro do container:

```ts
command: '... && TURBO_CACHE_DIR=/home/agent/.turbo-cache TURBO_TELEMETRY_DISABLED=1 pnpm build',
```

Ferramentas que derivam caminho do git têm todas essa armadilha. Se algo falhar
com um caminho do host dentro do container, é provavelmente isto.

## 7. O build faz parte do setup

Se a sua CLI resolve dependências do workspace pelo `dist` — o caso de qualquer
monorepo que compila antes de publicar — **o agente comanda uma versão velha de
si mesmo** sem um build no setup. Não é zelo: é a diferença entre o agente usar
o código que você acabou de escrever e usar o de ontem.

## 8. As worktrees ficam dentro do repositório, e quebram o seu lint

O Sandcastle cria as worktrees em `.sandcastle/worktrees/`. Cada uma é uma cópia
completa do repositório — **incluindo a configuração do seu formatador**. O
resultado, num repositório com Biome:

```
× Found a nested root configuration, but there's already a root configuration.
```

O `pnpm lint` do projeto passa a falhar por causa de um diretório temporário.
Ensine a ferramenta a ignorá-lo:

```json
{ "files": { "includes": ["**", "!**/.sandcastle/worktrees", "!**/.sandcastle/logs"] } }
```

Vale conferir o mesmo para ESLint, Prettier, `tsconfig` e qualquer varredura
`**/*`.

---

## O prompt é o produto

Três descobertas que não têm nada a ver com infraestrutura, e que mudaram mais o
resultado do que qualquer conserto acima.

### O agente faz o que o prompt manda, não o que você quis dizer

Eu tinha um servidor MCP no projeto, registrado no `.mcp.json`, e queria que o
agente o exercitasse. Resultado da primeira execução: **18 chamadas ao CLI, zero
ao MCP** — porque o prompt dizia `pnpm taskin start <ID>`.

Se você quer que uma interface específica seja exercitada, **nomeie as
ferramentas dessa interface no prompt** e proíba explicitamente o atalho:

> Não use o shell para estas três operações. O servidor MCP é a interface sendo
> exercitada aqui, e uma chamada de shell a contorna.

Para o servidor do projeto subir numa sessão headless, habilite-o:

```json
// .claude/settings.json
{ "enabledMcpjsonServers": ["taskin"] }
```

### Peça que ele relate quando algo faltar

Acrescente ao prompt:

> Se uma ferramenta não estiver disponível, diga isso na mensagem de commit e
> caia para a alternativa — mas **relate**, porque isso é um defeito que vale
> conhecer.

Um fallback silencioso esconde exatamente o defeito que você quer enxergar.

### Duas formas de priorizar não conversam sozinhas

O prompt do template ordena por categoria — correção de bug, tracer bullet,
polimento, refatoração. O meu rastreador tinha um campo numérico de prioridade.
Com duas tarefas do mesmo tipo, o critério empatava e o agente continuava o que
já estava em andamento: pegou uma tarefa de prioridade **30** em vez de uma de
**255**.

Se o seu rastreador tem prioridade própria, diga ao prompt que ela decide:

> **O número de prioridade decide.** A ordem por categoria só desempata. Uma
> tarefa já em andamento **não** vence por estar em andamento — várias passadas
> sem fechar são motivo de suspeita, não de mais uma.

Depois dessa mudança, a rodada seguinte fechou três tarefas na ordem exata de
prioridade.

**E diga em que direção.** Eu escrevi "maior vence" e estava errado: no Taskin a
prioridade é uma **posição** na fila, e a ordem manual põe o menor número no
topo. Uma rodada inteira fechou as tarefas de um grupo na ordem inversa à que o
dashboard mostrava, sem ninguém perceber — o agente obedeceu ao prompt, e o
prompt contradizia o produto. Confira a direção contra a ferramenta que exibe a
fila, e não contra a intuição de que número grande é importante.

---

## Verificar pelo efeito, não pelo log

O log do Sandcastle **não renderiza chamadas MCP** no modo padrão — a própria
documentação diz que o parser descarta blocos de ferramentas que não reconhece.
Contar ocorrências no log dá zero mesmo quando o agente usou o servidor o tempo
todo.

Prove pelo efeito colateral que só um dos caminhos produz. No meu caso:

| | rodada pelo CLI | rodada pelo MCP |
| --- | --- | --- |
| status da tarefa | `in-progress` | `in-progress` |
| commit automático de status | **existe** | **não existe** |

A ausência do commit era a prova — porque o CLI automatiza git e o servidor MCP,
não. (Isso também revelou um defeito real: duas portas para a mesma operação com
efeitos diferentes.)

## Outras coisas que você vai encontrar

**O `merge-to-head` mescla no HEAD que estiver.** Se você não quer o trabalho do
agente no `main`, rode a partir de uma branch dedicada. Ele também **troca a
branch do seu diretório de trabalho** ao terminar.

**O commit de status pode suprimir o seu CI.** Se o seu rastreador marca commits
automáticos com `[skip ci]`, e esse commit fica no topo do push, o GitHub —
que lê **apenas o commit de topo** — pula o pipeline inteiro, release incluído.

**Verifique antes de mesclar.** Merge direto não é merge sem conferência: rode
lint, typecheck, testes e build sobre o trabalho do agente. E desconfie de falha
que apareça logo após um `install`: `dist` incompleto produz erro de tipo que
some sozinho depois do primeiro build completo.

**Teste de navegador não roda no sandbox** sem instalar as bibliotecas de
sistema do Chromium. O agente contorna com elegância — documenta em vez de
tentar —, mas isso limita quais tarefas são acionáveis.

---

# macOS com Colima

Esta seção é onde estava o maior ganho. Os números são do mesmo repositório, mesmo
install, mesma imagem:

| configuração | install | build |
| --- | --- | --- |
| x86_64 emulado + sshfs | passou de 9min **sem terminar** | 9min |
| aarch64 nativo + virtiofs | **42s** | **25s** |

## Confira o que você tem

```bash
colima status
```

Duas linhas importam:

```
arch: x86_64          ← numa máquina Apple Silicon, isto é emulação
mountType: sshfs      ← a montagem mais lenta disponível
```

Um Colima iniciado com os padrões, uma vez, há meses, provavelmente está assim.

## O `colima start` ignora as flags numa instância existente

Esta foi a pegadinha. Rodar

```bash
colima stop && colima start --arch aarch64 --mount-type virtiofs
```

**não muda nada** — arquitetura e tipo de montagem só se aplicam na *criação* da
VM. Um `start` reusa a configuração salva, sem avisar.

E `colima delete` destrói **todas as imagens e volumes**. No meu caso eram 796
imagens e 194 volumes, incluindo um registro privado e bancos de dados de
projetos — nada que se recrie numa tarde.

## Use um perfil dedicado

```bash
colima start --profile sandcastle \
  --arch aarch64 --vm-type vz --mount-type virtiofs \
  --cpu 4 --memory 8 --disk 60
```

Isso cria uma VM nova, deixa a sua intacta, e troca o contexto do Docker
automaticamente. Para voltar:

```bash
docker context use colima          # a sua de sempre
docker context use colima-sandcastle
```

Lembre que a imagem do Sandcastle precisa ser **reconstruída** no perfil novo:
ela estava em x86_64 e agora o alvo é arm64.

```bash
pnpm exec sandcastle docker build-image
```

## O Colima só compartilha alguns caminhos

Isto me fez diagnosticar por vinte minutos um problema que não existia: montei um
diretório em `/private/tmp/...` e, dentro do container, `/home/agent/workspace`
apareceu **vazio, pertencente ao root**.

O Colima compartilha por padrão apenas o seu `$HOME` (e `/tmp/colima`). Qualquer
caminho fora disso é montado como diretório vazio, sem erro nenhum.

Como o Sandcastle cria as worktrees dentro do próprio repositório, isso funciona
naturalmente — desde que o repositório esteja sob `$HOME`. Se você reproduz algo
à mão para depurar, use um caminho sob `$HOME`, ou vai depurar a montagem em vez
do problema.

## virtiofs e o pnpm

Ver a seção 5. Resumo: o virtiofs não lida bem com hardlink, o pnpm insiste em
hardlink se o store estiver no mesmo dispositivo, e a solução é manter o store no
sistema de arquivos do container.

## E o Docker Desktop?

Em Apple Silicon ele é nativo arm64 e usa VirtioFS por padrão — ou seja, já vem
configurado como o perfil acima. A vantagem não é capacidade, é o padrão certo de
fábrica. O Colima chega no mesmo lugar com um comando.

Se for considerar a troca, confira o licenciamento: gratuito para uso pessoal,
educação e empresas pequenas; assinatura paga acima de certo porte.

---

## Ponto de partida

Um `onSandboxReady` que funciona num monorepo pnpm, com tudo acima aplicado:

```ts
hooks: {
  sandbox: {
    onSandboxReady: [
      {
        // Um comando só: a ordem precisa ser garantida.
        command:
          'pnpm install --config.store-dir=/home/agent/.pnpm-store && ' +
          'TURBO_CACHE_DIR=/home/agent/.turbo-cache TURBO_TELEMETRY_DISABLED=1 pnpm build',
        // Teto, não previsão: depende do runtime de quem roda.
        timeoutMs: 30 * 60_000,
      },
    ],
  },
},
```

E no `Dockerfile`:

```dockerfile
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
# Se o seu install depende de outras ferramentas, elas entram aqui.
# No nosso caso, o `uv` — um pacote Python roda `uv sync` no install,
# e sem ele o `pnpm install` falha antes de instalar qualquer coisa.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
```

## O que eu faria diferente

Mediria antes de configurar. Três dos seis defeitos de ambiente eram do
*runtime*, não do Sandcastle, e eu só descobri isso depois de tratar sintomas.
Dez minutos rodando `pnpm install` dentro da imagem, à mão, com a saída visível,
teriam economizado a tarde inteira:

```bash
git archive HEAD | docker run --rm -i --entrypoint bash <sua-imagem> -c '
  mkdir -p /w && cd /w && tar x && time pnpm install && time pnpm build
'
```

Se isso não passar, o Sandcastle não tem como passar — e o erro aparece na sua
frente, sem camadas no meio.
