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
    if (event.data.type === "HIGHLIGHT_TEXTS") {
      for (const id of event.data.data) {
        const el = document.querySelector(`[data-text-id="${id}"]`);
        el.classList.add(
          "bg-red-500",
          "bg-opacity-20",
          "p-2",
          "rounded-md",
          "border-2",
          "border-solid",
          "border-red-500",
          "inline-block"
        );
      }
    }
  });
})();
