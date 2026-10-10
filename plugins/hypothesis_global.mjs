const hypothesisTransform = {
  name: "hypothesis-global",
  stage: "document",

  plugin: (_, utils) => (mdast) => {
    if (!mdast?.children) return;

    // Voorkom dubbele widgets
    const exists = mdast.children.some(
      (node) => node.type === "anywidget"
    );

    if (exists) return;

    mdast.children.push({
      type: "anywidget",
      url: "https://cdn.jsdelivr.net/gh/FreekPols/JBtest@main/plugins/hypothesis.mjs",
      data: {}
    });
  }
};

export default {
  name: "hypothesis-global",
  transforms: [hypothesisTransform]
};