import { AutoInjectorOptions, ScriptError } from "./interfaces.mjs";
import { canScriptRun, djb2Hash, getAutoInjectorScripts, saveAutoInjectorScript, saveAutoInjectorScriptError, setAutoInjectorOptions } from "./utils.mjs";

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
    if (details.reason === "update") {
        await migrateFrom010To020();
        await migrateFrom020To021();
        await migrateFrom021To022();
        await migrateFrom022To023();
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
            confirmation_dialog_remove: true,
            confirmation_dialog_edit: false,
            enable_remove_indent_shift_tab: true,
            enable_insert_tab_on_tab: true,
        }
        setAutoInjectorOptions(ai_options);
    }
}

async function migrateFrom022To023() {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: { hash: number | undefined, name: string, url: string, code: string, enabled: boolean }[] | undefined };
    if (scripts === undefined) return;
    const migrated_scripts = scripts.map((s) => { if (s.hash === undefined) s.hash = djb2Hash(s.code); return s; });
    await chrome.storage.local.remove("scripts");
    await chrome.storage.local.set({ "scripts": migrated_scripts });
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
    if (!tab_url.startsWith("http")) return;
    for (const { hash, code } of scripts.filter((s) => canScriptRun(s, tab_url)).map((s) => { return { hash: s.hash, code: s.code } })) {
        await chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            args: [],
            func: messagePassingScript,
        });
        await chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            args: [code, hash, chrome.runtime.id],
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
        if (!tab_url.startsWith("http")) return;
        for (const { hash, code } of scripts.filter((s) => canScriptRun(s, tab_url)).map((s) => { return { hash: s.hash, code: s.code } })) {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                args: [],
                func: messagePassingScript,
            });
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                args: [code, hash, chrome.runtime.id],
                //injectImmediately: true,
                world: "MAIN",
                func: injectScript,
            });
        }
    }
});

chrome.runtime.onMessage.addListener(async (_msg) => {
    const msg = _msg as ScriptError;
    await saveAutoInjectorScriptError(msg);
    console.log(msg);
    chrome.runtime.sendMessage({ message: "ErrorUpdate" });
});

chrome.runtime.onMessageExternal.addListener(async (_msg) => {
    const msg = _msg as ScriptError;
    await saveAutoInjectorScriptError(msg);
    console.log(msg);
    chrome.runtime.sendMessage({ message: "ErrorUpdate" });
});

function injectScript(code: string, hash: number, id: string) {
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


    document.addEventListener("securitypolicyviolation", (e) => {
        const target = e.target;
        if (target !== null && target instanceof HTMLElement) {
            if (target.id.startsWith("autoinjector-script-") && target.id.endsWith(`${hash}`)) {
                console.error(`AutoInjector; Error: ${e}`);
                if (typeof chrome !== 'undefined') {
                    chrome.runtime.sendMessage(id, {
                        hash: hash,
                        message: `CSP violation: directive ${e.violatedDirective} prevented injection of script at ${document.URL}`,
                        timestamp: (new Date()).getTime(),
                    });
                }
                else {
                    const event = new CustomEvent<{ hash: number, message: string, timestamp: number }>("AutoInjectorError", {
                        detail: {
                            hash: hash,
                            message: `CSP violation: directive ${e.violatedDirective} prevented injection of script at ${document.URL}`,
                            timestamp: (new Date()).getTime(),
                        }
                    });
                    window.dispatchEvent(event);
                }
            }
        }
    });

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.id = `autoinjector-script-${hash}`;
    script.text = `
    try { ${code} }
    catch (e) { 
        console.error(\`AutoInjector; Error \${e}\`); 
        if (typeof chrome !== 'undefined') {
            chrome.runtime.sendMessage("${id}", { hash: ${hash}, message: \`\${e}; Occurred at: \${document.URL}\`, timestamp: (new Date()).getTime() });
        } else {
            const event = new CustomEvent("AutoInjectorError", {
                detail: {
                    hash: ${hash},
                    message: \`\${e}; Occurred at: \${document.URL}\`,
                    timestamp: (new Date()).getTime()
                }
            });
            window.dispatchEvent(event);
        }
    }`;
    document.body.appendChild(script);
    console.log(script);
}

function messagePassingScript() {
    window.addEventListener("AutoInjectorError", ((event: CustomEvent<string>) => {
        event.stopImmediatePropagation();
        chrome.runtime.sendMessage(event.detail);
    }) as EventListener);
}
