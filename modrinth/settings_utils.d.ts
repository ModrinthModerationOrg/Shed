declare interface SelectionOptions {
    handlerType: ?EntryHandler;
}

declare interface SettingsOptions {
    showDefaultValue: boolean;
    attemptFlexWrapping: boolean;
}

declare interface TextBoxOptions<T> {
    endec: ?{decode: (select: T) => String; encode: (select: string) => T; };
}

declare interface SettingsElementMaker {
    dependentSetting?: CachedSetting<boolean>;

    textBox<T>(name: string, setting: CachedSetting<T>, options: TextBoxOptions<T> & SettingsOptions): HTMLDivElement;

    input(name: string, setting: CachedSetting<string>, options: SettingsOptions): HTMLDivElement;

    selection<T>(name: string, setting: CachedSetting<string|number|T>, collection: Collection<T>, options: SettingsOptions): HTMLDivElement;

    toggle(name: string, setting: CachedSetting<boolean>, options: SettingsOptions): HTMLDivElement;

    // TODO: ADD ABLITY TO TOGGLE DEFAULT VALUE OFF FOR CERTAIN SETTINGS
    base(name: string, setting: CachedSetting<any>, controlBuilder: (wrapper: HTMLDivElement, defaultStateSpan: HTMLSpanElement) => void, options: SettingsOptions): HTMLDivElement;

    labeledOption(name, controlBuilder: (wrapper: HTMLDivElement, label: HTMLLabelElement) => void): HTMLDivElement;

    dependentOn(setting: CachedSetting<boolean>, buildFunc: (maker: this) => void): this;
}

interface SettingsElementsUtils {
    mergeAs<E extends Element>(element: E): E & SettingsElementMaker;
}

declare const settingsElements: SettingsElementsUtils;