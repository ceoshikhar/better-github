/**
 * This is the build script that you can use to :
 * 1. Package the extension to better-github.zip for the specified browser.
 *    Generally for publication or distribution of the extension.
 * 2. Generate manifest.json file for the specified browser.
 *
 * Prerequisites for this script to work :
 * 1. `zip` util binary installed, run `zip --version` to check if you have it
 * or not. If you get something like `command not found: zip` then you don't
 * have it, so install it. `zip` is not needed for generating manifest.json.
 * 2. `rm -rf` should work. This is available on `linux` and `unix` machines.
 * Don't know what you need to do for it to work on `windows`. I use WSL.
 *
 * USAGE :
 * - node build <browser> [options] OR you can run scripts from `package.json`
 *
 * Valid values for `<browser>` are : "chrome" and "firefox"
 * Valid options :
 * 1. `-m` : To generate only the manifest.json and not generate package.zip
 *
 * EXAMPLE :
 * 1. Generate better-github.zip for chrome : `node build chrome`
 * 2. Generate manifest.json for firefox : `node build firefox -m`
 */

const fs = require("fs");
const childProcess = require("child_process");
const chalk = require("chalk");

function green(text) {
  return chalk.green(text);
}

function red(text) {
  return chalk.red.underline(text);
}

function result(text) {
  return chalk.black.bgYellowBright(text);
}

// NOTE: Update the `version` here and in `package.json` whenever a new release
// of the extension is published.
const chromeManifestContent = {
  "manifest_version": 2,
  "name": "Better Github",
  "version": "1.0.1",
  "description": "Enhance your code reading experience on GitHub",
  "content_scripts": [
    {
      "js": ["better-github.js"],
      "matches": ["https://github.com/*", "https://gist.github.com/*"]
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

// For Firefox's manifest, we just have to add one extra property: "applications"
const firefoxManifestContent = {
  ...chromeManifestContent,
  "applications": {
    "gecko": {
      "id": "better-github@ceoshikhar.com",
      "strict_min_version": "80.0"
    }
  }
};

// The first element will be 'node', the second element will be the name of the
// JS file. The next elements will be any additional command line arguments.
const args                = process.argv.slice(2);
const maxArgs             = 2;
const browser             = args[0];
const validBrowsers       = ['chrome', 'firefox'];
const shouldBuildPackage  = browser && args[1] === '-m' ? false : true;
const manifest            = 'manifest.json';
const thingsToZip         = ['assets/icon16.png', 'assets/icon48.png', 'assets/icon128.png',
                             'assets/favicon.png', 'assets/icon-no-bg.png',
                             'better-github.js', manifest, 'popup.html', 'styles.css'];
const packageName         = 'better-github.zip';

function browserType() {
  const isChrome  = browser === validBrowsers[0] ? true : false;
  const isFirefox = browser === validBrowsers[1] ? true : false;
  return { isChrome, isFirefox };
}

function makeSureArgsAreValid() {
  if (args.length > maxArgs) {
    throw new Error(`Maximum 2 arguments are allowed`);
  }

  if (!validBrowsers.includes(browser)) {
    throw new Error(`Invalid browser, "chrome" and "firefox" are only valid`);
  }

  if (shouldBuildPackage && args.length === maxArgs) {
    throw new Error(`Unexpected arguments`);
  }
}

function maybeDeleteManifest() {
  const command = `rm -rf ${manifest}`;
  console.log(green(`> Deleting `) + red(`old ${manifest}`) + green(` if exists`));
  childProcess.execSync(command);
}

function buildManifest() {
  maybeDeleteManifest();

  // Create new manifest.json and put `chromeManifestContent` if the build is
  // for Chrome browser otherwise put `firefoxManifestContent` if the build is
  // for Firefox browser.
  console.log(green(`> Generating `) + red(`new ${manifest}`) + green(` for ${browser}`));
  if (browserType().isChrome) {
    fs.writeFileSync(manifest, JSON.stringify(chromeManifestContent, null, 2));
  } else if (browserType().isFirefox) {
    fs.writeFileSync(manifest, JSON.stringify(firefoxManifestContent, null, 2));
  }
}

function maybeDeletePackage() {
  const command = `rm -rf ${packageName}`;
  console.log(green(`Deleting `) + red(`old ${packageName} `) + green(`if exists`));
  childProcess.execSync(command);
}

function buildPackage() {
  maybeDeletePackage();

  const command = `zip ${packageName} ${thingsToZip.join(' ')}`
  console.log(green(`Zipping the following files to `) + red(`${packageName} :`)  , command);
  childProcess.execSync(command);
}

function main() {
  const t0 = Date.now();

  makeSureArgsAreValid();
  buildManifest();

  if (shouldBuildPackage) {
    buildPackage();
  }

  const t1 = Date.now();
  const timeTaken = t1 - t0;
  console.log(result(`Built in: ${timeTaken}ms`));
}

main();
