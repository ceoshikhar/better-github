// This allows us to re-apply the font styles when we navigate on GitHub. As 
// GitHub is an SPA we need to check if the location.href changes, we have to 
// apply the styles again otherwise the font styles only apply to the first
// GitHub page that is visited.
let oldHref = document.location.href;

// Entry point of the extension to interact with the DOM on GitHub
window.onload = async function() {
  // We apply set font styles when GitHub page is loaded.
  applyCurrentSetStyles();

  const bodyList = document.querySelector("body");
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function() {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href;
        // When the user navigates on Github to other pages after the intial
        // load, we apply the styles again on the new page on GitHub.
        applyCurrentSetStyles();
      }
    });
  });

  const config = {
    childList: true,
    subtree: true
  }

  observer.observe(bodyList, config);
};

// This is where the magic happens. As the name suggests, the function is 
// responsible for applying the font styles to the code text elements on a page.
//
// Apply font styles (font-name & font-size).
// These styles are applied to :
// - GitHub code viewer(reading files).
// - Code in README files that are using "`<source code>`" blocks.
// - Code in pull request diffs. 
//
// FIXME: If the PR diffs are large and they are lazy loaded when scrolling 
// through the diffs, the custom styles are not applied on the new fetched
// diffs. Maybe have a code lines "length" count check in `MutationObserver`
// just like we did for `location.href`?
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

// Apply the currently set font styles if they exist
async function applyCurrentSetStyles() {
  const currentSetFontStyles = await getCurrentSetFontStyles();
  if (!currentSetFontStyles) return;

  const { fontFamily, fontSize } = currentSetFontStyles;
  applyStyles(fontFamily, fontSize);
}


// Reset the font styles to Github's default.
function resetStyles() {
  // These styles were taken from Google Chrome's inspect element tool on
  // 24/3/2021. These default styles might change but it's not really that
  // important otherwise it would defeat the whole purpose of `Better Github`.
  const githubDefaultFontFamily = "SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace";
  const githubDefaultFontSize   = "12px";

  // Clear the storage so that when we reload/refresh or visit GitHub in another
  // tab, we don't apply any custom styles. The real(coming from GitHub)
  // GitHub's default styles are used.
  clearStorage();
  // Although we do apply the GitHub's "default styles" so that we don't have to
  // manually refresh the current open tabs and this makes it feel "reactive".
  applyStyles(githubDefaultFontFamily, githubDefaultFontSize);
}


// Better-Github's extension Popup UI handling to allow user to customize the
// styles. Handles the `APPLY` and `RESET` button logic.
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

  if (data.reset) {
    resetStyles();
  };

  // TODO: Right now we ignore if both the fields are empty but soon we need to
  // allow user to provided either one of the properties (font family or font
  // size) and we should apply just that style instead of making both of the
  // properties required.
  if (!data.font || !data.size) {
    return;
  }

  const name = data.font;
  const size = data.size;

  saveToStorage({ fontName: name });
  saveToStorage({ fontSize: size });

  const { fontFamily, fontSize } = genFontStyles(name, size);
  applyStyles(fontFamily, fontSize);
  sendResponse({ data, success: true });
});

// Store the current set font styles to this object so that we don't have to
// fetch them from chrome storage API again. This improves the performance as we
// don't do the async chrome storage API read calls on every new GitHub page.
const cache = {
  fontName: null,
  fontSize: null
};

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
      const data = result[`${key}`];
      resolve(data);
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

function setCurrentSetFontName(size) {
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
  // document is loaded. After that, `cache` will always have `cache.fontName`
  // and `cache.fontSize`.

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
