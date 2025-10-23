import { deleteAutoInjectorScript, getAutoInjectorScripts, saveAutoInjectorScript } from "./utils.mjs";

async function main() {
    const scripts = await getAutoInjectorScripts();
    const script_div = document.getElementById("script-div");

    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement | null;
    const submit_script = document.getElementById("submit-script");

    if (script_div !== null) {
        const list = document.createElement("ol");
        if (scripts !== undefined) {
            for (const [i, script] of scripts.entries()) {
                const list_item = document.createElement("li");
                const div = document.createElement("div");
                div.style = "display: flex; padding: 4px; gap: 4px;";

                const p = document.createElement("p");
                p.innerText = script;
                p.style = "width: 75%";
                const delete_button = document.createElement("button");
                delete_button.style = "margin: auto; padding: 5px;";
                delete_button.innerText = "X";
                delete_button.onclick = () => { deleteScript(i) };

                div.appendChild(p);
                div.appendChild(delete_button);
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

async function deleteScript(i: number) {
    await deleteAutoInjectorScript(i);
    location.reload();
}

