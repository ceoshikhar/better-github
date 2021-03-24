// This allows us to re-apply the font styles when we navigate on GitHub.
// As GitHub is an SPA we need to check if the location.href changes,
// we have to apply the styles again otherwise the font styles only
// apply to the first GitHub page that is visited.
let oldHref = document.location.href;

// Entry point of the extension to interact with the DOM on GitHub
window.onload = async function() {
  // We apply set font styles when GitHub page is loaded.
  applyCurrentSetStyles();

  const bodyList = document.querySelector("body");
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
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

// Better-Github's extension Popup UI handling to allow user to customize the styles.
// Handle `APPLY` and `RESET` button logic.
document.addEventListener('DOMContentLoaded', async function() {
  const setFontName   = await getCurrentSetFontName() || '';
  const setFontSize   = await getCurrentSetFontSize() || '';
  const applyButton   = document.getElementById('apply-button');
  const resetButton   = document.getElementById('reset-button');
  const fontNameInput = document.getElementById('fontFamily');
  const fontSizeInput = document.getElementById('fontSize');

  // Set the initial value of the inputs to be the current set styles.
  fontNameInput.value = setFontName;
  fontSizeInput.value = setFontSize;

  applyButton.addEventListener('click', function() {
    const font = fontNameInput.value;
    const size = fontSizeInput.value;
    const fontStyles = {
      font,
      size: parseInt(size)
    }

    // Dispatch an event with new font styles data for applying them.
    chrome.tabs.query({}, function(tabs) {
      tabs.map(function(tab) {
        chrome.tabs.sendMessage(tab.id, { data: fontStyles });
      });
    });
  });

  // Dispatch an event to reset the font styles to GitHub's default styles.
  resetButton.addEventListener('click', function() {
    chrome.tabs.query({}, function(tabs) {
      tabs.map(function(tab) {
        chrome.tabs.sendMessage(tab.id, { data: { reset: true } });
      });
    });
  });
})

// Handle the events dispatched when user clicks on either `APPLY` or `RESET` button.
chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
  const data = request.data || {};

  if (data.reset) {
    resetStyles();
  };

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

// Store the current set font styles to this object so that we
// don't have to fetch them from chrome storage API again.
// This improves the performance as we don't do the async
// chrome storage API read calls on every new GitHub page.
const cache = {
  setFontName: null,
  setFontSize: null
};

function saveToStorage(data) {
  chrome.storage.sync.set(data);
}

function getFromStorage(key) {
  return new Promise(function(resolve, _reject) {
    chrome.storage.sync.get([`${key}`], function(result) {
      const data = result[`${key}`];
      resolve(data);
    });
  });
}

function clearStorage() {
  chrome.storage.sync.clear();
}

async function getCurrentSetFontName() {
  const currentFontName = await getFromStorage('fontName');
  return currentFontName;
}

async function getCurrentSetFontSize() {
  const currentFontSize = await getFromStorage('fontSize');
  return currentFontSize;
}

function setCurrentSetFontName(name) {
  saveToStorage({ fontName: name });
  cache.setFontName = name;
}

function setCurrentSetFontName(size) {
  saveToStorage({ fontSize: size });
  cache.setFontSize = size;
}

function genFontStyles(name, size) {
  const fontFamily  = `${name}, 'monospace'`;
  const fontSize    = `${size}px`;

  return { fontFamily, fontSize };
}

async function getCurrentSetFontStyles() {
  if (cache.setFontName && cache.setFontSize) {
    return genFontStyles(cache.setFontName, cache.setFontSize);
  };

  const currentSetFontName = await getCurrentSetFontName();
  const currentSetFontSize = await getCurrentSetFontSize();

  if (!currentSetFontName || !currentSetFontSize) {
    return;
  }

  // Update the cache so that we don't make the chrome storage
  // API calls again to get current set font styles.
  cache.setFontName = currentSetFontName;
  cache.setFontSize = currentSetFontSize;

  return genFontStyles(currentSetFontName, currentSetFontSize);
}

// Apply font styles (font-family & font-size).
// These styles are applied to GitHub code viewer(files),
// code in README files(using "`<source code>`" blocks),
// code in pull request diffs.
async function applyStyles(fontFamily, fontSize) {
  const codeTextElements        = document.getElementsByClassName("blob-code-inner");
  const codeTextElementsLen     = codeTextElements.length;
  const codeLineNumElements     = document.getElementsByClassName("blob-num");
  const codeLineNumElementsLen  = codeLineNumElements.length;
  const preElements             = document.querySelectorAll("pre");
  const preElementsLen          = preElements.length;

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

// Apply the currently set font styles if they exist
async function applyCurrentSetStyles() {
  const currentSetFontStyles = await getCurrentSetFontStyles();
  if (!currentSetFontStyles) return;

  const { fontFamily, fontSize } = currentSetFontStyles;
  applyStyles(fontFamily, fontSize);
}


// Reset the font styles to Github's default.
function resetStyles() {
  // These styles were taken from Google Chrome on 24/3/2021.
  const githubDefaultFontFamily = "SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace";
  const githubDefaultFontSize   = "12px";

  clearStorage();
  applyStyles(githubDefaultFontFamily, githubDefaultFontSize);
}

