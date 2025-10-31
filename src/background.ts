import { djb2Hash, getAutoInjectorScripts, saveAutoInjectorScript } from "./utils.mjs";

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
    if (details.reason === "update") {
        let scripts = await getAutoInjectorScripts();
        if (scripts === undefined) {
            saveAutoInjectorScript("AutoInjector Test Script", "alert(\"Hello! I am an alert box!! Caused by AutoInjector\");", false);
        }
    }
});

chrome.action.onClicked.addListener(async (_tab: chrome.tabs.Tab) => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("dashboard.html")
    });
});

chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.OnActivatedInfo) => {
    const scripts = await getAutoInjectorScripts();
    if (scripts === undefined) return;
    for (const code of scripts.filter((s) => s.enabled).map((s) => s.code)) {
        await chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            args: [code, djb2Hash(code)],
            //injectImmediately: true,
            world: "MAIN",
            func: injectScript,
        });
    }
});

chrome.tabs.onUpdated.addListener(async (tabId: number, updateinfo: chrome.tabs.OnUpdatedInfo) => {
    if (updateinfo.status === chrome.tabs.TabStatus.COMPLETE) {
        const scripts = await getAutoInjectorScripts();
        if (scripts === undefined) return;
        for (const code of scripts.filter((s) => s.enabled).map((s) => s.code)) {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                args: [code, djb2Hash(code)],
                //injectImmediately: true,
                world: "MAIN",
                func: injectScript,
            });
        }
    }
});

function injectScript(code: string, hash: number) {
    const auto_injector_script = document.getElementById(`autoinjector-script-${hash}`);
    if (auto_injector_script !== null) return;

    console.log(`AutoInjector; Script Injection => ${code}`);

    // Crate Trusted Types policy to allow injection on website with Trusted Types requirements 
    if (window.trustedTypes !== undefined) {
        if (window.trustedTypes.defaultPolicy === null) {
            window.trustedTypes?.createPolicy('default', {
                createScript: (input: string) => {
                    return input;
                }
            });
        }
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.id = `autoinjector-script-${hash}`;
    script.text = code;
    document.body.appendChild(script);
    console.log(script);

}
