const code = "alert(\"Hello! I am an alert box!! Caused by AutoInjector\");";

chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.OnActivatedInfo) => {
    await chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        args: [code],
        //injectImmediately: true,
        world: "MAIN",
        func: (c) => {
            console.log(`AutoInjector; Script Injection => ${c}`);
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.text = c;
            document.body.appendChild(script);
            console.log(script);

        }
    });
})
