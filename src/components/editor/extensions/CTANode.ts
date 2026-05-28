import { Node, mergeAttributes } from '@tiptap/core';

export interface CTAOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const CTANode = Node.create<CTAOptions>({
  name: 'cta',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      title: { default: 'Título do CTA' },
      description: { default: '' },
      buttonText: { default: 'Saiba mais' },
      buttonHref: { default: '#' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-cta]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { title, description, buttonText, buttonHref, ...rest } = HTMLAttributes;
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, rest, { 'data-cta': '' }),
      ['h3', {}, title ?? ''],
      ['p', {}, description ?? ''],
      ['a', { href: buttonHref ?? '#' }, buttonText ?? ''],
    ];
  },
});
