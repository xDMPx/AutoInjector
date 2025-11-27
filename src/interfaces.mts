export interface Script {
    hash: number,
    name: string,
    url: string,
    code: string,
    enabled: boolean
}

export interface AutoInjectorOptions {
    confirmation_dialog_remove: boolean
    confirmation_dialog_edit: boolean
    enable_remove_indent_shift_tab: boolean
    enable_insert_tab_on_tab: boolean
}
