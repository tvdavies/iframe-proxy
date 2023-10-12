(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    .highlight [data-text-highlighted]:not([data-text-focused]) {
      background: rgb(255, 0, 0, 0.1);
    }

    [data-text-focused] {
      background: rgb(255, 0, 0, 0.4);
    }
  `;
  document.head.appendChild(style);

  document.body.classList.add("highlight");

  let nextId = 1;

  window.textById = {};

  window.text = "";

  // We want to find all nodes that contain text.
  // If the text is just a link or a button, we don't care about it.
  // We want to find all the text that makes up the main content, and split it into paragraphs or sections.
  // The parent element of each paragraph or section should be given a data-text-id attribute.
  // The text of each paragraph or section should be stored in a global object called window.textById.
  // The key of each entry in window.textById should be the data-text-id attribute of the parent element.
  // The value of each entry in window.textById should be the text content of the parent element.
  // The parent element should be given a data-text-highlighted attribute when it is highlighted.
  // The parent element should be given a data-text-focused attribute when it is focused.

  const elementsToTarget = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
  ];

  const elementsToIgnore = ["sup"];

  function getTextWeCareAbout(el) {
    // Loop through all the child nodes of this element
    // and append the innerText of each child node to the text variable
    // as long as the tag is not in our list of tags to ignore
    let text = "";

    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (
        child.nodeType === Node.ELEMENT_NODE &&
        !elementsToIgnore.includes(child.tagName.toLowerCase())
      ) {
        text += getTextWeCareAbout(child);
      }
    }

    // return text.replaceAll("\n", "").trim();

    return text;
  }

  for (const tag of elementsToTarget) {
    document.querySelectorAll(tag).forEach((el) => {
      const text = getTextWeCareAbout(el);

      if (text.length === 0) return;

      const id = nextId++;

      el.setAttribute("data-text-id", "" + id);
      // window.textById[id] = {
      //   text: text,
      //   html: el.innerHTML,
      // };
      window.textById[id] = el.innerText;
      window.text += el.innerText + "\n\n";
    });
  }

  // Get original URL from meta original-url tag
  const originalUrl = document.querySelector(
    'meta[name="original-url"]'
  ).content;

  window.parent.postMessage(
    {
      type: "PAGE_LOADED",
      data: {
        plainText: window.text, //document.documentElement.innerText,
        texts: window.textById,
        url: originalUrl,
      },
    },
    "*"
  );

  window.addEventListener("message", (event) => {
    if (event.data.type === "HIGHLIGHT") {
      const enabled = event.data.data;

      if (enabled) {
        document.body.classList.add("highlight");
      } else {
        document.body.classList.remove("highlight");
      }

      return;
    }

    if (event.data.type === "HIGHLIGHT_TEXTS") {
      const complianceResponses = event.data.data;

      for (const {
        input_text,
        id: complianceResponseId,
      } of complianceResponses) {
        console.log("HIGHLIGHT_TEXT", { text, complianceResponseId });

        for (const id in window.textById) {
          if (window.textById[id].includes(input_text)) {
            console.log("FOUND TEXT", { id, input_text });

            const el = document.querySelector(`[data-text-id="${id}"]`);
            el.setAttribute("data-text-highlighted", true);

            // Append compliance id to data-compliance-id attribute
            // if it doesn't already exist
            const complianceIds = el.getAttribute("data-compliance-id");
            if (!complianceIds) {
              el.setAttribute("data-compliance-id", complianceResponseId);
            } else if (!complianceIds.includes(complianceResponseId)) {
              el.setAttribute(
                "data-compliance-id",
                complianceIds + " " + complianceResponseId
              );
            }

            break;
          }
        }
      }

      return;
    }

    if (event.data.type === "CLEAR_COMPLIANCE") {
      // Remove all spans with data-compliance-id attributes
      // leaving the child text nodes intact
      document.querySelectorAll("[data-compliance-id]").forEach((el) => {
        el.removeAttribute("data-compliance-id");
      });

      return;
    }

    // if (event.data.type === "HIGHLIGHT_TEXTS") {
    //   for (const id of event.data.data) {
    //     const el = document.querySelector(`[data-text-id="${id}"]`);
    //     el.setAttribute("data-text-highlighted", true);
    //   }
    //   return;
    // }

    if (event.data.type === "UNHIGHLIGHT_ALL_TEXTS") {
      document.querySelectorAll("[data-text-highlighted]").forEach((el) => {
        el.removeAttribute("data-text-highlighted");
      });
      return;
    }

    if (event.data.type === "UNHIGHLIGHT_TEXTS") {
      for (const id of event.data.data) {
        const el = document.querySelector(`[data-text-id="${id}"]`);
        el.removeAttribute("data-text-highlighted");
      }
      return;
    }

    if (event.data.type === "FOCUS_TEXT") {
      // Check if this element is already focussed - if it is we will toggle it off
      const el = document.querySelector(
        `[data-compliance-id~="${event.data.data}"]`
      );
      const focus = !el.hasAttribute("data-text-focused");

      // Remove data-text-focused from all elements
      document.querySelectorAll("[data-text-focused]").forEach((el) => {
        el.removeAttribute("data-text-focused");
      });

      // Set the document zoom to 2x if focussing
      // document.body.style.zoom = focus ? 2 : 1;

      if (focus) {
        el.setAttribute("data-text-focused", true);

        // Scroll the element into view
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }

      return;
    }
  });
})();
