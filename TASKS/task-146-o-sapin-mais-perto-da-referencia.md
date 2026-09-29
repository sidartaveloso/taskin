# 🧩 Task 146 — O Sapin mais perto da referencia

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso

## Description
Comparado contra TASKS/assets/sapin/sapin-mascote.png na mesma escala, o Sapin gerado coincide em 90% da silhueta verde (IoU 0,904), mas falta a sombra em meia-lua sob os calombos dos olhos, as pupilas estao centradas em vez de puxadas para o nariz, os bracos sao finos e se abrem demais, as coxas incham para fora embaixo e a canela desce reta, e boca, dedos, canela e sombra no chao tem cores diferentes da referencia. O desenho do Sapin passa a seguir a referencia nesses pontos, sem mudar o do Taskin.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Sombra dos olhos: meia-lua verde-escura sob cada calombo, do lado de fora, caindo sobre o corpo e cortada no contorno dele — a prioridade desta task
- [ ] Olhos: pupilas 3 unidades puxadas para o nariz, esclera levemente oval (14,8 x 15,5) e calombos um pouco maiores no alto; tinta da pupila e da palpebra na cor da referencia
- [ ] Bracos: traco 10 em vez de 8, e a ponta mais perto do corpo, com os mesmos angulos (o rastreio de pose continua valendo)
- [ ] Coxas: a borda de fora recolhe mais cedo ate o tornozelo, e a de dentro desce na diagonal (a canela), em vez da coluna reta; a canela mais escura
- [ ] Cores so do Sapin: boca verde-escura, dedos mais escuros que o corpo e sombra no chao mais clara
- [ ] Testes nos specs de corpo, olhos, boca, bracos e do organismo; o Taskin continua desenhando igual
- [ ] Comparacao de novo contra a referencia, na mesma escala (silhueta, sobreposicao e cores), com o IoU registrado aqui
- [ ] Changeset (patch no `@opentask/taskin-design-vue`)
- [ ] Verificacao: `typecheck`, `lint`, `test` e `build` do design-vue verdes

## Notes
Medidas tiradas da referencia (1280x853) na escala do viewBox 320x260: 0,37 unidade por pixel, com a origem em (207,6; 43,4).
