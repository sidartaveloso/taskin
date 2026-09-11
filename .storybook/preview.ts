import basePreview from '../packages/design-vue/.storybook/preview';
/*
 * Os tokens do `ui-sense`. Os dois pacotes declaram os mesmos 97 tokens com os
 * mesmos valores, entao carregar as duas folhas nao conflita — mas sem esta as
 * stories do `ui-sense` ficariam dependendo de o `design-vue` ter carregado a
 * sua, que e acoplamento invisivel.
 */
import '../packages/ui-sense/.storybook/preview.css';

/*
 * O preview da raiz reaproveita o do `design-vue`, que e superconjunto do do
 * `ui-sense`: mesmos `controls`, mesmo `layout`, mesmo `a11y.test`, e a ordem do
 * `storySort` dele ja contem a do outro. Manter uma terceira copia aqui daria
 * tres lugares para editar quando a catraca de a11y da task-042 for ligada.
 *
 * O `storySort` e a excecao e precisa ficar **literal aqui dentro**: o
 * Storybook le esse campo por analise estatica do arquivo, antes de executar
 * qualquer coisa. Herdado por spread ele vira `Identifier` para o parser, que
 * avisa "should be defined inline" e ordena a sidebar alfabeticamente — Atoms
 * depois de Templates.
 */
export default {
  ...basePreview,
  parameters: {
    ...basePreview.parameters,
    options: {
      storySort: {
        order: ['Atoms', 'Molecules', 'Organisms', 'Templates', 'Pages', 'Composables'],
      },
    },
  },
};
