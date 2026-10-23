// The WebView owns its document and selection. Publish current DOM snapshots,
// never push a delayed React value back into innerHTML while the user types.
export const observeEditorContent = `
  var content = document.querySelector('[contenteditable="true"]');
  if (content && !content.dataset.supplyedInput) {
    content.dataset.supplyedInput = 'true';
    var lastPublished;
    window.supplyedPublishContent = function () {
      var html = content.innerHTML;
      if (html === lastPublished) return;
      lastPublished = html;
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'SUPPLYED_CONTENT',data:html}));
    };
    content.addEventListener('input', window.supplyedPublishContent);
    content.addEventListener('compositionend', window.supplyedPublishContent);
    content.addEventListener('blur', window.supplyedPublishContent);
    new MutationObserver(window.supplyedPublishContent).observe(content, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ['style', 'href', 'face', 'size', 'color']
    });
  }
`;
export const requestCurrentEditorContent = 'window.supplyedPublishContent && window.supplyedPublishContent();';
