/** classificationData is for debugging in the browser */
let classificationData = [];
function printClassificationData(elementId) {
  const filteredData = classificationData.filter(
    (info) => info.id === elementId
  );
  for (const info of filteredData) {
    console.log(info);
  }
}
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
      const elementInfo = {
        id: elementId(element),
        tagName: element.tagName,
        className: element.className,
        reason: reason,
        action: action,
      };
    
      classificationData.push(elementInfo);
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
    function filterNotKeyboardAccessible(elements) {
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
        logClassification(el, "(LOG) - event listeners: ", keydown.join(", "));
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
    
    
    classificationData = [];
    let elements = Array.from(document.querySelectorAll("*"));
    console.log(elements.length);
    const baseElements = baseFilter(elements);
    const iterativeElements = filterIterativeOrLooksLike(baseElements);
    const nonKeyboardAccessibleElements = filterNotKeyboardAccessible(iterativeElements);
    return nonKeyboardAccessibleElements.map((e) => ({
      element: e,
      id: elementId(e),
    }));
     
  }
  const elements = Array.from(document.querySelectorAll("*"));
  
  const groundTruth = new Set (elements.filter((e) => e.hasAttribute('unaccessible')));
  const evaluatedElements = new Set(findNonKeyboardAccessibleInteractiveElements())
  
  
  const csv = [["id", "label", "evaluated label"]];
  for (const element of elements) {
    csv.push([elementId(element), groundTruth.has(element), evaluatedElements.has(element)]);
  }
  
  const truePositives = csv.filter((row) => row[1] === true && row[2] === true).length;
  const falsePositives = csv.filter((row) => row[1] === false && row[2] === true).length;
  const falseNegatives = csv.filter((row) => row[1] === true && row[2] === false).length;
  const trueNegatives = csv.filter((row) => row[1] === false && row[2] === false).length;

  const sensitivity =  truePositives / (truePositives + falseNegatives);
  const specificity = trueNegatives / (trueNegatives + falsePositives);
  const precision = truePositives / (truePositives + falsePositives);
  const f1Score = 2 * (precision * sensitivity) / (precision + sensitivity);
  
  csv.push(["true positives", truePositives]);
  csv.push(["false positives", falsePositives]);
  csv.push(["false negatives", falseNegatives]);
  csv.push(["true negatives", trueNegatives]);
  
  csv.push(["sensitivity", sensitivity]);
  csv.push(["specificity", specificity]);
  csv.push(["precision", precision]);
  csv.push(["f1 score", f1Score]);
  return csv;
}

// const elements = findNonKeyboardAccessibleInteractiveElements();

module.exports = {
  runExperiment
};
