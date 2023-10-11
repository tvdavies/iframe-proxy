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

  function wrapTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim().length === 0) {
        return;
      }

      // If this text is hidden, don't wrap it
      if (window.getComputedStyle(node.parentNode).display === "none") {
        return;
      }

      const span = document.createElement("span");
      const id = nextId++;
      span.setAttribute("data-text-id", "" + id);
      window.textById[id] = node.textContent;

      node.parentNode.replaceChild(span, node);
      span.appendChild(node);
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        wrapTextNodes(node.childNodes[i]);
      }
    }
  }

  wrapTextNodes(document.body);

  // Get original URL from meta original-url tag
  const originalUrl = document.querySelector(
    'meta[name="original-url"]'
  ).content;

  window.parent.postMessage(
    {
      type: "PAGE_LOADED",
      data: {
        plainText: document.documentElement.innerText,
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
      for (const id of event.data.data) {
        const el = document.querySelector(`[data-text-id="${id}"]`);
        el.setAttribute("data-text-highlighted", true);
      }
      return;
    }

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
      const el = document.querySelector(`[data-text-id="${event.data.data}"]`);
      const focus = !el.hasAttribute("data-text-focused");

      // Remove data-text-focused from all elements
      document.querySelectorAll("[data-text-focused]").forEach((el) => {
        el.removeAttribute("data-text-focused");
      });

      // Set the document zoom to 2x if focussing
      document.body.style.zoom = focus ? 2 : 1;

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
