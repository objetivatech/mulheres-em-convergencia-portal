import { Node, mergeAttributes } from '@tiptap/core';

export type CalloutVariant = 'info' | 'warning' | 'success' | 'error';

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const CalloutNode = Node.create<CalloutOptions>({
  name: 'callout',
  group: 'block',
  content: 'block+',
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      variant: {
        default: 'info' as CalloutVariant,
        parseHTML: (el) => el.getAttribute('data-variant'),
        renderHTML: ({ variant }) => ({ 'data-variant': variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-callout': '',
        class: `callout callout-${HTMLAttributes['data-variant'] ?? 'info'}`,
      }),
      0,
    ];
  },
});
