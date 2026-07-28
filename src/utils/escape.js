export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function paragraphs(text) {
  return String(text || '')
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${esc(p.trim())}</p>`)
    .join('');
}

/** Word spans with shared index counter */
export function inlineWords(text, startIndex = 0) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  let i = startIndex;
  const html = words
    .map((word) => `<span class="word text-hover" style="--wi:${i++}">${esc(word)}</span>`)
    .join(' ');
  return { html, nextIndex: i };
}

/** Split prose into word spans for staggered reveal */
export function paragraphsAnimated(text) {
  let wordIndex = 0;
  return String(text || '')
    .trim()
    .split(/\n\s*\n/)
    .map((para) => {
      const { html, nextIndex } = inlineWords(para, wordIndex);
      wordIndex = nextIndex;
      return `<p class="prose-line text-anim text-anim--rise">${html}</p>`;
    })
    .join('');
}

/** Single animated line (beats, contact, hero) */
export function lineAnimated(text, variant = 'rise', startIndex = 0) {
  const { html, nextIndex } = inlineWords(text, startIndex);
  return {
    html: `<p class="text-anim text-anim--${variant}">${html}</p>`,
    nextIndex,
  };
}

/** Animated heading words */
export function titleAnimated(text, startIndex = 0) {
  const { html, nextIndex } = inlineWords(text, startIndex);
  return { html: `<span class="title-words text-anim text-anim--slide">${html}</span>`, nextIndex };
}
