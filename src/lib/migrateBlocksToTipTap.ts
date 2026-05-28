// src/lib/migrateBlocksToTipTap.ts

/**
 * Detects whether a `pages.content` value is already TipTap JSON
 * or legacy PUCK block format, and converts if necessary.
 *
 * TipTap JSON: { type: "doc", content: [...] }
 * PUCK format: { content: [{type: "HeadingBlock", props: {...}}, ...], root: {} }
 */

export type TipTapDoc = {
  type: 'doc';
  content: TipTapNode[];
};

export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
};

type PuckBlock = {
  type: string;
  props: Record<string, unknown>;
};

type PuckData = {
  content: PuckBlock[];
  root?: unknown;
};

/** Returns true when the value is already a TipTap document */
export function isTipTapDoc(value: unknown): value is TipTapDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).type === 'doc'
  );
}

/** Returns true when the value looks like PUCK data */
export function isPuckData(value: unknown): value is PuckData {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>).content)
  );
}

// ---------------------------------------------------------------------------
// Block converters
// ---------------------------------------------------------------------------

function textNode(text: string): TipTapNode {
  return { type: 'text', text };
}

function paragraph(children: TipTapNode[]): TipTapNode {
  return { type: 'paragraph', content: children };
}

function heading(level: number, text: string): TipTapNode {
  return {
    type: 'heading',
    attrs: { level: Math.min(Math.max(level, 1), 6) },
    content: [textNode(text)],
  };
}

function convertHeadingBlock(props: Record<string, unknown>): TipTapNode[] {
  const text = String(props.text ?? '');
  const level = Number(props.level ?? 2);
  return [heading(level, text)];
}

function convertTextBlock(props: Record<string, unknown>): TipTapNode[] {
  // TextBlock stores raw HTML in props.text — strip tags for plain text.
  const raw = String(props.text ?? '');
  const plain = raw.replace(/<[^>]+>/g, '');
  if (!plain.trim()) return [];
  return [paragraph([textNode(plain)])];
}

function convertHeroBlock(props: Record<string, unknown>): TipTapNode[] {
  const nodes: TipTapNode[] = [];
  if (props.title) nodes.push(heading(1, String(props.title)));
  if (props.subtitle) nodes.push(paragraph([textNode(String(props.subtitle))]));
  if (props.buttonText && props.buttonLink) {
    nodes.push(
      paragraph([
        {
          type: 'text',
          text: String(props.buttonText),
          marks: [{ type: 'link', attrs: { href: String(props.buttonLink) } }],
        },
      ])
    );
  }
  return nodes;
}

function convertImageBlock(props: Record<string, unknown>): TipTapNode[] {
  if (!props.src) return [];
  return [
    {
      type: 'image',
      attrs: {
        src: String(props.src),
        alt: String(props.alt ?? ''),
        title: String(props.caption ?? ''),
      },
    },
  ];
}

function convertButtonBlock(props: Record<string, unknown>): TipTapNode[] {
  if (!props.text) return [];
  return [
    paragraph([
      {
        type: 'text',
        text: String(props.text),
        marks: props.link
          ? [{ type: 'link', attrs: { href: String(props.link) } }]
          : [],
      },
    ]),
  ];
}

function convertCardGridBlock(props: Record<string, unknown>): TipTapNode[] {
  const cards = Array.isArray(props.cards) ? props.cards : [];
  const nodes: TipTapNode[] = [];
  for (const card of cards) {
    if (card.title) nodes.push(heading(3, String(card.title)));
    if (card.description) nodes.push(paragraph([textNode(String(card.description))]));
  }
  return nodes;
}

function convertBlock(block: PuckBlock): TipTapNode[] {
  const { type, props } = block;
  switch (type) {
    case 'HeadingBlock':
      return convertHeadingBlock(props);
    case 'TextBlock':
      return convertTextBlock(props);
    case 'HeroBlock':
      return convertHeroBlock(props);
    case 'ImageBlock':
      return convertImageBlock(props);
    case 'ButtonBlock':
      return convertButtonBlock(props);
    case 'CardGridBlock':
      return convertCardGridBlock(props);
    default:
      // Unknown block — preserve text if available, log for diagnosis
      console.warn(`[migrateBlocksToTipTap] Unknown block type: "${type}". Using text fallback.`);
      const fallbackText = props.text ?? props.title ?? `[${type}]`;
      return [paragraph([textNode(String(fallbackText))])];
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Given a value from `pages.content`, returns a TipTap document.
 *
 * - If already TipTap JSON → returned as-is.
 * - If PUCK format → converted to TipTap nodes.
 * - If null/unknown → returns an empty doc.
 */
export function ensureTipTapDoc(content: unknown): TipTapDoc {
  if (isTipTapDoc(content)) return content;

  if (isPuckData(content)) {
    const nodes: TipTapNode[] = content.content.flatMap(convertBlock);
    return {
      type: 'doc',
      content: nodes.length > 0 ? nodes : [paragraph([])],
    };
  }

  // Null, empty, or unrecognised — return an empty document
  return { type: 'doc', content: [paragraph([])] };
}
