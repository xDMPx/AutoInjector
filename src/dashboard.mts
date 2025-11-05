import { Script } from "./interfaces.mjs";
import { deleteAutoInjectorScript, disableAutoInjectorScript, djb2Hash, editAutoInjectorScript, enableAutoInjectorScript, getAutoInjectorScripts, saveAutoInjectorScript } from "./utils.mjs";

async function main() {
    const scripts = await getAutoInjectorScripts();
    const script_div = document.getElementById("script-div");

    if (script_div !== null) {
        const list = document.createElement("ol");
        list.className = "list-decimal list-outside p-1";
        if (scripts !== undefined) {
            for (const [i, { name, code, enabled }] of scripts.entries()) {
                const list_item = document.createElement("li");
                const div = document.createElement("div");
                div.className = "inline-flex place-items-center w-full p-4 gap-4";

                const script_collapse_div = createScriptCollapse(name, code);
                const script_buttons_div = createScriptButtons(name, code, enabled, i);

                div.appendChild(script_collapse_div);
                div.appendChild(script_buttons_div);
                list_item.appendChild(div);
                list.appendChild(list_item);
            }
            script_div.appendChild(list);
        }
    }

    const submit_script_form = document.getElementById("submit-script-form") as HTMLFormElement;
    submit_script_form.onsubmit = (e) => { saveScript(e); };

    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    user_script_text.oninput = () => { autoResizeTextArea() };
    user_script_text.onkeydown = (e) => {
        autoIndentOnEnter(e);
        removeLastIndentOnShiftTabKey(e);
        insertTabOnTabKey(e);
    };
    autoResizeTextArea();

    const export_button = document.getElementById("btn_export")!;
    export_button.onclick = exportScripts;

    const import_button = document.getElementById("btn_import")!;
    import_button.onclick = onImportScriptsClick;
}

main();

function createScriptButtons(name: string, code: string, enabled: boolean, script_num: number): HTMLDivElement {
    const script_buttons_div = document.createElement("div");
    script_buttons_div.className = "flex place-items-center gap-4";

    const checkbox_tooltip = document.createElement("div");
    checkbox_tooltip.className = "tooltip";
    checkbox_tooltip.setAttribute("data-tip", "Enable/disable this script");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled;
    checkbox.className = "checkbox checkbox-primary my-auto";
    checkbox.onclick = () => { toggleScriptEnabled(script_num, checkbox.checked) };
    checkbox_tooltip.appendChild(checkbox);

    const edit_button_tooltip = document.createElement("div");
    edit_button_tooltip.className = "tooltip";
    edit_button_tooltip.setAttribute("data-tip", "Edit this script");
    const edit_button = document.createElement("button");
    edit_button.className = "btn btn-accent m-auto";
    edit_button.innerHTML = "<span class=\"material-symbols-outlined\">edit</span>";
    edit_button.onclick = () => { editScriptMode(script_num, name, code) };
    edit_button_tooltip.appendChild(edit_button);

    const copy_button_tooltip = document.createElement("div");
    copy_button_tooltip.className = "tooltip";
    copy_button_tooltip.setAttribute("data-tip", "Copy to clipboard");
    const copy_button = document.createElement("button");
    copy_button.className = "btn btn-accent m-auto";
    copy_button.innerHTML = "<span class=\"material-symbols-outlined\">content_copy</span>";
    copy_button.onclick = () => { copyScriptToClipboard(code) };
    copy_button_tooltip.appendChild(copy_button);

    const delete_button_tooltip = document.createElement("div");
    delete_button_tooltip.className = "tooltip";
    delete_button_tooltip.setAttribute("data-tip", "Permanently remove this script");
    const delete_button = document.createElement("button");
    delete_button.className = "btn btn-accent m-auto ";
    delete_button.innerHTML = "<span class=\"material-symbols-outlined\">delete_forever</span>";
    delete_button.onclick = () => { deleteScript(script_num) };
    delete_button_tooltip.appendChild(delete_button);

    script_buttons_div.appendChild(checkbox_tooltip);
    script_buttons_div.appendChild(edit_button_tooltip);
    script_buttons_div.appendChild(copy_button_tooltip);
    script_buttons_div.appendChild(delete_button_tooltip);

    return script_buttons_div;
}

function createScriptCollapse(name: string, code: string): HTMLDivElement {
    const script_collapse_div = document.createElement("div");
    script_collapse_div.tabIndex = 0;
    script_collapse_div.className = "collapse collapse-arrow bg-base-100 border-base-300 border w-3/4 ";
    const script_collapse_title_div = document.createElement("div");
    script_collapse_title_div.className = "collapse-title whitespace-pre-wrap";
    script_collapse_title_div.innerText = name;
    const script_collapse_content_div = document.createElement("div");
    script_collapse_content_div.className = "collapse-content whitespace-pre-wrap";
    script_collapse_content_div.innerText = code;
    script_collapse_div.appendChild(script_collapse_title_div);
    script_collapse_div.appendChild(script_collapse_content_div);

    return script_collapse_div;
}

function editScriptMode(i: number, name: string, script: string) {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const user_script_name = document.getElementById("user-script-name") as HTMLTextAreaElement;
    const submit_script_button = document.getElementById("submit-script") as HTMLButtonElement;
    const submit_script_form = document.getElementById("submit-script-form") as HTMLFormElement;
    user_script_text.style.height = 'auto';
    submit_script_button.textContent = "Save";
    submit_script_form.onsubmit = (e) => { editScript(e, i) };
    user_script_text.value = script;
    user_script_text.style.height = `${user_script_text.scrollHeight}px`;
    user_script_name.value = name;
}


function autoResizeTextArea() {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    // recalculate the scrollHeight 
    user_script_text.style.height = 'auto';
    user_script_text.style.height = `${user_script_text.scrollHeight}px`;
}

function autoIndentOnEnter(e: KeyboardEvent) {
    if (e.key !== "Enter") return;
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    if (user_script_text.selectionStart !== user_script_text.selectionEnd) return;

    e.preventDefault();
    const cursor_pos = user_script_text.selectionStart;
    const before = user_script_text.value.slice(0, cursor_pos);
    const after = user_script_text.value.slice(cursor_pos);

    const prev_line = before.slice(before.lastIndexOf("\n") + 1);
    const indent = getLineIndent(prev_line);

    user_script_text.value = `${before}\n${indent}${after}`;
    user_script_text.selectionStart = before.length + indent.length + 1;
    user_script_text.selectionEnd = before.length + indent.length + 1;
}

function insertTabOnTabKey(e: KeyboardEvent) {
    if (e.key !== "Tab" || e.shiftKey === true) return;
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    if (user_script_text.selectionStart !== user_script_text.selectionEnd) return;
    e.preventDefault();

    const cursor_pos = user_script_text.selectionStart;
    const before = user_script_text.value.slice(0, cursor_pos);
    const after = user_script_text.value.slice(cursor_pos);

    user_script_text.value = `${before}\t${after}`;
}

function removeLastIndentOnShiftTabKey(e: KeyboardEvent) {
    if (e.key !== "Tab" || e.shiftKey === false) return;
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    if (user_script_text.selectionStart !== user_script_text.selectionEnd) return;
    e.preventDefault();

    const cursor_pos = user_script_text.selectionStart;
    let before = user_script_text.value.slice(0, cursor_pos);
    const after = user_script_text.value.slice(cursor_pos);

    let line = before.slice(before.lastIndexOf("\n") + 1);
    let indent = getLineIndent(line);
    before = before.slice(0, before.length - line.length);
    line = line.slice(indent.length);
    if (indent.endsWith("\t")) {
        indent = indent.slice(0, indent.length - 1);
    } else if (indent.endsWith(" ")) {
        let count_of_spaces = 0;
        for (let i = indent.length - 1; i >= 0 && indent[i] === " "; i--) {
            count_of_spaces++;
        }
        console.log(count_of_spaces);
        const remove = (count_of_spaces % 4 === 0) ? 4 : count_of_spaces % 4;
        indent = indent.slice(0, indent.length - remove);
    }

    user_script_text.value = `${before}${indent}${line}${after}`;
}

function getLineIndent(line: string): string {
    let i = 0;
    while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
        i++;
    }
    return line.slice(0, i);
}

async function saveScript(e: SubmitEvent) {
    e.preventDefault();
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const user_script_name = document.getElementById("user-script-name") as HTMLInputElement;
    await saveAutoInjectorScript(user_script_name.value, user_script_text.value);

    reload();
}

async function deleteScript(i: number) {
    const delete_script_modal = document.getElementById("delete_script_modal")! as HTMLDialogElement;
    delete_script_modal.showModal();
    delete_script_modal.onsubmit = async (e) => {
        e.preventDefault();
        if (e.submitter?.id === "delete_script_modal-yes") {
            await deleteAutoInjectorScript(i);
            reload();
        }
        delete_script_modal.close();
    };
}

async function editScript(e: SubmitEvent, i: number) {
    e.preventDefault();
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const user_script_name = document.getElementById("user-script-name") as HTMLTextAreaElement;
    await editAutoInjectorScript(i, user_script_name.value, user_script_text.value);
    user_script_text.value = "";
    user_script_name.value = "";
    reload();
}

async function toggleScriptEnabled(i: number, enabled: boolean) {
    if (enabled) {
        await enableAutoInjectorScript(i);
    } else {
        await disableAutoInjectorScript(i);
    }
    reload();
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

    const imported_scripts = JSON.parse(data) as { name: string | undefined, code: string, enabled: boolean }[];
    let i = (saved_scripts === undefined) ? 0 : saved_scripts.length + 1;
    const scripts: Script[] = imported_scripts.map((s) => {
        if (s.name === undefined) s.name = `Script ${i++}`;
        return { name: s.name, code: s.code, enabled: s.enabled };
    });
    const duplicate_scripts: Script[] = [];
    for (const script of scripts) {
        if (saved_scripts_hash.has(djb2Hash(script.code))) {
            console.log("Duplicate script:");
            console.log(script.code);
            duplicate_scripts.push(script);
            continue;
        };
        await saveAutoInjectorScript(script.name, script.code, script.enabled);
    }
    if (duplicate_scripts.length > 0) {
        const import_duplicate_script_modal = document.getElementById("import_duplicate_script_modal")! as HTMLDialogElement;
        import_duplicate_script_modal.showModal();
        import_duplicate_script_modal.onsubmit = async (e) => {
            e.preventDefault();
            if (e.submitter?.id === "import_duplicate_script_modal-yes") {
                for (const script of duplicate_scripts) {
                    await saveAutoInjectorScript(script.name, script.code, script.enabled);
                }
            }
            import_duplicate_script_modal.close();
            reload();
        };
    } else {
        reload();
    }

}

function copyScriptToClipboard(code: string) {
    navigator.clipboard.writeText(code);
}

function reload() {
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const user_script_name = document.getElementById("user-script-name") as HTMLInputElement;

    user_script_text.value = "";
    user_script_name.value = "";

    location.reload();
}
