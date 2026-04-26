const htmlElementToTagNameMap = new Map([
    [HTMLAnchorElement, "a"],
    [HTMLAreaElement, "area"],
    [HTMLAudioElement, "audio"],
    [HTMLBaseElement, "base"],
    [HTMLBodyElement, "body"],
    [HTMLBRElement, "br"],
    [HTMLButtonElement, "button"],
    [HTMLCanvasElement, "canvas"],
    [HTMLTableCaptionElement, "caption"],
    [HTMLDataElement, "data"],
    [HTMLDataListElement, "datalist"],
    [HTMLDetailsElement, "details"],
    [HTMLDialogElement, "dialog"],
    [HTMLDivElement, "div"],
    [HTMLDListElement, "dl"],
    [HTMLEmbedElement, "embed"],
    [HTMLFieldSetElement, "fieldset"],
    [HTMLFormElement, "form"],
    [HTMLHeadElement, "head"],
    [HTMLHRElement, "hr"],
    [HTMLHtmlElement, "html"],
    [HTMLIFrameElement, "iframe"],
    [HTMLImageElement, "img"],
    [HTMLInputElement, "input"],
    [HTMLLabelElement, "label"],
    [HTMLLegendElement, "legend"],
    [HTMLLIElement, "li"],
    [HTMLLinkElement, "link"],
    [HTMLMapElement, "map"],
    [HTMLMenuElement, "menu"],
    [HTMLMetaElement, "meta"],
    [HTMLMeterElement, "meter"],
    [HTMLObjectElement, "object"],
    [HTMLOListElement, "ol"],
    [HTMLOptGroupElement, "optgroup"],
    [HTMLOptionElement, "option"],
    [HTMLOutputElement, "output"],
    [HTMLParagraphElement, "p"],
    [HTMLPictureElement, "picture"],
    [HTMLPreElement, "pre"],
    [HTMLProgressElement, "progress"],
    [HTMLScriptElement, "script"],
    [HTMLSelectElement, "select"],
    [HTMLSlotElement, "slot"],
    [HTMLSourceElement, "source"],
    [HTMLSpanElement, "span"],
    [HTMLStyleElement, "style"],
    [HTMLTableElement, "table"],
    [HTMLTemplateElement, "template"],
    [HTMLTextAreaElement, "textarea"],
    [HTMLTimeElement, "time"],
    [HTMLTitleElement, "title"],
    [HTMLTableRowElement, "tr"],
    [HTMLTrackElement, "track"],
    [HTMLUListElement, "ul"],
    [HTMLVideoElement, "video"],
]);

const htmlElementToTagNames = new Map([
    //[HTMLElement, ["abbr", "address", "article", "aside", "b", "bdi", "bdo", "cite", "code", "dd", "dfn", "dt", "em", "figcaption", "figure", "footer", "header", "hgroup", "i", "kbd", "main", "mark", "nav", "noscript", "rp", "rt", "ruby", "s", "samp", "search", "section", "small", "strong", "sub", "summary", "sup", "u", "var", "wbr"],]
    [HTMLQuoteElement, ["q", "blockquote"]],
    //[HTMLModElement, ["del", "ins"]],
    //[HTMLTableCellElement, ["td", "th"]], 
    //[HTMLTableSectionElement, ["tbody", "tfoot", "thead"]]
    //[HTMLTableColElement, ["col", "colgroup"]],
    [HTMLHeadingElement, ["h1","h2","h3","h4","h5","h6"]]
]);
/** @import {} from '../misc/index' */

const baseStyleIds = {
    button: "button",
    selection: "selection",
    dialog: "dialog",
    dialog_container: "dialog_container",
    dialog_header: "dialog_header",
    edit_box_div: "edit_box_div",
    row: "row",
    column: "column",
}

/** @type(ElementsStaticConstructors) */
const Elements = {};

/**
 * @template {HTMLElement} T
 * @param {{new(): T}} type
 * @return {string|undefined} 
 */
function getTagName(type) {
    return htmlElementToTagNameMap.get(type) ?? htmlElementToTagNames.get(type)[0]
}

/**
 * @template {HTMLElement} T
 * @this Element
 * @param {{new(): T}} type
 * @return {T|undefined} 
 */
Element.prototype.addTo = function (type, tagName) {
    const elementTag = tagName ?? getTagName(type) ?? customElements.getName(type);
    if (elementTag == null) {
        console.error(`Unable to figure out the tag name for '${type}' as such has no tag name within registry or has no unique type!`);
        return undefined;
    }
    /*** @type(T) */ 
    const element = document.createElement(elementTag);
    this.append(element);
    return element;
}

Element.prototype.mergeAs = function (typeRef, data) {
    Object.assign(this, data)
    return this;
}

Element.prototype.clearElements = function () {
    this.innerHTML = "";
    return this;
}

HTMLElement.prototype.displayIf = function (/** @type {Observable<boolean>} */ value) {
    var prevDisplay = null;
    const setDisplay = (value) => {
        if (value) {
            if (prevDisplay != "none") {
                this.style.display = prevDisplay
                prevDisplay = "none"
            }
        } else if (prevDisplay == "none") {
            prevDisplay = this.style.display ?? ""
            this.style.display = "none"
        }
    }
    value.onChange(setDisplay);
    setDisplay(value.get())
}

/**
 * @this HTMLElement
 * @param {StyleHandler & {blackListStyleIds?: string[]}} style
 * @return {this} 
 */
HTMLElement.prototype.addStyle = function (style, withBase = true) {
    if (!withBase) (style.blackListStyleIds ??= []).push("baseStyle");
    ThemeStorage.applyStyle(this, style);
    return this;
}

/**
 * @deprecated
 * @this HTMLElement
 * @param {StyleHandler & {blackListStyleIds?: string[]}} style
 * @return {this} 
 */
HTMLElement.prototype.setStyle = function (style) {
    return this.addStyle(style, false);
}

/**
 * @this HTMLElement
 * @param {StyleData} style
 * @return {this} 
 */
HTMLElement.prototype.modifyStyle = function (style) {
    if (style.style != null) Object.assign(this.style, style.style);
    if (style.className != null) this.className = style.className;
    if (style.classList != null) this.classList.add(style.classList);

    return this;
}

HTMLElement.prototype.with = function (handler) {
    for (const [objKey, objValue] of Object.entries(handler)) {
        if (objKey == "attr") continue;
        this[objKey] = objValue;
    }

    if (handler.attr != null) {
        for (const [key, value] of Object.entries(handler.attr)) this.setAttribute(key, value);
    }

    return this;
}

/**
 * @this HTMLElement
 * @param {ThemeID} themeId
 * @param {Consumer<this>} consumer
 * @return {this} 
 */
Element.prototype.themed = function (themeId, consumer) {
    ThemeStorage.push(themeId);
    consumer(this);
    ThemeStorage.pop(themeId);
    return this;
}

Element.prototype.modify = function (modifier) {
    modifier(this);
    return this;
}

Element.prototype.div = function (refData) {
    const element = this.addTo(HTMLDivElement);

    return (refData != null) ? element.mergeAs(refData.typeRef, refData.objectData) : element;
}

Element.prototype.column = function (refData) {
    const element = this.addTo(HTMLDivElement).addStyle({styleId: baseStyleIds.column}, false);

    return (refData != null) ? element.mergeAs(refData.typeRef, refData.objectData) : element;
}

Element.prototype.row = function (refData) {
    const element = this.addTo(HTMLDivElement).addStyle({styleId: baseStyleIds.row}, false);

    return (refData != null) ? element.mergeAs(refData.typeRef, refData.objectData) : element;
}

Element.prototype.btn = function (name, color, onPress) {
    const btn = this.addTo(HTMLButtonElement).addStyle({ 
        styleId: baseStyleIds.button,
        style: { background: `${color}`, } 
    });

    btn.innerHTML = name;
    btn.onmousedown = (event) => {
        if (event.button == 0 || event.button == 1) onPress(btn, event);
    }

    return btn;
}

/**
 * @template {Element} E
 * @template T
 * @extends Observable<T>
 */
class ElementObservable extends Observable {
    element;

    /**
     * @constructor
     * @param {E} element
     * @param {() => T} getCallback
     * @param {((value: T) => T)?} setCallback
     */
    constructor (element, getCallback, setCallback) {
        super(getCallback, setCallback);
        this.element = element
    }
}

/**
 * @template T
 * @param {Collection<T>} options
 * @param {string|number|T} defaultOption
 * @param {EntryHandler} entryHandler
 */
Element.prototype.selection = function (options, defaultOption, entryHandler) {
    const selection = this.addTo(HTMLSelectElement)
        .addStyle({ styleId: baseStyleIds.selection })
        // TODO: ADD ABILITY TO HANDLE WHEN UPDATED FROM THIS METHOD
        .updateSelections(options, defaultOption, entryHandler);

    const dataEntry = {
        key: defaultOption,
        value: getFromCollectionValidated(options, defaultOption)
    }
    
    /** @type(ElementObservable<HTMLSelectElement, {key: string | number | T, value: T}>) */
    const observable = new ElementObservable(selection, () => dataEntry, (data) => {
        const key = data.key;
        const options = selection.options;

        for (let index = 0; index < options.length; index++) {
            const element = options[index];

            if (element.innerText == key || element.innerValue == data.value) {
                selection.selectedIndex = index;
                break;
            }
        }
    });

    selection.onchange = () => {
        const selectedElement = selection.options[selection.selectedIndex];

        dataEntry.key = selectedElement.innerText;
        dataEntry.value = selectedElement.innerValue;

        observable.set(dataEntry);
    }

    return observable;
}

Element.prototype.dataListInput = function (id, placeholder, options, defaultValue, width) {
    // TODO: MAKE DIV CONTAINER TO PUT EVERYTHING IN ?
    const input = this
        .input("text", placeholder, defaultValue)
        .addStyle({ styleId: "selection", style: { width: width ?? "100px" }})
        .with({name: id, attr: { list: id }})

    this.addTo(HTMLDataListElement)
        .with({id: id, })
        .updateSelections(options, EntryHandler.VALUE_VALUE);

    return input;
}

/**
 * @type(EntryHandler)
 */
const EntryHandler = Object.freeze({
    KEY_VALUE:   { name: "key_value",   },
    VALUE_KEY:   { name: "value_key",   },
    KEY_KEY:     { name: "key_key",     },
    VALUE_VALUE: { name: "value_value", },
});

/**
 * @this HTMLSelectElement
 * @return {this} 
 */
HTMLSelectElement.prototype.updateSelections = function (options, defaultOption, entryHandler) {
    updateSelections(this, options, defaultOption, entryHandler);
    return this;
}

/**
 * @this HTMLDataListElement
 * @return {this} 
 */
HTMLDataListElement.prototype.updateSelections = function (options, entryHandler) {
    updateSelections(this, options, null, entryHandler);
    return this;
}

/**
 * @param {Element} select
 * @param {Collection} options
 * @param {string} defaultOption
 * @param {EntryHandler} entryHandler
 */
function updateSelections(select, options, defaultOption, entryHandler) {
    if (entryHandler == null) {
        if (Array.isArray(options)) {
            entryHandler = EntryHandler.VALUE_VALUE;
        } else {
            entryHandler = EntryHandler.KEY_VALUE;
        }
    }

    select.clearElements()

    var defaultOptionEl = null;

    /**
     * @param {[string, any]} data
     */
    function createOption(data) {
        if (entryHandler == EntryHandler.VALUE_KEY) data = data.reverse();
        else if (entryHandler == EntryHandler.KEY_KEY) data = [data[0], data[0]];
        else if (entryHandler == EntryHandler.VALUE_VALUE) data = [data[1], data[1]];

        const el = select.addTo(HTMLOptionElement)
            .with({
                innerText: data[0],
                innerValue: data[1],
                value: data[1]
            });

        if (data[0] == defaultOption && defaultOptionEl == null) {
            defaultOptionEl = el;
            el.selected = true;
        }
    }

    /**
     * @type([string|number, T][])
     */
    var entries;

    if (Array.isArray(options)) entries = options.entries();
    else if(options instanceof Map) entries = options.entries();
    else entries = Object.entries(options);

    for (const data of entries) createOption(data);

    select.onChange?.();
}

Element.prototype.collapsible = function (tooltip, state, consumer) {
    return this
        .div()
        .addStyle({
            style: {
                width: "100%",
                gap: "10px",
                display: "flex",
                flexDirection: "column"
            },
        }, false)
        .modify((holder) => {
            /** @type(HTMLDivElement) */
            var collapsible = null;

            var value = state.get();

            /**
             * @param {boolean} value
             * @param {HTMLButtonElement} btn
             */
            function onPress(value, btn) {
                if (value) {
                    btn.classList.add("active")
                } else {
                    btn.classList.remove("active")
                }

                if (value) {
                    collapsible.style.display = "flex";
                } else {
                    collapsible.style.display = "none";
                }
            }
    
            const btn = holder.btn("...", "F3E4C9", (btn) => {
                    value = !value;
                    state.set(value)
                    onPress(value, btn);
                })
                .with({title: tooltip ?? ""})
                .addStyle({style: { padding: "0px" }});

            collapsible = holder.div().addStyle({
                style: {
                    flexDirection: "column",
                    padding: "0px",
                    gap: "10px",
                    width: "100%"
                },
                className: "collapsible-content"
            }, false).modify(consumer);

            onPress(value, btn);
        });
}

Element.prototype.toggleBtn = function (id, value, onToggle, /** @type(ToggleStyler) */ styler) {
    var state = value;

    if (styler == null) styler = ThemeStorage.peek().toggleStyler;
    const baseStyles = styler?.initialStyles(state);
    const button = this.addTo(HTMLButtonElement)
        .with({id: id, type: 'button', attr: {role: 'switch', 'aria-checked': state}})
        .addStyle(baseStyles?.btnStyle ?? null, false);


    const knob = button.addTo(HTMLSpanElement)
        .addStyle(baseStyles?.spanStyle ?? null, false);

    button.addEventListener('click', () => {
        const value = !state;
        if(onToggle != null) onToggle(value);
        setState(value);
    });

    function setState(value) {
        state = value;
        // Update Accessibility
        button.setAttribute('aria-checked', value);

        styler?.onChangeStyler(value, button, knob);

        console.log(`${id} is now: ${value}`);
    }

    button.setValue = setState;

    return button;
}

Element.prototype.header = function (type, text) {
    return this
        .addTo(HTMLHeadingElement, `h${type}`)
        .with({textContent: text})
}

Elements.dialog = function () {
    const dialog = document.body.addTo(HTMLDialogElement);
    const baseShowModal = dialog.showModal.bind(dialog);
    return dialog.mergeAs(null, /** @type {HTMLExtendedDialogElement} */ ({
        showModal() {
            baseShowModal()
            for (const callback of this.onOpenModalCallbacks) callback(this);
        },
        openModal() {
            this.showModal();
        },
        onOpen(callback) {
            (this.onOpenModalCallbacks ??= []).push(callback)
        },
        onClose(callback) {
            (this.onCloseModalCallbacks ??= []).push(callback)
        }
    }))
}

Elements.modalAs = function (title, func) {
    var value = null;
    
    const result = Elements.modal(title, (modal, container, topbar) => value = func(modal, container, topbar));

    if (result.then != null) {
        return /**@type {Promise<void>}*/ Promise.resolve(result).then(() => {
            return value;
        })
    } else {
        return value; 
    }
}

Elements.modal = function (title, consumer) {
    // 1. Create the Overlay (Background)
    const dialog = Elements.dialog()
        .addStyle({
            styleId: baseStyleIds.dialog,
            className: "special-theme"
        }); 
        
    dialog.onClose(() => dialog.style.display = "");
    
    // Optional: Close dialog when clicking outside of it (on the backdrop)
    dialog.addEventListener('click', (event) => {
        const target = event.target;
        if (dialog.contains(target) && dialog != target) return;
        dialog.close();
        for (const callback of dialog.onCloseModalCallbacks) callback(dialog);
    });
    
    const container = dialog.div().with({id: "modal-container"})
        .addStyle({
            styleId: baseStyleIds.dialog_container,
            style: { width: "" }
        });

    const topBar = container.div()
        .addStyle({styleId: baseStyleIds.dialog_header}, false);

    const titleElement = topBar.header(2, title)
        .addStyle({style: { margin: '0 0 0 0' }}, false);

    const btn = topBar.btn("", "", () => {
            dialog.close();
            for (const callback of dialog.onCloseModalCallbacks) callback(dialog);
        })
        .with({id: "closeBtn", innerHTML: "&times;", attr: {"aria-label": "Close dialog"}})
        .addStyle({style: {width: ""}});

    dialog.onOpen((element) => {
        element.style.display = "flex"
    })

    const result = consumer(dialog, 
        container, 
        topBar.mergeAs(null, /** @type {HTMLModalTopBar} */ ({
            titleElement: titleElement,
            closeBtnElement: btn,
        }))
    );

    if (result.then != null) {
        return /**@type {Promise<void>}*/ Promise.resolve(result).then((value) => {
            return dialog;
        })
    } else {
        return dialog; 
    }
}

Element.prototype.detail = function(title, titleClassName) {
    return this.addTo(HTMLDetailsElement)
        .modify((details) => {
            const summary = details.addTo(HTMLElement, "summary")
                .addStyle({style: { width: "fit-content" }}, false);

            const titleElement = summary.addTo(HTMLSpanElement);

            if (titleClassName != null) titleElement.addStyle({className: titleClassName}, false)

            titleElement.append(title);
        });
}

Element.prototype.input = function(type, placeholder, defaultValue) {
    return this.addTo(HTMLInputElement)
        .with({
            type: type,
            placeholder: placeholder,
            value: defaultValue
        });
}

Element.prototype.editBox = function (id, innerText, contentEditable) {
    const outerDiv = this.div(parent)
        .addStyle({
            style: {
                width: "100%",
                height: "50%",
                overflow: "scroll"
            },
        }, false).with({
            id: id,
            className: 'cm-editor ͼ1 ͼ2 ͼ4'
        });

    const innerBox = outerDiv.div()
        .addStyle({styleId: baseStyleIds.edit_box_div})
        .with({
            id: `${id}-contents`,
            className: 'cm-content',
            contentEditable: `${contentEditable ?? false}`,
            spellcheck: true,
            attr: {
                'role': 'textbox',
                'autocorrect': 'off',
                'autocapitalize': 'none',
                'writingsuggestions': 'false',
                'translate': 'no',
                'aria-multiline': 'true',
                //'aria-placeholder': 'Reply to thread...',
                //'data-language': 'markdown',
            },
            textContent: innerText ?? ""
        });

    outerDiv.setValue = (value) => innerBox.textContent = value;
    outerDiv.getValue = () => innerBox.textContent;

    return outerDiv;
}

class ThemeStorage {
    /** @private @type(Map<ThemeId, ThemeStorage>) */
    static storages = new Map();
    /** @private @type(ThemeId[]) */
    static stack = [];
    /** @private @type(((storage: ThemeStorage) => void)[]) */
    static onCreationCallbacks = [];

    identifier;
    /** @type {{[key: StyleId]: StyleData & { styleIds: StyleID[]}}} */
    styleAppliers = {};
    baseStyle;
    toggleStyler;
    styleSheetSupplier;

    /**
     * @constructor
     * @param {ThemeId} id 
     * @param {(string | string[])?} styleSheetSupplier 
     */
    constructor(id, styleSheetSupplier) {
        this.identifier = id;
        this.styleSheetSupplier = styleSheetSupplier;

        ThemeStorage.storages.set(id, this);

        for (const callback of ThemeStorage.onCreationCallbacks) {
            callback(this);
        }
    }

    static peek() {
        return (ThemeStorage.stack.length > 0) 
            ? ThemeStorage.get(ThemeStorage.stack[ThemeStorage.stack.length - 1])
            : undefined;
    }

    static push(/** @type(ThemeId) */ id) {
        ThemeStorage.stack.push(id);
    }

    static pop() {
        ThemeStorage.stack.pop();
    }

    static get(/** @type(ThemeId) */ id) {
        return ThemeStorage.storages.get(id)
    }

    static themes() {
        return Array.from(ThemeStorage.storages.values());
    }

    /**
     * @param {(storage: ThemeStorage) => void} callback 
     */
    static onCreationCallback(callback) {
        ThemeStorage.onCreationCallbacks.push(callback);
        for (const storage of this.themes()) {
            callback(storage);
        }
    }

    /**
     * @template {HTMLElement} T
     * @param {T} element 
     * @param {StyleHandler & {blackListStyleIds?: string[]}} handler 
     */
    static applyStyle(element, handler = {}) {
        const storage = (handler.themeId != null) ? ThemeStorage.get(handler.themeId) : ThemeStorage.peek();
        if (storage == null) return;

        const styles = [
            ((handler.blackListStyleIds ?? []).includes("baseStyle") ? null : storage.baseStyle) ?? {},
            ...(storage.resolveStyles(handler.blackListStyleIds ?? [], handler).reverse()),
        ];

        styles.forEach((style) => {
            if (style.style) Object.assign(element.style, style.style);
        })

        element.className = [handler.className, ...styles.map(style => style.className)].filter(Boolean).join(" ");
        [handler.classList, ...styles.map(style => style.classNaclassListme)].filter(Boolean).forEach(list => element.classList.add(list));
    }

    /**
     * @param {string[]} blackListStyleIds
     * @param {StyleData & { styleIds?: StyleID[], styleId?: StyleID }} styleData 
     * @param {StyleData[]} [styles=[]] 
     * @returns {StyleData[]}
     */
    resolveStyles(blackListStyleIds, styleData, styles = []) {
        styles.push(styleData);
        for (const styleId of [styleData.styleId ?? "", ...(styleData.styleIds ?? [])]) {
            if (blackListStyleIds.includes(styleId)) continue;

            /** @type {StyleData & { styleIds: StyleID[]}} */
            const style = this.styleAppliers[styleId]

            if (style) this.resolveStyles(blackListStyleIds, style, styles)
        }
        return styles;
    }
}