type Collection<T> = {[key: string]: T} | Map<String, T> | T[];

type Consumer<T> = (value: T) => void;

interface ElementOptions {
    tagName: string | undefined;
    style: StyleHandler | undefined;
}

interface ToggleStyler {
    initialStyles: (value: boolean) => {btnStyle: StyleHandler, spanStyle: StyleHandler}
    onChangeStyler: (value: boolean, btn: HTMLButtonElement, span: HTMLSpanElement) => void;
}

interface Elements {
    modal(title: string|Element, consumer: (dialog: HTMLDialogElement, parent: HTMLDivElement, title: HTMLHeadingElement, closeBtn: HTMLButtonElement) => Promise<void>): Promise<HTMLDialogElement>;
}

var Elements: Elements;

interface Element {
    /**
     * Method used to add a child element with custom CSS within javascript land
     */
    addTo<T>(type: { new (): T }, tagName: string?): T;
    modify(modifier: Consumer<this>): this;
    clearElements(): this;
    
    themed(themeId: ThemeId, consumer: Consumer<this>): this;

    div(): HTMLDivElement;
    header(type: string|number, text: string): HTMLHeadingElement;
    collapsible(tooltip: string, state: Observable<boolean>, consumer: (parent: HTMLDivElement) => void): HTMLDivElement;

    detail(title: string, titleClassName: string?): HTMLDetailsElement;
    editBox(id: string, innerText: string, canEditContents: boolean): HTMLDivElement;

    btn(name: string, color: string, action: (btn: HTMLButtonElement, ev: PointerEvent) => any): HTMLButtonElement
    toggleBtn(id: string, value: boolean, onToggle: (value: boolean, btn: HTMLButtonElement, span: HTMLSpanElement) => void, styler: ToggleStyler): HTMLButtonElement;

    selection<T>(options: Collection<T>, defaultOption: string|number|T, entryHandler: EntryHandler?): ElementObservable<HTMLSelectElement, T>
    dataListInput(id: string, placeholder: string,  options: Collection<string>, defaultValue: string, width: string): HTMLInputElement;
    input(type: string, placeholder: string, defaultValue: string): HTMLInputElement;
}

type StyleData = {
    className: string?,
    classList: string[]?,
    style: CSSStyleDeclaration?
}

type StyleHandler = {
    className: string?,
    classList: string[]?,
    themeId: ThemeId?,
    styleId: StyleId?,
    style: CSSStyleDeclaration?,
    append: boolean = true,
}

type ElementHandler = { id: ElementId?, name: string?, title: string?, attr: {[qualifiedName: string]: string} };

type ElementId = string;

// TODO: WORK OUT SOME WAY TO HOLD LIKE A STYLIZED BUILDER OBJECT TYPE THING WHERE YOU GIVEN IT A STYLE KEY TO THEN HAVE CERTAIN THEME STYLES APPLY FOR STUFF
interface HTMLElement {
    addStyle(style: StyleHandler?): this;
    setStyle(style: StyleHandler?): this;
    modifyStyle(style: StyleHandler): this;
    with(handler: ElementHandler & this): this;
}

interface ElementObservable<E, T> extends Observable<T> {
    element: E;
    
    constructor(element: E, getCallback: () => T);
}

type ThemeId = string;
type StyleId = string;

class ThemeStorage {
    private static storages: Map<ThemeId, ThemeStorage>;
    private static stack: ThemeId[];
    private static onCreationCallbacks: ((storage: ThemeStorage) => void)[];

    constructor(id: ThemeId, styleSheetSupplier: (string | string[])?);

    static push(id: ThemeId): void;
    static pop(): void;
    static peek(): ThemeStorage;

    static get(id: ThemeId): ThemeStorage?;
    static applyStyle<T extends HTMLElement>(element: T, handler: StyleHandler = {}): T;

    static onCreationCallback(callback: (storage: ThemeStorage) => void);

    identifier: ThemeId;
    styleAppliers: {[key: StyleId]: StyleData};
    baseStyle: StyleData?;
    toggleStyler: ToggleStyler;
    styleSheetSupplier: (string | string[])?;
}

/**
 * Object used within {@link HTMLSelectElement.updateSelections} and {@link HTMLDataListElement.updateSelections} to indicate how the given
 * collection is used when parsing such to {@link HTMLOptionElement}
 */
enum EntryHandler {
    KEY_VALUE   = { name: "key_value"   },
    VALUE_KEY   = { name: "value_key"   },
    KEY_KEY     = { name: "key_key"     },
    VALUE_VALUE = { name: "value_value" },
}

interface HTMLSelectElement {
    updateSelections<T>(options: Collection<T>, defaultOption: string|number|T, handler: EntryHandler?): this;
}

interface HTMLDataListElement {
    updateSelections<T>(options: Collection<T>, handler: EntryHandler?): this;
}

interface HTMLDialogElement {
    /**
     * The showModal() method of the {@link HTMLDialogElement} interface displays the dialog as a modal dialog, over the top of any other dialogs or elements that might be visible.
     * 
     * @deprecated Please use {@link openModal()} instead such calls this one with custom code for handling display or other style stuff when opening the dialog
     */
    private showModal();
    /**
     * The showModal() method of the {@link HTMLDialogElement} interface displays the dialog as a modal dialog, over the top of any other dialogs or elements that might be visible.
     */
    openModal();

    private onOpenModalCallbacks: Array<(HTMLDialogElement) => void>;
    private onCloseModalCallbacks: Array<(HTMLDialogElement) => void>;

    onOpen(callback: (element: HTMLDialogElement) => void): void;
    onClose(callback: (element: HTMLDialogElement) => void): void;
}