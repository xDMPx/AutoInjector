// http://www.cse.yorku.ca/~oz/hash.html
export function djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (((hash << 5) + hash) + str.charCodeAt(i));

    }
    //non-negative 32-bit value
    return hash >>> 0;
}

export async function getAutoInjectorScripts(): Promise<string[] | undefined> {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: string[] | undefined };
    return scripts;
}

export async function saveAutoInjectorScript(script: string) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: string[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    scripts.push(script);
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function deleteAutoInjectorScript(i: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: string[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    scripts.splice(i, 1);
    await chrome.storage.local.set({ "scripts": scripts });
}
