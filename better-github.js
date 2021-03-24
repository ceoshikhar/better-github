// Store the current set font styles to this object so that we
// have to fetch them from chrome storage API only once. 
// This improves the performance as we don't do the async
// chrome storage API read calls every new GitHub page.
const cache = {
  setFontName: null,
  setFontSize: null
};

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

function genFontStyles(name, size) {
  const fontFamily  = `${name}, 'monospace'`;
  const fontSize    = `${size}px`;

  return { fontFamily, fontSize };
}

async function applyStyles(fontFamily, fontSize) {
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

// Reset the font styles to Github's default.
function resetStyles() {
  // These styles were taken from Google Chrome on 24/3/2021.
  const githubDefaultFontFamily = "SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace";
  const githubDefaultFontSize   = "12px";

  clearStorage();
  applyStyles(githubDefaultFontFamily, githubDefaultFontSize);
}

// Apply the currently set font styles if they exist
async function applyCurrentSetStyles() {
  const currentSetFontStyles = await getCurrentSetFontStyles();
  if (!currentSetFontStyles) return;

  const { fontFamily, fontSize } = currentSetFontStyles;
  applyStyles(fontFamily, fontSize);
}

let oldHref = document.location.href;
window.onload = async function() {
  applyCurrentSetStyles();

  const bodyList = document.querySelector("body");
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href;
        // When the user navigates on Github to other pages after the intial
        // load, we apply the styles again on the new page.
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

document.addEventListener('DOMContentLoaded', async function() {
  const setFontName    = await getCurrentSetFontName() || '';
  const setFontSize      = await getCurrentSetFontSize() || '';
  const applyButton   = document.getElementById('apply-button');
  const resetButton   = document.getElementById('reset-button');
  const fontNameInput = document.getElementById('fontFamily');
  const fontSizeInput = document.getElementById('fontSize');

  fontNameInput.value = setFontName;
  fontSizeInput.value = setFontSize;

  applyButton.addEventListener('click', function() {
    const font = fontNameInput.value;
    const size = fontSizeInput.value;
    const fontStyles = {
      font,
      size: parseInt(size)
    }

    // Dispatch an event for setting the new font styles.
    chrome.tabs.query({}, function(tabs) {
      tabs.map(function(tab) {
        chrome.tabs.sendMessage(tab.id, { data: fontStyles });
      });
    });
  });

  // Dispatch an event for resetting the font styles.
  resetButton.addEventListener('click', function() {
    chrome.tabs.query({}, function(tabs) {
      tabs.map(function(tab) {
        chrome.tabs.sendMessage(tab.id, { data: { reset: true } });
      });
    });
  });
})
