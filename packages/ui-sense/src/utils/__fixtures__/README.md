# Tabelas de casos compartilhadas

Os arquivos `*.cases.json` desta pasta são **contrato** entre a implementação
TypeScript e o porte em Kotlin do app do relógio (`packages/mascote-wear`). Os
dois lados rodam os mesmos casos: o teste TypeScript ao lado do código e o teste
do módulo `core` do app do relógio, que lê estes arquivos pela raiz do
repositório.

Mudar um caso — ou o comportamento que ele descreve — exige mudar as duas
implementações no mesmo commit. Caso novo entra aqui, e não só num dos lados:
um caso que só um lado conhece é exatamente a divergência silenciosa que estas
tabelas existem para impedir.
