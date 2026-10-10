const hypothesisTransform = {
  name: "hypothesis-global",
  stage: "document",

  plugin: (mdast) => {
    // Voorkom dubbele injectie
    const exists = mdast.children.some(
      node => node.type === "anywidget" &&
              node.url === "plugins/hypothesis.mjs"
    );

    if (exists) return;

    mdast.children.push({
      type: "anywidget",
      url: "plugins/hypothesis.mjs",
      data: {}
    });
  }
};

export default {
  name: "hypothesis-global",
  transforms: [hypothesisTransform]
};