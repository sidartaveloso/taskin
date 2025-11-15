import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Avatar from './Avatar.vue'

describe('Avatar', () => {
  it('should render with name', () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'John Doe',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display initials from name', () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'John Doe',
      },
    })
    expect(wrapper.text()).toContain('JD')
  })

  it('should render with image when src is provided', () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'John Doe',
        src: 'https://example.com/avatar.jpg',
      },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/avatar.jpg')
  })
})
