import { getAutoInjectorScripts, saveAutoInjectorScript } from "./utils.mjs";

async function main() {
    const scripts = await getAutoInjectorScripts();
    const script_div = document.getElementById("script-div");

    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement | null;
    const submit_script = document.getElementById("submit-script");

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

    if (user_script_text !== null && submit_script !== null) {
        submit_script.onclick = () => {
            saveAutoInjectorScript(user_script_text.value);
            location.reload();
        }
    }

}

main();
