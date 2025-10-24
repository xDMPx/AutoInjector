import { deleteAutoInjectorScript, disableAutoInjectorScript, editAutoInjectorScript, enableAutoInjectorScript, getAutoInjectorScripts, saveAutoInjectorScript } from "./utils.mjs";

async function main() {
    const scripts = await getAutoInjectorScripts();
    const script_div = document.getElementById("script-div");

    if (script_div !== null) {
        const list = document.createElement("ol");
        list.className = "list-decimal list-inside p-1";
        if (scripts !== undefined) {
            for (const [i, { code, enabled }] of scripts.entries()) {
                const list_item = document.createElement("li");
                const div = document.createElement("div");
                div.className = "inline-flex w-5/6 p-4 gap-4";
                const p = document.createElement("p");
                p.innerText = code;
                p.className = "w-3/4 whitespace-pre-wrap";
                const bdiv = document.createElement("div");
                bdiv.className = "flex gap-4";
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = enabled;
                checkbox.className = "checkbox checkbox-primary my-auto";
                checkbox.onclick = () => { toggleScriptEnabled(i, checkbox.checked) };
                const edit_button = document.createElement("button");
                edit_button.className = "btn btn-accent m-auto";
                edit_button.innerHTML = "<span class=\"material-symbols-outlined\">edit</span>";
                edit_button.onclick = () => { editScriptMode(i, code) };
                const delete_button = document.createElement("button");
                delete_button.className = "btn btn-accent m-auto ";
                delete_button.innerHTML = "<span class=\"material-symbols-outlined\">delete_forever</span>";
                delete_button.onclick = () => { deleteScript(i) };

                bdiv.appendChild(checkbox);
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

async function toggleScriptEnabled(i: number, enabled: boolean) {
    if (enabled) {
        await enableAutoInjectorScript(i);
    } else {
        await disableAutoInjectorScript(i);
    }
    location.reload();
}
