import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Avatar from './Avatar.vue';

describe('Avatar', () => {
  it('should render with name', () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'John Doe',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should display initials from name', () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'John Doe',
      },
    });
    expect(wrapper.text()).toContain('JD');
  });

  it('should render with image when src is provided', () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'John Doe',
        src: 'https://example.com/avatar.jpg',
      },
    });
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/avatar.jpg');
  });

  it('should fall back to initials when the image fails to load', async () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'John Doe',
        src: '/avatar/broken',
      },
    });
    expect(wrapper.find('img').exists()).toBe(true);

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toContain('JD');
  });

  it('should retry the image when src changes after a failure', async () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'John Doe',
        src: '/avatar/broken',
      },
    });
    await wrapper.find('img').trigger('error');
    expect(wrapper.find('img').exists()).toBe(false);

    await wrapper.setProps({ src: '/avatar/working' });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('/avatar/working');
  });
});
