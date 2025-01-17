function findNonKeyboardAccessibleInteractiveElements() {
  let elements = Array.from(document.querySelectorAll("*"));
  console.log(elements.length);

  elements = filterNonInteractiveElements(elements);
  console.log(elements.length);

  elements = filterNotVisibleElements(elements);
  console.log(elements.length);

  elements = filterNoneBuildInAccessibleElements(elements);
  console.log(elements.length);

  let looksInteractiveElements = elements.filter(looksInteractive);
  console.log(looksInteractiveElements.length);

  let functionalInteractiveElements = looksInteractiveElements.filter(
    hasEventListeners
  );
  console.log(functionalInteractiveElements.length);

  
  return elements;
}

function filterNotVisibleElements(elements) {
  elements = elements.filter(
    (el) =>
      el.style.display !== "none" &&
      el.style.visibility !== "hidden" &&
      !el.hidden
  );
  return elements;
}

function filterNonInteractiveElements(elements) {
  const noneInteractiveElements = new Set([
    "HTML",
    "HEAD",
    "BODY",
    "SCRIPT",
    "STYLE",
    "META",
    "TITLE",
    "LINK",
    "FORM",
  ]);
  elements = elements.filter((el) => !noneInteractiveElements.has(el.tagName));
  return elements;
}

function filterNoneBuildInAccessibleElements(elements) {
  const noneKeyboardAccessibleElements = new Set([
    "BUTTON",
    "INPUT",
    "SELECT",
    "TEXTAREA",
    "A",
    "OPTION",
    "LABEL",
    "IFRAME",
  ]);
  elements = elements.filter(
    (el) => !noneKeyboardAccessibleElements.has(el.tagName)
  );
  return elements;
}

function looksInteractive(element) {
  const buttonTexts = ["click", "submit", "start", "go", "buy", "add", "order"];
  return (
    ["pointer"].includes(element.style.cursor) ||
    element.className.includes("button") ||
    element.className.includes("btn") ||
    element.className.includes("interactive") ||
    element.className.includes("link") ||
    element.className.includes("tab") ||
    element.className.includes("tab-item") ||
    element.className.includes("tab-button") ||
    element.className.includes("tab-button-text") ||
    element.hasAttribute("data-button") ||
    element.hasAttribute("data-interactive") ||
    buttonTexts.some((text) => element.textContent.toLowerCase().includes(text))
  );
}

function hasEventListeners(element) {
  const possibleEvents = [
    "click",
    "mousedown",
    "mouseup",
    "keydown",
    "keyup",
    "keypress",
    "touchstart",
  ];
  return (
    possibleEvents.some((evt) => typeof element[`on${evt}`] === "function") ||
    (getEventListeners(element)[evt] || []).length > 0
  );
}

findNonKeyboardAccessibleInteractiveElements();
