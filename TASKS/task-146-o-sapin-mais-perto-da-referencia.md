# 🧩 Task 146 — O Sapin mais perto da referencia

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso

## Description
Comparado contra TASKS/assets/sapin/sapin-mascote.png na mesma escala, o Sapin gerado coincide em 90% da silhueta verde (IoU 0,904), mas falta a sombra em meia-lua sob os calombos dos olhos, as pupilas estao centradas em vez de puxadas para o nariz, os bracos sao finos e se abrem demais, as coxas incham para fora embaixo e a canela desce reta, e boca, dedos, canela e sombra no chao tem cores diferentes da referencia. O desenho do Sapin passa a seguir a referencia nesses pontos, sem mudar o do Taskin.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Sombra dos olhos: cada calombo projeta no corpo uma meia-lua preta a 20% (`#body-eye-shadows`), um circulo do tamanho do calombo deslocado para baixo e para fora (3 para o lado, 0,6 para baixo), que o calombo cobre por cima. Um `clipPath` com o contorno do corpo corta o que cairia fora dele; o id vem do `useId`, entao dois mascotes no mesmo app nao pegam o recorte um do outro. Na referencia a sombra e 20% mais escura que o corpo (`#359633` sobre `#48B540`) e vai das 7h30 as 6h30 de cada calombo — igual agora. Testes em `TaskinBody.spec.ts`: a meia-lua entre o corpo e o calombo, para baixo e para fora, cortada pelo contorno do corpo, e um recorte por mascote
- [x] Corpo: a referencia e 2 a 3 unidades mais larga logo abaixo dos calombos e igual a elipse da cintura para baixo — e por isso que a sombra dos olhos nasce mais para fora. O `#body-main` do Sapin vira um contorno: metade de cima de superelipse (controle 0,64), metade de baixo eliptica
- [x] Olhos: `EYE_GEOMETRY` ganha `pupilRest` (onde a pupila descansa antes de olhar para algum lado) e `ink`. No Sapin, pupilas 3 unidades puxadas para o nariz, esclera 14,8 x 15,5, tinta `#213037` na pupila e na palpebra; calombos com raio 23,5. O rastreio e a direcao do olhar partem de onde a pupila descansa. No Taskin, tudo como estava. Testes em `TaskinEyes.spec.ts`
- [x] Bracos: `ARM_GEOMETRY` ganha a espessura e a pose de descanso de cada bicho. O Sapin tem traco 11 e descansa em (32°, 72°), com braco 29,7 e antebraco 33,4 — a ponta desce ate (54,5; 160,5), como na referencia. So o descanso muda: o rastreio de pose passa posicoes explicitas, que valem igual nos dois. O Taskin segue com 8 e (35°, 65°). Testes em `TaskinArms.spec.ts`
- [x] Coxas e pes: a coxa recolhe ate o tornozelo e a borda de dentro, a canela, desce na diagonal de x=130 a 136 (antes, uma coluna reta), com a canela a 20% de preto. O pe abre de uma base em tres dedos grossos (traco 7), com as pontas (raio 5,2) um tom mais escuras. Contornos a ate 3 px da referencia, linha a linha. Teste em `TaskinBody.spec.ts`
- [x] Cores so do Sapin: boca `#134635` (`MOUTH_INK` em `TaskinMouth.types.ts`, tambem no ofegante e na lingua), sombra no chao `#E4E9ED`. Testes em `TaskinMouth.spec.ts` e `Taskin.spec.ts`, que prendem tambem as cores do Taskin
- [x] Comparacao contra a referencia, na mesma escala, com o SVG extraido do componente no Storybook: a silhueta verde coincide em IoU 0,962 (antes 0,904); pupila, boca e sombra no chao com a cor exata da referencia; corpo, barriga e sombra dos olhos a poucos tons
- [x] Changeset `.changeset/sapin-mais-perto-da-referencia.md` (patch no `@opentask/taskin-design-vue`)
- [x] Verificacao: `typecheck`, `lint` e `build` do design-vue verdes; specs 413/413 e stories como testes 282/282 no Chromium; `turbo run typecheck --filter=...@opentask/taskin-design-vue` com 18/18; testes do `@opentask/taskin-mascote` 21/21
- [ ] ... — adiado: a pupila da referencia e um pouco mais alta que larga (5,7 x 6,5); a do Sapin segue redonda (raio 6), porque trocar o `<circle>` por `<ellipse>` mudaria o DOM do Taskin, que os testes e o rastreio usam

## Notes
Medidas tiradas da referencia (1280x853) na escala do viewBox 320x260: 0,37 unidade por pixel, com a origem em (207,6; 43,4).
