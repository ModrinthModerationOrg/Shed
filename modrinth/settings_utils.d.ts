declare interface SelectionOptions {
    handlerType: ?EntryHandler;
}

declare interface SettingsOptions {
    showDefaultValue: boolean;
    attemptFlexWrapping: boolean;
}

declare interface TextBoxOptions<T> {
    endec: Endec<T, string>;
}

declare interface SettingsElementMaker {
    dependentSetting?: Setting<boolean>;
    oncloseHook: (callback: () => void) => void;

    textBox<T>(name: string, setting: Setting<T>, options: TextBoxOptions<T> & SettingsOptions): this;

    input(name: string, setting: Setting<string>, options: SettingsOptions): this;

    selection<T>(name: string, setting: Setting<string|number|T>, collection: Collection<T>, options: SettingsOptions): this;

    toggle(name: string, setting: Setting<boolean>, options: SettingsOptions): this;

    // TODO: ADD ABLITY TO TOGGLE DEFAULT VALUE OFF FOR CERTAIN SETTINGS
    base(name: string, setting: Setting<any>, controlBuilder: (wrapper: HTMLDivElement, defaultStateSpan: HTMLSpanElement) => void, options: SettingsOptions): this;

    labeledOption(name: string, controlBuilder: (wrapper: HTMLDivElement, label: HTMLLabelElement) => void): this;

    dependentOn(setting: Setting<boolean>, buildFunc: (maker: this) => void): this;

    group({header, direction}: {header: {name?: string, headerType?: string | number, styleData: StyleData}, direction?: "row" | "column"}, builder: (groupHolder: HTMLDivElement & SettingsElementMaker) => void): this;
}

interface SettingsElementsUtils {
    mergeAs<E extends Element>(element: E, oncloseHook: (callback: () => void) => void): E & SettingsElementMaker;
}

declare const settingsElements: SettingsElementsUtils;