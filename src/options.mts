import { AutoInjectorMessage, AutoInjectorMessageType } from "./interfaces.mjs";
import { getAutoInjectorOptions, setAutoInjectorOptions } from "./utils.mjs";

async function main() {
    const auto_injector_options = await getAutoInjectorOptions();
    const confirmation_dialog_remove_checkbox = document.getElementById("confirmation_dialog_remove_checkbox") as HTMLInputElement;
    confirmation_dialog_remove_checkbox.checked = auto_injector_options.confirmation_dialog_remove;
    confirmation_dialog_remove_checkbox.onclick = async () => {
        const auto_injector_options = (await getAutoInjectorOptions())!;
        const confirmation_dialog_remove_checkbox = document.getElementById("confirmation_dialog_remove_checkbox") as HTMLInputElement;
        auto_injector_options.confirmation_dialog_remove = confirmation_dialog_remove_checkbox.checked;
        setAutoInjectorOptions(auto_injector_options);
    };
    const edit_dialog_remove_checkbox = document.getElementById("edit_dialog_remove_checkbox") as HTMLInputElement;
    edit_dialog_remove_checkbox.checked = auto_injector_options.confirmation_dialog_edit;
    edit_dialog_remove_checkbox.onclick = async () => {
        const auto_injector_options = (await getAutoInjectorOptions())!;
        const edit_dialog_remove_checkbox = document.getElementById("edit_dialog_remove_checkbox") as HTMLInputElement;
        auto_injector_options.confirmation_dialog_edit = edit_dialog_remove_checkbox.checked;
        setAutoInjectorOptions(auto_injector_options);
    };
    {
        const edit_cancel_dialog_checkbox = document.getElementById("edit_cancel_dialog_checkbox") as HTMLInputElement;
        edit_cancel_dialog_checkbox.checked = auto_injector_options.confirmation_dialog_edit_cancel;
        edit_cancel_dialog_checkbox.onclick = async () => {
            const auto_injector_options = (await getAutoInjectorOptions())!;
            const edit_cancel_dialog_checkbox = document.getElementById("edit_cancel_dialog_checkbox") as HTMLInputElement;
            auto_injector_options.confirmation_dialog_edit_cancel = edit_cancel_dialog_checkbox.checked;
            setAutoInjectorOptions(auto_injector_options);
        };
    }
    const enable_remove_indent_shift_tab_checkbox = document.getElementById("enable_remove_indent_shift_tab_checkbox") as HTMLInputElement;
    enable_remove_indent_shift_tab_checkbox.checked = auto_injector_options.enable_remove_indent_shift_tab;
    enable_remove_indent_shift_tab_checkbox.onclick = async () => {
        const auto_injector_options = (await getAutoInjectorOptions())!;
        const enable_remove_indent_shift_tab_checkbox = document.getElementById("enable_remove_indent_shift_tab_checkbox") as HTMLInputElement;
        auto_injector_options.enable_remove_indent_shift_tab = enable_remove_indent_shift_tab_checkbox.checked;
        setAutoInjectorOptions(auto_injector_options);
    };
    const enable_insert_tab_on_tab_checkbox = document.getElementById("enable_insert_tab_on_tab_checkbox") as HTMLInputElement;
    enable_insert_tab_on_tab_checkbox.checked = auto_injector_options.enable_insert_tab_on_tab;
    enable_insert_tab_on_tab_checkbox.onclick = async () => {
        const auto_injector_options = (await getAutoInjectorOptions())!;
        const enable_insert_tab_on_tab_checkbox = document.getElementById("enable_insert_tab_on_tab_checkbox") as HTMLInputElement;
        auto_injector_options.enable_insert_tab_on_tab = enable_insert_tab_on_tab_checkbox.checked;
        setAutoInjectorOptions(auto_injector_options);
    };
    const enable_setting_inject_immediately_checkbox = document.getElementById("enable_setting_inject_immediately_checkbox") as HTMLInputElement;
    enable_setting_inject_immediately_checkbox.checked = auto_injector_options.enable_setting_inject_immediately;
    enable_setting_inject_immediately_checkbox.onclick = async () => {
        const auto_injector_options = (await getAutoInjectorOptions())!;
        const enable_setting_inject_immediately_checkbox = document.getElementById("enable_setting_inject_immediately_checkbox") as HTMLInputElement;
        auto_injector_options.enable_setting_inject_immediately = enable_setting_inject_immediately_checkbox.checked;
        setAutoInjectorOptions(auto_injector_options).then(() => {
            const msg: AutoInjectorMessage = {
                type: AutoInjectorMessageType.SettingsUpdate,
            } as AutoInjectorMessage;
            chrome.runtime.sendMessage(msg)
        })
    };

    const warn_about_dupilcate_scripts_checkbox = document.getElementById("warn_about_dupilcate_scripts_checkbox") as HTMLInputElement;
    warn_about_dupilcate_scripts_checkbox.checked = auto_injector_options.warn_about_dupilcate_scripts;
    warn_about_dupilcate_scripts_checkbox.onclick = async () => {
        const auto_injector_options = (await getAutoInjectorOptions())!;
        const warn_about_dupilcate_scripts_checkbox = document.getElementById("warn_about_dupilcate_scripts_checkbox") as HTMLInputElement;
        auto_injector_options.warn_about_dupilcate_scripts = warn_about_dupilcate_scripts_checkbox.checked;
        setAutoInjectorOptions(auto_injector_options);
    };
}

main();
