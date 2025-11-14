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
}

main();
