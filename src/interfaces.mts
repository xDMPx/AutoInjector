export interface Script {
    hash: number,
    name: string,
    url: string,
    code: string,
    code_hash: number,
    enabled: boolean,
    injectImmediately: boolean
}

export interface CascadingStyleSheets {
    hash: number,
    name: string,
    url: string,
    css: string,
    css_hash: number,
    enabled: boolean,
}

export enum AutoInjectorMessageType {
    ErrorUpdate,
    ScriptError,
    SettingsUpdate
}

export interface AutoInjectorMessage {
    type: AutoInjectorMessageType,
    scriptError: ScriptError | undefined,
}

export interface AutoInjectorOptions {
    confirmation_dialog_remove: boolean
    confirmation_dialog_edit: boolean
    confirmation_dialog_edit_cancel: boolean
    enable_remove_indent_shift_tab: boolean
    enable_insert_tab_on_tab: boolean
    enable_setting_inject_immediately: boolean
    warn_about_dupilcate_scripts: boolean
    warn_about_dupilcate_user_css: boolean
}

export interface ScriptError {
    hash: number,
    message: string,
    url: string,
    timestamp: number
}
