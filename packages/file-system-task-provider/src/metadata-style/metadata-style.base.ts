import { readMetadataBlock, removeMetadataBlock, replaceMetadataBlock, sameLabel } from './metadata-block.js';
import type { MetadataField, MetadataStyle, MetadataStyleId } from './metadata-style.types.js';

/**
 * What actually distinguishes the three styles: how a list of fields becomes a
 * list of lines, and how a block written in this style is recognised.
 */
interface MetadataStyleDefinition {
  readonly id: MetadataStyleId;
  matches(blockLines: readonly string[]): boolean;
  formatLines(fields: readonly MetadataField[]): string[];
}

/**
 * Builds a {@link MetadataStyle} from the two operations that differ between
 * styles.
 *
 * `read` and `write` are shared and identical for all three: reading is
 * tolerant by construction (the block parser strips every marking) and writing
 * always re-emits the whole block, which is what guarantees a file never ends
 * up half in one style and half in another.
 */
export function defineMetadataStyle(definition: MetadataStyleDefinition): MetadataStyle {
  const format = (fields: readonly MetadataField[]): string => definition.formatLines(fields).join('\n');

  return {
    id: definition.id,
    matches: definition.matches,
    format,

    read(content, label) {
      const block = readMetadataBlock(content);
      return block?.fields.find((field) => sameLabel(field.label, label))?.value;
    },

    write(content, label, value) {
      const block = readMetadataBlock(content);
      const fields: MetadataField[] = [...(block?.fields ?? [])];
      const index = fields.findIndex((field) => sameLabel(field.label, label));

      if (value === undefined) {
        if (index === -1) return content;
        fields.splice(index, 1);
        // Um bloco vazio nao e um bloco em branco: some junto com a linha.
        return fields.length === 0
          ? removeMetadataBlock(content)
          : replaceMetadataBlock(content, format(fields).split('\n'));
      }

      if (index === -1) {
        fields.push({ label, value });
      } else {
        // Reescreve no lugar, preservando o rotulo como esta no arquivo — um
        // arquivo em pt-BR nao vira `Assignee` por ter sido editado.
        fields[index] = { label: fields[index]?.label ?? label, value };
      }

      return replaceMetadataBlock(content, format(fields).split('\n'));
    },
  };
}
