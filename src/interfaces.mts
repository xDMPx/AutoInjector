export interface Script {
    name: string,
    url: string,
    code: string,
    enabled: boolean
}

export interface AutoInjectorOptions {
    confirmation_dialog_remove: boolean
}
