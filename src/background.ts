import { AutoInjectorOptions } from "./interfaces.mjs";
import { djb2Hash, canScriptRun, getAutoInjectorScripts, saveAutoInjectorScript, setAutoInjectorOptions } from "./utils.mjs";

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
    if (details.reason === "update") {
        await migrateFrom010To020();
        await migrateFrom020To021();
        await migrateFrom021To022();
        let scripts = await getAutoInjectorScripts();
        if (scripts === undefined) {
            saveAutoInjectorScript("AutoInjector Test Script", "*", "alert(\"Hello! I am an alert box!! Caused by AutoInjector\");", false);
        }
    }
});

async function migrateFrom010To020() {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: { name: string | undefined, code: string, enabled: boolean }[] | undefined };
    if (scripts === undefined) return;
    let i = 0;
    const migrated_scripts = scripts.map((s) => { if (s.name === undefined) s.name = `Script ${i++}`; return s; });
    await chrome.storage.local.remove("scripts");
    await chrome.storage.local.set({ "scripts": migrated_scripts });
}

async function migrateFrom020To021() {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: { name: string, url: string | undefined, code: string, enabled: boolean }[] | undefined };
    if (scripts === undefined) return;
    const migrated_scripts = scripts.map((s) => { if (s.url === undefined) s.url = "*"; return s; });
    await chrome.storage.local.remove("scripts");
    await chrome.storage.local.set({ "scripts": migrated_scripts });
}

async function migrateFrom021To022() {
    let { ai_options } = await chrome.storage.local.get("ai_options") as { [key: string]: AutoInjectorOptions | undefined };
    if (ai_options === undefined) {
        ai_options = {
            confirmation_dialog_remove: true
        }
        setAutoInjectorOptions(ai_options);
    }
}

chrome.action.onClicked.addListener(async (_tab: chrome.tabs.Tab) => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("dashboard.html")
    });
});

chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.OnActivatedInfo) => {
    const scripts = await getAutoInjectorScripts();
    if (scripts === undefined) return;
    const tab = await chrome.tabs.get(activeInfo.tabId);
    let tab_url = tab.url || tab.pendingUrl;
    if (tab_url === undefined) return;
    for (const { code } of scripts.filter((s) => canScriptRun(s, tab_url)).map((s) => { return { code: s.code } })) {
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
        const tab = await chrome.tabs.get(tabId);
        let tab_url = tab.url || tab.pendingUrl;
        if (tab_url === undefined) return;
        for (const { code } of scripts.filter((s) => canScriptRun(s, tab_url)).map((s) => { return { code: s.code } })) {
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
