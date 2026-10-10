import { randomUUID } from "node:crypto";

const hypothesisTransform = {
  name: "hypothesis-global",
  stage: "document",

  plugin: () => (mdast) => {
    if (!mdast?.children) return;

    // Zoek ook naar widgets binnen geneste nodes
    const hasHypothesis = (node) => {
      if (
        node.type === "anywidget" &&
        node.esm?.includes("hypothesis.mjs")
      ) {
        return true;
      }

      return node.children?.some(hasHypothesis) ?? false;
    };

    // Voorkom dubbele Hypothesis-widgets
    if (hasHypothesis(mdast)) return;

    // Voeg Hypothesis toe aan de pagina
    mdast.children.push({
      type: "anywidget",
      esm: "./plugins/hypothesis.mjs",
      model: {},
      id: randomUUID()
    });
  }
};

export default {
  name: "hypothesis-global",
  transforms: [hypothesisTransform]
};