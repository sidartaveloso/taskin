# 🧩 Task 091 — Os humores do Taskin no topo da landing, para a pagina ter vida

- Status: done
- Type: feat
- Assignee: Sidarta Veloso

## Description
A landing tem um mascote so, no hero. Colocar no topo, logo abaixo do hero, a fileira com todos os humores do Taskin, que hoje so aparece na galeria de componentes. Vale para os dois idiomas e deve sair do slot home-hero-after do layout, nao de cada index.md. A lista de humores tem que vir do design system em tempo de execucao, nunca copiada a mao.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Componente `MuralDeHumores.vue` no tema do site, lendo `TASKIN_MOODS` em tempo de execucao
- [x] Encaixar no slot `home-hero-after` do layout, para os dois idiomas de uma vez
- [x] `idleAnimation` ligado, rastreamento de olhar de fora — dezessete instancias ouvindo o mouse e caro
- [x] Responsivo: a fileira quebra em varias linhas e encolhe o espacamento no celular
- [x] Respeitar `prefers-reduced-motion` no efeito de hover
- [x] Verificar no navegador, contra o site servido: dezessete mascotes, 145px de altura

## Notes

### Onde ficou, e por que

No slot `home-hero-after` do layout, entre o hero e os cartoes de recurso. E o
topo da pagina, e e onde a fileira tem espaco para respirar sem empurrar o
conteudo. O slot so existe em paginas `layout: home`, que sao exatamente os dois
`index.md` — entao portugues e ingles ganharam o mural sem que nenhum dos dois
arquivos precise saber que ele existe.

### A lista vem do design system

`TASKIN_MOODS`, exportado pelo `@opentask/taskin-design-vue` (task-090). Um humor
novo no mascote aparece na landing sozinho; ninguem precisa lembrar de vir editar
este arquivo.

### As escolhas de animacao

`idleAnimation` ligado e o que da vida: cada mascote pisca ou mexe os tentaculos
num intervalo proprio de 3,5s, entao a fileira nunca esta parada nem em
sincronia. Rastreamento de olhar ficou de fora de proposito — dezessete
instancias ouvindo o mouse e caro, e o hero ja tem um mascote que segue o cursor.

### Evidencia

Verificado no navegador contra o site servido em `localhost:6100`: `.mural` com
17 filhos e 145px de altura, quebrando em duas linhas na janela estreita.
