# 🧩 Task 089 — Teste de links pos-publicacao: nenhuma pagina do site pode responder 4xx

- Status: pending
- Type: test
- Assignee: sidartaveloso
- Priority: 5700

## Description
Duas camadas. Estatica, sobre a arvore montada pelo workflow do Pages antes do deploy: toda ancora interna precisa ou apontar para um arquivo que existe na arvore, ou carregar target, que e o que a faz escapar do roteador do vitepress. Smoke pos-deploy, contra a URL publicada devolvida pelo deploy-pages: percorre os links e confere o status, falhando em 4xx interno e apenas avisando em link externo, para o CI nao ficar refem do uptime de terceiros. A camada estatica e a que teria pego a task-088; um crawler de status HTTP nao teria, porque aquele 404 era desenhado no cliente sobre uma resposta 200.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Camada estatica: percorrer os HTML da arvore montada e exigir de cada ancora interna que o destino exista como arquivo, ou que ela carregue `target`
- [ ] Ligar a camada estatica ao workflow do Pages, logo apos o passo `Assemble the Pages tree` e antes do upload
- [ ] Camada de smoke: percorrer os links contra a URL publicada que o `deploy-pages` devolve
- [ ] Separar severidade: link interno com 4xx falha o job, link externo apenas avisa
- [ ] Testes do proprio verificador, com arvore de mentira — sem rede
- [ ] Documentar no `docs/` o que cada camada cobre e o que ela nao cobre

## Notes

### Por que duas camadas, e nao um crawler so

A pergunta que originou esta task foi se um teste pos-publicacao percorrendo
links e conferindo status resolveria. Resolve uma parte — e **nao** teria pego a
task-088, que e o defeito que motivou a pergunta.

Naquele caso `GET /taskin/components/` respondia `200`. O 404 era desenhado pelo
roteador do vitepress **no cliente**, depois da resposta: ele intercepta o clique
em ancora interna sem `target` e tenta resolver o caminho como rota de markdown.
Um crawler de status teria passado verde.

A camada que pega essa classe e estatica e roda antes de publicar: para cada
ancora interna do HTML construido, ou o destino existe como arquivo na arvore
montada, ou a ancora tem `target`. Sem rede, deterministica, segundos.

A arvore **montada** e o lugar certo: `/components/` nao existe no `dist` do
vitepress — e o Storybook que o workflow copia para dentro da arvore. E por isso
que a configuracao precisa de `ignoreDeadLinks` para o checador nativo.

### O que o smoke pos-deploy acrescenta

O que so existe depois de publicado: `base` errado, asset que nao subiu, a
galeria que nao foi copiada, e os links externos que apodrecem sozinhos. Roda
contra a URL que o `deploy-pages` devolve, nao contra um endereco fixo.

### O que fica de fora

Navegador de verdade clicando e conferindo o que foi renderizado. A camada
estatica cobre a mesma classe de defeito por uma fracao do custo, e ja existe a
task-058 sobre e2e.
