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

    const export_btn = document.getElementById("export-btn") as HTMLButtonElement;
    export_btn.onclick = async () => {
        const auto_injector_options = (await getAutoInjectorOptions())!;
        if (auto_injector_options !== undefined) {
            const auto_injector_options_json = JSON.stringify(auto_injector_options, null);
            const url = `data:application/json;base64,${btoa(auto_injector_options_json)}`;
            const a = document.createElement("a");
            a.href = url;

            const date = new Date();
            const year = date.getFullYear();
            console.log(year);
            const month = String(date.getMonth() + 1).padStart(2, "0");
            console.log(month);
            const day = date.getDate().toString().padStart(2, "0");
            console.log(day);
            a.download = `autoinjector_settings_${year}_${month}_${day}.json`;

            a.click();
        }

    };
}

main();
