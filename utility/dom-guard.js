// A browser translator (Chrome's, Edge's) swaps the page's text nodes for <font> elements of its own. React still
// holds the old nodes, so its next removeChild or insertBefore names a node that is no longer where React left it,
// the browser throws, and the whole page falls to the error screen. Here the two calls put up with a moved node
// instead: the page keeps working, at worst with a leftover translated word. https://github.com/facebook/react/issues/11538
const guardTranslatedDom = () => {
  if (typeof Node !== 'function' || !Node.prototype || Node.prototype.__translateGuard) return;
  const removeChild = Node.prototype.removeChild;
  const insertBefore = Node.prototype.insertBefore;

  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) return child;
    return removeChild.call(this, child);
  };
  // The node it was to go before has moved: the end of the parent keeps the new content on the page
  Node.prototype.insertBefore = function (node, before) {
    return insertBefore.call(this, node, before && before.parentNode !== this ? null : before);
  };
  Node.prototype.__translateGuard = true;
};

guardTranslatedDom();
