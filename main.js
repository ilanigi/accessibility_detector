/** classificationData is for debugging in the browser */
let classificationData = [];

function runExperiment() {
  function elementId(element) {
    return `${element.tagName}-${element.id}-${element.className}`;
  }
  function findNonKeyboardAccessibleInteractiveElements() {
    function baseFilter(elements) {
      elements = filterInteractiveElements(elements);
      elements = filterNoneBuiltInAccessibleElements(elements);
      elements = filterVisibleElements(elements);
      return elements;
    }

    function logClassification(element, reason, action) {
      console.log(elementId(element), reason, action);
      classificationData.push([elementId(element), reason, action]);
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
        "UL"
      ]);

      const filteredElements = [];
      for (const el of elements) {
        const isInteractive = !noneInteractiveElements.has(el.tagName);
        logClassification(
          el,
          "element type: " + el.tagName,
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
    function filterVisibleElements(elements) {
      // TODO - can remove all children of hidden elements
      const filteredElements = [];
      for (const el of elements) {
        const style = getComputedStyle(el);
        const isVisible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
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
        logClassification(element, "has event listener", "kept");
        return true;
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
    }

    function looksInteractive(el) {
      const style = getComputedStyle(el);
      const classList = el.className.toLowerCase().split(/\s+/);
      const text = el.textContent.toLowerCase();
      const actionWords = [
        "click",
        "submit",
        "buy",
        "add",
        "order",
        "learn more",
        "sign up",
      ];

      const heuristicsDictionary = {
        backgroundIsNotTransparent:
          style.backgroundColor !== "rgba(0, 0, 0, 0)",
        hasPointerCursor: style.cursor === "pointer",
        paddingEnough:
          parseFloat(style.paddingLeft) > 5 ||
          parseFloat(style.paddingRight) > 5,
        hasRadius: parseFloat(style.borderRadius) > 0,
        hasButtonClass: classList.some((cls) =>
          /btn|button|clickable|interactive|cta|action/.test(cls)
        ),
        hasActionText: actionWords.some((w) => text.includes(w)),
      };

      let score = 0;
      for (const value of Object.values(heuristicsDictionary)) {
        if (value) {
          score++;
        }
      }
      const result = score > 2;
      const reason = Object.entries(heuristicsDictionary)
        .filter(([key, value]) => value)
        .map(([key]) => key)
        .join(", ");
      logClassification(
        el,
        "looks interactive, " + reason,
        result ? "kept" : "filtered"
      );
      return result;
    }

    classificationData = [["id", "reason", "action"]];
    let elements = Array.from(document.querySelectorAll("*"));
    const baseElements = baseFilter(elements);
    const interactiveElements = baseElements.filter(
      (el) =>
        hasRelatedRoles(el) || looksInteractive(el) || hasEventListeners(el) 
    );
    const nonKeyboardAccessibleElements = interactiveElements.filter(
      (el) => !isKeyboardAccessible(el)
    );
    return nonKeyboardAccessibleElements;
  }

  const elements = Array.from(document.querySelectorAll("*"));
  const groundTruth = new Set(
    elements.filter((e) => e.hasAttribute("unaccessible"))
  );
  const evaluatedElements = new Set(
    findNonKeyboardAccessibleInteractiveElements()
  );

  const csv = [["id", "label", "evaluated label"]];
  for (const element of elements) {
    csv.push([
      elementId(element),
      groundTruth.has(element),
      evaluatedElements.has(element),
    ]);
  }

  const truePositives = csv.filter(
    (row) => row[1] === true && row[2] === true
  ).length;
  const falsePositives = csv.filter(
    (row) => row[1] === false && row[2] === true
  ).length;
  const falseNegatives = csv.filter(
    (row) => row[1] === true && row[2] === false
  ).length;
  const trueNegatives = csv.filter(
    (row) => row[1] === false && row[2] === false
  ).length;

  //
  const sensitivity =
    truePositives + falseNegatives == 0
      ? 0
      : (truePositives * 1.0) / (truePositives + falseNegatives);
  const specificity =
    trueNegatives + falsePositives == 0
      ? 0
      : (trueNegatives * 1.0) / (trueNegatives + falsePositives);
  const precision =
    truePositives + falsePositives == 0
      ? 0
      : (truePositives * 1.0) / (truePositives + falsePositives);
  const f1Score =
    precision + sensitivity == 0
      ? 0
      : (2 * (precision * sensitivity)) / (precision + sensitivity);

  csv.push(["true positive", truePositives]);
  csv.push(["false positive", falsePositives]);
  csv.push(["false negative", falseNegatives]);
  csv.push(["true negative", trueNegatives]);

  csv.push(["sensitivity", sensitivity]);
  csv.push(["specificity", specificity]);
  csv.push(["precision", precision]);
  csv.push(["f1 score", f1Score]);
  return { csv, classificationData };
}

// const elements = findNonKeyboardAccessibleInteractiveElements();

module.exports = {
  runExperiment,
};
