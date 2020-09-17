function mountReplace(Component, options) {
  const { target, props, ...rest } = options;

  const frag = document.createDocumentFragment();
  const component = new Component({ target: frag, props, ...rest });

  target.parentNode.replaceChild(frag, target);

  return component;
}

export default mountReplace;
