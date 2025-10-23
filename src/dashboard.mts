import { deleteAutoInjectorScript, editAutoInjectorScript, getAutoInjectorScripts, saveAutoInjectorScript } from "./utils.mjs";

async function main() {
    const scripts = await getAutoInjectorScripts();
    const script_div = document.getElementById("script-div");

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
                const bdiv = document.createElement("div");
                bdiv.style = "display: flex; gap: 5px;";
                const edit_button = document.createElement("button");
                edit_button.style = "margin: auto; padding: 5px;";
                edit_button.innerText = "E";
                edit_button.onclick = () => { editScriptMode(i, script) };
                const delete_button = document.createElement("button");
                delete_button.style = "margin: auto; padding: 5px;";
                delete_button.innerText = "X";
                delete_button.onclick = () => { deleteScript(i) };


                bdiv.appendChild(edit_button);
                bdiv.appendChild(delete_button);
                div.appendChild(p);
                div.appendChild(bdiv);
                list_item.appendChild(div);
                list.appendChild(list_item);
            }
            script_div.appendChild(list);
        }
    }

    const submit_script = document.getElementById("submit-script")!;
    submit_script.onclick = saveScript;
}

main();

function editScriptMode(i: number, script: string) {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const submit_script = document.getElementById("submit-script")!;
    submit_script.textContent = "Save";
    submit_script.onclick = () => { editScript(i) };
    user_script_text.value = script;
}

async function saveScript() {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    await saveAutoInjectorScript(user_script_text.value);
    location.reload();

}

async function deleteScript(i: number) {
    await deleteAutoInjectorScript(i);
    location.reload();
}

async function editScript(i: number) {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    await editAutoInjectorScript(i, user_script_text.value);
    user_script_text.value = "";
    location.reload();
}

