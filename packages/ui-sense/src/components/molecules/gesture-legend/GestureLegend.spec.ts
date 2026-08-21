import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { GestureMapping } from '../../../composables/use-gesture-shortcuts/use-gesture-shortcuts.types';
import GestureLegend from './GestureLegend.vue';

const mappings: GestureMapping[] = [
  { gesture: 'Pointing_Up', action: 'moveUp' },
  { gesture: 'None', action: 'moveUp' },
  { gesture: 'Thumb_Down', action: 'none' },
  { gesture: 'Victory', action: 'groupWith' },
];

describe('GestureLegend', () => {
  it('renders a chip for each visible mapping', () => {
    const wrapper = mount(GestureLegend, { props: { mappings } });
    expect(wrapper.findAll('.gesture-legend__chip')).toHaveLength(2);
  });

  it('filters out None gestures and none actions', () => {
    const wrapper = mount(GestureLegend, { props: { mappings } });
    expect(wrapper.text()).toContain('Mover para cima');
    expect(wrapper.text()).toContain('Agrupar');
    expect(wrapper.findAll('.gesture-legend__label')).toHaveLength(2);
  });

  it('applies the compact class when compact is set', () => {
    const wrapper = mount(GestureLegend, { props: { mappings, compact: true } });
    expect(wrapper.find('.gesture-legend').classes()).toContain('gesture-legend--compact');
  });

  it('renders gesture icons inside chips', () => {
    const wrapper = mount(GestureLegend, { props: { mappings } });
    expect(wrapper.findAll('.gesture-icon')).toHaveLength(2);
  });
});
