/**
 * This is the  script that you can use to :
 * 1. Generate package.zip for the specified browser 
 * 2. Create manifest.json file for the specified browser
 * 
 * USAGE :
 * - node script <browser> [options]
 *  
 * Valid values for `<browser>` are - "chrome" and "firefox" 
 * Valid options :
 * 1. `-m` : To generate only the manifest
 * If no `options` are provided, the package.zip will be generated
 * If the script is used to generate the package.zip, the manifest.json will be
 * deleted after packaging the files.
 * 
 * EXAMPLE :
 * 1. Generate package.zip for chrome : `node script chrome`
 * 2. Generate manifest for firefox : `node script firefox -m`
 */

const fs = require("fs");
const childProcess = require("child_process");

const chromeManifestContent = {
  "manifest_version": 2,
  "name": "Better Github",
  "version": "1.0.0",
  "description": "Enhance your code reading experience on GitHub",
  "content_scripts": [
    {
      "js": ["better-github.js"],
      "matches": ["*://*.github.com/*"]
    }
  ],
  "permissions": ["storage"],
  "browser_action": {
    "default_title": "Better Github",
    "default_icon": "./assets/favicon.png",
    "default_popup": "popup.html"
  },
  "icons": {
    "16": "./assets/icon16.png",
    "48": "./assets/icon48.png",
    "128": "./assets/icon128.png"
  }
};

const firefoxManifestContent = {
  ...chromeManifestContent,
  "applications": {
    "gecko": {
      "id": "better-github@ceoshikhar.com",
      "strict_min_version": "1.0.0"
    }
  }
};

// The first element will be 'node', the second element will be the name of the
// JS file. The next elements will be any additional command line arguments.
const args            = process.argv.slice(2);
const maxArgs         = 2;
const browser         = args[0];
const validBrowsers   = ['chrome', 'firefox'];
const genOnlyManifest = browser && args[1] === '-m' ? true : false;
const manifest        = 'manifest.json';
const thingsToZip     = ['assets/*', 'better-github.js', manifest, 'popup.html', 'styles.css'];
const package         = 'better-github.zip';

function browserType() {
  const isChrome  = browser === validBrowsers[0] ? true : false;
  const isFirefox = browser === validBrowsers[1] ? true : false;
  return { isChrome, isFirefox };
}

function makeSureArgsAreValid() {
  if (args.length > maxArgs) {
    throw new Error(`Maximum 2 arguments are allowed. Check docs for more info.`);
  }

  if (!validBrowsers.includes(browser)) {
    throw new Error(`Invalid browser, "chrome" and "firefox" are only valid.`);
  }

  if (!genOnlyManifest && args.length === maxArgs) {
    throw new Error(`Unexpected arguments. Check docs for more info.`);
  }
}

function maybeDeleteManifest() {
  const command = `rm -rf ${manifest}`;
  console.log(`Deleting old ${manifest} if exists`);
  childProcess.execSync(command);
}

function refreshManifest() {
  maybeDeleteManifest();

  // Create new manifest.json and put `chromeManifestContent` if the build is
  // for Chrome browser otherwise put `firefoxManifestContent` if the build is
  // for Firefox browser.
  console.log(`Generating new ${manifest} for ${browser}`);
  if (browserType().isChrome) {
    fs.writeFileSync(manifest, JSON.stringify(chromeManifestContent, null, 2));
  } else if (browserType().isFirefox) {
    fs.writeFileSync(manifest, JSON.stringify(firefoxManifestContent, null, 2));
  }
}

function maybeDeletePackage() {
  const command = `rm -rf ${package}`;
  console.log(`Deleting old ${package} if exists`);
  childProcess.execSync(command);
}

function generateNewPackage() {
  maybeDeletePackage();

  const command = `zip ${package} ${thingsToZip.join(' ')}`
  console.log("Zipping the files : ", { command });
  childProcess.execSync(command);
}

function main() {
  console.log({ args, len: args.length });
  makeSureArgsAreValid();

  if (genOnlyManifest) {
    refreshManifest();
  } else {
    refreshManifest();
    generateNewPackage();
    maybeDeleteManifest();
  }
}

main();
