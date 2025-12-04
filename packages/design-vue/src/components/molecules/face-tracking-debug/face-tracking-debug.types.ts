export interface FaceTrackingDebugProps {
  /**
   * Debug data to display
   */
  data?: Record<string, unknown> | null;

  /**
   * Title of the debug panel
   */
  title?: string;

  /**
   * Position of the debug panel
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
