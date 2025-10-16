const code = "alert(\"Hello! I am an alert box!! Caused by AutoInjector\");";

chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.OnActivatedInfo) => {
    await chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        args: [code],
        //injectImmediately: true,
        world: "MAIN",
        func: (code) => {
            const auto_injector_script = document.getElementById("autoinjector-script");
            if (auto_injector_script !== null) return;
            console.log(`AutoInjector; Script Injection => ${code}`);
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.id = "autoinjector-script";
            script.text = code;
            document.body.appendChild(script);
            console.log(script);
        }
    });
});
