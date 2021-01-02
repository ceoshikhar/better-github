const codeElements = document.getElementsByClassName("blob-code-inner");
const len = codeElements.length;

for (let i = 0; i < len; i++) {
  // TODO: Instead of hard coding the `fontFamily` and `fontSize`, we should be 
  // able to allow the user to choose a font size and font family of their 
  // choice (which they have installed on their machine).
  codeElements[i].style.fontFamily = "'Fira Code', 'monospace'";
  codeElements[i].style.fontSize = "14px";
}
