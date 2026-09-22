import { describe, expect, it } from 'vitest';
import type { MetadataStyle } from './metadata-style.types.js';

const TITLE = '# 🧩 Task 001 — A title, with a colon in it';

const fileWith = (block: string): string => `${TITLE}

${block}

## Description
Body.
`;

/** The same block, written each of the three ways. */
export const BLOCK_FIXTURES = {
  'hard-break': 'Status: pending\\\nType: feat\\\nAssignee: sidarta-veloso',
  list: '- Status: pending\n- Type: feat\n- Assignee: sidarta-veloso',
  plain: 'Status: pending\nType: feat\nAssignee: sidarta-veloso',
  /** What the defective version wrote: the break on the last line too. */
  'hard-break-legacy': 'Status: pending\\\nType: feat\\\nAssignee: sidarta-veloso\\',
} as const;

/**
 * Behaviour every {@link MetadataStyle} must have, run once per implementation.
 *
 * Exported as a function rather than declared as tests so the three styles
 * cannot drift from each other: a style that reads only its own marking, or
 * that leaves marking on the last line, fails here and not in production.
 *
 * @public
 */
export function runMetadataStyleContractTests(style: MetadataStyle): void {
  describe(`MetadataStyle contract — ${style.id}`, () => {
    describe('format', () => {
      it('renders one line per field', () => {
        const lines = style.format([
          { label: 'Status', value: 'pending' },
          { label: 'Type', value: 'feat' },
        ]);
        expect(lines.split('\n')).toHaveLength(2);
      });

      it('leaves no marking dangling on the last line', () => {
        const lines = style.format([
          { label: 'Status', value: 'pending' },
          { label: 'Assignee', value: 'sidarta-veloso' },
        ]);
        expect(lines.split('\n').at(-1)).toMatch(/sidarta-veloso$/);
      });

      it('is recognised as its own style', () => {
        const lines = style.format([
          { label: 'Status', value: 'pending' },
          { label: 'Type', value: 'feat' },
          { label: 'Assignee', value: 'sidarta-veloso' },
        ]);
        expect(style.matches(lines.split('\n'))).toBe(true);
      });
    });

    describe('read', () => {
      it('round-trips what format wrote', () => {
        const content = fileWith(style.format([{ label: 'Assignee', value: 'sidarta-veloso' }]));
        expect(style.read(content, 'Assignee')).toBe('sidarta-veloso');
      });

      it.each(Object.entries(BLOCK_FIXTURES))('reads a block written as %s', (_id, block) => {
        const content = fileWith(block);
        expect(style.read(content, 'Status')).toBe('pending');
        expect(style.read(content, 'Type')).toBe('feat');
        expect(style.read(content, 'Assignee')).toBe('sidarta-veloso');
      });

      it('matches the label case-insensitively', () => {
        const content = fileWith(BLOCK_FIXTURES.list);
        expect(style.read(content, 'status')).toBe('pending');
      });

      it('keeps a localized label readable under its own name', () => {
        const content = fileWith(style.format([{ label: 'Responsável', value: 'sidarta-veloso' }]));
        expect(style.read(content, 'Responsável')).toBe('sidarta-veloso');
        expect(style.read(content, 'Assignee')).toBeUndefined();
      });

      it('returns undefined for a field that is not there', () => {
        expect(style.read(fileWith(BLOCK_FIXTURES.list), 'Priority')).toBeUndefined();
      });

      it('ignores a fenced example in the body', () => {
        const content = `${TITLE}

${BLOCK_FIXTURES.list}

## Description

\`\`\`markdown
Status: done
\`\`\`
`;
        expect(style.read(content, 'Status')).toBe('pending');
      });

      it('reads a value containing a colon', () => {
        const content = fileWith(style.format([{ label: 'GroupName', value: 'Release: 4.0' }]));
        expect(style.read(content, 'GroupName')).toBe('Release: 4.0');
      });
    });

    describe('write', () => {
      it.each(Object.entries(BLOCK_FIXTURES))('updates a field in a %s block', (_id, block) => {
        const updated = style.write(fileWith(block), 'Status', 'in-progress');
        expect(style.read(updated, 'Status')).toBe('in-progress');
        expect(style.read(updated, 'Assignee')).toBe('sidarta-veloso');
      });

      it.each(Object.entries(BLOCK_FIXTURES))('normalizes a %s block into this style', (_id, block) => {
        const updated = style.write(fileWith(block), 'Status', 'done');
        const lines = updated.split('\n').filter((line) => /^(?:-\s+)?(?:Status|Type|Assignee):/.test(line));
        expect(style.matches(lines)).toBe(true);
      });

      it('appends a field the file did not have', () => {
        const updated = style.write(fileWith(BLOCK_FIXTURES.list), 'Priority', '3');
        expect(style.read(updated, 'Priority')).toBe('3');
        expect(style.read(updated, 'Status')).toBe('pending');
      });

      it('removes a field when the value is undefined', () => {
        const updated = style.write(fileWith(BLOCK_FIXTURES.list), 'Type', undefined);
        expect(style.read(updated, 'Type')).toBeUndefined();
        expect(style.read(updated, 'Status')).toBe('pending');
        expect(updated).not.toContain('Type:');
      });

      it('leaves the file alone when removing a field it does not have', () => {
        const content = fileWith(BLOCK_FIXTURES.list);
        expect(style.write(content, 'Priority', undefined)).toBe(content);
      });

      it('creates the block when the file has none', () => {
        const content = `${TITLE}\n\n## Description\nBody.\n`;
        const updated = style.write(content, 'Status', 'pending');
        expect(style.read(updated, 'Status')).toBe('pending');
        expect(updated.startsWith(TITLE)).toBe(true);
      });

      it('does not touch the body', () => {
        const updated = style.write(fileWith(BLOCK_FIXTURES.list), 'Status', 'done');
        expect(updated).toContain('## Description\nBody.');
      });

      it('preserves the label spelling already in the file', () => {
        const content = fileWith('- Responsável: sidarta-veloso');
        const updated = style.write(content, 'responsável', 'ana');
        expect(updated).toContain('Responsável');
        expect(style.read(updated, 'Responsável')).toBe('ana');
      });
    });
  });
}
