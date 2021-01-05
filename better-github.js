const DEFAULT_FONT_FAMILY = "'SF Mono', 'monospace'";
const DEFAULT_FONT_SIZE   = "14px";

// TODO: Instead of hard coding the `fontFamily` and `fontSize`, we should
// be able to allow the user to choose a font size and font family of their
// choice (which they have installed on their machine).
function applyStyles(fontFamily = DEFAULT_FONT_FAMILY,
                     fontSize   = DEFAULT_FONT_SIZE) {
  const codeTextElements = document.getElementsByClassName("blob-code-inner");
  const codeTextElementsLen = codeTextElements.length;
  const codeLineNumElements = document.getElementsByClassName("blob-num");
  const codeLineNumElementsLen = codeLineNumElements.length;
  const preElements = document.querySelectorAll("pre");
  const preElementsLen = preElements.length;

  for (let i = 0; i < codeTextElementsLen; i++) {
    codeTextElements[i].style.fontFamily = fontFamily;
    codeTextElements[i].style.fontSize = fontSize;
  }

  for (let i = 0; i < codeLineNumElementsLen; i++) {
    codeLineNumElements[i].style.fontFamily = fontFamily;
    codeLineNumElements[i].style.fontSize = fontSize;
  }

  for (let i = 0; i < preElementsLen; i++ ){
    preElements[i].style.fontFamily = fontFamily;
    preElements[i].style.fontSize = fontSize;
  }
}

let oldHref = document.location.href;

window.onload = function() {
  // We apply the styles when we load Github for the first time.
  applyStyles();

  const bodyList = document.querySelector("body");
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href;
        // When the user navigates on Github to other pages after the intial
        // load, we apply the styles again on the new page.
        applyStyles();
      }
    });
  });

  const config = {
    childList: true,
    subtree: true
  }

  observer.observe(bodyList, config);
};
