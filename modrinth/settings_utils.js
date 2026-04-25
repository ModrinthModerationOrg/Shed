/** @type {SettingsElementsUtils} */
const settingsElements = {
    mergeAs(element, oncloseHook) {
        const addToBase = element.addTo.bind(element);
        return element.mergeAs(null, /** @type {SettingsElementMaker & Element} */ ({
            oncloseHook: oncloseHook,
            textBox(name, setting, options) {
                if (options != null && options.showDefaultValue == null) options.showDefaultValue = false;
                return this.base(name, setting, (parent) => {
                    const endec = options?.endec ?? _fallThoughEndec
                    const value = endec.decode(setting.get());
                    const box = parent.editBox(setting.key, value, true)
                        .with({id: setting.key});

                    this.oncloseHook(() => {
                        const text = box.getValue();

                        try {
                            setting.set(endec.encode(text));
                        } catch(err) {
                            app.error("Configuration Save", `Unable to save setting '${setting.key}' as an error occured in encoding: ${err.message}`)
                        }
                    })

                    setting.onChange((value) => box.setValue(endec.decode(value)))

                }, options ?? {showDefaultValue: false})
            },
            input(name, setting, options) {
                return this.base(name, setting, (parent) => {
                    return parent
                        .input("text", "", setting.get())
                        .modify((input) => {
                            input.addEventListener("input", () => {
                                setting.set(input.value)
                            });

                            setting.onChange((value) => {
                                input.value = value;
                            })
                        })
                }, options ?? {showDefaultValue: false})
            },
            selection(name, setting, collection, options = {}) {
                return this.base(name, setting, (parent) => {
                    var locked = false;
                    const observable = parent
                        .selection(collection, setting.get(), options.handlerType ?? EntryHandler.KEY_KEY)
                        .onChange((value) => {
                            locked = true;
                            setting.set(validateKeyWithCollection(collection, value.key, setting.defaultValue));
                            locked = false;
                        });

                    setting.onChange((value) => { if (!locked) observable.set({ key: value, value: value }); })

                    return observable.element.addStyle({style: {width: ""}}, false);
                }, options)
            },
            toggle(name, setting, options) {
                return this.base(name, setting, (parent, defaultStateSpan) => {
                    defaultStateSpan.className = `text-${(setting.defaultValue ? "green" : "red")}`
                    parent.toggleBtn(setting.key, setting.get(), setting.set)
                        .modify((btn) => setting.onChange(btn.setValue))
                }, options)
            },
            base(name, setting, controlBuilder, options = {}) {
                this.labeledOption(name, (wrapper, label) => {
                    const p = label.addTo(HTMLParagraphElement).addStyle({ className: "m-0 text-secondary"}, false);
                
                    if (options.showDefaultValue ?? true) p.append(" Default: ");

                    const defaultStateSpan = p.addTo(HTMLSpanElement);

                    if (options.showDefaultValue ?? true) defaultStateSpan.append(`${setting.defaultValue.key ?? setting.defaultValue}`)

                    wrapper.div()
                        .modifyStyle({style: {
                            width: "21.58px",
                            height: "20.4px"
                        }})
                        .addTo(HTMLButtonElement)
                        .modify((btn) => {
                            btn.innerText = "⟳"
                            btn.title = "Reset to Default"
                            function setDisplay(value) {
                                btn.style.display = (value != setting.defaultValue) ? "" : "none";
                            }
                            setDisplay(setting.get())
                            btn.onclick = () => {
                                setting.set(setting.defaultValue)
                                btn.style.display = "none";
                            }
                            setting.onChange(setDisplay)
                        })

                    const optionHolder = options.attemptFlexWrapping ?? true 
                        ? wrapper.div().modifyStyle({style: { display: "flex", minWidth: "256px", justifyContent: "right", marginLeft: "auto"}})
                        : wrapper;

                    controlBuilder(optionHolder, defaultStateSpan)
                })

                return this;
            },
            labeledOption(name, controlBuilder) {
                this.div()
                    .addStyle({
                        styleId: styles.bordered_flex,
                        style: {
                            width: "100%",
                            flexDirection: 'row',
                            borderColor: 'rgba(0,0,0,0)'
                        },
                        className: "flex flex-row flex-wrap items-center gap-2 rounded-2xl bg-bg-raised p-4"
                    }).modify((wrapper) => {
                        const label = wrapper.addTo(HTMLLabelElement)
                            .addStyle({
                                style: { marginRight: "auto" }
                            }, false);

                        label
                            .addTo(HTMLSpanElement)
                            .addStyle({
                                className: "block font-semibold capitalize"
                            }, false)
                            .append(name);

                        controlBuilder(wrapper, label);
                    });

                return this;
            },
            dependentSetting: null,
            dependentOn(setting, builder) {
                this.dependentSetting = setting;
                builder(this);
                this.dependentSetting = null;
            },
            addTo(type, tag) {
                const element = addToBase(type, tag);

                if(this.dependentSetting != null && element.displayIf) element.displayIf(this.dependentSetting);

                return element;
            },
            group({name, headerType, direction}, builder){
                if (name != null) this.header(headerType, name);

                builder(settingsElements.mergeAs(direction == "column" ? this.column() : this.row(), this.oncloseHook));

                return this;
            }
        }))
    }
}