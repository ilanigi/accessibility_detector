/** classificationData is for debugging in the browser */
let classificationData = [];

function runExperiment(threshold = 2) {
  function elementId(element) {
    return `${element.tagName}-${element.id}-${element.className}`;
  }
  function findNonKeyboardAccessibleInteractiveElements(threshold = 2) {
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
        "UL",
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

    function looksInteractive(el, threshold = 2) {
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
      const result = score >= threshold;
      const reason = Object.entries(heuristicsDictionary)
        .filter(([key, value]) => value)
        .map(([key]) => key)
        .join("; ");
      logClassification(
        el,
        "looks interactive: " + reason,
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
    findNonKeyboardAccessibleInteractiveElements(threshold)
  );

  const csv = [["id", "label", "evaluated label"]];
  for (const element of elements) {
    csv.push([
      elementId(element),
      groundTruth.has(element),
      evaluatedElements.has(element),
    ]);
  }

  const truePositive = csv.filter(
    (row) => row[1] === true && row[2] === true
  ).length;
  const falsePositive = csv.filter(
    (row) => row[1] === false && row[2] === true
  ).length;
  const falseNegative = csv.filter(
    (row) => row[1] === true && row[2] === false
  ).length;
  const trueNegative = csv.filter(
    (row) => row[1] === false && row[2] === false
  ).length;

  const sensitivity =
    truePositive + falseNegative == 0
      ? 0
      : (truePositive * 1.0) / (truePositive + falseNegative);
  const specificity =
    trueNegative + falsePositive == 0
      ? 0
      : (trueNegative * 1.0) / (trueNegative + falsePositive);
  const precision =
    truePositive + falsePositive == 0
      ? 0
      : (truePositive * 1.0) / (truePositive + falsePositive);
  const f1Score =
    precision + sensitivity == 0
      ? 0
      : (2.0 * (precision * sensitivity)) / (precision + sensitivity);

  const scores = [
    truePositive,
    falsePositive,
    falseNegative,
    trueNegative,
    sensitivity.toFixed(4),
    specificity.toFixed(4),
    precision.toFixed(4),
    f1Score.toFixed(4),
  ];
  return { csv, classificationData, scores };
}

// const elements = findNonKeyboardAccessibleInteractiveElements();

module.exports = {
  runExperiment,
};
