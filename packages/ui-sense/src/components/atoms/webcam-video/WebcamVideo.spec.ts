import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import WebcamVideo from './WebcamVideo.vue';

describe('WebcamVideo', () => {
  it('renders a video element with the webcam-video class', () => {
    const wrapper = mount(WebcamVideo);
    expect(wrapper.find('video.webcam-video').exists()).toBe(true);
  });

  it('is hidden by default and visible when the visible prop is set', async () => {
    const hidden = mount(WebcamVideo);
    expect(hidden.find('video').classes()).not.toContain('visible');

    const visible = mount(WebcamVideo, { props: { visible: true } });
    expect(visible.find('video').classes()).toContain('visible');
  });

  it('mirrors the video horizontally when mirrored is true', () => {
    const wrapper = mount(WebcamVideo, { props: { mirrored: true } });
    expect(wrapper.find('video').classes()).toContain('mirrored');
  });

  it('applies width and height as inline styles', () => {
    const wrapper = mount(WebcamVideo, { props: { width: 640, height: 480 } });
    const style = wrapper.find('video').attributes('style');
    expect(style).toContain('width: 640px');
    expect(style).toContain('height: 480px');
  });

  it('exposes the video element ref', () => {
    const wrapper = mount(WebcamVideo);
    const vm = wrapper.vm as unknown as { videoElement: unknown };
    expect(vm.videoElement).toBeDefined();
  });
});
