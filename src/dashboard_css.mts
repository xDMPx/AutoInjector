import { autoIndentOnEnter, autoResizeTextArea, copyContentToClipboard, getLineIndent, shortToast } from "./dashboard_utils.mjs";
import { deleteAutoInjectorUserCSS, disableAutoInjectorUserCSS, editAutoInjectorUserCss, enableAutoInjectorUserCSS, getAutoInjectorOptions, getAutoInjectorUserCSS, saveAutoInjectorUserCSS } from "./utils.mjs";

async function main() {
    const user_css_div = document.getElementById("user-css-div") as HTMLDivElement;
    user_css_div.appendChild(await createUserCssList());


    const submit_user_css = document.getElementById("submit-user-css-form") as HTMLFormElement;
    submit_user_css.onsubmit = (e) => { saveUserCss(e); };

    const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
    let overwrite_tab_behaviour = false;
    let options = await getAutoInjectorOptions();
    user_css_text.onfocus = () => {
        overwrite_tab_behaviour = true;
        getAutoInjectorOptions().then((o) => options = o);
    };
    user_css_text.oninput = () => {
        autoResizeTextArea("user-css");
        getAutoInjectorOptions().then((o) => options = o);
    };
    user_css_text.onkeydown = (e) => {
        getAutoInjectorOptions().then((o) => options = o);
        if (e.key === "Escape") overwrite_tab_behaviour = false;
        autoIndentOnEnter("user-css", e);
        if (overwrite_tab_behaviour) {
            if (options.enable_remove_indent_shift_tab) {
                removeLastIndentOnShiftTabKey(e);
            }
            if (options.enable_insert_tab_on_tab) {
                insertTabOnTabKey(e);
            }
        }
    };
    autoResizeTextArea("user-css");


    const export_button = document.getElementById("btn_export")!;
    export_button.onclick = exportUserCss;

    const btn_disable_all = document.getElementById("btn_disable_all")!;
    btn_disable_all.onclick = onDisableAllClick;

    const options_button = document.getElementById("btn_options")!;
    options_button.onclick = () => {
        chrome.runtime.openOptionsPage();
    }

    const about_button = document.getElementById("btn_about")!;
    about_button.onclick = () => {
        const about_modal = document.getElementById("about_modal")! as HTMLDialogElement;
        about_modal.showModal();
    };

    const about_name_text = document.getElementById("about-name_text")!;
    about_name_text.innerText = `${chrome.runtime.getManifest().name}`;
    const about_description_text = document.getElementById("about-description_text")!;
    about_description_text.innerText = `${chrome.runtime.getManifest().description}`;
    const about_version_text = document.getElementById("about-version_text")!;
    about_version_text.innerText = `Version v${chrome.runtime.getManifest().version}`;

}

main();

async function createUserCssList() {
    const user_css = await getAutoInjectorUserCSS();
    const list = document.createElement("ol");
    list.className = "list-decimal list-outside p-1";
    list.id = "user-css-list";
    if (user_css !== undefined) {
        for (const { hash, name, url, css, enabled } of user_css) {
            const list_item = document.createElement("li");
            const div = document.createElement("div");
            div.className = "inline-flex place-items-center w-full p-4 gap-4";

            const user_css_collapse_div = createUserCssCollapse(name, url, css);
            const user_css_buttons_div = createUserCssButtons(hash, name, url, css, enabled);

            div.appendChild(user_css_collapse_div);
            div.appendChild(user_css_buttons_div);
            list_item.appendChild(div);
            list.appendChild(list_item);
        }
    }

    return list;
}

function createUserCssCollapse(name: string, url: string, css: string): HTMLDivElement {
    const user_css_collapse_div = document.createElement("div");
    user_css_collapse_div.tabIndex = 0;
    user_css_collapse_div.className = "collapse collapse-arrow bg-base-100 border-base-300 border w-3/4 ";
    const user_css_collapse_title_div = document.createElement("div");
    user_css_collapse_title_div.className = "collapse-title whitespace-pre-wrap break-all";
    user_css_collapse_title_div.innerText = `${name}\nURL: ${url}`;

    const user_css_collapse_content_div = document.createElement("div");
    user_css_collapse_content_div.className = "collapse-content whitespace-pre-wrap break-all";
    user_css_collapse_content_div.innerText = css;
    user_css_collapse_div.appendChild(user_css_collapse_title_div);
    user_css_collapse_div.appendChild(user_css_collapse_content_div);

    return user_css_collapse_div;
}

function createUserCssButtons(hash: number, name: string, url: string, css: string, enabled: boolean): HTMLDivElement {
    const user_css_buttons_div = document.createElement("div");
    user_css_buttons_div.className = "flex place-items-center gap-4";

    const checkbox_tooltip = document.createElement("div");
    checkbox_tooltip.className = "tooltip";
    checkbox_tooltip.setAttribute("data-tip", "Enable/disable this user css");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled;
    checkbox.className = "checkbox checkbox-primary my-auto";
    checkbox.onclick = () => { toggleUserCssEnabled(hash, checkbox.checked) };
    checkbox_tooltip.appendChild(checkbox);

    const edit_button_tooltip = document.createElement("div");
    edit_button_tooltip.className = "tooltip";
    edit_button_tooltip.setAttribute("data-tip", "Edit this user css");
    const edit_button = document.createElement("button");
    edit_button.className = "btn btn-accent m-auto edit-button";
    edit_button.innerHTML = "<span class=\"material-symbols-outlined\">edit</span>";
    edit_button.onclick = () => {
        const user_css_list = document.getElementById("user-css-list")!;
        for (const user_css of user_css_list?.children) {
            const edit_button = user_css.getElementsByClassName("edit-button").item(0) as HTMLButtonElement | null;
            if (edit_button == null) continue;
            edit_button.disabled = true;
        }
        edit_button.disabled = false;

        edit_button_tooltip.setAttribute("data-tip", "Cancel edit");
        edit_button.innerHTML = "<span class=\"material-symbols-outlined\">cancel</span>";
        edit_button.className = "btn btn-secondary m-auto";
        checkbox.disabled = true;
        editUserCssMode(hash, name, url, css);
        edit_button.onclick = async () => {
            const options = await getAutoInjectorOptions();
            if (options.confirmation_dialog_edit_cancel) {
                const exit_edit_user_css_modal = document.getElementById("exit_edit_user_css_modal")! as HTMLDialogElement;
                exit_edit_user_css_modal.showModal();
                exit_edit_user_css_modal.onsubmit = async (e) => {
                    e.preventDefault();
                    if (e.submitter?.id === "exit_edit_user_css_modal-yes") {
                        reload();
                    }
                    exit_edit_user_css_modal.close();
                };
            } else {
                reload();
            }
        };
    };
    edit_button_tooltip.appendChild(edit_button);

    const copy_button_tooltip = document.createElement("div");
    copy_button_tooltip.className = "tooltip";
    copy_button_tooltip.setAttribute("data-tip", "Copy to clipboard");
    const copy_button = document.createElement("button");
    copy_button.className = "btn btn-accent m-auto";
    copy_button.innerHTML = "<span class=\"material-symbols-outlined\">content_copy</span>";
    copy_button.onclick = () => { copyContentToClipboard(copy_button_tooltip, copy_button, css) };
    copy_button_tooltip.appendChild(copy_button);

    const delete_button_tooltip = document.createElement("div");
    delete_button_tooltip.className = "tooltip";
    delete_button_tooltip.setAttribute("data-tip", "Permanently remove this user css");
    const delete_button = document.createElement("button");
    delete_button.className = "btn btn-accent m-auto ";
    delete_button.innerHTML = "<span class=\"material-symbols-outlined\">delete_forever</span>";
    delete_button.onclick = () => { deleteUserCss(hash, name) };
    delete_button_tooltip.appendChild(delete_button);

    user_css_buttons_div.appendChild(checkbox_tooltip);
    user_css_buttons_div.appendChild(edit_button_tooltip);
    user_css_buttons_div.appendChild(copy_button_tooltip);
    user_css_buttons_div.appendChild(delete_button_tooltip);

    return user_css_buttons_div;
}

async function saveUserCss(e: SubmitEvent) {
    e.preventDefault();
    const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
    const user_css_name = document.getElementById("user-css-name") as HTMLInputElement;
    const user_css_url = document.getElementById("user-css-url") as HTMLTextAreaElement;

    const saveUserCss = async () => {
        const saved = await saveAutoInjectorUserCSS(user_css_name.value, user_css_url.value, user_css_text.value);
        if (saved) {
            shortToast(`User CSS "${user_css_name.value}" saved successfully!"`);
            reload();
        } else {
            user_css_name.pattern = `^(?!${user_css_name.value}$).*$`;
            (user_css_name.nextElementSibling! as HTMLDivElement).innerText = "User CSS name must be unique";
            user_css_name.oninput = () => {
                if (user_css_name.value.length > 2) {
                    (user_css_name.nextElementSibling! as HTMLDivElement).innerText = "User CSS name must be unique";
                } else {
                    (user_css_name.nextElementSibling! as HTMLDivElement).innerText = "";
                }
            }
            user_css_name.reportValidity();
        }
    };

    saveUserCss();
}

async function deleteUserCss(hash: number, name: string) {
    const options = await getAutoInjectorOptions();
    if (options.confirmation_dialog_remove) {
        const delete_user_css_modal = document.getElementById("delete_user_css_modal")! as HTMLDialogElement;
        delete_user_css_modal.showModal();
        delete_user_css_modal.onsubmit = async (e) => {
            e.preventDefault();
            if (e.submitter?.id === "delete_user_css_modal-yes") {
                await deleteAutoInjectorUserCSS(hash);

                shortToast(`User CSS "${name}" removed successfully!`);
                reload();
            }
            delete_user_css_modal.close();
        };
    } else {
        await deleteAutoInjectorUserCSS(hash);
        shortToast(`User CSS "${name}" removed successfully!`);
        reload();
    }
}

function editUserCssMode(hash: number, name: string, url: string, css: string) {
    const user_css_name = document.getElementById("user-css-name") as HTMLTextAreaElement;
    const user_css_url = document.getElementById("user-css-url") as HTMLTextAreaElement;
    const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
    const submit_user_css_button = document.getElementById("submit-user-css") as HTMLButtonElement;
    const submit_user_css_form = document.getElementById("submit-user-css-form") as HTMLFormElement;
    user_css_text.style.height = 'auto';
    submit_user_css_button.textContent = "Save";
    submit_user_css_form.onsubmit = (e) => { editUserCss(e, hash) };
    user_css_text.value = css;
    user_css_text.style.height = `${user_css_text.scrollHeight}px`;
    user_css_name.value = name;
    user_css_url.value = url;
}

async function editUserCss(e: SubmitEvent, hash: number) {
    e.preventDefault();
    const editUserCss = async () => {
        const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
        const user_css_name = document.getElementById("user-css-name") as HTMLInputElement;
        const user_css_url = document.getElementById("user-css-url") as HTMLTextAreaElement;
        const name = user_css_name.value;

        const edited = await editAutoInjectorUserCss(hash, user_css_name.value, user_css_url.value, user_css_text.value);
        if (edited) {
            shortToast(`User CSS "${name}" updated successfully!`);
            reload();
        } else {
            user_css_name.pattern = `^(?!${user_css_name.value}$).*$`;
            (user_css_name.nextElementSibling! as HTMLDivElement).innerText = "User CSS name must be unique";
            user_css_name.oninput = () => {
                if (user_css_name.value.length > 2) {
                    (user_css_name.nextElementSibling! as HTMLDivElement).innerText = "User CSS name must be unique";
                } else {
                    (user_css_name.nextElementSibling! as HTMLDivElement).innerText = "";
                }
            }
            user_css_name.reportValidity();
        }
    };

    const options = await getAutoInjectorOptions();
    if (options.confirmation_dialog_edit) {
        const edit_user_css_modal = document.getElementById("edit_user_css_modal")! as HTMLDialogElement;
        edit_user_css_modal.showModal();
        edit_user_css_modal.onsubmit = async (e) => {
            e.preventDefault();
            if (e.submitter?.id === "edit_user_css_modal-yes") {
                await editUserCss();
            }
            edit_user_css_modal.close();
        };
    } else {
        await editUserCss();
    }
}

async function toggleUserCssEnabled(hash: number, enabled: boolean) {
    if (enabled) {
        await enableAutoInjectorUserCSS(hash);
    } else {
        await disableAutoInjectorUserCSS(hash);
    }
    reload();
}

async function onDisableAllClick() {
    let user_css = await getAutoInjectorUserCSS();
    if (user_css === undefined) return;
    for (const u_css of user_css) {
        await disableAutoInjectorUserCSS(u_css.hash);
    }
    reload();
}

async function exportUserCss() {
    let user_css = await getAutoInjectorUserCSS();
    if (user_css !== undefined) {
        const user_css_json = JSON.stringify(user_css, null);
        const url = `data:application/json;base64,${btoa(user_css_json)}`;
        const a = document.createElement("a");
        a.href = url;

        const date = new Date();
        const year = date.getFullYear();
        console.log(year);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        console.log(month);
        const day = date.getDate().toString().padStart(2, "0");
        console.log(day);
        a.download = `autoinjector_css_${year}_${month}_${day}.json`;

        a.click();
    }

}

function removeLastIndentOnShiftTabKey(e: KeyboardEvent) {
    if (e.key !== "Tab" || e.shiftKey === false) return;
    const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
    if (user_css_text.selectionStart !== user_css_text.selectionEnd) return;
    e.preventDefault();

    const cursor_pos = user_css_text.selectionStart;
    let before = user_css_text.value.slice(0, cursor_pos);
    const after = user_css_text.value.slice(cursor_pos);

    let line = before.slice(before.lastIndexOf("\n") + 1);
    let indent = getLineIndent(line);
    before = before.slice(0, before.length - line.length);
    line = line.slice(indent.length);
    let symbols_removed = 0;
    if (indent.endsWith("\t")) {
        indent = indent.slice(0, indent.length - 1);
        symbols_removed = 1;
    } else if (indent.endsWith(" ")) {
        let count_of_spaces = 0;
        for (let i = indent.length - 1; i >= 0 && indent[i] === " "; i--) {
            count_of_spaces++;
        }
        console.log(count_of_spaces);
        const remove = (count_of_spaces % 4 === 0) ? 4 : count_of_spaces % 4;
        indent = indent.slice(0, indent.length - remove);
        symbols_removed = remove;
    }

    user_css_text.value = `${before}${indent}${line}${after}`;
    user_css_text.selectionStart = cursor_pos - symbols_removed;
    user_css_text.selectionEnd = cursor_pos - symbols_removed;
}

function insertTabOnTabKey(e: KeyboardEvent) {
    if (e.key !== "Tab" || e.shiftKey === true) return;
    const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
    if (user_css_text.selectionStart !== user_css_text.selectionEnd) return;
    e.preventDefault();

    const cursor_pos = user_css_text.selectionStart;
    const before = user_css_text.value.slice(0, cursor_pos);
    const after = user_css_text.value.slice(cursor_pos);

    user_css_text.value = `${before}\t${after}`;

    user_css_text.selectionStart = cursor_pos + 1;
    user_css_text.selectionEnd = cursor_pos + 1;
}

function reload() {
    const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
    const user_css_name = document.getElementById("user-css-name") as HTMLInputElement;
    const user_css_url = document.getElementById("user-css-url") as HTMLTextAreaElement;
    user_css_text.value = "";
    user_css_name.value = "";
    user_css_url.value = "*";
    autoResizeTextArea("user-css");

    const submit_css_form = document.getElementById("submit-user-css-form") as HTMLFormElement;
    submit_css_form.reset();
    submit_css_form.onsubmit = (e) => { saveUserCss(e); };

    const submit_user_css_button = document.getElementById("submit-user-css") as HTMLButtonElement;
    submit_user_css_button.textContent = "Submit";

    const user_css_div = document.getElementById("user-css-div") as HTMLDivElement;
    user_css_div.children.item(0)?.remove();
    createUserCssList().then((l) => user_css_div.appendChild(l))
}
