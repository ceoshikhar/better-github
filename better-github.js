// Store the current set font styles to this object so that we don't have to
// fetch them from chrome storage API again and again.
// This improves the performance as we don't do the async chrome storage API
// read calls every time `applyCurrentSetStyles` is called.
const cache = {
    dirty: false,
    fontName: null,
    fontSize: null,
    lineHeight: null,
};

// These styles were taken from Google Chrome's(Windows) inspect element tool
// on 24/3/2021. These default styles might change but it's not really that
// important otherwise it would defeat the whole purpose of `Better Github`.
const DEFAULT_FONT_FAMILY =
    "SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace";
const DEFAULT_FONT_SIZE = "12px";
const DEFAULT_LINE_HEIGHT = 1.4;

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
    if (isUserEditingFile()) return;

    const currentSetFontStyles = await getCurrentSetFontStyles();
    if (!currentSetFontStyles) return;

    const { fontFamily, fontSize, lineHeight } = currentSetFontStyles;
    applyStyles(fontFamily, fontSize, lineHeight);
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
    // Clear the storage so that when we reload/refresh or visit GitHub in another
    // tab, we don't apply any custom styles including the above two mentioned.
    // The real(coming from GitHub) GitHub's default styles are used.
    clearStorage();

    // We apply the GitHub's "default styles" so that we don't have to manually
    // refresh the current open tabs and this makes it feel "reactive".
    applyStyles(DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT);
}

// This is where the magic happens. As the name suggests, the function is
// responsible for applying the font styles to the code text elements on a page.
//
// Apply font styles (font-name & font-size).
// These styles are applied to :
// - All the text inside a file while viewing( reading ) it.
// - Code in README files that are inside "`<code>`" blocks also known as `<pre>` tags.
// - Code in pull request diffs.
function applyStyles(fontFamily, fontSize, lineHeight) {
    const codeTextElements = document.getElementsByClassName("blob-code-inner");
    const codeLineNumElements = document.getElementsByClassName("blob-num");
    const preElements = document.querySelectorAll("pre");
    const codeElements = document.querySelectorAll("code");

    for (let i = 0; i < codeTextElements.length; i++) {
        applyStyle(codeTextElements[i], "fontFamily", fontFamily);
        applyStyle(codeTextElements[i], "fontSize", fontSize);
        applyStyle(codeTextElements[i], "lineHeight", lineHeight);
    }

    for (let i = 0; i < codeLineNumElements.length; i++) {
        applyStyle(codeLineNumElements[i], "fontFamily", fontFamily);
        applyStyle(codeLineNumElements[i], "fontSize", fontSize);
        applyStyle(codeLineNumElements[i], "fontHeight", lineHeight);
    }

    for (let i = 0; i < preElements.length; i++) {
        applyStyle(preElements[i], "fontFamily", fontFamily);
        applyStyle(preElements[i], "fontSize", fontSize);
        applyStyle(preElements[i], "fontHeight", lineHeight);
    }

    for (let i = 0; i < codeElements.length; i++) {
        applyStyle(codeElements[i], "fontFamily", fontFamily);
        applyStyle(codeElements[i], "fontSize", fontSize);
        applyStyle(codeElements[i], "fontHeight", lineHeight);
    }
}

/**
 * @param {HTMLElement} el The element to apply the style to.
 * @param {string} prop The style property to change.
 * @param {string} value The value to apply for the given `prop`.
 *
 * If a falsy(inc. empty string) value is passed as `value` then that value
 * will not be applied and will be skipped.
 */
function applyStyle(el, prop, value) {
    if (!value) {
        return;
    }

    el.style[prop] = value;
}

// Extension's browser action popup UI handling to allow user to customize the
// settings of the styles. Handles the `APPLY` and `RESET` button logic.
document.addEventListener("DOMContentLoaded", async function () {
    const setFontName = (await getCurrentSetFontName()) || "";
    const setFontSize = (await getCurrentSetFontSize()) || "";
    const setLineHeight = (await getCurrentSetLineHeight()) || "";
    const applyButton = document.getElementById("apply-button");
    const resetButton = document.getElementById("reset-button");
    const fontNameInput = document.getElementById("font-name-input");
    const fontSizeInput = document.getElementById("font-size-input");
    const lineHeightInput = document.getElementById("line-height-input");

    // Set the initial value of the inputs to be the current set styles.
    fontNameInput.value = setFontName;
    fontSizeInput.value = setFontSize;
    lineHeightInput.value = setLineHeight;

    applyButton.addEventListener("click", function () {
        const font = fontNameInput.value;
        const size = fontSizeInput.value;
        const height = lineHeightInput.value;
        const fontStyles = {
            font,
            size,
            height,
        };

        // We get the details of all the tabs open and send message to all the
        // tabs with the new font styles data. All the tabs with GitHub open
        // will read this message and apply the new styles sent in the message.
        chrome.tabs.query({}, function (tabs) {
            tabs.map(function (tab) {
                chrome.tabs.sendMessage(tab.id, { data: fontStyles });
            });
        });
    });

    resetButton.addEventListener("click", function () {
        // Send message to all the tabs with data saying that we should reset the
        // styles. All the tabs with GitHub open will read this message and reset
        // styles to GitHub's default styles.
        chrome.tabs.query({}, function (tabs) {
            tabs.map(function (tab) {
                chrome.tabs.sendMessage(tab.id, { data: { reset: true } });
            });
        });
    });
});

// We listen for messages that we earlier sent when a user clicked on `APPLY` or
// `RESET` button. Based on the `request.data` of the message, we either apply
// the new styles or reset the styles.
chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
    const data = request.data || {};
    const shouldReset = data.reset === true;

    if (shouldReset) {
        resetStyles();
        return;
    }

    const name = data.font;
    const size = data.size;
    const height = data.height;

    setCurrentSetFontName(name);
    setCurrentSetFontSize(size);
    setCurrentSetLineHeight(height);

    const { fontFamily, fontSize, lineHeight } = genFontStyles(
        name,
        size,
        height
    );
    applyStyles(fontFamily, fontSize, lineHeight);
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
    return new Promise(function (resolve, _reject) {
        chrome.storage.sync.get([`${key}`], function (result) {
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

async function getCurrentSetLineHeight() {
    const currentLineHeight = await getFromStorage("lineHeight");
    return currentLineHeight;
}

function setCurrentSetFontName(name) {
    saveToStorage({ fontName: name });
    cache.fontName = name;
}

function setCurrentSetFontSize(size) {
    saveToStorage({ fontSize: size });
    cache.fontSize = size;
}

function setCurrentSetLineHeight(height) {
    saveToStorage({ lineHeight: height });
    cache.lineHeight = height;
}

// Generates correct styles by adding `px` for `size` and  adding
// `'monospace'` for `name`.
function genFontStyles(name, size, height) {
    const fontFamily = !name ? DEFAULT_FONT_FAMILY : `${name}, 'monospace'`;
    const fontSize = !size ? DEFAULT_FONT_SIZE : `${size}px`;
    const lineHeight = !height ? DEFAULT_LINE_HEIGHT : height;

    return { fontFamily, fontSize, lineHeight };
}

async function getCurrentSetFontStyles() {
    if (cache.dirty) {
        return genFontStyles(cache.fontName, cache.fontSize, cache.lineHeight);
    }

    // Everything below here will be executed only during the first time the
    // document is loaded. After that, `cache` will always have latest font styles.

    const currentSetFontName = await getCurrentSetFontName();
    const currentSetFontSize = await getCurrentSetFontSize();
    const currentSetLineHeight = await getCurrentSetLineHeight();

    // Update the cache so that we don't make the chrome storage read calls again.
    cache.dirty = true;
    if (currentSetFontName) cache.fontName = currentSetFontName;
    if (currentSetFontSize) cache.fontSize = currentSetFontSize;
    if (currentSetLineHeight) cache.lineHeight = currentSetLineHeight;

    return getCurrentSetFontStyles();
}

// This is a cheeky solution to the issue where the code editor goes whack
// mode when we change the font styles on the code lines inside the editor.
//
// So for the time being we will not change the font styles when a user is
// editing a file on GitHub.
//
// Maybe in the future, if I get lucky( idk wtf is GitHub doing ) or someone
// in the world contributes and solves this issue where we can apply custom
// font styles to editor font without making it go insane, that would be nice.
//
// Untill then, Better GitHub won't do it's magic when user edits a file on
// GitHub. Also, who does that? xD
// Check - https://github.com/ceoshikhar/better-github/issues/6 for more info.
function isUserEditingFile() {
    function fileNameFromPath() {
        const words = window.location.pathname.split("/");
        const len = words.length;
        // The file being viewed/edited on GitHub is the last word in the URL path.
        const fileName = words[len - 1];

        return fileName;
    }

    // The word "edit" exists in the URL path if the user is editing the file.
    const wordEditInPathExists = window.location.pathname.includes("edit");
    const fileNameFromInputEl = document.querySelector(
        "input[name=filename]"
    )?.value;

    // The name of the file being edited will be same in URL path and input element on page load.
    if (fileNameFromPath() === fileNameFromInputEl && wordEditInPathExists) {
        return true;
    }

    return false;
}
