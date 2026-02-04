import { AutoInjectorMessage, AutoInjectorMessageType, AutoInjectorOptions } from "./interfaces.mjs";
import { canScriptRun, canUserCSSRun, djb2Hash, getAutoInjectorOptions, getAutoInjectorScripts, getAutoInjectorUserCSS, saveAutoInjectorScript, saveAutoInjectorScriptError, saveAutoInjectorUserCSS, setAutoInjectorOptions } from "./utils.mjs";

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
    if (details.reason === "install") {
        let scripts = await getAutoInjectorScripts();
        if (scripts === undefined) {
            saveAutoInjectorScript("AutoInjector Test Script", "*", "alert(\"Hello! I am an alert box!! Caused by AutoInjector\");", false, false);
        }
        let user_css = await getAutoInjectorUserCSS();
        if (user_css === undefined) {
            saveAutoInjectorUserCSS("AutoInjector Test User CSS", "*", 'body { border: 20px dotted red; }', false);
        }
        let ai_options = await getAutoInjectorOptions();
        setAutoInjectorOptions(ai_options);
    }
    if (details.reason === "update") {
        await migrateFrom010To020();
        await migrateFrom020To021();
        await migrateFrom021To022();
        await migrateFrom022To023();
        await migrateFrom023To024();
        await migrateFrom024To025();
        await migrateFrom025To026();
        await migrateFrom030To031();
        let scripts = await getAutoInjectorScripts();
        if (scripts === undefined) {
            saveAutoInjectorScript("AutoInjector Test Script", "*", "alert(\"Hello! I am an alert box!! Caused by AutoInjector\");", false, false);
        }
        let user_css = await getAutoInjectorUserCSS();
        if (user_css === undefined) {
            saveAutoInjectorUserCSS("AutoInjector Test User CSS", "*", 'body { border: 20px dotted red; }', false);
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
            confirmation_dialog_edit_cancel: true,
            enable_remove_indent_shift_tab: true,
            enable_insert_tab_on_tab: true,
            enable_setting_inject_immediately: false,
            warn_about_dupilcate_scripts: true,
            warn_about_dupilcate_user_css: true
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

async function migrateFrom023To024() {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: { hash: number, name: string, url: string, code: string, enabled: boolean, injectImmediately: boolean | undefined }[] | undefined };
    if (scripts === undefined) return;
    const migrated_scripts = scripts.map((s) => { if (s.injectImmediately === undefined) s.injectImmediately = false; return s; });
    await chrome.storage.local.remove("scripts");
    await chrome.storage.local.set({ "scripts": migrated_scripts });

    let { ai_options } = await chrome.storage.local.get("ai_options") as { [key: string]: AutoInjectorOptions };
    if (ai_options.enable_setting_inject_immediately === undefined) {
        ai_options.enable_setting_inject_immediately = false;
        await setAutoInjectorOptions(ai_options);
    }
}

async function migrateFrom024To025() {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: { hash: number, name: string, url: string, code: string, enabled: boolean, injectImmediately: boolean }[] | undefined };
    if (scripts === undefined) return;

    const names: Set<String> = new Set();
    const migrated_scripts = [];
    for (let script of scripts) {
        while (names.has(script.name)) {
            const rand = Math.floor(Math.random() * 10000);
            script.name += `_${rand}`;
        }
        names.add(script.name);
        migrated_scripts.push(script);
    }

    await chrome.storage.local.remove("scripts");
    await chrome.storage.local.set({ "scripts": migrated_scripts });


    let { ai_options } = await chrome.storage.local.get("ai_options") as { [key: string]: AutoInjectorOptions };
    if (ai_options.confirmation_dialog_edit_cancel === undefined) {
        ai_options.confirmation_dialog_edit_cancel = true;
        await setAutoInjectorOptions(ai_options);
    }
}

async function migrateFrom025To026() {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: { code_hash: number | undefined, hash: number, name: string, url: string, code: string, enabled: boolean, injectImmediately: boolean }[] | undefined };
    if (scripts === undefined) return;
    const migrated_scripts = scripts.map((s) => {
        if (s.code_hash === undefined) {
            s.hash = djb2Hash(s.name + s.code);
            s.code_hash = djb2Hash(s.code);
        }
        return s;
    });
    await chrome.storage.local.set({ "scripts": migrated_scripts });

    let { ai_options } = await chrome.storage.local.get("ai_options") as { [key: string]: AutoInjectorOptions };
    if (ai_options.warn_about_dupilcate_scripts === undefined) {
        ai_options.warn_about_dupilcate_scripts = true;
        await setAutoInjectorOptions(ai_options);
    }
}

async function migrateFrom030To031() {
    const { user_css } = await chrome.storage.local.get("user_css") as { [key: string]: { hash: number, name: string, url: string, css: string, enabled: boolean, css_hash: number | undefined }[] | undefined };
    if (user_css === undefined) return;
    const migrated_user_css = user_css.map((s) => {
        if (s.css_hash === undefined) {
            s.hash = djb2Hash(s.name + s.css);
            s.css_hash = djb2Hash(s.css);
        }
        return s;
    });
    await chrome.storage.local.set({ "user_css": migrated_user_css });

    let { ai_options } = await chrome.storage.local.get("ai_options") as { [key: string]: AutoInjectorOptions };
    if (ai_options.warn_about_dupilcate_user_css === undefined) {
        ai_options.warn_about_dupilcate_user_css = true;
        await setAutoInjectorOptions(ai_options);
    }
}

chrome.action.onClicked.addListener(async (_tab: chrome.tabs.Tab) => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("dashboard.html")
    });
});

chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.OnActivatedInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    injectUserScripts(tab);
    injectUserCSS(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId: number, updateinfo: chrome.tabs.OnUpdatedInfo) => {
    if (updateinfo.status === chrome.tabs.TabStatus.COMPLETE) {
        const tab = await chrome.tabs.get(tabId);
        injectUserScripts(tab);
        injectUserCSS(tab);
    }
});

chrome.runtime.onMessage.addListener(async (_msg) => {
    const msg = _msg as AutoInjectorMessage;
    console.log(msg);
    if (msg.type === AutoInjectorMessageType.ScriptError) {
        await saveAutoInjectorScriptError(msg.scriptError!);
        const update_msg: AutoInjectorMessage = {
            type: AutoInjectorMessageType.ErrorUpdate,
        } as AutoInjectorMessage;
        chrome.runtime.sendMessage(update_msg);
    } else if (msg.type === AutoInjectorMessageType.ErrorUpdate) {
        const update_msg: AutoInjectorMessage = {
            type: AutoInjectorMessageType.ErrorUpdate,
        } as AutoInjectorMessage;
        chrome.runtime.sendMessage(update_msg);
    }
});

chrome.runtime.onMessageExternal.addListener(async (_msg) => {
    const msg = _msg as AutoInjectorMessage;
    console.log(msg);
    if (msg.type === AutoInjectorMessageType.ScriptError) {
        await saveAutoInjectorScriptError(msg.scriptError!);
        const update_msg: AutoInjectorMessage = {
            type: AutoInjectorMessageType.ErrorUpdate,
        } as AutoInjectorMessage;
        chrome.runtime.sendMessage(update_msg);
    }
});

async function injectUserScripts(tab: chrome.tabs.Tab) {
    const scripts = await getAutoInjectorScripts();
    if (scripts === undefined) return;
    let tab_url = tab.url || tab.pendingUrl;
    if (tab_url === undefined) return;
    if (!tab_url.startsWith("http")) return;
    for (const { hash, code, injectImmediately } of scripts.filter((s) => canScriptRun(s, tab_url)).map((s) => { return { hash: s.hash, code: s.code, injectImmediately: s.injectImmediately } })) {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            args: [code, hash, chrome.runtime.id],
            injectImmediately: injectImmediately,
            world: "MAIN",
            func: injectScript,
        });
    }
}

async function injectUserCSS(tab: chrome.tabs.Tab) {
    const user_css = await getAutoInjectorUserCSS();
    if (user_css === undefined) return;
    let tab_url = tab.url || tab.pendingUrl;
    if (tab_url === undefined) return;
    if (!tab_url.startsWith("http")) return;
    for (const css of user_css.filter((s) => canUserCSSRun(s, tab_url)).map((s) => { return s.css })) {
        await chrome.scripting.insertCSS({
            target: { tabId: tab.id! },
            css: css
        });
    }
}

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
                enum AutoInjectorMessageType {
                    ErrorUpdate,
                    ScriptError,
                    SettingsUpdate
                }
                if (typeof chrome !== 'undefined') {
                    const msg: AutoInjectorMessage = {
                        type: AutoInjectorMessageType.ScriptError,
                        scriptError: {
                            hash: hash,
                            message: `CSP violation: directive ${e.violatedDirective} prevented injection of script;`,
                            url: document.URL,
                            timestamp: (new Date()).getTime(),
                        }
                    } as AutoInjectorMessage;
                    chrome.runtime.sendMessage(id, msg);
                }
                else {
                    const msg: AutoInjectorMessage = {
                        type: AutoInjectorMessageType.ScriptError,
                        scriptError: {
                            hash: hash,
                            message: `CSP violation: directive ${e.violatedDirective} prevented injection of script;`,
                            url: document.URL,
                            timestamp: (new Date()).getTime(),
                        }
                    } as AutoInjectorMessage;
                    const event = new CustomEvent<AutoInjectorMessage>("AutoInjectorError", {
                        detail: msg,
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
    function autoInjectorLogError(e) {
        console.error(\`AutoInjector; Error \${e}\`); 

        var AutoInjectorMessageType;
        (function (AutoInjectorMessageType) {
            AutoInjectorMessageType[AutoInjectorMessageType["ErrorUpdate"] = 0] = "ErrorUpdate";
            AutoInjectorMessageType[AutoInjectorMessageType["ScriptError"] = 1] = "ScriptError";
            AutoInjectorMessageType[AutoInjectorMessageType["SettingsUpdate"] = 2] = "SettingsUpdate";
        })(AutoInjectorMessageType || (AutoInjectorMessageType = {}));

        if (typeof chrome !== 'undefined') { 
            const msg = {
                type: AutoInjectorMessageType.ScriptError,
                scriptError: {
                    hash: ${hash},
                    message: \`\${e};\`,
                    url: document.URL,
                    timestamp: (new Date()).getTime() 
                }
            };
            chrome.runtime.sendMessage("${id}", msg);
        } else {
            const msg = {
                type: AutoInjectorMessageType.ScriptError,
                scriptError: {
                    hash: ${hash},
                    message: \`\${e};\`,
                    url: document.URL,
                    timestamp: (new Date()).getTime() 
                }
            };
            const event = new CustomEvent("AutoInjectorError", { detail: msg });
            window.dispatchEvent(event);
        }
    }
    try { ${code} }
    catch (e) { autoInjectorLogError(e) } `;
    document.body.appendChild(script);
    console.log(script);
}
