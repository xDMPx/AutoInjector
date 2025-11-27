import { Script, AutoInjectorOptions, ScriptError } from "./interfaces.mjs";

// http://www.cse.yorku.ca/~oz/hash.html
export function djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (((hash << 5) + hash) + str.charCodeAt(i));

    }
    //non-negative 32-bit value
    return hash >>> 0;
}

export function canScriptRun(script: Script, tab_url: string): boolean {
    if (!script.enabled) return false;

    let url = script.url;
    const index_of_asterisk = url.indexOf("*");

    if (!url.startsWith("https://") && !url.startsWith("http://")) {
        tab_url = tab_url.replace("https://", "").replace("http://", "")
    }

    if (url.endsWith("/")) {
        url = url.slice(0, url.length - 1);
    }
    if (tab_url.endsWith("/")) {
        tab_url = tab_url.slice(0, tab_url.length - 1);
    }

    if (index_of_asterisk !== 0 && !(index_of_asterisk === -1 && tab_url === url)
        && !(index_of_asterisk > 0 && tab_url.startsWith(url.slice(0, index_of_asterisk)))) return false;

    return true;
}

export async function getAutoInjectorScripts(): Promise<Script[] | undefined> {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    return scripts;
}

export async function saveAutoInjectorScript(name: string, url: string, script: string, enabled: boolean = true) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    scripts.push({
        hash: djb2Hash(script),
        name: name,
        url: url,
        code: script,
        enabled: enabled
    });
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function deleteAutoInjectorScript(i: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    scripts.splice(i, 1);
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function editAutoInjectorScript(i: number, name: string, url: string, script: string) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    scripts[i].name = name;
    scripts[i].url = url;
    scripts[i].code = script;
    scripts[i].hash = djb2Hash(script);
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function enableAutoInjectorScript(i: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    scripts[i].enabled = true;
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function disableAutoInjectorScript(i: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    scripts[i].enabled = false;
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function getAutoInjectorOptions(): Promise<AutoInjectorOptions> {
    let { ai_options } = await chrome.storage.local.get("ai_options") as { [key: string]: AutoInjectorOptions | undefined };

    if (ai_options === undefined) {
        ai_options = {
            confirmation_dialog_remove: true,
            confirmation_dialog_edit: false,
            enable_remove_indent_shift_tab: true,
            enable_insert_tab_on_tab: true,
        }
    }

    return ai_options;
}

export async function setAutoInjectorOptions(ai_options: AutoInjectorOptions) {
    await chrome.storage.local.set({ "ai_options": ai_options });
}

export async function saveAutoInjectorScriptError(script_error: ScriptError) {
    let { scripts_errors } = await chrome.storage.local.get("scripts_errors") as { [key: string]: ScriptError[] | undefined };
    if (scripts_errors === undefined) {
        scripts_errors = [];
    }
    scripts_errors.push(script_error);
    await chrome.storage.local.set({ "scripts_errors": scripts_errors });
}

