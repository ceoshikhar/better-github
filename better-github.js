// Store the current set font styles to this object so that we don't have to
// fetch them from chrome storage API again and again.
// This improves the performance as we don't do the async chrome storage API 
// read calls every time `applyCurrentSetStyles` is called.
const cache = {
  fontName: null,
  fontSize: null
};

// Do the magic once the DOM is completely loaded.
window.onload = init();

// Entry point of the extension to interact with the DOM on GitHub.
function init() {
  // Apply font styles when DOM tree is completely loaded.
  applyCurrentSetStyles();

  // Apply font styles when DOM tree is mutated.
  reApplyStylesOnDOMChange();
}

// Apply the currently set font styles if they exist
async function applyCurrentSetStyles() {
  const currentSetFontStyles = await getCurrentSetFontStyles();
  if (!currentSetFontStyles) return;

  const { fontFamily, fontSize } = currentSetFontStyles;
  applyStyles(fontFamily, fontSize);
}

// Apply the custom styles whenever something on the DOM changes. Following are
// some scenarios why this is important.
//
// 1. With larger PRs, sometimes diffs are loaded lazily. Which means, a DOM 
// mutation is happening. If we don't re-apply the styles, the newly loaded
// code text in the diff will have the defaul styles.
//
// 2. GitHub is an SPA. Which means, DOM is loaded only once. When you navigate
// to other "pages" on GitHub, the DOM is changing( mutation ) and if we don't 
// re-apply the styles, the code text on new page will have default styles.
//
// We don't care to check what the change is happening on the DOM, we just
// re-apply the styles no matter what's happening. This shouldn't be affecting
// the performance as all we are doing is changing the CSS styles, also there
// are not so many DOM changes happening once the entire page content is loaded.
function reApplyStylesOnDOMChange() {
  // We pass `applyCurrentSetStyles` as the callback to `Mutation Observer`.
  // This means, whenever a DOM mutation is observed it fires the callback.
  const observer = new MutationObserver(applyCurrentSetStyles);

  observer.observe(document, { childList: true, subtree: true });
}

// Reset the font styles to Github's default.
function resetStyles() {
  // These styles were taken from Google Chrome's(Windows) inspect element tool
  // on 24/3/2021. These default styles might change but it's not really that
  // important otherwise it would defeat the whole purpose of `Better Github`.
  const githubDefaultFontFamily = "SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace";
  const githubDefaultFontSize   = "12px";

  // Clear the storage so that when we reload/refresh or visit GitHub in another
  // tab, we don't apply any custom styles including the above two mentioned.
  // The real(coming from GitHub) GitHub's default styles are used.
  clearStorage();
  // Although we do apply the GitHub's "default styles" so that we don't have to
  // manually refresh the current open tabs and this makes it feel "reactive".
  applyStyles(githubDefaultFontFamily, githubDefaultFontSize);
}

// This is where the magic happens. As the name suggests, the function is 
// responsible for applying the font styles to the code text elements on a page.
//
// Apply font styles (font-name & font-size).
// These styles are applied to :
// - All the text inside a file while viewing( reading ) it.
// - Code in README files that are inside "`<code>`" blocks also known as `<pre>` tags.
// - Code in pull request diffs.
function applyStyles(fontFamily, fontSize) {
  const codeTextElements        = document.getElementsByClassName("blob-code-inner");
  const codeTextElementsLen     = codeTextElements.length;
  const codeLineNumElements     = document.getElementsByClassName("blob-num");
  const codeLineNumElementsLen  = codeLineNumElements.length;
  const preElements             = document.querySelectorAll("pre");
  const preElementsLen          = preElements.length;

  for (let i = 0; i < codeTextElementsLen; i++) {
    codeTextElements[i].style.fontFamily  = fontFamily;
    codeTextElements[i].style.fontSize    = fontSize;
  }

  for (let i = 0; i < codeLineNumElementsLen; i++) {
    codeLineNumElements[i].style.fontFamily = fontFamily;
    codeLineNumElements[i].style.fontSize   = fontSize;
  }

  for (let i = 0; i < preElementsLen; i++ ){
    preElements[i].style.fontFamily = fontFamily;
    preElements[i].style.fontSize   = fontSize;
  }
}

// Extension's browser action popup UI handling to allow user to customize the
// settings of the styles. Handles the `APPLY` and `RESET` button logic.
document.addEventListener('DOMContentLoaded', async function() {
  const setFontName   = await getCurrentSetFontName() || "";
  const setFontSize   = await getCurrentSetFontSize() || "";
  const applyButton   = document.getElementById("apply-button");
  const resetButton   = document.getElementById("reset-button");
  const fontNameInput = document.getElementById("font-name-input");
  const fontSizeInput = document.getElementById("font-size-input");

  // Set the initial value of the inputs to be the current set styles.
  fontNameInput.value = setFontName;
  fontSizeInput.value = setFontSize;

  applyButton.addEventListener("click", function() {
    const font = fontNameInput.value;
    const size = fontSizeInput.value;
    const fontStyles = {
      font,
      size: parseInt(size)
    }

    // We get the details of all the tabs open and send message to all the
    // tabs with the new font styles data. All the tabs with GitHub open 
    // will read this message and apply the new styles sent in the message.
    chrome.tabs.query({}, function(tabs) {
      tabs.map(function(tab) {
        chrome.tabs.sendMessage(tab.id, { data: fontStyles });
      });
    });
  });

  resetButton.addEventListener("click", function() {
    // Send message to all the tabs with data saying that we should reset the
    // styles. All the tabs with GitHub open will read this message and reset
    // styles to GitHub's default styles.
    chrome.tabs.query({}, function(tabs) {
      tabs.map(function(tab) {
        chrome.tabs.sendMessage(tab.id, { data: { reset: true } });
      });
    });
  });
})

// We listen for messages that we earlier sent when a user clicked on `APPLY` or
// `RESET` button. Based on the `request.data` of the message, we either apply
// the new styles or reset the styles.
chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
  const data = request.data || {};

  const shouldReset = data.reset === true;
  const doNothing = !data.font || !data.size;

  if (shouldReset) {
    resetStyles();
  };

  // TODO: Right now we ignore if any 1 of the fields are empty but soon we need
  // to allow user to provide either one of the properties (font name or font
  // size) and we should apply just that style instead of making both of the
  // properties required. So that user can change only one property (name or size).
  if (doNothing) {
    return;
  }

  const name = data.font;
  const size = data.size;

  setCurrentSetFontName(name);
  setCurrentSetFontSize(size);

  const { fontFamily, fontSize } = genFontStyles(name, size);
  applyStyles(fontFamily, fontSize);
  sendResponse({ data, success: true });
});

// Chrome's storage API allows us to store & fetch user's recent applied styles.

// Save to chrome's storage. `data` should be an object like `{ key: value }`.
function saveToStorage(data) {
  chrome.storage.sync.set(data);
}

// Read a `value` from chromes' storage by providing the `key`. This returns a
// Promise so that we can await for the `value`. If we don't use Promise, the
// return value will always be `undefined` as chrome's storage read is async.
function getFromStorage(key) {
  return new Promise(function(resolve, _reject) {
    chrome.storage.sync.get([`${key}`], function(result) {
      const value = result[`${key}`];
      resolve(value);
    });
  });
}

// Destroy everything from the chrome's storage.
function clearStorage() {
  chrome.storage.sync.clear();
}

async function getCurrentSetFontName() {
  const currentFontName = await getFromStorage("fontName");
  return currentFontName;
}

async function getCurrentSetFontSize() {
  const currentFontSize = await getFromStorage("fontSize");
  return currentFontSize;
}

function setCurrentSetFontName(name) {
  saveToStorage({ fontName: name });
  cache.fontName = name;
}

function setCurrentSetFontSize(size) {
  saveToStorage({ fontSize: size });
  cache.fontSize = size;
}

// Generates correct styles by adding `px` for `size` and  adding 
// `'monospace'` for `name`.
function genFontStyles(name, size) {
  const fontFamily  = `${name}, 'monospace'`;
  const fontSize    = `${size}px`;

  return { fontFamily, fontSize };
}

async function getCurrentSetFontStyles() {
  if (cache.fontName && cache.fontSize) {
    return genFontStyles(cache.fontName, cache.fontSize);
  };
  
  // Everything below here will be executed only during the first time the
  // document is loaded. After that, `cache` will always have latest font styles.

  const currentSetFontName = await getCurrentSetFontName();
  const currentSetFontSize = await getCurrentSetFontSize();

  if (!currentSetFontName || !currentSetFontSize) {
    return;
  }

  // Update the cache so that we don't make the chrome storage read calls again.
  cache.fontName = currentSetFontName;
  cache.fontSize = currentSetFontSize;

  return genFontStyles(currentSetFontName, currentSetFontSize);
}
