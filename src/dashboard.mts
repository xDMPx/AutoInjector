import { Script } from "./interfaces.mjs";
import { deleteAutoInjectorScript, disableAutoInjectorScript, djb2Hash, editAutoInjectorScript, enableAutoInjectorScript, getAutoInjectorScripts, saveAutoInjectorScript } from "./utils.mjs";

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

                const script_collapse_div = createScriptCollapse(code);
                const script_buttons_div = createScriptButtons(code, enabled, i);

                div.appendChild(script_collapse_div);
                div.appendChild(script_buttons_div);
                list_item.appendChild(div);
                list.appendChild(list_item);
            }
            script_div.appendChild(list);
        }
    }

    const submit_script = document.getElementById("submit-script")!;
    submit_script.onclick = saveScript;

    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    user_script_text.oninput = () => { autoResizeTextArea() };
    autoResizeTextArea();

    const export_button = document.getElementById("btn_export")!;
    export_button.onclick = exportScripts;

    const import_button = document.getElementById("btn_import")!;
    import_button.onclick = onImportScriptsClick;
}

main();

function createScriptButtons(code: string, enabled: boolean, script_num: number): HTMLDivElement {
    const script_buttons_div = document.createElement("div");
    script_buttons_div.className = "flex gap-4";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled;
    checkbox.className = "checkbox checkbox-primary my-auto";
    checkbox.onclick = () => { toggleScriptEnabled(script_num, checkbox.checked) };

    const edit_button = document.createElement("button");
    edit_button.className = "btn btn-accent m-auto";
    edit_button.innerHTML = "<span class=\"material-symbols-outlined\">edit</span>";
    edit_button.onclick = () => { editScriptMode(script_num, code) };

    const delete_button = document.createElement("button");
    delete_button.className = "btn btn-accent m-auto ";
    delete_button.innerHTML = "<span class=\"material-symbols-outlined\">delete_forever</span>";
    delete_button.onclick = () => { deleteScript(script_num) };

    script_buttons_div.appendChild(checkbox);
    script_buttons_div.appendChild(edit_button);
    script_buttons_div.appendChild(delete_button);

    return script_buttons_div;
}

function createScriptCollapse(code: string): HTMLDivElement {
    const script_collapse_div = document.createElement("div");
    if (code.split('\n').length > 1) {
        let new_line_pos = code.indexOf('\n');
        script_collapse_div.tabIndex = 0;
        script_collapse_div.className = "collapse collapse-arrow bg-base-100 border-base-300 border w-3/4 ";
        const script_collapse_title_div = document.createElement("div");
        script_collapse_title_div.className = "collapse-title whitespace-pre-wrap";
        script_collapse_title_div.innerText = code.slice(0, new_line_pos);
        const script_collapse_content_div = document.createElement("div"); script_collapse_content_div.className = "collapse-content whitespace-pre-wrap";
        script_collapse_content_div.innerText = code.slice(new_line_pos);
        script_collapse_div.appendChild(script_collapse_title_div);
        script_collapse_div.appendChild(script_collapse_content_div);
    } else {
        script_collapse_div.tabIndex = 0;
        script_collapse_div.className = "bg-base-100 border-base-300 border w-3/4 ";
        const script_collapse_title_div = document.createElement("div");
        script_collapse_title_div.className = "p-1 whitespace-pre-wrap";
        script_collapse_title_div.innerText = code;
        script_collapse_div.appendChild(script_collapse_title_div);
    }

    return script_collapse_div;
}

function editScriptMode(i: number, script: string) {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const submit_script = document.getElementById("submit-script")!;
    user_script_text.style.height = 'auto';
    submit_script.textContent = "Save";
    submit_script.onclick = () => { editScript(i) };
    user_script_text.value = script;
    user_script_text.style.height = `${user_script_text.scrollHeight}px`;
}


function autoResizeTextArea() {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    // recalculate the scrollHeight 
    user_script_text.style.height = 'auto';
    user_script_text.style.height = `${user_script_text.scrollHeight}px`;
}

async function saveScript() {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    await saveAutoInjectorScript(user_script_text.value);
    location.reload();

}

async function deleteScript(i: number) {
    const delete_script_modal = document.getElementById("delete_script_modal")! as HTMLDialogElement;
    delete_script_modal.showModal();
    delete_script_modal.onsubmit = async (e) => {
        e.preventDefault();
        if (e.submitter?.id === "delete_script_modal-yes") {
            await deleteAutoInjectorScript(i);
            location.reload();
        }
        delete_script_modal.close();
    };
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

async function exportScripts() {
    let scripts = await getAutoInjectorScripts();
    if (scripts !== undefined) {
        const scripts_json = JSON.stringify(scripts, null);
        const url = `data:application/json;base64,${btoa(scripts_json)}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = "autoinjector_scripts.json";
        a.click();
    }

}

async function onImportScriptsClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file !== undefined) {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = (e) => {
                if (e.target !== null && e.target.result != undefined)
                    importScripts(e.target?.result.toString())
            }
        }
    };
    input.click();
}

async function importScripts(data: string) {
    const saved_scripts = (await getAutoInjectorScripts())?.map((s) => djb2Hash(s.code));
    const saved_scripts_hash = new Set(saved_scripts);

    const scripts = JSON.parse(data) as Script[];
    for (const script of scripts) {
        if (saved_scripts_hash.has(djb2Hash(script.code))) {
            console.log("Duplicate script:");
            console.log(script.code);
            continue;
        };
        await saveAutoInjectorScript(script.code, script.enabled);
    }
    location.reload();
}
