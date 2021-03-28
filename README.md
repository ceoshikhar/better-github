<div align="center">
  <div style="display: flex; justify-content: center">
    <img src="./assets/icon128.png" height="48px" style="margin-right: 1em"/>
    <h1>better-github</h1>
  </div>
  <p>🎨 Chrome extension to enhance your code reading experience on GitHub</p>
</div>

# Demo

<img src="./assets/demo.gif">

# Features

`Better Github` allows you to apply custom fonts and modify font size of code text. These styles are applied to :

- All the text inside a file while viewing( reading ) it.

  <img src="./assets/feature-1-example.png">

- Code in README.md files that are inside "`<code>`" blocks also known as `<pre>` tags.

  <img src="./assets/feature-2-example.png">

- Code in pull request diffs.

  <img src="./assets/feature-3-example.png">

# Motivation

Default font size of code text was very small which gave me had a hard time reading code in any repository and in PR diffs. I also wanted my code editor font and GitHub font to be same.

Couldn't find anything existing to help me solve my problem, so I created this simple yet powerful extension for Chrome browser.

I called it `Better GitHub` inspired by `Better Twitch TV` and `Better Discord`.

# Installation - you will have to do it manually right now, sorry ☹

> Might seem impossible but a $5 fee to publish it to Chrome store is not what I can afford if no one ends up needing this extension. I created this extension for myself and decided to make it public. If people like it and use it, definitely I will publish it. For now, I am sure you are a developer as this extension literally is for GitHub where you are reading this right now, so this shouldn't bother you much. Once again, sorry for the "inconvenience" but it is what it is.

# WIP Todos

- [x] Instead of hard coding the `fontFamily` and `fontSize`, we should be able to allow the user to choose a font size and font family of their choice (which they have installed on their machine).
- [x] Create a browser action popup to show expose an interface to allow the user to edit `fontFamily` and `fontSize`.
- [x] Integrate browser action popup with chrome API to persist and read user's settings for `fontFamily` and `fontSize` to the storage.
- [x] Apply styles without reloading whenever the settings are changed from the browser action popup interface.
- [x] If no custom font styles are set, load GitHub's default font styles.
- [x] User can reset font styles to GitHub's default font styles.
- [ ] Add GIF to show the usage( demo ) of the extension.
- [ ] Installation - instructions on how to download/clone the repo, install the extension and use it.
- [x] Better Github's logo for the extension favicon and icon.
- [ ] Allow user to apply styles to either font family or font size instead of both fields being mandatory.
