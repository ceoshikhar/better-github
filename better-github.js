let oldHref = document.location.href;

window.onload = function() {
  // On the first `onLoad` event we change the styles.
  changeStyles();

  const bodyList = document.querySelector("body");
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href;
        // When the user navigates on Github to other page, we change the styles
        // again otherwise the styles will change only when any page on Github
        // is loaded at first.
        changeStyles();
      }
    });
  });

  const config = {
    childList: true,
    subtree: true
  }

  observer.observe(bodyList, config);
};

function changeStyles() {
  const codeElements = document.getElementsByClassName("blob-code-inner");
  const len = codeElements.length;

  for (let i = 0; i < len; i++) {
    // TODO: Instead of hard coding the `fontFamily` and `fontSize`, we should
    // be able to allow the user to choose a font size and font family of their
    // choice (which they have installed on their machine).
    codeElements[i].style.fontFamily = "'Fira Code', 'monospace'";
    codeElements[i].style.fontSize = "14px";
  }
}
