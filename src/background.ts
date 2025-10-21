chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
    if (details.reason === "update") {
        let scripts = await getAutoInjectorScripts();
        if (scripts === undefined) {
            saveAutoInjectorScript("alert(\"Hello! I am an alert box!! Caused by AutoInjector\");");
        }
    }
});


chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.OnActivatedInfo) => {
    const scripts = await getAutoInjectorScripts();
    if (scripts === undefined) return;
    for (const code of scripts) {
        await chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            args: [code, djb2_hash(code)],
            //injectImmediately: true,
            world: "MAIN",
            func: inject_script,
        });
    }
});


chrome.tabs.onUpdated.addListener(async (tabId: number, updateinfo: chrome.tabs.OnUpdatedInfo) => {
    if (updateinfo.status === chrome.tabs.TabStatus.COMPLETE) {
        const scripts = await getAutoInjectorScripts();
        if (scripts === undefined) return;
        for (const code of scripts) {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                args: [code, djb2_hash(code)],
                //injectImmediately: true,
                world: "MAIN",
                func: inject_script,
            });
        }
    }
});

function inject_script(code: string, hash: number) {
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

// http://www.cse.yorku.ca/~oz/hash.html
function djb2_hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (((hash << 5) + hash) + str.charCodeAt(i));

    }
    //non-negative 32-bit value
    return hash >>> 0;
}

async function getAutoInjectorScripts(): Promise<string[] | undefined> {
    const { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: string[] | undefined };
    console.log(scripts);
    return scripts;
}

async function saveAutoInjectorScript(script: string) {
    let { scripts } = await chrome.storage.local.get("scripts") as { [key: string]: string[] | undefined };
    if (scripts === undefined) {
        scripts = [];
    }
    scripts.push(script);
    await chrome.storage.local.set({ "scripts": scripts });
}
