console.log("messagePassingScript");

window.addEventListener("AutoInjectorError", ((event: CustomEvent<string>) => {
    event.stopImmediatePropagation();
    chrome.runtime.sendMessage(event.detail);
}) as EventListener);
