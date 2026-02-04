import { autoIndentOnEnter, autoResizeTextArea, copyContentToClipboard, expandTextArea, insertTabOnTabKey, removeLastIndentOnShiftTabKey, shortToast } from "./dashboard_utils.mjs";
import { CascadingStyleSheets } from "./interfaces.mjs";
import { deleteAutoInjectorUserCSS, disableAutoInjectorUserCSS, djb2Hash, editAutoInjectorUserCss, enableAutoInjectorUserCSS, getAutoInjectorOptions, getAutoInjectorUserCSS, getAutoInjectorUserCSSByHash, saveAutoInjectorUserCSS } from "./utils.mjs";

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
                removeLastIndentOnShiftTabKey("user-css", e);
            }
            if (options.enable_insert_tab_on_tab) {
                insertTabOnTabKey("user-css", e);
            }
        }
    };
    autoResizeTextArea("user-css");

    const user_css_expand_textarea = document.getElementById("user-css-expand-textarea") as HTMLDivElement;
    user_css_expand_textarea.onclick = () => expandTextArea("user-css-textarea-div", "user-css-expand-textarea");

    const export_button = document.getElementById("btn_export")!;
    export_button.onclick = exportUserCss;

    const import_button = document.getElementById("btn_import")!;
    import_button.onclick = onImportUserCssClick;

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

    const user_css = await getAutoInjectorUserCSS();
    const duplicate_user_css = user_css?.find((s) => s.css_hash === djb2Hash(user_css_text.value))
    if (duplicate_user_css !== undefined) {
        const save_duplicate_user_css_modal = document.getElementById("save_duplicate_user_css_modal")! as HTMLDialogElement;
        const modal_text = save_duplicate_user_css_modal.getElementsByClassName("modal-box-h3").item(0)!;
        const duplicate_user_css_name = (await getAutoInjectorUserCSSByHash(duplicate_user_css.hash))?.name!;
        modal_text.textContent = modal_text.textContent.replace("{}", duplicate_user_css_name);

        save_duplicate_user_css_modal.showModal();
        save_duplicate_user_css_modal.onsubmit = async (e) => {
            e.preventDefault();
            if (e.submitter?.id === "save_duplicate_user_css_modal-yes") {
                saveUserCss();
            }
            save_duplicate_user_css_modal.close();

        }
    }
    else {
        saveUserCss();
    }
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

    const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
    const user_css = await getAutoInjectorUserCSSByHash(hash);
    const user_css_hash = user_css?.hash;
    const ai_user_css = await getAutoInjectorUserCSS();
    const duplicate_user_css = ai_user_css?.find((s) => s.css_hash === djb2Hash(user_css_text.value) && s.hash !== user_css_hash)
    const options = await getAutoInjectorOptions();
    if (duplicate_user_css !== undefined) {
        const save_duplicate_user_css_modal = document.getElementById("save_duplicate_user_css_modal")! as HTMLDialogElement;
        const modal_text = save_duplicate_user_css_modal.getElementsByClassName("modal-box-h3").item(0)!;
        const duplicate_user_css_name = (await getAutoInjectorUserCSSByHash(duplicate_user_css.hash))?.name!;
        modal_text.textContent = modal_text.textContent.replace("{}", duplicate_user_css_name);

        save_duplicate_user_css_modal.showModal();
        save_duplicate_user_css_modal.onsubmit = async (e) => {
            e.preventDefault();
            if (e.submitter?.id === "save_duplicate_user_css_modal-yes") {
                if (options.confirmation_dialog_edit) {
                    const edit_script_modal = document.getElementById("edit_user_css_modal")! as HTMLDialogElement;
                    edit_script_modal.showModal();
                    edit_script_modal.onsubmit = async (e) => {
                        e.preventDefault();
                        if (e.submitter?.id === "edit_user_css_modal-yes") {
                            await editUserCss();
                        }
                        edit_script_modal.close();
                    };
                } else {
                    await editUserCss();
                }
            }
            save_duplicate_user_css_modal.close();
        }
    }
    else {
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

async function onImportUserCssClick() {
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
                    importUserCss(e.target?.result.toString())
            }
        }
    };
    input.click();
}

async function importUserCss(data: string) {
    const auto_injector_user_css = await getAutoInjectorUserCSS();
    const saved_user_css = (auto_injector_user_css?.map((s) => s.css_hash));
    const saved_user_css_hash = new Set(saved_user_css);

    const imported_user_css = JSON.parse(data) as { hash: number, name: string, url: string, css: string, enabled: boolean, css_hash: number | undefined }[];
    const migrated_user_css: CascadingStyleSheets[] = imported_user_css.map((s) => {
        s.hash = djb2Hash(s.name + s.css);
        s.css_hash = djb2Hash(s.css);
        return { hash: s.hash, name: s.name, url: s.url, css: s.css, css_hash: s.css_hash, enabled: s.enabled };
    });
    const names: Set<String> = new Set(auto_injector_user_css?.map((s) => s.name));
    const user_css = [];
    for (let u_css of migrated_user_css) {
        while (names.has(u_css.name)) {
            const rand = Math.floor(Math.random() * 10000);
            u_css.name += `_${rand}`;
        }
        names.add(u_css.name);
        user_css.push(u_css);
    }
    const duplicate_user_css: CascadingStyleSheets[] = [];
    let imported_user_css_count = 0;
    for (const u_css of user_css) {
        if (saved_user_css_hash.has(u_css.css_hash)) {
            console.log("Duplicate user css:");
            console.log(u_css.css);
            duplicate_user_css.push(u_css);
            continue;
        };
        imported_user_css_count++;
        await saveAutoInjectorUserCSS(u_css.name, u_css.url, u_css.css, u_css.enabled);
    }
    if (duplicate_user_css.length > 0) {
        const import_duplicate_user_css_modal = document.getElementById("import_duplicate_user_css_modal")! as HTMLDialogElement;
        import_duplicate_user_css_modal.showModal();
        import_duplicate_user_css_modal.onsubmit = async (e) => {
            let duplicate_user_css_count = 0;
            e.preventDefault();
            if (e.submitter?.id === "import_duplicate_user_css_modal-yes") {
                for (const u_css of duplicate_user_css) {
                    imported_user_css_count++;
                    duplicate_user_css_count++;
                    await saveAutoInjectorUserCSS(u_css.name, u_css.url, u_css.css, u_css.enabled);
                }
            }
            import_duplicate_user_css_modal.close();

            shortToast(`Imported ${imported_user_css_count} user CSS(${duplicate_user_css_count} duplicate${duplicate_user_css_count > 1 ? 's' : ''}) successfully!`);
            reload();
        };
    } else {
        shortToast(`Imported ${imported_user_css_count} user CSS successfully!`);
        reload();
    }

}

function reload() {
    const user_css_text = document.getElementById("user-css") as HTMLTextAreaElement;
    const user_css_name = document.getElementById("user-css-name") as HTMLInputElement;
    const user_css_url = document.getElementById("user-css-url") as HTMLTextAreaElement;
    const user_css_text_div = document.getElementById("user-css-textarea-div") as HTMLDivElement;
    const user_css_expand_textarea = document.getElementById("user-css-expand-textarea") as HTMLDivElement;
    user_css_text.value = "";
    user_css_name.value = "";
    user_css_url.value = "*";
    autoResizeTextArea("user-css");
    user_css_text_div.style.marginRight = "";
    user_css_text_div.style.marginLeft = "";
    user_css_expand_textarea.setAttribute("expanded", "false");
    user_css_expand_textarea.innerHTML = `<span class="material-symbols-outlined">fit_page_width</span>`;


    const submit_css_form = document.getElementById("submit-user-css-form") as HTMLFormElement;
    submit_css_form.reset();
    submit_css_form.onsubmit = (e) => { saveUserCss(e); };

    const submit_user_css_button = document.getElementById("submit-user-css") as HTMLButtonElement;
    submit_user_css_button.textContent = "Submit";

    const user_css_div = document.getElementById("user-css-div") as HTMLDivElement;
    user_css_div.children.item(0)?.remove();
    createUserCssList().then((l) => user_css_div.appendChild(l))
}
