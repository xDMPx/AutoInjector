import { Script } from "./interfaces.mjs";

// http://www.cse.yorku.ca/~oz/hash.html
export function djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (((hash << 5) + hash) + str.charCodeAt(i));

    }
    //non-negative 32-bit value
    return hash >>> 0;
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
