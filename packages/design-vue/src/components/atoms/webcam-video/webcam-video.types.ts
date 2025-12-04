export interface WebcamVideoProps {
  /**
   * Show or hide the webcam feed
   */
  visible?: boolean;

  /**
   * Width of the webcam feed
   */
  width?: number;

  /**
   * Height of the webcam feed
   */
  height?: number;

  /**
   * Mirror the video (horizontal flip)
   */
  mirrored?: boolean;
}
