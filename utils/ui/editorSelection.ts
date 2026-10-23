// This small bridge runs inside the editor's WebView. Screens still use simple props.
export const observeEditorSelection = `
  var content = document.querySelector('[contenteditable="true"]');
  document.addEventListener('selectionchange', function () {
    var selection = window.getSelection();
    if (!content || document.activeElement !== content || !selection || !selection.rangeCount || !content.contains(selection.anchorNode)) return;
    window.supplyedSelection = selection.getRangeAt(0).cloneRange();
    var node = selection.anchorNode;
    if (node.nodeType === 3) node = node.parentElement;
    var style = window.getComputedStyle(node);
    var link = node.closest('a');
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SUPPLYED_SELECTION',
      data: {
        font: document.queryCommandIndeterm('fontName') ? '' : document.queryCommandValue('fontName'),
        size: document.queryCommandIndeterm('fontSize') ? '' : style.fontSize,
        color: document.queryCommandIndeterm('foreColor') ? '' : document.queryCommandValue('foreColor'),
        text: selection.toString(),
        href: link ? link.getAttribute('href') : ''
      }
    }));
  });
`;

export const restoreEditorSelection = `
  if (window.supplyedSelection) {
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(window.supplyedSelection);
  }
`;

export function editorColor(value: string) {
  const rgb = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  return rgb
    ? '#' +
        rgb
          .slice(1)
          .map(channel => Number(channel).toString(16).padStart(2, '0'))
          .join('')
    : value.toLowerCase();
}
