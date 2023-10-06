(() => {
  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  const elementsToTarget = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "span",
  ];

  window.textById = {};

  elementsToTarget.forEach((tag) => {
    document.querySelectorAll(tag).forEach((el) => {
      // If the parent already has a data-text-id, skip this element
      if (el.closest("[data-text-id]")) {
        return;
      }

      // If the element is not visible, skip it
      if (el.offsetParent === null) {
        return;
      }

      const text = el.innerText;

      if (text.trim().length === 0) {
        return;
      }

      const id = generateId();
      el.setAttribute("data-text-id", id);
      window.textById[id] = el.innerText;
    });
  });

  const message = {
    type: "TEXTS",
    data: window.textById,
  };

  window.parent.postMessage(message, "*");

  window.addEventListener("message", (event) => {
    if (event.data.type === "ADD_CLASSES") {
      for (const id of event.data.data.ids) {
        const el = document.querySelector(`[data-text-id="${id}"]`);

        for (const className of event.data.data.classes) {
          el.classList.add(className);
        }
      }
      return;
    }

    if (event.data.type === "REMOVE_CLASSES") {
      for (const id of event.data.data.ids) {
        const el = document.querySelector(`[data-text-id="${id}"]`);

        for (const className of event.data.data.classes) {
          el.classList.remove(className);
        }
      }
      return;
    }
  });
})();
