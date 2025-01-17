  let classificationData = [];

  function logClassification(element, reason, action) {
    const elementInfo = {
      id: elementId(element),
      tagName: element.tagName,
      className: element.className,
      reason: reason.replace(/,/g, ";"), // Replace commas to avoid CSV formatting issues
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
    classificationData = [];

    let elements = Array.from(document.querySelectorAll("*"))
    console.log(elements.length);

    elements = filterNonInteractiveElements(elements);
    console.log(elements.length);

    elements = filterNotVisibleElements(elements);
    console.log(elements.length);

    elements = filterNoneBuiltInAccessibleElements(elements);
    console.log(elements.length);

    elements = filterIterativeOrLooksLike(elements);
    console.log(elements.length);

    elements = filterKeyboardAccessible(elements);
    console.log(elements.length);

    return elements.map(e => ({
      element: e,
      id: elementId(e),
    }));
  }

  function filterKeyboardAccessible(elements) {
    const filteredElements = [];
    for (const el of elements) {
      const notKeyboardAccessible = !isKeyboardAccessible(el);
      logClassification(
        el,
        notKeyboardAccessible
          ? "Not keyboard accessible"
          : "Is keyboard accessible",
        notKeyboardAccessible ? "kept" : "filtered"
      );
      if (notKeyboardAccessible) {
        filteredElements.push(el);
      }
    }
    return filteredElements;
  }

  function filterIterativeOrLooksLike(elements) {
    const filteredElements = [];
    for (const el of elements) {
      const hasListeners = hasEventListeners(el);
      const looksInteractive = filterLooksInteractive(el);
      const isInteractive = looksInteractive || hasListeners;
      logClassification(
        el,
        isInteractive
          ? looksInteractive
            ? "Looks interactive"
            : "Has event listeners"
          : "Not interactive",
        isInteractive ? "kept" : "filtered"
      );
      if (isInteractive) {
        filteredElements.push(el);
      }
    }
    return filteredElements;
  }

  function filterNotVisibleElements(elements) {
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
      logClassification(
        el,
        isNativelyAccessible
          ? "Natively accessible element"
          : "Not natively accessible",
        isNativelyAccessible ? "filtered" : "kept"
      );
      if (!isNativelyAccessible) {
        filteredElements.push(el);
      }
    }
    
    return filteredElements;
  }

  function filterLooksInteractive(element) {
    const buttonTexts = ["click", "submit", "start", "go", "buy", "add", "order"];

    if (element.style.cursor === "pointer") {
      logClassification(element, "has cursor pointer", "kept");
      return true;
    }

    const classList =
      !!element?.className?.split &&
      element.className.split(/\s+/).filter(Boolean) || [];
    if (
      classList.some((cls) =>
        /btn|interactive|clickable|cta|link|tab(-item)?/i.test(cls)
      )
    ) {
      logClassification(element, "has class name", "kept");
      return true;
    }

    if (
      element.hasAttribute("data-button") ||
      element.hasAttribute("data-interactive")
    ) {
      logClassification(element, "has data attribute", "kept");
      return true;
    }

    // const lowerText = element.textContent.trim().toLowerCase();
    // if (buttonTexts.some((txt) => lowerText.includes(txt))) {
    //   logClassification(element, "has button text", "kept");
    //   return true;
    // }

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

    if (possibleEvents.some((evt) => typeof element[`on${evt}`] === "function")) {
      logClassification(element, "has event listener", "kept");
      return true;
    }

    try {
      return possibleEvents.some((evt) => {
        const listeners = getEventListeners(element)[evt] || [];
        logClassification(
          element,
          `has ${evt} event listener`,
          listeners.length > 0 ? "kept" : "filtered"
        );
        return listeners.length > 0;
      });
    } catch (e) {
      return false;
    }
  }

  function isKeyboardAccessible(el) {
    return el.tabIndex >= 0 || hasKeydownHandler(el);
  }

  function hasKeydownHandler(el) {
    if (typeof el.onkeydown === "function") return true;
    try {
      const keydown = getEventListeners(el).keydown || [];
      return keydown.length > 0;
    } catch {
      return false;
    }
  }
   function elementId(element) {
    return `${element.tagName}-${element.id}-${element.className}`;
  }

  const elements = findNonKeyboardAccessibleInteractiveElements();