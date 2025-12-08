window.addEventListener("AutoInjectorError", ((event: CustomEvent) => {
    event.stopImmediatePropagation();
    chrome.runtime.sendMessage(event.detail);
}) as EventListener);
