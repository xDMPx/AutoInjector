export interface Script {
    hash: number,
    name: string,
    url: string,
    code: string,
    enabled: boolean,
    injectImmediately: boolean
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
    enable_remove_indent_shift_tab: boolean
    enable_insert_tab_on_tab: boolean
    enable_setting_inject_immediately: boolean
}

export interface ScriptError {
    hash: number,
    message: string,
    timestamp: number
}
