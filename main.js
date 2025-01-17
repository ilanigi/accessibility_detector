function findNonKeyboardAccessibleInteractiveElements() {
  let elements = Array.from(document.querySelectorAll("*"));
  console.log(elements.length);

  elements = filterNonInteractiveElements(elements);
  console.log(elements.length);

  elements = filterNotVisibleElements(elements);
  console.log(elements.length);

  elements = filterNoneBuiltInAccessibleElements(elements);
  console.log(elements.length);

  elements = elements.filter((el) => filterLooksInteractive(el) || hasEventListeners(el));
  console.log(elements.length);
  
  elements = elements.filter((el) => !isKeyboardAccessible(el));
  console.log(elements.length);

  return elements;
}

function filterNotVisibleElements(elements) {
  return elements.filter(
    (el) =>
      el.style.display !== "none" &&
      el.style.visibility !== "hidden" &&
      !el.hidden
  );
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
  return elements.filter((el) => !noneInteractiveElements.has(el.tagName));
}


function filterNoneBuiltInAccessibleElements(elements) {
  const nativelyKeyboardAccessible = new Set([
    "BUTTON",
    "INPUT",
    "SELECT",
    "TEXTAREA",
    "A",
    "OPTION",
    "LABEL",
    "IFRAME",
    "HREF",
  ]);
  return elements.filter(
    (el) => !nativelyKeyboardAccessible.has(el.tagName)
  );
}


function filterLooksInteractive(element) {
  const buttonTexts = ["click", "submit", "start", "go", "buy", "add", "order"];
  
  
  const classList = element.className.split(/\s+/).filter(Boolean);  
  if (element.style.cursor === "pointer") return true;
  if (
    classList.some((cls) =>
      /button|btn|interactive|clickable|cta|link|tab(-item|-button)?/i.test(cls)
    )
  ) {
    return true;
  }

  if (element.hasAttribute("data-button") || element.hasAttribute("data-interactive")) {
    return true;
  }

  const lowerText = element.textContent.trim().toLowerCase();
  if (buttonTexts.some((txt) => lowerText.includes(txt))) {
    return true;
  }

  return false;
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

  if (
    possibleEvents.some((evt) => typeof element[`on${evt}`] === "function")
  ) {
    return true;
  }

  try {
    return possibleEvents.some((evt) => {
      const listeners = getEventListeners(element)[evt] || [];
      return listeners.length > 0;
    });
  } catch (e) {
    return false;
  }
}


function isKeyboardAccessible(el) {
  if (el.tabIndex >= 0) {
    return true;
  }

  return false;
}
