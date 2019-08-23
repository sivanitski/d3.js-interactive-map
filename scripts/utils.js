function patternify(params) {
  var container = params.container;
  var selector = params.selector;
  var elementTag = params.tag;
  var data = params.data || [ selector ];

  // Pattern in action
  var selection = container.selectAll('.' + selector).data(data, (d, i) => {
    if (typeof d === 'object') {
      if (d.id) {
        return d.id;
      }
    }
    return i;
  });
  selection.exit().remove();
  selection = selection.enter().append(elementTag).merge(selection);
  selection.attr('class', selector);
  return selection;
}