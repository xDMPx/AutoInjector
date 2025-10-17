const scripts = ["alert(\"Hello! I am an alert box!! Caused by AutoInjector\");", "alert(\"Hello! I am an alert box 2!! Caused by AutoInjector script 2\");"]

chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.OnActivatedInfo) => {
    for (const code of scripts) {
        await chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            args: [code, djb2_hash(code)],
            //injectImmediately: true,
            world: "MAIN",
            func: (code: string, hash: number) => {
                const auto_injector_script = document.getElementById(`autoinjector-script-${hash}`);
                if (auto_injector_script !== null) return;
                console.log(`AutoInjector; Script Injection => ${code}`);
                const script = document.createElement("script");
                script.type = "text/javascript";
                script.id = `autoinjector-script-${hash}`;
                script.text = code;
                document.body.appendChild(script);
                console.log(script);
            }
        });
    }
});

// http://www.cse.yorku.ca/~oz/hash.html
function djb2_hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (((hash << 5) + hash) + str.charCodeAt(i));

    }
    //non‑negative 32‑bit value
    return hash >>> 0;
}
