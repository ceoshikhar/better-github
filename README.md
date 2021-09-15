![readme banner](./assets/banner.png)

<div align="center">
  <h1>better-github</h1>
  <p><strong>🎨 Enhance your code reading experience on GitHub</strong></p>
  <h3 align="center">
    <a href="https://addons.mozilla.org/en-US/firefox/addon/bettergithub/">Firefox</a>
    <span> · </span>
    <a href="https://chrome.google.com/webstore/detail/better-github/ammeaejgjdeifjekkofhnliedhccbmgp">Chrome</a>
    <span> · </span>
    <a href="#sponsor">Sponsor</a>
  </h3>
</div>

# Demo

<img src="./assets/demo.gif">

# Get the extension

### [Firefox](https://addons.mozilla.org/en-US/firefox/addon/bettergithub/)

### [Chrome](https://chrome.google.com/webstore/detail/better-github/ammeaejgjdeifjekkofhnliedhccbmgp)

# Features

### Simple interface to use the extension

![popup](./assets/popup.png)

`Better Github` allows you to apply custom fonts and modify font size of code text. These styles are applied to :

> Example below have the following Better GitHub's config: `Font Name` is [Hack](https://github.com/source-foundry/Hack) and `Font Size` is **14**.

- All the text inside a file while viewing( reading ) it.

   <img src="./assets/feature-1-example.png">

- Code in README files that are inside "`<code>`" blocks also known as `<pre>` tags.

  <img src="./assets/feature-2-example.png">

- Code in pull request diffs.

  <img src="./assets/feature-3-example.png">

**Note:** If the custom styles are not applied( it can happen sometimes ), refresh the page.

# Motivation

Default font size of code text was very small which gave me had a hard time reading code in any repository and in PR diffs. I also wanted my code editor font and GitHub font to be same.

Couldn't find anything existing to help me solve my problem, so I created this simple yet powerful extension for Chrome browser. If something does exist though, let me know, alright?

I called it `Better GitHub` inspired by `Better Twitch TV` and `Better Discord`.

# Sponsor

> I have already applied for [GitHub Sponsors](https://github.com/sponsors) and I am on the waitlist. Till then you can support the project via the methods listed below.

### [Paypal](https://paypal.me/itsShikhar)

# Todos

> Context: I created this list of tasks after I decided to make this extension public. Initially the code was very small and the font styles were hard coded. If I needed to modify the styles, I had to change it in the source code, reload the extension and refresh GitHub pages to reflect the updates. Consider this list as the roadmap for the project.

- [x] Instead of hard coding the `fontFamily` and `fontSize`, we should be able to allow the user to choose a font size and font family of their choice (which they have installed on their machine).
- [x] Create a browser action popup to show an interface to allow the user to customise their extension's settings for `fontFamily` and `fontSize`.
- [x] Integrate browser action popup with chrome API to persist and read user's settings for `fontFamily` and `fontSize` from and to the storage.
- [x] Apply styles without reloading whenever the settings are changed from the browser action popup interface.
- [x] If no custom font styles are set, load GitHub's default font styles.
- [x] User can reset font styles to GitHub's default font styles.
- [x] Add GIF to show the usage( demo ) of the extension.
- [x] Installation instructions on how to clone/download this repository, install the extension and use it.
- [x] Logo for the extension that will be used as favicon, icon, in documentation etc.
- [x] Firefox support as it was requested by [others](https://dev.to/ceoshikhar/enhance-your-code-reading-experience-on-github-with-this-chrome-extension-24ei).
- [x] Publish it as an official Mozilla Firefox addon.
- [x] Publish it as an official Chrome extension on Chrome Web Store.
- [ ] Allow user to change only one property, either font name or font size instead of both properties being mandatory.
- [ ] Add `CONTRIBUTING.md` to help others so that they can contribute to the project.
