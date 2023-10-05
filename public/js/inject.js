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
      const id = generateId();
      el.setAttribute("data-text-id", id);
      window.textById[id] = el.innerText;
    });
  });

  const message = {
    type: "TEXTS",
    data: window.textById,
  };

  console.log("Sending message to parent:", message);
  window.parent.postMessage(message, "*");

  window.addEventListener("message", (event) => {
    if (event.data.type === "HIGHLIGHT_TEXTS") {
      console.log("HIGHLIGHT_TEXTS", event.data.data);

      Object.keys(event.data.data).forEach((id) => {
        const el = document.querySelector(`[data-text-id="${id}"]`);
        console.log("Highlighting text with id:", id, el);
        el.classList.add("bg-yellow-200", "bg-opacity-20", "p-2");
      });
    }
  });
})();
