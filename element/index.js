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

/** @type(Elements) */
const Elements = {};

/**
 * @template {HTMLElement} T
 * @param {{new(): T}} type
 * @return {string|undefined} 
 */
function getTagName(type) {
    return htmlElementToTagNameMap[type] ?? htmlElementToTagNames[type][0]
}

/**
 * @template
 * @param {{new(): T}} type
 */
function addExtension(type, funcName, func) {
    const currentFunc = type.prototype[funcName];
    if (currentFunc == null) {
        type.prototype[funcName] = func;
    } else {
        app.error("Method Extender", `Unable to extend the given type ${type} as it already has a func named: ${funcName}`)
    }
} 

/**
 * @template {HTMLElement} T
 * @this Element
 * @param {{new(): T}} type
 * @return {T|undefined} 
 */
Element.prototype.add = function (type, tagName) {
    const elementTag = tagName ?? getTagName(type) ?? customElements.getName(type);
    if (elementTag == null) {
        console.error(`Unable to figure out the tag name for '${type}' as such has no tag name within registry or has no unique type!`);
        return undefined;
    }
    /*** @type(T) */ 
    const element = document.createElement(elementTag);
    this.append(element);
    return this;
}

/**
 * @this Element
 * @param { (this) => this } consumer
 * @return { this } 
 */
Element.prototype.addTo = function (consumer) {
    consumer(this);
    return this;
}

/**
 * @this HTMLElement
 * @param {StyleHandler} style
 * @return {this} 
 */
HTMLElement.prototype.addStyle = function (style) {
    ThemeStorage.applyStyle(this, style);
    return this;
}

/**
 * @this HTMLElement
 * @param {StyleHandler} style
 * @return {this} 
 */
HTMLElement.prototype.setStyle = function (style) {
    style.append = false;
    ThemeStorage.applyStyle(this, style);
    return this;
}

/**
 * @this HTMLElement
 * @param {StyleData} style
 * @return {this} 
 */
HTMLElement.prototype.modifyStyle = function (style) {
    if (style.style != null) Object.defineProperties(this.style, style.style);
    if (style.className != null) this.className = style.className;
    if (style.classList != null) this.classList.add(style.classList);

    return this;
}

HTMLElement.prototype.with = function (handler) {
    for (const [objKey, objValue] of handler) {
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
Element.prototype.themed = (themeId, consumer) => {
    ThemeStorage.push(themeId);
    consumer(this);
    ThemeStorage.pop(themeId);
    return this;
}

Element.prototype.modify = (modifier) => {
    modifier(this);
    return this;
}

Element.prototype.div = function () {
    return this.add(HTMLDivElement);
}

Element.prototype.btn = function (name, color, onPress) {
    const btn = this.add(HTMLDivElement).addStyle({ 
        styleId: "button",
        style: { background: `${color}`, } 
    });

    btn.innerText = name;
    btn.onclick = (obj, event) => onPress(btn, event);

    return btn;
}


class ElementObservable extends Observable {
    element;

    /**
     * @constructor
     * @param {E} element
     * @param {() => T} getCallback
     */
    constructor (element, getCallback) {
        super(getCallback);
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
    const selection = this.add(HTMLSelectElement)
        .addStyle({ styleId: "selection" })
        // TODO: ADD ABILITY TO HANDLE WHEN UPDATED FROM THIS METHOD
        .updateSelections(options, defaultOption, entryHandler);

    var baseSelection = getFromCollectionValidated(options, defaultOption);

    /** @type(ElementObservable<HTMLSelectElement, T>) */
    const observable = new ElementObservable(selection, () => baseSelection);

    select.onchange = () => {
        baseSelection = selection.options[selection.selectedIndex].innerValue

        observable.set(baseSelection);
    }

    return observable;
}

Element.prototype.dataListInput = function (id, placeholder, options, defaultValue, width) {
    // TODO: MAKE DIV CONTAINER TO PUT EVERYTHING IN ?
    const input = this
        .input("text", placeholder, defaultValue)
        .addStyle({ styleId: "selection", style: { width: width ?? "100px" }})
        .with({name: id, attr: { list: id }})

    this.add(HTMLDataListElement)
        .with({id: id, })
        .updateSelections(options, EntryHandler.KEY_KEY);

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
HTMLSelectElement.updateSelections = function (options, defaultOption, entryHandler) {
    updateSelections(this, options, defaultOption, entryHandler);
    return this;
}

/**
 * @this HTMLDataListElement
 * @return {this} 
 */
HTMLDataListElement.updateSelections = function (options, entryHandler) {
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

    select.innerHTML = ""

    var defaultOptionEl = null;

    /**
     * @param {[string, any]} data
     */
    function createOption(data) {
        if (entryHandler == EntryHandler.VALUE_KEY) data = data.reverse();
        else if (entryHandler == EntryHandler.KEY_KEY) data = [data[0], data[0]];
        else if (entryHandler == EntryHandler.VALUE_VALUE) data = [data[1], data[1]];

        const el = addElement(select, HTMLOptionElement, 'option');

        el.innerText = data[0];
        el.value = el.innerValue = data[1];

        if (data[0] == defaultOption && defaultOptionEl != null) {
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
}

Element.prototype.collapsible = function (tooltip, consumer) {
    return this
        .div()
        .modify((holder) => {
            /** @type(HTMLDivElement) */
            var collapsible = null;
    
            holder.btn("...", "F3E4C9", (btn) => {
                    btn.classList.toggle("active");
                    if (collapsible.style.display === "flex") {
                        collapsible.style.display = "none";
                    } else {
                        collapsible.style.display = "flex";
                    }
                })
                .with({title: tooltip ?? ""})
                .addStyle({style: { padding: "0px" }});

            collapsible = holder.div().setStyle({
                style: {
                    flexDirection: "column",
                    padding: "0px",
                    gap: "10px",
                    width: "100%"
                },
                className: "collapsible-content"
            }).modify(consumer);
        });
}

Element.prototype.toggleBtn = function (id, value, onToggle, /** @type(ToggleStyler) */ styler) {
    if (styler == null) styler = ThemeStorage.peek().toggleStyler;
    const baseStyles = styler?.initialStyles(value);
    const button = this.add(HTMLButtonElement)
        .with({id: id, type: 'button', attr: {role: 'switch', 'aria-checked': value}})
        .setStyle(baseStyles?.btnStyle ?? null);

    const knob = button.add(HTMLSpanElement)
        .setStyle(baseStyles?.spanStyle ?? null);

    button.addEventListener('click', () => {
        value = !value;
        if(onToggle != null) onToggle(value);

        // Update Accessibility
        button.setAttribute('aria-checked', value);

        styler?.onChangeStyler(value, button, knob);

        console.log(`${id} is now: ${value}`);
    });

    return button;
}

Element.prototype.header = function (type, text) {
    return this
        .add(HTMLHeadingElement, `h${type}`)
        .with({textContent: text})
}

HTMLDialogElement.prototype.openModal = function () {
    this.showModal();
    for (const callback of this.onOpenModalCallbacks) callback(this);
}

HTMLDialogElement.prototype.onOpen = function (callback) {
    (this.onOpenModalCallbacks ??= []).push(callback)
}

HTMLDialogElement.prototype.onClose = function (callback) {
    (this.onCloseModalCallbacks ??= []).push(callback)
}

Elements.modal = async function (title, consumer) {
    // 1. Create the Overlay (Background)
    const overlay = document.body.add(HTMLDialogElement)
        .addStyle({
            styleId: "dialog",
            className: "special-theme"
        }); 
        
    overlay.onclose = () => overlay.style.display = "";
    
    // Optional: Close dialog when clicking outside of it (on the backdrop)
    overlay.addEventListener('click', (event) => {
        const target = event.target;
        if (overlay.contains(target) && overlay != target) return;
        overlay.close();
        for (const callback of element.onCloseModalCallbacks) callback(element);
    });

    const container = overlay.div()
        .with({id: "modal-container"})
        .addStyle({styleId: "dialog_container"});

    const header = container.div(container)
        .setStyle({className: "dialog-header"});

    const titleElement = header.header(2, title)
        .setStyle({style: { margin: '0 0 0 0' }});

    const btn = header.btn("", "", () => {
            overlay.close();
            if(onclose != null) onclose();
        })
        .with({id: "closeBtn", innerHTML: "&times;", attr: {"aria-label": "Close dialog"}})
        .addStyle({style: {width: ""}});

    overlay.onOpen((element) => {
        element.style.display = "flex"
    })

    await consumer(overlay, container, titleElement, btn);

    return overlay; 
}

Element.prototype.detail = (title, titleClassName) => {
    /** @type(HTMLElement) */ const element = this;
    return element.add(HTMLDetailsElement)
        .modify((details) => {
            const summary = details.add(HTMLElement, "summary")
                .setStyle({style: { width: "fit-content" }});

            const titleElement = summary.add(HTMLSpanElement);

            if (titleClassName != null) titleElement.setStyle({className: titleClassName})

            titleElement.append(title);
        });
}

Element.prototype.input = (type, placeholder, defaultValue) => {
    /** @type(HTMLElement) */ const element = this;
    return element.add(HTMLInputElement)
        .with({
            type: type,
            placeholder: placeholder,
            value: defaultValue
        });
}

Element.prototype.editBox = (id, innerText, contentEditable) => {
    /** @type(HTMLElement) */ const element = this;
    const outerDiv = element.div(parent)
        .setStyle({
            style: {
                width: "100%",
                height: "50%",
                overflow: "scroll"
            }
        }).with({
            id: id,
            className: 'cm-editor ͼ1 ͼ2 ͼ4'
        });

    return outerDiv.div()
        .addStyle({styleId: "edit_box_div"})
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
            innerText: innerText ?? ""
        });
}

class ThemeStorage {
    /** @private @type(Map<ThemeId, ThemeStorage>) */
    static storages = new Map();
    /** @private @type(ThemeId[]) */
    static stack = [];
    /** @private @type(((storage: ThemeStorage) => void)[]) */
    static onCreationCallbacks = [];

    identifier;
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
     * @param {StyleHandler} handler 
     */
    static applyStyle(element, handler = {}) {
        const storage = (handler.themeId != null) ? ThemeStorage.get(handler.themeId) : ThemeStorage.peek();
        if (storage != null) {

            if (handler.append ?? true) {
                /** @type {StyleData} */
                const styleApplier = storage.styleAppliers[handler.styleId] ?? {};

                Object.assign(element.style, {
                    ...storage.baseStyle,
                    ...(handler.style ?? {}),
                    ...(styleApplier.style ?? {})
                });

                if (handler.className != null || styleApplier.className != null) {
                    element.className = `${handler.className} ${styleApplier.className}`;
                }
                if (handler.classList != null) element.classList.add(handler.classList);
                if (styleApplier.classList != null) element.classList.add(styleApplier.classList != null)
            } else {
                Object.assign(element.style, handler.style ?? {});

                if (handler.className != null) element.className = handler.className;
                if (handler.classList != null) element.classList.add(handler.classList);
            }   
        }
    }
}