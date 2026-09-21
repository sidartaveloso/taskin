# @opentask/taskin-mascote

O Taskin em tela cheia, para um celular apoiado abaixo do monitor.

Ele acompanha o rosto pela câmera frontal e, quando alguém na sala fala alto,
chama a pessoa pelo nome, faz a pausa e chia — em voz alta, para quem está
falando ouvir. A ideia é que pedir silêncio deixe de custar a concentração de
quem pede.

## Usando

Publicado junto do site, em `/taskin/mascote/`. Abra esse endereço no celular e
instale na tela inicial ("Adicionar à tela de início"). Depois disso ele abre
sem barra de endereço e funciona sem rede.

No aparelho:

1. **Apoie o celular abaixo do monitor**, virado para você.
2. **Toque em "Começar"** — é o gesto de que o navegador precisa para liberar o
   som, a câmera, o microfone e a trava de tela. Um toque, e o resto do dia ele
   só trabalha.
3. **Abra a engrenagem** no canto e diga a quem chamar. Fecha, e não se mexe
   mais nisso.

## Desenvolvendo

```bash
pnpm mascote           # sobe em http://localhost:6130/taskin/mascote/
pnpm mascote:icons     # regenera os ícones a partir do SVG do mascote
```

Os testes rodam com `pnpm --filter @opentask/taskin-mascote test`.

## As decisões que o aparelho impõe

**A tela apaga, e um celular apagado não olha para ninguém.** A Screen Wake Lock
API resolve, mas com duas regras que moldam o desenho: ela só é concedida após
interação do usuário e em contexto seguro — daí a tela de entrada — e **é
liberada sozinha quando a aba deixa de estar visível**, o que acontece a cada
troca de aplicativo. Por isso a trava é reconquistada no `visibilitychange`, e
não pedida uma vez só.

**Câmera e microfone exigem contexto seguro.** Um celular acessando o seu
computador por IP da rede local não é HTTPS nem `localhost`, então não serve.
Publicar junto do site resolve: o aparelho abre um endereço e pronto.

**A configuração é a mesma do `.taskin.json`.** Não há arquivo num celular, mas
o que vai para o `localStorage` é um bloco `mascot` como se escreve no arquivo,
lido pela mesma `resolveMascotNoiseSettings`. Guardar o objeto já resolvido
seria mais simples e criaria uma segunda definição do que é uma reação a ruído.
Do jeito que está, o que se ajusta no celular pode ser colado num projeto, e
vice-versa.

## O que ainda não foi verificado

Nada disto foi testado num aparelho de verdade — só no navegador. Em particular,
**o Safari do iOS já teve histórico de negar câmera e microfone a aplicações
instaladas na tela inicial** rodando em `standalone`; isso precisa ser
confirmado instalado, e não apenas na aba. Ver a task-099.
