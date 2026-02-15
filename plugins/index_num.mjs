/**
 * index-num.mjs
 *
 * A MyST plugin that provides:
 *  - {index-num} directive (records entries, no visible output)
 *  - {show-index-num} directive (renders a *page-local* index)
 *
 * For each index entry, the link text shown is the "nearest heading number above"
 * the index marker, computed from heading order (1.2.3 style).
 *
 * NOTE: This is page-local. Cross-page / project-wide show-index customization
 * isn't currently exposed cleanly to plugins.
 */

function normalizeTerm(s) {
  return (s ?? '').trim();
}

function parseIndexArgs(argOrBody) {
  // Minimal support for common Sphinx-ish patterns:
  //  - "a, b, c"
  //  - "parent; child"
  //  - lines like "single: x", "pair: a; b", etc. (we store as plain terms)
  const raw = (argOrBody ?? '').trim();
  if (!raw) return [];

  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const terms = [];

  for (const line of lines) {
    const m = line.match(/^(single|pair|triple|see|seealso)\s*:\s*(.*)$/i);
    const payload = m ? m[2] : line;

    // Split by comma (multiple entries), keep semicolons inside the term
    payload
      .split(',')
      .map((p) => normalizeTerm(p))
      .filter(Boolean)
      .forEach((t) => terms.push(t));
  }

  // de-dupe but preserve order
  return [...new Set(terms)];
}

function walkInOrder(node, fn) {
  if (!node) return;
  fn(node);
  const children = node.children || [];
  for (const child of children) walkInOrder(child, fn);
}

function headingNumberFromStack(stack) {
  return stack.join('.');
}

export default {
  name: 'Index Numbered (local)',
  directives: [
    {
      name: 'index-num',
      doc: 'Like {index}, but collected for {show-index-num} (page-local).',
      // Accept either argument form: :::{index-num} term :::
      // OR body form with multiple lines like the Sphinx patterns.
      arg: { type: String, doc: 'Index terms, e.g. "force; addition, decomposition".' },
      run(data) {
        // No visible output; we keep the directive node in the AST so the transform can find it.
        // Returning an empty array removes visible content.
        return [];
      },
    },
    {
      name: 'show-index-num',
      doc: 'Show a page-local index; each link text is the nearest heading number above the entry.',
      run() {
        // The transform will replace the directive node; returning [] is fine.
        return [];
      },
    },
  ],

  transforms: [
    {
      name: 'index-num-local-transform',
      doc: 'Collect index-num entries and replace show-index-num with a generated list.',
      stage: 'document',
      plugin: () => (root) => {
        // 1) Walk document in order, compute heading numbers, and collect index entries.
        const headingCounts = []; // per depth counters
        let currentHeadingNumber = ''; // nearest heading above
        const entries = []; // { term, targetId, headingNumber }

        // Generate stable-ish ids for targets
        let idxCounter = 0;

        walkInOrder(root, (node) => {
          if (node.type === 'heading') {
            // MyST heading nodes typically have `depth` and `children`.
            const depth = node.depth ?? 1;

            // ensure headingCounts length == depth
            while (headingCounts.length < depth) headingCounts.push(0);
            while (headingCounts.length > depth) headingCounts.pop();

            // increment this depth, reset deeper handled by pop
            headingCounts[depth - 1] += 1;

            currentHeadingNumber = headingNumberFromStack(headingCounts);
          }

          if (node.type === 'mystDirective' && node.name === 'index-num') {
            idxCounter += 1;
            const targetId = `index-num-${idxCounter}`;

            const terms = parseIndexArgs(node.args || node.value || '');

            // Attach an identifier so links can target it.
            // Many MyST nodes support `identifier`; if not, it's ignored by some renderers.
            node.identifier = targetId;

            for (const term of terms) {
              entries.push({
                term,
                targetId,
                headingNumber: currentHeadingNumber || '',
              });
            }
          }
        });

        // 2) Replace each {show-index-num} directive with a generated list.
        // Sort alphabetically by term (simple, page-local).
        const sorted = [...entries].sort((a, b) => a.term.localeCompare(b.term));

        function makeListNodes() {
          if (!sorted.length) {
            return [{ type: 'paragraph', children: [{ type: 'text', value: 'No index entries on this page.' }] }];
          }

          const items = sorted.map((e) => ({
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [
                  // term text
                  { type: 'strong', children: [{ type: 'text', value: e.term }] },
                  { type: 'text', value: ' — ' },
                  // link where visible text is heading number
                  {
                    type: 'link',
                    url: `#${e.targetId}`,
                    children: [{ type: 'text', value: e.headingNumber || '—' }],
                  },
                ],
              },
            ],
          }));

          return [{ type: 'list', ordered: false, children: items }];
        }

        function replaceShowIndexNum(node) {
          if (!node.children) return;
          node.children = node.children.flatMap((child) => {
            if (child?.type === 'mystDirective' && child.name === 'show-index-num') {
              return makeListNodes();
            }
            // recurse
            replaceShowIndexNum(child);
            return [child];
          });
        }

        replaceShowIndexNum(root);
      },
    },
  ],
};
