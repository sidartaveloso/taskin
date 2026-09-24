# 🧩 Task 097 — o taskin se irrita por etapas e se acalma sozinho

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 1418

## Description
Hoje a reacao ao ruido poe o mascote em thoughtful, que se le como um hmm pensativo e nao como um pedido de silencio, e volta a neutral dois segundos depois — sem memoria do que acabou de acontecer. O humor passa a acompanhar uma irritacao acumulada: sobe conforme a ocupacao da janela se aproxima da exigida, dispara para furious no momento do shhh, e decai sozinha depois de um tempo de sala calma.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

### A irritação como estado, em função pura
- [ ] Testes antes do código: a irritação sobe com a ocupação da janela; o disparo do shhh a empurra para o topo; ela decai sozinha em sala calma; dois disparos seguidos deixam o mascote mais irritado que um só; o decaimento nunca passa de zero nem de um
- [ ] `escalarIrritacao(estado, evento, agora)` em `design-vue`, recebendo a `NoiseProgress` do `ui-sense` e o instante — sem `setInterval` próprio, para ser testável com relógio falso
- [ ] Faixas de humor derivadas da irritação: `neutral` → `annoyed` → `furious`, com os limiares nomeados

### O componente
- [ ] `TaskinWithShhh` passa a alimentar a irritação a cada amostra do `onProgress` e a derivar `currentMood` dela
- [ ] A reação do shhh deixa de ser `thoughtful` e passa a `furious` (ou `annoyed`, quando a irritação ainda está baixa)
- [ ] O retorno ao normal deixa de ser o `setTimeout` de 2s que zera tudo: o balão e a boca continuam com o tempo curto, o humor decai pela irritação
- [ ] Props `moodEscalation` e `calmDownMs`, com defaults, e o estado visível no painel de debug

### Storybook
- [ ] Controles novos no meta de `Organisms/Taskin/Shhh` e a `BrunoShhh` com a escalada ligada
- [ ] Story ou nota explicando a escada de humores sem depender de barulho real — o botão `Test Shhh` já permite ver a escalada clicando várias vezes

### Fechamento
- [ ] `MASCOT_NOISE_REACTION.md` e changeset
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Por que faz sentido
Dois motivos, e o primeiro é um defeito.

**O humor de hoje está errado.** A reação põe o mascote em `thoughtful`, que é a
cara de quem está pensando — não a de quem está pedindo silêncio. Quem olha a
tela no momento do shhh vê um "hmm", não um "chega".

**O dado para escalar já existe.** A task-095 expôs o `onProgress` com a
ocupação da janela contra a exigida. "Quase ficando totalmente puto" é
literalmente essa razão chegando perto de 1, e hoje esse número só aparece no
painel de debug. O mascote pode ficar `annoyed` *antes* de falar, o que dá à
sala a chance de baixar a voz sem ninguém precisar ser interrompido — que é o
propósito da coisa toda.

### A forma proposta
Uma irritação de 0 a 1, e não um interruptor:

- **Sobe** com a ocupação da janela, proporcional a quão perto do limiar está.
- **Salta** a cada shhh disparado, de modo que dois pedidos seguidos deixem o
  mascote visivelmente mais bravo que um.
- **Decai** sozinha enquanto a sala está calma, com uma constante de tempo
  (`calmDownMs`), até voltar a zero.

O humor sai de faixas dessa irritação: `neutral` abaixo do primeiro limiar,
`annoyed` no meio, `furious` no topo. O `TASKIN_MOODS` já tem os três.

### O que muda no que existe
O `setTimeout` de 2 segundos que hoje devolve tudo ao `neutral` deixa de mandar
no humor. Ele continua cuidando do balão e da boca, que são o gesto curto; o
humor passa a ser estado, e não gesto — é justamente o que permite "voltar ao
normal depois de um tempo com tudo calmo" em vez de dois segundos fixos.

### Fora de escopo
Persistir a irritação entre sessões, e levá-la para o `.taskin.json`. Como nas
tasks 093 a 096, isto é Storybook e componente; a configuração do produto entra
quando fizer falta.
