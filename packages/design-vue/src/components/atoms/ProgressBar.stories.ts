import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import ProgressBar from './ProgressBar.vue';

const meta: Meta<typeof ProgressBar> = {
  title: 'Atoms/Base/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs', 'design-vue'],
  parameters: {
    // O `layout: 'centered'` global (preview.ts) poe o body em flex centrado,
    // e o `#storybook-root` passa a ter largura de conteudo. Como a barra e
    // `width: 100%`, ela resolvia 100% de um pai que se dimensiona pelo
    // conteudo dela: colapsava para a largura do rotulo (26px com "65%") e
    // para ZERO em `showLabel: false`. `padded` devolve um container em bloco.
    layout: 'padded',
  },
  argTypes: {
    percentage: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Primary: Story = {
  args: {
    percentage: 65,
    variant: 'primary',
    showLabel: true,
  },
};

export const Success: Story = {
  args: {
    percentage: 100,
    variant: 'success',
    showLabel: true,
  },
};

export const Warning: Story = {
  args: {
    percentage: 75,
    variant: 'warning',
    showLabel: true,
  },
};

export const Danger: Story = {
  args: {
    percentage: 25,
    variant: 'danger',
    showLabel: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    percentage: 50,
    variant: 'primary',
    showLabel: false,
  },
};

export const ReactsToPropChange: Story = {
  name: 'Reage a mudanca da prop (pai)',
  parameters: {
    docs: {
      description: {
        story:
          '`percentage` e prop: quem muda e o pai. Esta story mantem o valor num `ref` do ' +
          'wrapper e troca por botao, para verificar que a barra reflete o valor novo — ' +
          'inclusive nos extremos, que o componente precisa clampar.',
      },
    },
  },
  render: () => ({
    components: { ProgressBar },
    setup() {
      const percentage = ref(25);
      const setPercentage = (value: number) => {
        percentage.value = value;
      };
      return { percentage, setPercentage };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <ProgressBar :percentage="percentage" variant="primary" />

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" data-testid="set-25" @click="setPercentage(25)">25%</button>
          <button type="button" data-testid="set-80" @click="setPercentage(80)">80%</button>
          <button type="button" data-testid="set-above" @click="setPercentage(150)">150%</button>
          <button type="button" data-testid="set-below" @click="setPercentage(-20)">-20%</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /**
     * Confere tudo que depende do percentual: a largura do preenchimento, o
     * texto de cada copia do rotulo, e o recorte da copia que fica sobre o
     * fill. O rotulo mora na trilha, em duas copias de cores diferentes, e cada
     * uma existe apenas se o seu lado existe.
     */
    const expectRendered = async (percentage: number) => {
      await waitFor(() => {
        const fill = canvasElement.querySelector<HTMLElement>('.progress-bar__fill');
        const labels = [...canvasElement.querySelectorAll('.progress-bar__label')];
        const onFill = canvasElement.querySelector<HTMLElement>('.progress-bar__label--on-fill');

        expect(fill?.style.width).toBe(`${percentage}%`);

        expect(labels.length).toBeGreaterThan(0);
        for (const label of labels) {
          expect(label.textContent?.trim()).toBe(`${percentage}%`);
        }

        // Em 0% nao ha nada sobre o fill; em 100% nao ha trilha livre
        expect(!!onFill).toBe(percentage > 0);
        expect(labels).toHaveLength(percentage > 0 && percentage < 100 ? 2 : 1);

        if (onFill) {
          expect(onFill.parentElement?.getAttribute('style')).toContain(`${100 - percentage}%`);
        }
      });
    };

    await expectRendered(25);

    // Sobe: a prop mudou no pai, a barra tem que acompanhar
    await fireEvent.click(canvas.getByTestId('set-80'));
    await expectRendered(80);

    // Desce de novo, para nao passar por acidente com um valor so crescente
    await fireEvent.click(canvas.getByTestId('set-25'));
    await expectRendered(25);

    // Acima de 100 e abaixo de 0 sao clampados, e o clamp tambem tem que
    // recalcular a cada mudanca
    await fireEvent.click(canvas.getByTestId('set-above'));
    await expectRendered(100);

    await fireEvent.click(canvas.getByTestId('set-below'));
    await expectRendered(0);

    // Volta ao valor inicial: sem isso a story fica parada em 0% depois do
    // play, e quem abre no Storybook ve uma barra vazia achando que quebrou
    await fireEvent.click(canvas.getByTestId('set-25'));
    await expectRendered(25);
  },
};

export const AllVariants: Story = {
  render: () => ({
    components: { ProgressBar },
    setup() {
      // Uma fonte so para o rotulo e para a prop: antes o texto "Primary (65%)"
      // era escrito a mao ao lado de `:percentage="65"`, e os dois podiam
      // divergir na proxima edicao.
      const cases = [
        { variant: 'primary', percentage: 0 },
        { variant: 'primary', percentage: 65 },
        { variant: 'success', percentage: 100 },
        { variant: 'warning', percentage: 75 },
        { variant: 'danger', percentage: 25 },
      ] as const;

      const titleCase = (value: string) => value[0]?.toUpperCase() + value.slice(1);

      return { cases, titleCase };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div v-for="item in cases" :key="item.variant + item.percentage">
          <p style="margin-bottom: 0.5rem; font-weight: 600;">
            {{ titleCase(item.variant) }} ({{ item.percentage }}%)
          </p>
          <ProgressBar :percentage="item.percentage" :variant="item.variant" />
        </div>
      </div>
    `,
  }),
};
