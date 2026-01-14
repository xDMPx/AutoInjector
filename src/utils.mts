import { Script, AutoInjectorOptions, ScriptError, AutoInjectorMessage, AutoInjectorMessageType, CascadingStyleSheets } from "./interfaces.mjs";

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

export function canUserCSSRun(css: CascadingStyleSheets, tab_url: string): boolean {
    if (!css.enabled) return false;

    let url = css.url;
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

export async function getAutoInjectorUserCSS(): Promise<CascadingStyleSheets[] | undefined> {
    const { user_css } = await chrome.storage.local.get("user_css") as { [key: string]: CascadingStyleSheets[] | undefined };
    return user_css;
}

export async function saveAutoInjectorScript(name: string, url: string, script: string, injectImmediately: boolean, enabled: boolean = true): Promise<boolean> {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    if (scripts.find((s) => s.name === name) !== undefined) return false;

    scripts.push({
        hash: djb2Hash(name + script),
        name: name,
        url: url,
        code: script,
        code_hash: djb2Hash(script),
        enabled: enabled,
        injectImmediately: injectImmediately
    });
    await chrome.storage.local.set({ "scripts": scripts });

    return true;
}

export async function saveAutoInjectorUserCSS(name: string, url: string, css: string, enabled: boolean = true): Promise<boolean> {
    let { user_css } = await chrome.storage.local.get("user_css") as { [key: string]: CascadingStyleSheets[] | undefined };
    if (user_css === undefined) {
        user_css = [];
    }
    if (user_css.find((s) => s.name === name) !== undefined) return false;

    user_css.push({
        hash: djb2Hash(name + css),
        name: name,
        url: url,
        css: css,
        enabled: enabled,
    });
    await chrome.storage.local.set({ "user_css": user_css });

    return true;
}

export async function deleteAutoInjectorScript(hash: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    const i = scripts.findIndex((s) => s.hash === hash);
    if (i === -1) return;

    const deleted_script = scripts.splice(i, 1);
    deletedAutoInjectorScriptErrorsForHash(deleted_script[0].hash);

    await chrome.storage.local.set({ "scripts": scripts });
}

export async function editAutoInjectorScript(hash: number, name: string, url: string, script: string, injectImmediately: boolean): Promise<boolean> {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    const i = scripts.findIndex((s) => s.hash === hash);
    if (i === -1) return false;
    if (scripts.find((s, j) => j !== i && s.name === name) !== undefined) return false;


    const old_hash = scripts[i].hash;
    scripts[i].hash = djb2Hash(name + script);
    scripts[i].name = name;
    scripts[i].url = url;
    scripts[i].code = script;
    scripts[i].code_hash = djb2Hash(script);
    scripts[i].injectImmediately = injectImmediately;

    deletedAutoInjectorScriptErrorsForHash(old_hash);
    await chrome.storage.local.set({ "scripts": scripts });

    return true;
}

export async function enableAutoInjectorScript(hash: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    const i = scripts.findIndex((s) => s.hash === hash);
    if (i === -1) return;

    scripts[i].enabled = true;
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function enableAutoInjectorUserCSS(hash: number) {
    let { user_css } = await chrome.storage.local.get("user_css") as { [key: string]: Script[] | undefined };
    if (user_css === undefined) {
        user_css = [];
    }
    const i = user_css.findIndex((s) => s.hash === hash);
    if (i === -1) return;

    user_css[i].enabled = true;
    await chrome.storage.local.set({ "user_css": user_css });
}

export async function disableAutoInjectorScript(hash: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    const i = scripts.findIndex((s) => s.hash === hash);
    if (i === -1) return;

    scripts[i].enabled = false;
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function disableAutoInjectorUserCSS(hash: number) {
    let { user_css } = await chrome.storage.local.get("user_css") as { [key: string]: Script[] | undefined };
    if (user_css === undefined) {
        user_css = [];
    }
    const i = user_css.findIndex((s) => s.hash === hash);
    if (i === -1) return;

    user_css[i].enabled = false;
    await chrome.storage.local.set({ "user_css": user_css });

}

export async function enableImmediatInjectionForAutoInjectorScript(hash: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    const i = scripts.findIndex((s) => s.hash === hash);
    if (i === -1) return;

    scripts[i].injectImmediately = false;
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function disableImmediatInjectionForAutoInjectorScript(hash: number) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    const i = scripts.findIndex((s) => s.hash === hash);
    if (i === -1) return;

    scripts[i].injectImmediately = false;
    await chrome.storage.local.set({ "scripts": scripts });
}

export async function getAutoInjectorOptions(): Promise<AutoInjectorOptions> {
    let { ai_options } = await chrome.storage.local.get("ai_options") as { [key: string]: AutoInjectorOptions | undefined };

    if (ai_options === undefined) {
        ai_options = {
            confirmation_dialog_remove: true,
            confirmation_dialog_edit: false,
            confirmation_dialog_edit_cancel: true,
            enable_remove_indent_shift_tab: true,
            enable_insert_tab_on_tab: true,
            enable_setting_inject_immediately: false,
            warn_about_dupilcate_scripts: true
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

export async function getAutoInjectorScriptErrors(): Promise<ScriptError[]> {
    let { scripts_errors } = await chrome.storage.local.get("scripts_errors") as { [key: string]: ScriptError[] | undefined };
    if (scripts_errors === undefined) {
        scripts_errors = [];
    }

    return scripts_errors;
}

export async function deleteAutoInjectorScriptErrors(se: ScriptError) {
    let { scripts_errors } = await chrome.storage.local.get("scripts_errors") as { [key: string]: ScriptError[] | undefined };
    if (scripts_errors === undefined) {
        scripts_errors = [];
    }

    const i = scripts_errors.findIndex((s) => s.hash === se.hash && s.message === se.message);
    if (i !== -1) {
        scripts_errors.splice(i, 1);
        await chrome.storage.local.set({ "scripts_errors": scripts_errors });
    }
}

export async function getAutoInjectorScriptByHash(hash: number): Promise<Script | undefined> {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }

    return scripts.find((s) => s.hash === hash)
}

export async function deletedAutoInjectorScriptErrorsForHash(hash: number) {
    let { scripts_errors } = await chrome.storage.local.get("scripts_errors") as { [key: string]: ScriptError[] | undefined };
    if (scripts_errors === undefined) {
        scripts_errors = [];
    }

    const filtered_scripts_errors = scripts_errors.filter((se) => { if (se.hash !== hash) return true; else return false; });
    await chrome.storage.local.set({ "scripts_errors": filtered_scripts_errors });


    const update_msg: AutoInjectorMessage = {
        type: AutoInjectorMessageType.ErrorUpdate,
    } as AutoInjectorMessage;

    chrome.runtime.sendMessage(update_msg);
}

export async function getAutoInjectorScriptByName(name: string): Promise<Script | undefined> {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: Script[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }

    return scripts.find((s) => s.name === name)
}
