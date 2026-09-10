import { defineMetadataStyle } from './metadata-style.base.js';
import type { MetadataStyle } from './metadata-style.types.js';

/**
 * No marking at all.
 *
 * CommonMark collapses the block into a single paragraph, so this style is for
 * files that are only ever read raw. It is offered because that is a real
 * preference, not because it is what you get by forgetting the marking — and
 * it is the fallback when a block matches neither of the other two.
 *
 * @public
 */
export const plainMetadataStyle: MetadataStyle = defineMetadataStyle({
  id: 'plain',

  matches: () => true,

  formatLines: (fields) => fields.map((field) => `${field.label}: ${field.value}`),
});
