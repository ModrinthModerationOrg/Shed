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
    oncloseHook: (callback: () => void) => void;

    textBox<T>(name: string, setting: CachedSetting<T>, options: TextBoxOptions<T> & SettingsOptions): this;

    input(name: string, setting: CachedSetting<string>, options: SettingsOptions): this;

    selection<T>(name: string, setting: CachedSetting<string|number|T>, collection: Collection<T>, options: SettingsOptions): this;

    toggle(name: string, setting: CachedSetting<boolean>, options: SettingsOptions): this;

    // TODO: ADD ABLITY TO TOGGLE DEFAULT VALUE OFF FOR CERTAIN SETTINGS
    base(name: string, setting: CachedSetting<any>, controlBuilder: (wrapper: HTMLDivElement, defaultStateSpan: HTMLSpanElement) => void, options: SettingsOptions): this;

    labeledOption(name: string, controlBuilder: (wrapper: HTMLDivElement, label: HTMLLabelElement) => void): this;

    dependentOn(setting: CachedSetting<boolean>, buildFunc: (maker: this) => void): this;

    group({header, direction}: {header: {name?: string, headerType?: string | number, styleData: StyleData}, direction?: "row" | "column"}, builder: (groupHolder: HTMLDivElement & SettingsElementMaker) => void): this;
}

interface SettingsElementsUtils {
    mergeAs<E extends Element>(element: E, oncloseHook: (callback: () => void) => void): E & SettingsElementMaker;
}

declare const settingsElements: SettingsElementsUtils;