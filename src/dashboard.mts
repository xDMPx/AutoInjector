import { getAutoInjectorScripts } from "./utils.mjs";

async function main() {
    const scripts = await getAutoInjectorScripts();
    const script_div = document.getElementById("script-div");

    if (script_div !== null) {
        const list = document.createElement("ol");
        if (scripts !== undefined) {
            for (const script of scripts) {
                const list_item = document.createElement("li");
                const div = document.createElement("div");
                div.innerText = script;
                list_item.appendChild(div);
                list.appendChild(list_item);
            }
            script_div.appendChild(list);
        }
    }
}

main();
