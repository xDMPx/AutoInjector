import { disableAutoInjectorUserCSS, enableAutoInjectorUserCSS, getAutoInjectorUserCSS } from "./utils.mjs";

async function main() {
    const user_css_div = document.getElementById("user-css-div") as HTMLDivElement;
    user_css_div.appendChild(await createUserCssList());
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
            const user_css_buttons_div = createUserCssButtons(hash, css, enabled);

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

function createUserCssButtons(hash: number, css: string, enabled: boolean): HTMLDivElement {
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

    const copy_button_tooltip = document.createElement("div");
    copy_button_tooltip.className = "tooltip";
    copy_button_tooltip.setAttribute("data-tip", "Copy to clipboard");
    const copy_button = document.createElement("button");
    copy_button.className = "btn btn-accent m-auto";
    copy_button.innerHTML = "<span class=\"material-symbols-outlined\">content_copy</span>";
    copy_button.onclick = () => { copyScriptToClipboard(copy_button_tooltip, copy_button, css) };
    copy_button_tooltip.appendChild(copy_button);

    user_css_buttons_div.appendChild(checkbox_tooltip);
    user_css_buttons_div.appendChild(copy_button_tooltip);

    return user_css_buttons_div;
}

function copyScriptToClipboard(copy_button_tooltip: HTMLDivElement, copy_button: HTMLButtonElement, code: string) {
    copy_button_tooltip.setAttribute("data-tip", "Copied!");
    copy_button.innerHTML = "<span class=\"material-symbols-outlined\">check</span>";
    setTimeout(() => {
        copy_button_tooltip.setAttribute("data-tip", "Copy to clipboard");
        copy_button.innerHTML = "<span class=\"material-symbols-outlined\">content_copy</span>";
    }, 250);
    navigator.clipboard.writeText(code);
}

async function toggleUserCssEnabled(hash: number, enabled: boolean) {
    if (enabled) {
        await enableAutoInjectorUserCSS(hash);
    } else {
        await disableAutoInjectorUserCSS(hash);
    }
    reload();
}

function reload() {
    const user_css_div = document.getElementById("user-css-div") as HTMLDivElement;
    user_css_div.children.item(0)?.remove();
    createUserCssList().then((l) => user_css_div.appendChild(l))
}
