import { autoIndentOnEnter, autoResizeTextArea, copyContentToClipboard, expandTextArea, insertTabOnTabKey, removeLastIndentOnShiftTabKey, shortToast } from "./dashboard_utils.mjs";
import { AutoInjectorMessage, AutoInjectorMessageType, Script, ScriptError } from "./interfaces.mjs";
import { deleteAutoInjectorScript, deleteAutoInjectorScriptErrors, disableAutoInjectorScript, djb2Hash, editAutoInjectorScript, enableAutoInjectorScript, getAutoInjectorOptions, getAutoInjectorScriptByHash, getAutoInjectorScriptErrors, getAutoInjectorScripts, saveAutoInjectorScript } from "./utils.mjs";

enum SortOrder {
    None,
    Ascending,
    Descending
}

let errors_date_sort_order = SortOrder.Ascending;
let errors_name_sort_order = SortOrder.None;
let errors_url_sort_order = SortOrder.None;

let errors_filter_by_name: String | null = null;
let errors_filter_by_domain: String | null = null;

async function main() {
    const script_div = document.getElementById("script-div") as HTMLDivElement;
    script_div.appendChild(await createScriptList());

    const submit_script = document.getElementById("submit-script-form") as HTMLFormElement;
    submit_script.onsubmit = (e) => { saveScript(e); };

    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    let overwrite_tab_behaviour = false;
    let options = await getAutoInjectorOptions();
    user_script_text.onfocus = () => {
        overwrite_tab_behaviour = true;
        getAutoInjectorOptions().then((o) => options = o);
    };
    user_script_text.oninput = () => {
        autoResizeTextArea("user-script");
        getAutoInjectorOptions().then((o) => options = o);
    };
    user_script_text.onkeydown = (e) => {
        getAutoInjectorOptions().then((o) => options = o);
        if (e.key === "Escape") overwrite_tab_behaviour = false;
        autoIndentOnEnter("user-script", e);
        if (overwrite_tab_behaviour) {
            if (options.enable_remove_indent_shift_tab) {
                removeLastIndentOnShiftTabKey("user-script", e);
            }
            if (options.enable_insert_tab_on_tab) {
                insertTabOnTabKey("user-script", e);
            }
        }
    };

    const user_script_expand_textarea = document.getElementById("user-script-expand-textarea") as HTMLDivElement;
    user_script_expand_textarea.onclick = () => expandTextArea("user-script-textarea-div", "user-script-expand-textarea");

    autoResizeTextArea("user-script");
    if (!options.enable_setting_inject_immediately) {
        document.getElementById("user-script-inject-immediately-label")!.style.display = "none";
    }

    const export_button = document.getElementById("btn_export")!;
    export_button.onclick = exportScripts;

    const import_button = document.getElementById("btn_import")!;
    import_button.onclick = onImportScriptsClick;

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


    const display_errors = document.getElementById("fab_display_errors")!;
    const auto_injector_scripts_errors = await getAutoInjectorScriptErrors();
    if (auto_injector_scripts_errors.length > 0) {
        display_errors.style.display = "inline-flex";
    }
    if (auto_injector_scripts_errors.length == 0) {
        display_errors.style.display = "none";
    }
    display_errors.onclick = displayErrorsModal;

    const error_modal_sort_by_date = document.getElementById("error_modal_sort_by_date")!;
    error_modal_sort_by_date.onclick = () => {
        errors_name_sort_order = SortOrder.None;
        errors_url_sort_order = SortOrder.None;
        document.getElementById("error_modal_sort_by_name_symbol")!.innerText = "";
        document.getElementById("error_modal_sort_by_url_symbol")!.innerText = "";

        switch (errors_date_sort_order) {
            case SortOrder.Descending:
            case SortOrder.None:
                errors_date_sort_order = SortOrder.Ascending;
                break;
            case SortOrder.Ascending:
                errors_date_sort_order = SortOrder.Descending;
                break;
        }
        if (errors_date_sort_order === SortOrder.Ascending) document.getElementById("error_modal_sort_by_date_symbol")!.innerText = "arrow_upward";
        else if (errors_date_sort_order === SortOrder.Descending) document.getElementById("error_modal_sort_by_date_symbol")!.innerText = "arrow_downward";
        else if (errors_date_sort_order === SortOrder.None) document.getElementById("error_modal_sort_by_date_symbol")!.innerText = "";

        displayErrorsModal();
    };

    const error_modal_sort_by_name = document.getElementById("error_modal_sort_by_name")!;
    error_modal_sort_by_name.onclick = () => {
        errors_date_sort_order = SortOrder.None;
        errors_url_sort_order = SortOrder.None;
        document.getElementById("error_modal_sort_by_date_symbol")!.innerText = "";
        document.getElementById("error_modal_sort_by_url_symbol")!.innerText = "";

        switch (errors_name_sort_order) {
            case SortOrder.Descending:
            case SortOrder.None:
                errors_name_sort_order = SortOrder.Ascending;
                break;
            case SortOrder.Ascending:
                errors_name_sort_order = SortOrder.Descending;
                break;
        }
        if (errors_name_sort_order === SortOrder.Ascending) document.getElementById("error_modal_sort_by_name_symbol")!.innerText = "arrow_upward";
        else if (errors_name_sort_order === SortOrder.Descending) document.getElementById("error_modal_sort_by_name_symbol")!.innerText = "arrow_downward";
        else if (errors_name_sort_order === SortOrder.None) document.getElementById("error_modal_sort_by_name_symbol")!.innerText = "";

        displayErrorsModal();
    };

    const error_modal_sort_by_url = document.getElementById("error_modal_sort_by_url")!;
    error_modal_sort_by_url.onclick = () => {
        errors_date_sort_order = SortOrder.None;
        errors_name_sort_order = SortOrder.None;
        document.getElementById("error_modal_sort_by_date_symbol")!.innerText = "";
        document.getElementById("error_modal_sort_by_name_symbol")!.innerText = "";

        switch (errors_url_sort_order) {
            case SortOrder.Descending:
            case SortOrder.None:
                errors_url_sort_order = SortOrder.Ascending;
                break;
            case SortOrder.Ascending:
                errors_url_sort_order = SortOrder.Descending;
                break;
        }
        if (errors_url_sort_order === SortOrder.Ascending) document.getElementById("error_modal_sort_by_url_symbol")!.innerText = "arrow_upward";
        else if (errors_url_sort_order === SortOrder.Descending) document.getElementById("error_modal_sort_by_url_symbol")!.innerText = "arrow_downward";
        else if (errors_url_sort_order === SortOrder.None) document.getElementById("error_modal_sort_by_url_symbol")!.innerText = "";

        displayErrorsModal();
    };

}

main();

chrome.runtime.onMessage.addListener(async (_msg) => {
    const msg = _msg as AutoInjectorMessage;
    if (msg.type === AutoInjectorMessageType.ErrorUpdate) {
        const display_errors = document.getElementById("fab_display_errors")!;
        const auto_injector_scripts_errors = await getAutoInjectorScriptErrors();
        if (auto_injector_scripts_errors.length > 0) {
            display_errors.style.display = "inline-flex";
        }
        if (auto_injector_scripts_errors.length == 0) {
            display_errors.style.display = "none";
        }

        const error_display_modal = document.getElementById("error_display_modal")! as HTMLDialogElement;
        if (error_display_modal.checkVisibility({ visibilityProperty: true })) {
            displayErrorsModal();
        }
    } else if (msg.type === AutoInjectorMessageType.SettingsUpdate) reload();
});

async function createScriptList() {
    const options = await getAutoInjectorOptions();
    const scripts = await getAutoInjectorScripts();
    const list = document.createElement("ol");
    list.className = "list-decimal list-outside p-1";
    list.id = "user-script-list";
    if (scripts !== undefined) {
        for (const { hash, name, url, code, enabled, injectImmediately } of scripts) {
            const list_item = document.createElement("li");
            const div = document.createElement("div");
            div.className = "inline-flex place-items-center w-full p-4 gap-4";

            const script_collapse_div = createScriptCollapse(name, url, code, injectImmediately, options.enable_setting_inject_immediately);
            const script_buttons_div = createScriptButtons(hash, name, url, code, enabled, injectImmediately);

            div.appendChild(script_collapse_div);
            div.appendChild(script_buttons_div);
            list_item.appendChild(div);
            list.appendChild(list_item);
        }
    }

    return list;
}

function createScriptButtons(hash: number, name: string, url: string, code: string, enabled: boolean, injectImmediately: boolean): HTMLDivElement {
    const script_buttons_div = document.createElement("div");
    script_buttons_div.className = "flex place-items-center gap-4";

    const checkbox_tooltip = document.createElement("div");
    checkbox_tooltip.className = "tooltip";
    checkbox_tooltip.setAttribute("data-tip", "Enable/disable this script");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled;
    checkbox.className = "checkbox checkbox-primary my-auto";
    checkbox.onclick = () => { toggleScriptEnabled(hash, checkbox.checked) };
    checkbox_tooltip.appendChild(checkbox);

    const edit_button_tooltip = document.createElement("div");
    edit_button_tooltip.className = "tooltip";
    edit_button_tooltip.setAttribute("data-tip", "Edit this script");
    const edit_button = document.createElement("button");
    edit_button.className = "btn btn-accent m-auto edit-button";
    edit_button.innerHTML = "<span class=\"material-symbols-outlined\">edit</span>";
    edit_button.onclick = () => {
        const script_list = document.getElementById("user-script-list")!;
        for (const script of script_list?.children) {
            const edit_button = script.getElementsByClassName("edit-button").item(0) as HTMLButtonElement | null;
            if (edit_button == null) continue;
            edit_button.disabled = true;
        }
        edit_button.disabled = false;

        edit_button_tooltip.setAttribute("data-tip", "Cancel edit");
        edit_button.innerHTML = "<span class=\"material-symbols-outlined\">cancel</span>";
        edit_button.className = "btn btn-secondary m-auto";
        checkbox.disabled = true;
        editScriptMode(hash, name, url, code, injectImmediately);
        edit_button.onclick = async () => {
            const options = await getAutoInjectorOptions();
            if (options.confirmation_dialog_edit_cancel) {
                const exit_edit_script_modal = document.getElementById("exit_edit_script_modal")! as HTMLDialogElement;
                exit_edit_script_modal.showModal();
                exit_edit_script_modal.onsubmit = async (e) => {
                    e.preventDefault();
                    if (e.submitter?.id === "exit_edit_script_modal-yes") {
                        reload();
                    }
                    exit_edit_script_modal.close();
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
    copy_button.onclick = () => { copyContentToClipboard(copy_button_tooltip, copy_button, code) };
    copy_button_tooltip.appendChild(copy_button);

    const delete_button_tooltip = document.createElement("div");
    delete_button_tooltip.className = "tooltip";
    delete_button_tooltip.setAttribute("data-tip", "Permanently remove this script");
    const delete_button = document.createElement("button");
    delete_button.className = "btn btn-accent m-auto ";
    delete_button.innerHTML = "<span class=\"material-symbols-outlined\">delete_forever</span>";
    delete_button.onclick = () => { deleteScript(hash, name) };
    delete_button_tooltip.appendChild(delete_button);

    script_buttons_div.appendChild(checkbox_tooltip);
    script_buttons_div.appendChild(edit_button_tooltip);
    script_buttons_div.appendChild(copy_button_tooltip);
    script_buttons_div.appendChild(delete_button_tooltip);

    return script_buttons_div;
}

function createScriptCollapse(name: string, url: string, code: string, injectImmediately: boolean, display_inject_immediately: boolean): HTMLDivElement {
    const script_collapse_div = document.createElement("div");
    script_collapse_div.tabIndex = 0;
    script_collapse_div.className = "collapse collapse-arrow bg-base-100 border-base-300 border w-3/4 ";
    const script_collapse_title_div = document.createElement("div");
    script_collapse_title_div.className = "collapse-title whitespace-pre-wrap break-all";
    if (display_inject_immediately) script_collapse_title_div.innerText = `${name}\nURL: ${url}\nInject Immediately: `;
    else script_collapse_title_div.innerText = `${name}\nURL: ${url}`;
    if (display_inject_immediately) {
        const script_inject_immediately_input = document.createElement("input");
        script_inject_immediately_input.disabled = true;
        script_inject_immediately_input.type = "checkbox";
        script_inject_immediately_input.className = "checkbox checkbox-primary";
        script_inject_immediately_input.checked = injectImmediately;
        script_collapse_title_div.appendChild(script_inject_immediately_input);
    }
    const script_collapse_content_div = document.createElement("div");
    script_collapse_content_div.className = "collapse-content whitespace-pre-wrap break-all";
    script_collapse_content_div.innerText = code;
    script_collapse_div.appendChild(script_collapse_title_div);
    script_collapse_div.appendChild(script_collapse_content_div);



    return script_collapse_div;
}

function editScriptMode(hash: number, name: string, url: string, script: string, injectImmediately: boolean) {
    const user_script_name = document.getElementById("user-script-name") as HTMLTextAreaElement;
    const user_script_url = document.getElementById("user-script-url") as HTMLTextAreaElement;
    const user_script_inject_immediately = document.getElementById("user-script-inject-immediately") as HTMLInputElement;
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const submit_script_button = document.getElementById("submit-script") as HTMLButtonElement;
    const submit_script_form = document.getElementById("submit-script-form") as HTMLFormElement;
    user_script_text.style.height = 'auto';
    submit_script_button.textContent = "Save";
    submit_script_form.onsubmit = (e) => { editScript(e, hash) };
    user_script_text.value = script;
    user_script_text.style.height = `${user_script_text.scrollHeight}px`;
    user_script_name.value = name;
    user_script_url.value = url;
    user_script_inject_immediately.checked = injectImmediately;
}

async function displayErrorsModal() {
    createInjectionErrorFilters();
    const error_display_modal = document.getElementById("error_display_modal")! as HTMLDialogElement;
    error_display_modal.showModal();
    // Fix for open by default dropdown
    (document.activeElement! as HTMLElement).blur();

    console.log(document.activeElement);
    error_display_modal.onclose = async () => {
        const auto_injector_scripts_errors = await getAutoInjectorScriptErrors();
        if (auto_injector_scripts_errors.length == 0) {
            const display_errors = document.getElementById("fab_display_errors")!;
            display_errors.style.display = "none";
        }
    };

    const script_injection_errors_div = document.getElementById("script_injection_errors")! as HTMLDivElement;
    const script_injection_errors_list = await createInjectionErrorList();
    script_injection_errors_div.children.item(0)?.remove();
    script_injection_errors_div.appendChild(script_injection_errors_list);

    const script_injection_errors_dissmis = document.getElementById("script_injection_errors_dissmis")!;
    const auto_injector_scripts_errors = await getAutoInjectorScriptErrors();
    script_injection_errors_dissmis.onclick = async () => {
        script_injection_errors_div.children.item(0)?.remove();
        for (const error of auto_injector_scripts_errors) {
            await deleteAutoInjectorScriptErrors(error);
        }
        error_display_modal.close();
    }

}

async function createInjectionErrorFilters() {
    const error_modal_filter_by_name = document.getElementById("error_modal_filter_by_name")! as HTMLDivElement;
    const auto_injector_scripts_errors = await getAutoInjectorScriptErrors();
    const scripts_errors: { script: Script, error: ScriptError }[] = (
        await Promise.all(auto_injector_scripts_errors.map(async (se) => {
            const script = await getAutoInjectorScriptByHash(se.hash);
            if (script === undefined) {
                return null;
            }
            return { script: script, error: se };
        }))).filter((se) => se !== null);

    error_modal_filter_by_name.innerHTML = `<div>Name:</div>`;

    const script_names = new Set(scripts_errors.map((se) => se.script.name));
    for (const script_name of script_names) {
        const div = document.createElement("div");
        div.className = "inline-flex gap-2";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "name-filter-radio";
        radio.className = "radio radio-xs my-auto";
        radio.value = `${script_name}`;
        if (errors_filter_by_name === script_name) radio.checked = true;
        radio.onclick = () => {
            if (radio.checked && radio.value !== errors_filter_by_name) {
                errors_filter_by_name = radio.value;
            } else if (radio.checked && radio.value === errors_filter_by_name) {
                radio.checked = false;
                errors_filter_by_name = null;
            }
            errors_filter_by_domain = null;
            displayErrorsModal();
        }

        const name = document.createElement("span");
        name.textContent = `${script_name}`;
        name.onclick = () => {
            radio.click();
        }
        name.className = "my-auto";

        div.appendChild(radio);
        div.appendChild(name);
        error_modal_filter_by_name.appendChild(div);
    }

    const error_modal_filter_by_domain = document.getElementById("error_modal_filter_by_domain")! as HTMLDivElement;
    error_modal_filter_by_domain.innerHTML = `<div>URL:</div>`;
    const script_domains = new Set(scripts_errors.map((se) => {
        let url = se.error.url;
        let domain = url.replace(new RegExp("https*://"), "").replace(new RegExp("/.*"), "").trim();
        return domain;
    }));
    for (const script_domain of script_domains) {
        const div = document.createElement("div");
        div.className = "inline-flex gap-2";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "name-filter-radio";
        radio.className = "radio radio-xs my-auto";
        radio.value = `${script_domain}`;
        if (errors_filter_by_domain === script_domain) radio.checked = true;
        radio.onclick = () => {
            if (radio.checked && radio.value !== errors_filter_by_domain) {
                errors_filter_by_domain = radio.value;
            } else if (radio.checked && radio.value === errors_filter_by_domain) {
                radio.checked = false;
                errors_filter_by_domain = null;
            }
            errors_filter_by_name = null;
            displayErrorsModal();
        }

        const name = document.createElement("span");
        name.textContent = `${script_domain}`;
        name.onclick = () => {
            radio.click();
        }
        name.className = "my-auto";

        div.appendChild(radio);
        div.appendChild(name);
        error_modal_filter_by_domain.appendChild(div);
    }
}

async function createInjectionErrorList() {
    const auto_injector_scripts_errors = await getAutoInjectorScriptErrors();
    const scripts_errors: { script: Script, error: ScriptError }[] = (
        await Promise.all(auto_injector_scripts_errors.map(async (se) => {
            const script = await getAutoInjectorScriptByHash(se.hash);
            if (script === undefined) {
                return null;
            }
            return { script: script, error: se };
        })))
        .filter((se) => se !== null).
        filter((se) => {
            if (errors_filter_by_name === null) return true;
            else {
                return se.script.name === errors_filter_by_name;
            }
        })
        .filter((se) => {
            if (errors_filter_by_domain === null) return true;
            else {
                let url = se.error.url;
                let domain = url.replace(new RegExp("https*://"), "").replace(new RegExp("/.*"), "").trim();
                return domain === errors_filter_by_domain;
            }
        })
        ;

    if (errors_date_sort_order === SortOrder.Ascending) scripts_errors.sort((a, b) => b.error.timestamp - a.error.timestamp);
    else if (errors_date_sort_order === SortOrder.Descending) scripts_errors.sort((a, b) => a.error.timestamp - b.error.timestamp);

    if (errors_name_sort_order === SortOrder.Ascending) scripts_errors.sort((a, b) => b.script.name.localeCompare(a.script.name));
    else if (errors_name_sort_order === SortOrder.Descending) scripts_errors.sort((a, b) => a.script.name.localeCompare(b.script.name));

    if (errors_url_sort_order === SortOrder.Ascending) scripts_errors.sort((a, b) => b.error.url.localeCompare(a.error.url));
    else if (errors_url_sort_order === SortOrder.Descending) scripts_errors.sort((a, b) => a.error.url.localeCompare(b.error.url));

    const list = document.createElement("ol");
    for (const script_error of scripts_errors) {
        const list_item = document.createElement("li");
        list_item.className = "p-2";

        const script = script_error.script;
        const error = script_error.error;

        const div = document.createElement("div");
        div.className = "alert alert-error alert-outline inline-flex w-full relative";
        div.role = "alert";
        div.innerHTML = `<div class="grid">
                <span class="font-semibold wrap-anywhere">${script?.name}</span>
                <span class="wrap-anywhere">${new Date(error.timestamp)}</span>
                <span class="wrap-anywhere">${error.message} Occured at: ${error.url}</span>
            </div>`;

        const dismiss_button = document.createElement("button");
        dismiss_button.className = "btn btn-sm btn-circle btn-ghost absolute right-1 top-1";
        dismiss_button.innerHTML = `<span class="material-symbols-outlined">close</span>`;
        dismiss_button.onclick = async () => {
            await deleteAutoInjectorScriptErrors(error);
            list_item.remove();
            createInjectionErrorFilters();
            if (list.children.length == 0) {
                const error_display_modal = document.getElementById("error_display_modal")! as HTMLDialogElement;
                error_display_modal.close();
            }
        }

        div.appendChild(dismiss_button);
        list_item.appendChild(div);
        list.appendChild(list_item);
    }

    return list;
}

async function saveScript(e: SubmitEvent) {
    e.preventDefault();
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const user_script_name = document.getElementById("user-script-name") as HTMLInputElement;
    const user_script_inject_immediately = document.getElementById("user-script-inject-immediately") as HTMLInputElement;
    const user_script_url = document.getElementById("user-script-url") as HTMLTextAreaElement;

    const saveScript = async () => {
        const saved = await saveAutoInjectorScript(user_script_name.value, user_script_url.value, user_script_text.value, user_script_inject_immediately.checked);
        if (saved) {
            shortToast(`Script "${user_script_name.value}" saved successfully!"`);
            reload();
        } else {
            user_script_name.pattern = `^(?!${user_script_name.value}$).*$`;
            (user_script_name.nextElementSibling! as HTMLDivElement).innerText = "Script name must be unique";
            user_script_name.oninput = () => {
                if (user_script_name.value.length > 2) {
                    (user_script_name.nextElementSibling! as HTMLDivElement).innerText = "Script name must be unique";
                } else {
                    (user_script_name.nextElementSibling! as HTMLDivElement).innerText = "";
                }
            }
            user_script_name.reportValidity();
        }
    };

    const options = await getAutoInjectorOptions();
    if (options.warn_about_dupilcate_scripts) {
        const scripts = await getAutoInjectorScripts();
        const duplicate_script = scripts?.find((s) => s.code_hash === djb2Hash(user_script_text.value))
        if (duplicate_script !== undefined) {
            const save_duplicate_script_modal = document.getElementById("save_duplicate_script_modal")! as HTMLDialogElement;
            const modal_text = save_duplicate_script_modal.getElementsByClassName("modal-box-h3").item(0)!;
            const duplicate_script_name = (await getAutoInjectorScriptByHash(duplicate_script.hash))?.name!;
            modal_text.textContent = modal_text.textContent.replace("{}", duplicate_script_name);

            save_duplicate_script_modal.showModal();
            save_duplicate_script_modal.onsubmit = async (e) => {
                e.preventDefault();
                if (e.submitter?.id === "save_duplicate_script_modal-yes") {
                    saveScript();
                }
                save_duplicate_script_modal.close();

            }
        }
        else {
            saveScript();
        }
    } else {
        saveScript();
    }
}

async function deleteScript(hash: number, name: string) {
    const options = await getAutoInjectorOptions();
    if (options.confirmation_dialog_remove) {
        const delete_script_modal = document.getElementById("delete_script_modal")! as HTMLDialogElement;
        delete_script_modal.showModal();
        delete_script_modal.onsubmit = async (e) => {
            e.preventDefault();
            if (e.submitter?.id === "delete_script_modal-yes") {
                await deleteAutoInjectorScript(hash);

                shortToast(`Script "${name}" removed successfully!`);
                reload();
            }
            delete_script_modal.close();
        };
    } else {
        await deleteAutoInjectorScript(hash);
        shortToast(`Script "${name}" removed successfully!`);
        reload();
    }
}

async function editScript(e: SubmitEvent, hash: number) {
    e.preventDefault();
    const editScript = async () => {
        const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
        const user_script_name = document.getElementById("user-script-name") as HTMLInputElement;
        const user_script_inject_immediately = document.getElementById("user-script-inject-immediately") as HTMLInputElement;
        const user_script_url = document.getElementById("user-script-url") as HTMLTextAreaElement;
        const name = user_script_name.value;

        const edited = await editAutoInjectorScript(hash, user_script_name.value, user_script_url.value, user_script_text.value, user_script_inject_immediately.checked);
        if (edited) {
            shortToast(`Script "${name}" updated successfully!`);
            reload();
        } else {
            user_script_name.pattern = `^(?!${user_script_name.value}$).*$`;
            (user_script_name.nextElementSibling! as HTMLDivElement).innerText = "Script name must be unique";
            user_script_name.oninput = () => {
                if (user_script_name.value.length > 2) {
                    (user_script_name.nextElementSibling! as HTMLDivElement).innerText = "Script name must be unique";
                } else {
                    (user_script_name.nextElementSibling! as HTMLDivElement).innerText = "";
                }
            }
            user_script_name.reportValidity();
        }


    };
    const options = await getAutoInjectorOptions();
    if (options.warn_about_dupilcate_scripts) {
        const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
        const script = await getAutoInjectorScriptByHash(hash);
        const script_hash = script?.hash;
        const scripts = await getAutoInjectorScripts();
        const duplicate_script = scripts?.find((s) => s.code_hash === djb2Hash(user_script_text.value) && s.hash !== script_hash)
        if (duplicate_script !== undefined) {
            const save_duplicate_script_modal = document.getElementById("save_duplicate_script_modal")! as HTMLDialogElement;
            const modal_text = save_duplicate_script_modal.getElementsByClassName("modal-box-h3").item(0)!;
            const duplicate_script_name = (await getAutoInjectorScriptByHash(duplicate_script.hash))?.name!;
            modal_text.textContent = modal_text.textContent.replace("{}", duplicate_script_name);

            save_duplicate_script_modal.showModal();
            save_duplicate_script_modal.onsubmit = async (e) => {
                e.preventDefault();
                if (e.submitter?.id === "save_duplicate_script_modal-yes") {
                    if (options.confirmation_dialog_edit) {
                        const edit_script_modal = document.getElementById("edit_script_modal")! as HTMLDialogElement;
                        edit_script_modal.showModal();
                        edit_script_modal.onsubmit = async (e) => {
                            e.preventDefault();
                            if (e.submitter?.id === "edit_script_modal-yes") {
                                await editScript();
                            }
                            edit_script_modal.close();
                        };
                    } else {
                        await editScript();
                    }
                }
                save_duplicate_script_modal.close();

            }
        }
        else {
            if (options.confirmation_dialog_edit) {
                const edit_script_modal = document.getElementById("edit_script_modal")! as HTMLDialogElement;
                edit_script_modal.showModal();
                edit_script_modal.onsubmit = async (e) => {
                    e.preventDefault();
                    if (e.submitter?.id === "edit_script_modal-yes") {
                        await editScript();
                    }
                    edit_script_modal.close();
                };
            } else {
                await editScript();
            }
        }
    } else {
        if (options.confirmation_dialog_edit) {
            const edit_script_modal = document.getElementById("edit_script_modal")! as HTMLDialogElement;
            edit_script_modal.showModal();
            edit_script_modal.onsubmit = async (e) => {
                e.preventDefault();
                if (e.submitter?.id === "edit_script_modal-yes") {
                    await editScript();
                }
                edit_script_modal.close();
            };
        } else {
            await editScript();
        }
    }
}

async function toggleScriptEnabled(hash: number, enabled: boolean) {
    if (enabled) {
        await enableAutoInjectorScript(hash);
    } else {
        await disableAutoInjectorScript(hash);
    }
    reload();
}


async function onDisableAllClick() {
    let scripts = await getAutoInjectorScripts();
    if (scripts === undefined) return;
    for (const script of scripts) {
        await disableAutoInjectorScript(script.hash);
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

        const date = new Date();
        const year = date.getFullYear();
        console.log(year);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        console.log(month);
        const day = date.getDate().toString().padStart(2, "0");
        console.log(day);
        a.download = `autoinjector_scripts_${year}_${month}_${day}.json`;

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
    const auto_injector_scripts = await getAutoInjectorScripts()
    const saved_scripts = (auto_injector_scripts?.map((s) => s.code_hash));
    const saved_scripts_hash = new Set(saved_scripts);

    const imported_scripts = JSON.parse(data) as { hash: number | undefined, name: string | undefined, url: string | undefined, code: string, code_hash: number | undefined, enabled: boolean, injectImmediately: boolean | undefined }[];
    let i = (saved_scripts === undefined) ? 0 : saved_scripts.length + 1;
    const migrated_scripts: Script[] = imported_scripts.map((s) => {
        if (s.name === undefined) s.name = `Script ${i++}`;
        if (s.url === undefined) s.url = "*";
        if (s.injectImmediately === undefined) s.injectImmediately = false;
        s.hash = djb2Hash(s.name + s.code);
        s.code_hash = djb2Hash(s.code);
        return { hash: s.hash, name: s.name, url: s.url, code: s.code, code_hash: s.code_hash, enabled: s.enabled, injectImmediately: s.injectImmediately };
    });
    const names: Set<String> = new Set(auto_injector_scripts?.map((s) => s.name));
    const scripts = [];
    for (let script of migrated_scripts) {
        while (names.has(script.name)) {
            const rand = Math.floor(Math.random() * 10000);
            script.name += `_${rand}`;
        }
        names.add(script.name);
        scripts.push(script);
    }
    const duplicate_scripts: Script[] = [];
    let imported_scripts_count = 0;
    for (const script of scripts) {
        if (saved_scripts_hash.has(djb2Hash(script.code))) {
            console.log("Duplicate script:");
            console.log(script.code);
            duplicate_scripts.push(script);
            continue;
        };
        imported_scripts_count++;
        await saveAutoInjectorScript(script.name, script.url, script.code, script.injectImmediately, script.enabled);
    }
    if (duplicate_scripts.length > 0) {
        const import_duplicate_script_modal = document.getElementById("import_duplicate_script_modal")! as HTMLDialogElement;
        import_duplicate_script_modal.showModal();
        import_duplicate_script_modal.onsubmit = async (e) => {
            let duplicate_scripts_count = 0;
            e.preventDefault();
            if (e.submitter?.id === "import_duplicate_script_modal-yes") {
                for (const script of duplicate_scripts) {
                    imported_scripts_count++;
                    duplicate_scripts_count++;
                    await saveAutoInjectorScript(script.name, script.url, script.code, script.injectImmediately, script.enabled);
                }
            }
            import_duplicate_script_modal.close();

            shortToast(`Imported ${imported_scripts_count} script${imported_scripts_count > 1 ? 's' : ''}(${duplicate_scripts_count} duplicate${duplicate_scripts_count > 1 ? 's' : ''}) successfully!`);
            reload();
        };
    } else {
        shortToast(`Imported ${imported_scripts_count} script${imported_scripts_count > 1 ? 's' : ''} successfully!`);
        reload();
    }

}

function reload() {
    const user_script_url = document.getElementById("user-script-url") as HTMLTextAreaElement;
    const user_script_text = document.getElementById("user-script") as HTMLTextAreaElement;
    const user_script_name = document.getElementById("user-script-name") as HTMLInputElement;
    const user_script_inject_immediately = document.getElementById("user-script-inject-immediately") as HTMLInputElement;
    const user_script_text_div = document.getElementById("user-script-textarea-div") as HTMLDivElement;
    const user_script_expand_textarea = document.getElementById("user-script-expand-textarea") as HTMLDivElement;

    user_script_text.value = "";
    user_script_name.value = "";
    user_script_url.value = "*";
    user_script_inject_immediately.checked = false;
    autoResizeTextArea("user-script");
    user_script_text_div.style.marginRight = "";
    user_script_text_div.style.marginLeft = "";
    user_script_expand_textarea.setAttribute("expanded", "false");
    user_script_expand_textarea.innerHTML = `<span class="material-symbols-outlined">fit_page_width</span>`;

    const submit_script_form = document.getElementById("submit-script-form") as HTMLFormElement;
    submit_script_form.reset();
    submit_script_form.onsubmit = (e) => { saveScript(e); };

    const submit_script_button = document.getElementById("submit-script") as HTMLButtonElement;
    submit_script_button.textContent = "Submit";

    getAutoInjectorOptions().then((options) => {
        if (!options.enable_setting_inject_immediately) {
            document.getElementById("user-script-inject-immediately-label")!.style.display = "none";
        } else {
            document.getElementById("user-script-inject-immediately-label")!.style.display = "inline-flex";
        }
    });

    const script_div = document.getElementById("script-div") as HTMLDivElement;
    script_div.children.item(0)?.remove();
    createScriptList().then((l) => script_div.appendChild(l))
}
