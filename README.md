<div align="center">
  <h1>better-github</h1>
  <p>🎨 Enhance your code reading experience on GitHub</p>
</div>

## Todo
Instead of hard coding the `fontFamily` and `fontSize`, we should be able to allow the user to choose a font size and font family of their choice (which they have installed on their machine).
- [x] Create a browser action popup to show expose an interface to allow the user to edit `fontFamily` and `fontSize`.
- [ ] Integrate browser action popup with chrome API to persist and read user's settings for `fontFamily` and `fontSize` to the storage.
- [ ] Apply styles without reloading whenever the settings are changed from the browser action popup interface.
