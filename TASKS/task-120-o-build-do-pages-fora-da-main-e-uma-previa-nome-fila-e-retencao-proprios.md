# 🧩 Task 120 — O build do Pages fora da main e uma previa: nome, fila e retencao proprios

- Status: in-progress
- Type: chore
- Assignee: sidartaveloso

## Description
O workflow pages-deploy.yml roda em todo push no develop, mas la so monta o site, o Storybook e o mascote e sobe um artefato de previa; publicar e so na main. Tres defeitos: toda execucao no develop se chama Deploy site and components to GitHub Pages, o que engana quem le a lista de runs; o concurrency group pages sem cancelamento e compartilhado com o deploy da main, entao previas atrasam o deploy de verdade e se enfileiram em vez de a mais nova cancelar a anterior; e cada push guarda um artefato com a retencao padrao do repositorio. Corrigir os tres, com a retencao configuravel por variavel do repositorio e padrao de 1 dia (24 horas, o minimo que o GitHub aceita).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
Add any relevant notes or links here.
