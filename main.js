let classificationData = [];

function logClassification(element, reason, action) {
  const elementInfo = {
    id: elementId(element),
    tagName: element.tagName,
    className: element.className,
    reason: reason,
    action: action,
  };

  classificationData.push(elementInfo);
}

function printClassificationData(elementId) {
  const filteredData = classificationData.filter(
    (info) => info.id === elementId
  );
  for (const info of filteredData) {
    console.log(info);
  }
}

function findNonKeyboardAccessibleInteractiveElements() {
  let elements = Array.from(document.querySelectorAll("*"));
  console.log(elements.length);
  elements = baseFilter(elements);

  elements = filterIterativeOrLooksLike(elements);
  console.log(elements.length);

  elements = filterKeyboardAccessible(elements);
  console.log(elements.length);

  return elements.map((e) => ({
    element: e,
    id: elementId(e),
  }));
}

function baseFilter(elements) {
  elements = filterInteractiveElements(elements);
  elements = filterNoneBuiltInAccessibleElements(elements);
  elements = filterVisibleElements(elements);
  return elements;
}

function filterKeyboardAccessible(elements) {
  const filteredElements = [];
  for (const el of elements) {
    if (!isKeyboardAccessible(el)) {
      filteredElements.push(el);
    }
  }
  return filteredElements;
}

function filterIterativeOrLooksLike(elements) {
  const filteredElements = [];
  for (const el of elements) {
    const hasListeners = hasEventListeners(el);
    const hasRelatedRole = hasRelatedRoles(el);

    if (hasListeners || hasRelatedRole) {
      filteredElements.push(el);
    }
  }
  return filteredElements;
}

function hasRelatedRoles(el) {
  const hasRole =
    el.hasAttribute("role") && ["button", "link", "tab"].includes(el.role);
  if (hasRole) {
    logClassification(
      el,
      hasRole ? "has related role" : "no related role",
      hasRole ? "kept" : "filtered"
    );
  }
  return hasRole;
}

function filterVisibleElements(elements) {
  const filteredElements = [];
  for (const el of elements) {
    const isVisible =
      el.style.display !== "none" &&
      el.style.visibility !== "hidden" &&
      !el.hidden;

    logClassification(
      el,
      isVisible ? "Element is visible" : "Element is not visible",
      isVisible ? "kept" : "filtered"
    );

    if (isVisible) {
      filteredElements.push(el);
    }
  }
  return filteredElements;
}

function filterInteractiveElements(elements) {
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

  const filteredElements = [];
  for (const el of elements) {
    const isInteractive = !noneInteractiveElements.has(el.tagName);
    logClassification(
      el,
      isInteractive
        ? "Interactive element type"
        : "Non-interactive element type",
      isInteractive ? "kept" : "filtered"
    );
    if (isInteractive) {
      filteredElements.push(el);
    }
  }
  return filteredElements;
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

  const filteredElements = [];

  for (const el of elements) {
    const isNativelyAccessible = nativelyKeyboardAccessible.has(el.tagName);
    if (!isNativelyAccessible) {
      filteredElements.push(el);
    }
  }

  return filteredElements;
}

// function filterLooksInteractive(element) {
//   if (element.style.cursor === "pointer") {
//     logClassification(element, "has cursor pointer", "kept");
//     return true;
//   }

//   const classList =
//     (!!element?.className?.split &&
//       element.className.split(/\s+/).filter(Boolean)) ||
//     [];
//   if (classList.some((cls) => /btn|interactive|clickable|cta/i.test(cls))) {

//     logClassification(
//       element,
//       `has class name: ${classList
//         .filter((cls) => /btn|interactive|clickable|cta/i.test(cls))
//         .join(", ")}`,
//       "kept"
//     );
//     return true;
//   }

//   if (
//     element.hasAttribute("data-button") ||
//     element.hasAttribute("data-interactive")
//   ) {
//     logClassification(element, "has data attribute", "kept");
//     return true;
//   }

//   return false;
// }

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

  if (possibleEvents.some((evt) => typeof element[`on${evt}`] === "function")) {
    logClassification(element, "has event listener", "kept");
    return true;
  }

  try {
    return possibleEvents.some((evt) => {
      const listeners = getEventListeners(element)[evt] || [];
      if (listeners.length > 0) {
        logClassification(element, `has ${evt} event listener`, "kept");
        return true;
      }
      return false;
    });
  } catch (e) {
    return false;
  }
}

function isKeyboardAccessible(el) {
  const hasHandler = hasKeydownHandler(el);
  const isTabbable = el.tabIndex >= 0;
  if (!isTabbable) {
    logClassification(el, "Not tabbable", "kept");
  }
  if (!hasHandler) {
    logClassification(el, "No keydown event listener", "kept");
  }
  if (isTabbable && hasHandler) {
    logClassification(el, "Is keyboard accessible", "filtered");
  }
  return isTabbable && hasHandler;
}

function hasKeydownHandler(el) {
  if (typeof el.onkeydown === "function") {
    logClassification(el, "has keydown event listener", "kept");
    return true;
  }
  try {
    const keydown = getEventListeners(el).keydown || [];
    logClassification(el, "event listeners", keydown.join(", "));
    if (keydown.length > 0) {
      logClassification(
        el,
        `has keydown event listener: ${keydown
          .map((listener) => listener.type)
          .join(", ")}`,
        "kept"
      );
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
function elementId(element) {
  return `${element.tagName}-${element.id}-${element.className}`;
}

const elements = findNonKeyboardAccessibleInteractiveElements();
