/**
 * @import {} from '../element/index'
 */
/**
 * @param {ThemeStorage} storage
 */
function createWithStyles(storage) {
    storage.baseStyle = {
        style: {
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            width: '100%'
        }
    };
    storage.styleAppliers["button"] = {
        style: {
            fontWeight: 'bold'
        }
    }
    storage.styleAppliers["rounded_background"] = {
        style: {
            gap: '10px',
            alignItems: 'center',
            background: '#222',
            padding: '10px',
            borderRadius: '8px',
        }
    }
    storage.styleAppliers["bordered_flex"] = {
        style: {
            ...storage.styleAppliers["rounded_background"],
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            border: '1px solid #444',
        }
    }
    storage.styleAppliers["selection"] = {
        style: {
            background: '#444',
            outline: 'none'
        }
    }
    storage.toggleStyler = /** @type(toggleStyler)*/ {
        /**@type((value: boolean) => {btnStyle: StyleHandler, spanStyle: StyleHandler}) */
        initialStyles: (value) => {
            return {
                btnStyle: {
                    className: `group inline-flex shrink-0 items-center rounded-full m-0 p-1 transition-all duration-200 cursor-pointer border-none h-6 !w-[48px] ${value ? 'bg-brand' : 'bg-button-bg'}`
                },
                spanStyle: {
                    className: `rounded-full transition-all duration-200 w-4 h-4 group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px] ${value ? 'translate-x-[24px] bg-black/90' : 'translate-x-0 bg-gray'}` 
                }
            }
        },
        /**@type((value: boolean, btn: HTMLButtonElement, span: HTMLSpanElement) => void) */
        onChangeStyler: (value, btn, span) => {
            if (value) {
                btn.classList.replace('bg-button-bg', 'bg-brand'); // Change background
                span.classList.replace('translate-x-0', 'translate-x-[24px]'); // Move knob right
                span.classList.replace('bg-gray', 'bg-black/90'); // Move knob right
            } else {
                btn.classList.replace('bg-brand', 'bg-button-bg'); // Revert background
                span.classList.replace('translate-x-[24px]', 'translate-x-0'); // Move knob right
                span.classList.replace('bg-black/90', 'bg-gray'); // Move knob right
            }
        }
    }
    storage.styleAppliers["dialog"] = {
        style: {
            backgroundColor: "rgba(0,0,0,0)",
            border: '0',
            zIndex: '12000',
            overflow: 'clip',
            //display: 'flex',
            //alignContent: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
        }
    }
    storage.styleAppliers["dialog_container"] = {
        style: {
            ...storage.styleAppliers["bordered_flex"],
            padding: '24px',
            borderRadius: '12px',
            border: "0",
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            backgroundColor: '#16181c',
            minWidth: '41%',
            maxWidth: "100%",
            height: "min-content",
            maxHeight: '100%',
            overflow: 'hidden',
        }
    }
    storage.styleAppliers["edit_box_div"] = {
        style: {
            width: "100%",
            height: "50%",
            textWrap: "nowrap !important",
            tabSize: '4',
            //background: '#444',
            minHeight: 0,
            marginBlockEnd: 0,
        }
    }
    return storage;
}

