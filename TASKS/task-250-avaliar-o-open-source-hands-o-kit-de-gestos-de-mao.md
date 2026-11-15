# 🧩 Task 250 — Avaliar o open-source-hands: o kit de gestos de mão serve para alguma coisa nossa?

- Status: pending
- Type: docs
- Assignee: sidartaveloso
- Difficulty: 2

## Description
O `open-source-hands` (https://github.com/abouchedidxcode/open-source-hands, MIT, TypeScript, criado em 03/11/2026) é um kit para fazer jogos de navegador jogados com as mãos pela webcam. Ele traz:

- `src/kit/` — o *hand-gesture-kit*: ~1.600 linhas de TypeScript sem dependências sobre o MediaPipe Hand Landmarker (21 pontos por mão). Entrega 20 poses (punho, apontar, pinça, joia…), 16 movimentos (deslizes, círculos, empurrar/puxar, aceno, torção, arremesso), 5 gestos de duas mãos (palma, zoom, volante) e valores contínuos (força da pinça, posição da palma, rotação, abertura, velocidade). Tem suavização One Euro, histerese contra tremulação e **mãos sintéticas**, que permitem testar sem webcam.
- `templates/game/` — um jogo inicial completo em three.js, com permissão de câmera, alternativa por mouse e toque, um robô que joga pelo próprio motor de gestos, testes e ferramentas de captura de tela, taxa de quadros e volume.
- `docs/MAKING-A-GAME.md` — o manual escrito a partir de 17 jogos.
- `skills/hand-gestures/SKILL.md` — uma skill de Claude Code.
- Laboratório de gestos ao vivo: https://abouchedidxcode.github.io/open-source-hands/lab.html

O repositório é escrito para ser lido por agentes: `AGENTS.md` é a porta de entrada. Tudo roda no navegador e o vídeo não sai do aparelho.

O fork já está feito em `sidartaveloso/open-source-hands`; falta clonar.

A pergunta desta task: **o que esse kit é de verdade, o que custa usá-lo, e ele abre alguma porta para o que a gente já faz?** A avaliação termina numa recomendação escrita; a decisão de adotar, arquivar ou tirar ideias é do usuário.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Clonar o fork `sidartaveloso/open-source-hands` ao lado dos outros repositórios e deixar anotado o comando que instala e roda (o README e o `AGENTS.md` dizem como)
- [ ] Rodar o que o repositório oferece sem webcam: os testes do kit e as mãos sintéticas. Anotar o que passou, o que quebrou e quanto demorou
- [ ] Abrir o laboratório de gestos e o jogo de exemplo e descrever, com evidência visual, quais gestos funcionam bem e quais tremem — este item só fecha com captura de tela
- [ ] Ler `src/kit/` com olho de módulo profundo (ver `padroes/estrutura-de-modulos.md`): qual é a interface que ele expõe, o que ela esconde, e dá para usar só o motor de gestos sem o three.js e sem o jogo inicial
- [ ] Levantar o custo de uso: tamanho do que vai para o navegador (kit + MediaPipe), navegadores e aparelhos que atende, se precisa de https, e o que acontece quando não há câmera ou a pessoa nega a permissão
- [ ] Levantar o risco de depender dele: idade do repositório (dias), um mantenedor só, licença MIT, e o que muda se ele parar — o kit é copiável ou é dependência?
- [ ] Responder onde isso tocaria o que já temos, com um parágrafo por frente e um "não serve" explícito onde não servir: o mascote do Taskin, o `taskinboard`, as superfícies de entrada do Taskin (hoje terminal, voz na Alexa, pulso), e qualquer projeto irmão
- [ ] Escrever a avaliação em `docs/avaliacoes/open-source-hands.md` (pasta nova, no espírito de `docs/RDT/`): o que é, o que custa, o risco, onde tocaria, e **uma** recomendação entre adotar, só tirar ideias, ou arquivar
- [ ] Levar a recomendação ao usuário e registrar as tasks que saírem dela, se saírem

## Notes
Avaliação, não adoção: nenhuma linha de código nossa muda nesta task além do documento em `docs/avaliacoes/`.

Material de leitura, nesta ordem: `AGENTS.md`, `docs/MAKING-A-GAME.md`, `src/kit/`, `templates/game/`.

### Onde executar
A leitura, a execução dos testes e a escrita da avaliação podem rodar sozinhas. A recomendação final o usuário decide em conversa.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo, captura de tela).
