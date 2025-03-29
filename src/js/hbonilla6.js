// Establece el modo estricto de JavaScript, que ayuda a capturar errores comunes, como el uso indebido de variables no declaradas.
'use strict';

/**
 * Librería personalizada para manipular el DOM. Ofrece una interfaz fluida y encadenada similar a jQuery, pero es más ligera.
 * Ideal para proyectos web específicos que requieren manipulación dinámica del DOM.
 * @see https://github.com/hbonilla6
 *
 * Crea una instancia de H a partir de un selector.
 * @param {string|HTMLElement|NodeList|Array} selector - El selector para buscar elementos en el DOM.
 * @returns {H} Una nueva instancia de H conteniendo los elementos seleccionados.
 */
function h(selector) {
    // Evalúa el selector y obtiene un arreglo de elementos del DOM.
    let elements = evaluateSelector(selector);
    // Retorna una nueva instancia de H pasando el arreglo de elementos.
    return new H(elements);
}

/**
 * Constructor para la clase H que almacena elementos DOM y proporciona métodos para manipularlos.
 * @param {Array<HTMLElement>} elements - Array de elementos HTML a manejar.
 */
function H(elements) {
    // Itera sobre el arreglo de elementos y asigna cada uno a 'this' usando un índice numérico.
    elements.forEach((element, index) => {
        this[index] = element;
    });
    // Establece la propiedad 'count' de 'this' con la cantidad de elementos.
    this.count = elements.length;
}

// Definición de métodos en el prototipo de H para permitir encadenamiento de métodos.

/**
 * Obtiene o establece el valor de los elementos de formulario.
 * @param {string} [newValue] - Valor para establecer a los elementos.
 * @returns {H|string} La instancia de H para encadenar o el valor del primer elemento si no se pasa un nuevo valor.
 */
H.prototype.val = function (newValue) {
    if (newValue !== undefined) {
        // Si se proporciona un nuevo valor, lo asigna a todos los elementos que contienen la propiedad 'value'.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement && 'value' in this[key]) {
                this[key].value = newValue;
            }
        }
        return this;
    } else {
        // Si no se proporciona un nuevo valor, retorna el valor del primer elemento que contenga la propiedad 'value'.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement && 'value' in this[key]) {
                return this[key].value.trim();
            }
        }
    }
};

/**
 * Establece el foco en el primer elemento, posiciona el cursor al final o selecciona todo el contenido si se habilita.
 * Aplica únicamente a elementos donde tiene sentido (inputs de texto, textarea).
 * @param {boolean} [selectAll=false] - Si es true, selecciona todo el contenido del campo.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.focus = function (selectAll = false) {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement && typeof this[key].focus === "function") {
            const element = this[key];

            // Lista de tipos de input que admiten selección y cursor
            const applicableInputTypes = ["text", "password", "email", "search", "tel", "url"];

            // Establecer el foco siempre
            element.focus();

            // Verificar si el elemento es de un tipo válido (INPUT o TEXTAREA)
            if (
                (element.tagName === "INPUT" && applicableInputTypes.includes(element.type)) ||
                element.tagName === "TEXTAREA"
            ) {
                const value = typeof element.value === "string" ? element.value : "";

                if (selectAll) {
                    // Seleccionar todo el contenido del campo
                    element.setSelectionRange(0, value.length);
                } else {
                    // Posicionar el cursor al final del contenido
                    element.setSelectionRange(value.length, value.length);
                }
            } else if (element.tagName === "INPUT" && element.type === "number") {
                // Para los inputs tipo 'number', cambiamos temporalmente a 'text'
                element.focus();

                // Cambiar temporalmente el tipo de "number" a "text" para permitir setSelectionRange
                element.type = "text";

                // Posicionar el cursor al final del contenido
                const value = element.value || "";
                element.setSelectionRange(value.length, value.length);

                // Restaurar el tipo a "number"
                element.type = "number";
            }

            break; // Solo aplica al primer elemento
        }
    }
    return this;
};

/**
 * Simula un clic en el primer elemento o realiza una acción para todos.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.click = function () {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement && typeof this[key].click === "function") {
            this[key].click(); // Simula un clic
        }
    }
    return this;
};

/**
 * Obtiene o establece una propiedad en los elementos.
 * @param {string} propName - Nombre de la propiedad.
 * @param {*} [value] - Valor para establecer en la propiedad.
 * @returns {H|*} La instancia de H para encadenar o el valor de la propiedad del primer elemento si no se pasa un nuevo valor.
 */
H.prototype.prop = function (propName, value) {
    if (value !== undefined) {
        // Establece el valor de la propiedad en todos los elementos
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                this[key][propName] = value;
            }
        }
        return this;
    } else {
        // Retorna el valor de la propiedad del primer elemento
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                return this[key][propName];
            }
        }
    }
};

/**
 * Obtiene o establece un atributo de datos en los elementos.
 * @param {string} dataName - Nombre del atributo de datos (sin "data-").
 * @param {*} [value] - Valor para establecer en el atributo.
 * @returns {H|*} La instancia de H para encadenar o el valor del atributo del primer elemento si no se pasa un nuevo valor.
 */
H.prototype.data = function (dataName, value) {
    if (value !== undefined) {
        // Establece el valor del atributo de datos en todos los elementos
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                this[key].setAttribute(`data-${dataName}`, value);
            }
        }
        return this;
    } else {
        // Retorna el valor del atributo de datos del primer elemento
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                return this[key].getAttribute(`data-${dataName}`);
            }
        }
    }
};

/**
 * Verifica si los elementos coinciden con el selector especificado.
 * @param {string} selector - El selector CSS que se va a verificar.
 * @returns {boolean} `true` si algún elemento coincide con el selector, `false` en caso contrario.
 */
H.prototype.is = function (selector) {
    // Función para manejar pseudo-selectores personalizados
    const checkPseudoSelector = (element, pseudo) => {
        switch (pseudo) {
            case ':hidden':
                return (
                    element.hidden || 
                    element.style.display === 'none' || 
                    window.getComputedStyle(element).display === 'none' ||
                    window.getComputedStyle(element).visibility === 'hidden' ||
                    element.offsetParent === null
                );
            
            case ':visible':
                return (
                    !element.hidden && 
                    window.getComputedStyle(element).display !== 'none' &&
                    window.getComputedStyle(element).visibility !== 'hidden' &&
                    element.offsetParent !== null
                );
            
            case ':checked':
                return element.checked === true;
            
            case ':selected':
                return element.selected === true;
            
            case ':enabled':
                return !element.disabled;
            
            case ':disabled':
                return element.disabled === true;
            
            case ':input':
                return ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(element.tagName);
            
            case ':parent':
                return element.children.length > 0;
            
            case ':empty':
                return element.children.length === 0;
            
            default:
                return false;
        }
    };

    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            const element = this[key];
            
            // Manejar pseudo-selectores personalizados
            if (selector.startsWith(':')) {
                if (checkPseudoSelector(element, selector)) {
                    return true;
                }
            } 
            // Usar matches para selectores estándar
            else {
                try {
                    if (element.matches(selector)) {
                        return true;
                    }
                } catch {
                    // Manejar selectores inválidos sin romper la ejecución
                    return false;
                }
            }
        }
    }
    return false;
};


/**
 * Elimina elementos del contenedor H.
 * @param {string} selector - Selector para identificar los elementos a eliminar.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.remove = function (selector) {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            let elements = this[key].querySelectorAll(selector);
            elements.forEach(element => element.remove());
        }
    }
    return this;
};

/**
 * Elimina elementos del contenedor H.
 * @param {string} selector - Selector para identificar los elementos a eliminar.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.remove = function () {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            this[key].remove();
        }
    }
    return this;
};


/**
 * Obtiene o establece el texto de los elementos.
 * @param {string} [newText] - Texto para establecer en los elementos.
 * @returns {H|string} La instancia de H para encadenar o el texto del primer elemento si no se pasa un nuevo texto.
 */
H.prototype.text = function (newText) {
    if (newText !== undefined) {
        // Si se proporciona un nuevo texto, lo asigna a todos los elementos que no son de formulario.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement && !('value' in this[key])) {
                this[key].textContent = newText;
            }
        }
        return this;
    } else {
        // Si no se proporciona un nuevo texto, retorna el texto del primer elemento que no sea de formulario.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement && !('value' in this[key])) {
                return this[key].textContent;
            }
        }
    }
};

/**
 * Obtiene o establece estilos CSS de los elementos.
 * @param {string|Object} property - Nombre de la propiedad CSS o un objeto con propiedades y valores.
 * @param {string} [value] - Valor para la propiedad CSS, si 'property' es un string.
 * @returns {H|string} La instancia de H para encadenar, el valor de la propiedad CSS si solo se proporciona el nombre, o el conjunto de valores si se pasa un objeto.
 */
H.prototype.css = function (property, value) {
    if (typeof property === 'object') {
        // Si 'property' es un objeto, asigna cada propiedad y valor a todos los elementos.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                Object.keys(property).forEach(prop => {
                    this[key].style[prop] = property[prop];
                });
            }
        }
        return this;
    } else if (typeof property === 'string' && value !== undefined) {
        // Si 'property' es un string y se proporciona un valor, asigna ese valor a la propiedad CSS especificada para todos los elementos.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                this[key].style[property] = value;
            }
        }
        return this;
    } else if (typeof property === 'string') {
        // Si solo se proporciona 'property', retorna el valor de esa propiedad CSS del primer elemento.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                return window.getComputedStyle(this[key])[property];
            }
        }
    }
};

 
/**
 * Agrega un manejador de eventos a los elementos.
 * @param {EventNames} eventName - Nombre del evento a escuchar.
 * @param {(this: HTMLElement, ev: GlobalEventHandlersEventMap[EventNames]) => void} handler - Función manejadora del evento.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.on = function (eventName, handler) {
    // Agrega el manejador de eventos especificado a todos los elementos.
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            this[key].addEventListener(eventName, handler);
        }
    }
    return this;
};

/**
 * Crea un nuevo elemento y lo agrega como hijo de los elementos seleccionados.
 * @typedef {'a' | 'abbr' | 'address' | 'area' | 'article' | 'aside' | 'audio' | 'b' | 'base' | 'bdi' | 'bdo' | 'blockquote' | 'body' | 'br' | 'button' | 'canvas' | 'caption' | 'cite' | 'code' | 'col' | 'colgroup' | 'data' | 'datalist' | 'dd' | 'del' | 'details' | 'dfn' | 'dialog' | 'div' | 'dl' | 'dt' | 'em' | 'embed' | 'fieldset' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'head' | 'header' | 'hr' | 'html' | 'i' | 'iframe' | 'img' | 'input' | 'ins' | 'kbd' | 'label' | 'legend' | 'li' | 'link' | 'main' | 'map' | 'mark' | 'menu' | 'meta' | 'meter' | 'nav' | 'noscript' | 'object' | 'ol' | 'optgroup' | 'option' | 'output' | 'p' | 'param' | 'picture' | 'pre' | 'progress' | 'q' | 'rp' | 'rt' | 'ruby' | 's' | 'samp' | 'script' | 'section' | 'select' | 'small' | 'source' | 'span' | 'strong' | 'style' | 'sub' | 'summary' | 'sup' | 'table' | 'tbody' | 'td' | 'template' | 'textarea' | 'tfoot' | 'th' | 'thead' | 'time' | 'title' | 'tr' | 'track' | 'u' | 'ul' | 'var' | 'video' | 'wbr'} TagName
 * @typedef {TagName | TagName[]} TagNameParameters
 * @param {TagNameParameters} tagName - Nombre del tag del elemento a crear.
 * @param {ElementCreationOptions} [options] - Opciones de creación del elemento.
 * @typedef {object} ElementCreationOptions - Opciones de creación del elemento.
 * @returns {H} Una nueva instancia de H con los elementos creados.
 */
H.prototype.create = function (tagName, options) {
    // Crea un nuevo elemento con el tagName especificado y las opciones proporcionadas.
    const element = document.createElement(tagName, options);

    // Agrega el elemento creado como hijo de todos los elementos seleccionados.
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            this[key].appendChild(element);
        }
    }

    // Retorna una nueva instancia de H con el nuevo elemento como su propiedad.
    return new H([element]);
};


/**
 * Agrega un manejador de eventos a los elementos para varios eventos.
 * @typedef {'click' | 'change' | 'blur' | 'input' | 'keydown'} EventNames
 * @typedef {EventNames | EventNames[]} EventParameters
 * @param {EventParameters} eventNames - Nombre o nombres de los eventos a escuchar.
 * @param {Function} handler - Función manejadora del evento.
 * @returns {this} La instancia de H para encadenar.
 */
H.prototype.onMany = function (eventNames, handler) {
    // Convierte a array si no lo es
        if (!Array.isArray(eventNames)) {
        eventNames = [eventNames];
    }

    // Agrega el manejador de eventos especificado a todos los elementos.
    for (let key in this) {
        // Verifica que la propiedad sea propia del objeto y que sea un elemento HTMLElement
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Itera sobre cada nombre de evento
            eventNames.forEach(eventName => {
                // Agrega el manejador de eventos al elemento actual para el evento actual
                this[key].addEventListener(eventName, handler);
            });
        }
    }
    // Retorna la instancia de H para encadenar
    return this;
};




/**
 * Oculta los elementos estableciendo su estilo 'display' en 'none'.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.hide = function () {
    // Establece el estilo 'display' en 'none' para todos los elementos.
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            this[key].style.display = 'none';
        }
    }
    return this;
};

'use strict';

/**
 * Añade elementos DOM como hijos a los elementos actuales.
 * @param {string|HTMLElement|NodeList|Array|H} childObj - Elementos para añadir como hijos.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.append = function (childObj) {
    // Normaliza `childObj` a un array de nodos DOM.
    let children;
    if (childObj instanceof H) {
        // Si es una instancia de H, conviértelo en un array de elementos.
        children = childObj.toArray();
    } else if (typeof childObj === 'string') {
        // Si es una cadena HTML, crea nodos DOM.
        const template = document.createElement('template');
        template.innerHTML = childObj.trim();
        children = Array.from(template.content.childNodes);
    } else if (childObj instanceof HTMLElement || childObj instanceof NodeList || Array.isArray(childObj)) {
        // Si es un HTMLElement, NodeList o Array, conviértelo en un array.
        children = Array.isArray(childObj) ? childObj : Array.from(childObj);
    } else {
        throw new TypeError("El argumento proporcionado no es válido para append.");
    }

    // Itera sobre los elementos de la instancia de H.
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Añade cada nodo hijo al elemento actual.
            for (let j = 0; j < children.length; j++) {
                if (children[j] instanceof Node) {
                    this[key].appendChild(children[j].cloneNode(true)); // Clona el nodo para evitar referencias únicas.
                }
            }
        }
    }

    return this; // Devuelve la instancia para permitir encadenamiento.
};

/**
 * Convierte los elementos almacenados en la instancia de H a un array.
 * @returns {Array<HTMLElement>} Array de elementos.
 */
H.prototype.toArray = function () {
    const elements = [];
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            elements.push(this[key]);
        }
    }
    return elements;
};


/**
 * Obtiene o establece el atributo 'checked' en elementos de tipo 'checkbox'.
 * @param {boolean} [checked] - Valor para establecer el atributo 'checked'. Si no se proporciona, se obtiene el valor actual.
 * @returns {H|boolean} La instancia de H para encadenar o el valor de 'checked' si no se proporciona.
 */
H.prototype.checked = function (checked) {
    // Itera sobre todos los elementos en 'this'.
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Verifica si el elemento es un 'checkbox'.
            if (this[key].type === 'checkbox') {
                if (checked !== undefined) {
                    this[key].setAttribute("checked", checked);
                    // Si se proporciona un valor, establece el atributo 'checked'.
                    this[key].checked = checked;
                } else {
                    // Si no se proporciona un valor, devuelve el estado 'checked' actual.
                    return this[key].checked;
                }
            }
        }
    }
    return this; // Devuelve la instancia de H para encadenar si se establece un valor.
};

/**
 * Obtiene o establece el atributo 'readonly' en elementos HTML.
 * @param {boolean} [readonly] - Valor para establecer el atributo 'readonly'. Si no se proporciona, se obtiene el valor actual.
 * @returns {H|boolean} La instancia de H para encadenar o el valor de 'readonly' si no se proporciona.
 */
H.prototype.readonly = function (readonly) {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            if (readonly !== undefined) {
                this[key].toggleAttribute("readonly", readonly);
            } else {
                return this[key].hasAttribute("readonly");
            }
        }
    }
    return this;
};

/**
 * Obtiene o establece la propiedad 'pointer-events' y el color de fondo en elementos HTML.
 * @param {boolean} [enabled] - Valor para activar o desactivar los eventos de puntero. Si no se proporciona, se obtiene el estado actual.
 * @returns {H|boolean} La instancia de H para encadenar o el estado de 'pointer-events' si no se proporciona.
 */
H.prototype.pointerEvents = function (enabled) {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            if (enabled !== undefined) {
                this[key].style.pointerEvents = enabled ? "auto" : "none";
                this[key].style.backgroundColor = enabled ? "" : "#e9ecef";
            } else {
                return this[key].style.pointerEvents !== "none";
            }
        }
    }
    return this;
};


/**
 * Obtiene o establece el atributo 'disabled' en elementos HTML.
 * @param {boolean} [disabled] - Valor para establecer el atributo 'disabled'. Si no se proporciona, se obtiene el valor actual.
 * @returns {H|boolean} La instancia de H para encadenar o el valor de 'disabled' si no se proporciona.
 */
H.prototype.disabled = function (disabled) {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            if (disabled !== undefined) {
                this[key].toggleAttribute("disabled", disabled);
            } else {
                return this[key].hasAttribute("disabled");
            }
        }
    }
    return this;
};

/**
 * Obtiene o establece el atributo 'hidden' en elementos HTML.
 * @param {boolean} [hidden] - Valor para establecer el atributo 'hidden'. Si no se proporciona, se obtiene el valor actual.
 * @returns {H|boolean} La instancia de H para encadenar o el valor de 'hidden' si no se proporciona.
 */
H.prototype.hidden = function (hidden) {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            if (hidden !== undefined) {
                this[key].toggleAttribute("hidden", hidden);
            } else {
                return this[key].hasAttribute("hidden");
            }
        }
    }
    return this;
};


/**
 * Obtiene o establece atributos a los elementos.
 * @param {string|Object} attribute - Nombre del atributo o un objeto con atributos y sus valores.
 * @param {string} [value] - Valor para el atributo, si 'attribute' es un string.
 * @returns {H|string} La instancia de H para encadenar o el valor del atributo si solo se proporciona el nombre.
 */
H.prototype.attr = function (attribute, value) {
    if (typeof attribute === 'object') {
        // Si 'attribute' es un objeto, asigna cada atributo y valor a todos los elementos.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                Object.keys(attribute).forEach(attr => {
                    this[key].setAttribute(attr, attribute[attr]);
                });
            }
        }
        return this;
    } else if (typeof attribute === 'string' && value !== undefined) {
        // Si 'attribute' es un string y se proporciona un valor, asigna ese valor al atributo especificado para todos los elementos.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                this[key].setAttribute(attribute, value);
            }
        }
        return this;
    } else if (typeof attribute === 'string') {
        // Si solo se proporciona 'attribute', retorna el valor de ese atributo del primer elemento.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                return this[key].getAttribute(attribute);
            }
        }
    }
};


/**
 * Alterna un atributo en todos los elementos seleccionados entre tener un valor y no tener ninguno.
 * Si el elemento tiene el atributo con el valor especificado, este se elimina. Si no lo tiene, el atributo se establece con el valor dado.
 * @param {string} attribute - Nombre del atributo que se alternará.
 * @param {string} value - Valor del atributo para alternar. Si el atributo tiene este valor, se eliminará; si no, se establecerá.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.toggleAttr = function (attribute, value) {
    // Itera sobre todas las propiedades del objeto
    for (let key in this) {
        // Verifica si la propiedad es realmente una propiedad del objeto (no heredada)
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Verifica si el elemento actual tiene el atributo con el valor especificado
            if (this[key].getAttribute(attribute) === value) {
                // Si el atributo existe y su valor es igual al especificado, elimínalo
                this[key].removeAttribute(attribute);
            } else {
                // Si el atributo no existe o su valor es diferente, establece el atributo con el valor especificado
                this[key].setAttribute(attribute, value);
            }
        }
    }
    // Retorna la instancia para permitir encadenamiento de métodos
    return this;
};



/**
 * Busca y retorna una nueva instancia de H conteniendo los elementos descendientes que coincidan con el selector.
 * @param {string} selector - Selector CSS para buscar dentro de los elementos.
 * @returns {H} Nueva instancia de H con los elementos encontrados.
 */
H.prototype.find = function (selector) {
    let foundElements = [];
    // Busca elementos dentro de cada elemento de esta instancia que coincidan con el selector.
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            foundElements.push(...this[key].querySelectorAll(selector));
        }
    }
    // Retorna una nueva instancia de H con los elementos encontrados.
    return new H(foundElements);
};


/**
 * Obtiene o establece el HTML interno de los elementos.
 * @param {string} [newHtml] - HTML para establecer dentro de los elementos.
 * @returns {H|string} La instancia de H para encadenar o el HTML del primer elemento si no se pasa nuevo HTML.
 */
H.prototype.html = function (newHtml) {
    if (newHtml !== undefined) {
        // Establece el HTML interno para todos los elementos si se proporciona 'newHtml'.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                this[key].innerHTML = newHtml;
            }
        }
        return this;
    } else {
        // Retorna el HTML interno del primer elemento si no se proporciona 'newHtml'.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                return this[key].innerHTML;
            }
        }
    }
};

/**
 * Muestra los elementos estableciendo su estilo 'display' en su valor predeterminado o vacío.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.show = function () {
    // Establece el estilo 'display' en su valor predeterminado o vacío para todos los elementos.
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            this[key].style.display = ''; // Puede ser necesario ajustar según la naturaleza específica de los elementos.
        }
    }
    return this;
};


/**
 * Alterna la visibilidad de los elementos. Si están visibles, los oculta; si están ocultos, los muestra.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.toggleDisplay = function () {
    // Itera sobre todas las propiedades del objeto
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Verifica el estilo actual y alterna entre 'none' y ''.
            if (window.getComputedStyle(this[key]).display === 'none') {
                // Si el display es 'none', muestra el elemento.
                this[key].style.display = ''; // Ajustar según la naturaleza específica de los elementos
            } else {
                // Si el display no es 'none', oculta el elemento.
                this[key].style.display = 'none';
            }
        }
    }
    return this;
};


/**
 * Elimina un atributo de los elementos.
 * @param {string} attributeName - Nombre del atributo a eliminar.
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.removeAttr = function (attributeName) {
    // Elimina el atributo especificado de todos los elementos.
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            this[key].removeAttribute(attributeName);
        }
    }
    return this;
};

/**
 * Cuenta las palabras en el texto de los elementos seleccionados, incluidos los elementos de formulario.
 * @returns {number} Número total de palabras en el texto de todos los elementos seleccionados.
 */
H.prototype.countWords = function () {
    let totalWords = 0;
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            let text;
            if (this[key] instanceof HTMLInputElement || this[key] instanceof HTMLTextAreaElement || this[key] instanceof HTMLSelectElement) {
                // Para elementos de formulario, usa 'value'
                text = this[key].value;
            } else {
                // Para otros elementos, usa 'textContent'
                text = this[key].textContent;
            }
            totalWords += text.trim().split(/\s+/).filter(Boolean).length;
        }
    }
    return totalWords;
};



/**
 * Llena una tabla con filas de placeholders basado en el número de columnas en el thead y el número de filas especificado.
 * @param {number} rowCount - Número de filas de placeholders a añadir.
 */
H.prototype.fillTableWithPlaceholders = function (rowCount) {
    if (!this.count || !(this[0] instanceof HTMLTableElement)) {
        throw new Error('fillTableWithPlaceholders debe ser llamado en un elemento HTMLTableElement.');
    }
    const table = this[0]; // Asume que la primera selección es la tabla
    const columns = table.querySelectorAll('thead th').length; // Cuenta el número de columnas en el thead
    const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody')); // Obtiene o crea el tbody

    tbody.innerHTML = ''; // Limpia el tbody actual

    for (let i = 0; i < rowCount; i++) {
        const tr = document.createElement('tr'); // Crea un nuevo elemento tr
        tr.className = 'placeholder-glow'; // Agrega la clase para efecto de carga

        for (let j = 0; j < columns; j++) {
            const td = document.createElement('td'); // Crea un nuevo elemento td
            const p = document.createElement('p');
            p.className = 'placeholder'; // Agrega la clase placeholder
            p.textContent = '_'; // Establece el contenido de placeholder
            td.appendChild(p); // Agrega la p al td
            tr.appendChild(td); // Agrega el td al tr
        }

        tbody.appendChild(tr); // Agrega el tr al tbody
    }
};



/**
 * Dispara un evento específico en todos los elementos seleccionados.
 * @param {string} eventName - Nombre del evento a disparar (e.g., 'click', 'change').
 */
H.prototype.trigger = function (eventName) {
    if (typeof Event === 'function') {
        // Crea y dispara un evento para navegadores modernos
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                let event = new Event(eventName, { bubbles: true, cancelable: true });
                this[key].dispatchEvent(event);
            }
        }
    } else {
        // Manejo para navegadores más antiguos
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                let event = document.createEvent('Event');
                event.initEvent(eventName, true, true);
                this[key].dispatchEvent(event);
            }
        }
    }
    return this; // Permite el encadenamiento de métodos
};

/**
 * Evalúa si todos los elementos seleccionados son válidos según las reglas de validación de HTML5.
 * @returns {boolean} Retorna `true` si todos los elementos del formulario son válidos, de lo contrario `false`.
 */
H.prototype.isValid = function () {
    let isValid = true;
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Verifica si el elemento es un input, textarea o select.
            if (this[key] instanceof HTMLInputElement || this[key] instanceof HTMLSelectElement || this[key] instanceof HTMLTextAreaElement) {
                // Utiliza el método checkValidity() para determinar si el elemento cumple con las reglas de validación.
                if (!this[key].checkValidity()) {
                    isValid = false;
                    break; // Salir del bucle si se encuentra un elemento no válido.
                }
            }
        }
    }
    return isValid;
};



/**
 * Registra un manejador de eventos para detectar cambios en todos los elementos seleccionados que son campos de entrada.
 * Esto incluye inputs de texto, áreas de texto, y elementos select.
 * @param {Function} handler - Función que se llamará cuando el evento de cambio o entrada ocurra.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.listenToChanges = function (handler) {
    // Itera sobre todas las propiedades del objeto.
    for (let key in this) {
        // Verifica si la propiedad es realmente una propiedad del objeto (no heredada).
        if (this.hasOwnProperty(key)) {
            // Si el elemento es un input o textarea, escucha el evento 'input'.
            if (this[key] instanceof HTMLInputElement || this[key] instanceof HTMLTextAreaElement) {
                // Agrega el manejador al evento 'input' para capturar cambios en el valor del elemento.
                this[key].addEventListener('input', handler);
            } else if (this[key] instanceof HTMLSelectElement) {
                // Si el elemento es un select, escucha el evento 'change'.
                // Agrega el manejador al evento 'change' para capturar cambios en la opción seleccionada.
                this[key].addEventListener('change', handler);
            }
        }
    }
    // Retorna la instancia para permitir encadenamiento de métodos.
    return this;
};

/**
 * Añade una clase CSS a todos los elementos seleccionados.
 * @param {string} classes - Nombre de las clases que se añadirán a los elementos.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.addClass = function (classes) {
    // Dividir la cadena de entrada en un array de nombres de clase
    const classNames = classes.split(/[,\s]+/); // Expresión regular que divide por comas o espacios

    // Itera sobre todas las propiedades del objeto
    for (let key in this) {
        // Verifica si la propiedad es realmente una propiedad del objeto (no heredada)
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Añade cada clase en el array de nombres de clase
            classNames.forEach(className => {
                if (className.trim() !== '') { // Evita añadir clases vacías
                    this[key].classList.add(className.trim()); // Uso de trim() para eliminar espacios en blanco
                }
            });
        }
    }
    // Retorna la instancia para permitir encadenamiento de métodos
    return this;
};



/**
 * Añade una clase CSS a todos los elementos seleccionados.
 * @param {string} className - Nombre de las clase que se añadirán a los elementos.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.addClassName = function (className) {

    // Itera sobre todas las propiedades del objeto
    for (let key in this) {
        // Verifica si la propiedad es realmente una propiedad del objeto (no heredada)
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Añade cada clase
                this[key].className = className.trim(); // Uso de trim() para eliminar espacios en blanco
        }
    }
    // Retorna la instancia para permitir encadenamiento de métodos
    return this;
};

/**
 * Elimina una clase CSS de todos los elementos seleccionados.
 * @param {string} classes - Nombre de la clases que se eliminarán de los elementos.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.removeClass = function (classes) {
    // Dividir la cadena de entrada en un array de nombres de clase
    const classNames = classes.split(',');

    // Itera sobre todas las propiedades del objeto
    for (let key in this) {
        // Verifica si la propiedad es realmente una propiedad del objeto (no heredada)
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Elimina cada clase en el array de nombres de clase
            classNames.forEach(className => {
                this[key].classList.remove(className.trim()); // Uso de trim() para eliminar espacios en blanco
            });
        }
    }
    // Retorna la instancia para permitir encadenamiento de métodos
    return this;
};


/**
 * Alterna la presencia de una clase CSS en todos los elementos seleccionados.
 * @param {string} classes - Nombre de las clases que se alternarán en los elementos.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.toggleClass = function (classes) {
    // Dividir la cadena de entrada en un array de nombres de clase
    const classNames = classes.split(',');

    // Itera sobre todas las propiedades del objeto
    for (let key in this) {
        // Verifica si la propiedad es realmente una propiedad del objeto (no heredada)
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Alterna cada clase en el array de nombres de clase
            classNames.forEach(className => {
                this[key].classList.toggle(className.trim()); // Uso de trim() para eliminar espacios en blanco
            });
        }
    }
    // Retorna la instancia para permitir encadenamiento de métodos
    return this;
};


/**
 * Método que agrega un event listener al evento "keypress" que dispara un evento dado cuando se presiona la tecla "Enter".
 * @param {Function} callback - La función que se ejecutará cuando se presione la tecla "Enter".
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.enter = function (callback) {
    // Itera sobre todas las propiedades del objeto.
    for (let key in this) {
        // Verifica si el elemento es una instancia de HTMLElement y si el evento "keypress" es compatible.
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Adjunta un event listener para el evento "keypress" en el elemento actual.
            this[key].addEventListener("keypress", function (e) {
                // Verifica si la tecla presionada es "Enter".
                if (e.key === "Enter") {
                    callback(e); // Ejecuta la función proporcionada
                }
            });
        }
    }
    // Retorna la instancia para permitir el encadenamiento de métodos.
    return this;
}

/**
 * Clona el primer elemento seleccionado y opcionalmente todos sus eventos.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.clone = function () {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Clona el elemento. Si withEvents es true, los eventos también serán clonados.
            this[key].cloneNode(true); // true significa clonar el elemento con todo su contenido.
        }
    }
    // Retorna la instancia para permitir el encadenamiento de métodos.
    return this;
};

/**
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.parent = function () {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Obtiene el elemento padre del elemento actual
            this[key].parentNode;
        }
    }
    // Retorna la instancia para permitir el encadenamiento de métodos.
    return this;
};

/**
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.next = function () {
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Reemplaza el elemento actual con su hermano siguiente
            this[key] = this[key].nextElementSibling;
        }
    }
    return this;
};

/**
 * Actualiza cada elemento en la instancia de H para que sea el ancestro más cercano que cumpla con el selector dado.
 * 
 * @param {string} selector - Selector CSS del ancestro más cercano que se desea encontrar.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.closest = function (selector) {
    let elements = [];
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            let closestElement = this[key].closest(selector);
            if (closestElement) {
                elements.push(closestElement);
            }
        }
    }
    // Retorna una nueva instancia de H con los elementos más cercanos encontrados.
    return new H(elements);
};

/**
 * Obtiene un elemento específico de la instancia de H.
 * Si no se proporciona un argumento, retorna el primer elemento.
 * Si se proporciona un número, retorna el elemento en ese índice.
 * Si se proporciona un string, intenta seleccionar el primer elemento que coincida con el selector.
 * 
 * @param {string|number} [selectorOrIndex] - Índice del elemento o selector CSS.
 * @returns {HTMLElement|null} El elemento correspondiente o null si no se encuentra.
 */
H.prototype.get = function (selectorOrIndex) {
    if (selectorOrIndex === undefined) {
        // Si no se proporciona un argumento, retorna el primer elemento.
        return this[0] || null;
    } else if (typeof selectorOrIndex === 'number') {
        // Si es un número, retorna el elemento en ese índice.
        return this[selectorOrIndex] || null;
    } else if (typeof selectorOrIndex === 'string') {
        // Si es un string, trata de encontrar el primer elemento que coincida con el selector.
        for (let key in this) {
            if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
                let foundElement = this[key].querySelector(selectorOrIndex);
                if (foundElement) {
                    return foundElement;
                }
            }
        }
    }
    return null; // Retorna null si no se encuentra ningún elemento.
};


/**
 * @param {string} [filter] - Un selector opcional para filtrar los elementos hijos.
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.children = function (filter) {
    // Array para almacenar los hijos filtrados.
    let children = [];

    // Itera sobre los elementos en la instancia actual.
    for (let key in this) {
        // Verifica que la propiedad pertenezca al objeto y sea un HTMLElement.
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Obtiene todos los hijos del elemento actual.
            let childElements = Array.from(this[key].children);

            // Si se proporciona un filtro, se aplica.
            if (filter) {
                childElements = childElements.filter(child => child.matches(filter));
            }

            // Almacena los hijos filtrados en el array `children`.
            children = children.concat(childElements);
        }
    }

    // Añade la propiedad 'count' al array 'children' para indicar la cantidad de elementos.
    children.count = children.length;

    // Retorna una nueva instancia de H con los elementos hijos y la cantidad de elementos.
    return new H(children);
};


/**
 * @returns {H} La instancia de H para permitir el encadenamiento de métodos.
 */
H.prototype.addBack = function () {
    // Verifica si existe un conjunto de elementos previo guardado.
    if (this.prevObject) {
        // Itera sobre los elementos previos.
        this.prevObject.forEach(element => {
            // Si el elemento previo no está ya en la instancia actual, se añade.
            if (!Array.from(this).includes(element)) {
                this[this.count++] = element; // Añade el elemento y actualiza la cuenta.
            }
        });
    }
    // Retorna la instancia para permitir el encadenamiento de métodos.
    return this;
};

/**
 * Agrega un manejador de eventos a los elementos.
 * @param {Function} callback - Función de callback que puede recibir uno o dos parámetros:
 *                             - Un parámetro: (element) => void
 *                             - Dos parámetros: (index, element) => void
 * @returns {H} La instancia de H para encadenar.
 */
H.prototype.each = function (callback) {
    // Verificamos el número de parámetros que espera la función callback
    const expectedArgs = callback.length;

    // Itera sobre las propiedades de 'this'
    for (let key in this) {
        if (this.hasOwnProperty(key) && this[key] instanceof HTMLElement) {
            // Si el callback espera dos parámetros, pasamos índice y elemento
            if (expectedArgs === 2) {
                callback.call(this[key], key, this[key]);
            }
            // Si el callback espera un parámetro, pasamos solo el elemento
            else {
                callback.call(this[key], this[key]);
            }
        }
    }
    return this; // Retorna 'this' para permitir encadenamiento
};

/**
 * Evalúa el selector proporcionado para determinar si se debe crear un nuevo elemento
 * HTML, seleccionar elementos existentes en el DOM, o usar directamente un objeto que
 * pueda ser un HTMLElement o una colección de ellos (como un NodeList o un array de HTMLElements).
 * Si el selector es una etiqueta HTML (e.g., '<div>'), crea un nuevo elemento de ese tipo.
 * Si es un selector CSS, selecciona los elementos que coincidan con el selector.
 * Si es un objeto (puede ser HTMLElement, NodeList, o Array), lo maneja adecuadamente.
 *
 * @param {HTMLElement|string|NodeList|Array} selector - El objeto HTMLElement, NodeList, Array, selector CSS, o etiqueta HTML.
 * @returns {Array<Element>} Retorna un arreglo de elementos que son creados, seleccionados, o manejados.
 */
function evaluateSelector(selector) {
    if (selector instanceof HTMLElement) {
        // Si el selector es un objeto HTMLElement, se retorna dentro de un array.
        return [selector];
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
        // Si el selector es un NodeList o un Array, se convierte a Array si es necesario y se retorna.
        return Array.from(selector);
    } else if (typeof selector === 'string') {
        if (selector.startsWith('<') && selector.endsWith('>')) {
            // Si el selector es una etiqueta HTML, crea un nuevo elemento.
            const tagName = selector.slice(1, -1);
            return [document.createElement(tagName)];
        } else {
            // Si el selector es un selector CSS, intenta encontrar elementos en el DOM.
            return Array.from(document.querySelectorAll(selector));
        }
    } else {
        throw new TypeError("El selector proporcionado debe ser una cadena, un HTMLElement, un NodeList o un Array.");
    }
}

/**
 * Copia el objeto `console` original y redefine sus métodos solo en localhost.
 */
const originalConsole = { ...console };

/**
 * Itera sobre las propiedades de `originalConsole` y redefine cada método de `h` para que
 * solo ejecute el método original de `console` si el hostname es "localhost".
 * @param {Object} originalConsole - El objeto del cual se copiarán las propiedades.
 * @param {Object} h - El objeto en el cual se redefinirán los métodos.
 */
for (const property in originalConsole) {
    /**
     * Redefine el método `property` en `h`.
     * @param {...any} args - Argumentos que se pasarán al método original de `console`.
     */
    h[property] = function (...args) {
        if (window.location.hostname === "localhost") {
            originalConsole[property](...args);
        }
    }
}


/**
 * Realiza una solicitud HTTP AJAX, con opción de confirmación antes de enviar.
 * @param {Object} options - Configuraciones y callbacks para la solicitud.
 * @param {string} options.type - Método HTTP como 'GET' o 'POST'.
 * @param {string} options.url - URL a la que se hace la solicitud.
 * @param {string} [options.dataType] - Tipo de respuesta esperada (e.g., 'json', 'text').
 * @param {string} [options.contentType] - Tipo de contenido de la solicitud HTTP.
 * @param {Object} [options.data] - Datos que se enviarán con la solicitud.
 * @param {number} [options.timeout] - Tiempo máximo en milisegundos antes de que la solicitud sea abortada.
 * @param {Function} [options.beforeSend] - Función que se ejecuta antes de enviar la solicitud.
 * @param {Function} [options.success] - Función callback para manejar la respuesta exitosa.
 * @param {Function} [options.error] - Función callback para manejar errores en la solicitud.
 * @param {Function} [options.complete] - Función que se ejecuta al completar la solicitud, tanto si es exitosa como si no.
 * @param {boolean} [options.confirm] - Indica si se debe mostrar una confirmación antes de enviar la solicitud.
 * @param {string} [options.confirmTitle] - Título utilizado en el cuadro de diálogo de confirmación.
 */
h.hbx = function (options) {
    // Verifica si se necesita confirmación antes de realizar la acción
    if (options.confirm) {
        // Verifica si Swal está definido y si el método fire está disponible
        if (typeof Swal !== 'undefined' && typeof Swal.fire === 'function') {
            // Llama a swalConfirmation si está disponible
            swalConfirmation({
                type: tToast.confirm,
                title: "¿Desea confirmar?",
                options: {
                    buttons: {
                        deny: {
                            show: false
                        },
                        confirm: {
                            color: '#4caf50'
                        }
                    },
                    onConfirm: function () {
                        // Si se confirma, envía la solicitud
                        sendRequest(options);
                    }
                }
            });
        } else {
            // Utiliza window.confirm si swalConfirmation no está disponible
            if (window.confirm(options.confirmTitle || '¿Desea confirmar?')) {
                // Si se confirma, envía la solicitud
                sendRequest(options);
            }
        }
    } else {
        // Envía la solicitud directamente si no se requiere confirmación
        sendRequest(options);
    }
};

/**
 * Función para enviar la solicitud XMLHttpRequest configurada.
 * @param {Object} options - Configuraciones y callbacks para la solicitud.
 */
function sendRequest(options) {
    // Crea una nueva instancia de XMLHttpRequest
    var xhr = new XMLHttpRequest();

    // Inicializa la URL con la URL base
    var url = options.url;
    // Si el método es GET y hay datos, los agrega a la URL como parámetros
    if (options.type.toUpperCase() === 'GET' && options.data) {
        var params = prepareData(options);
        url += '?' + params;
    }

    // Configura el tipo de solicitud, la URL y la asincronía
    xhr.open(options.type, url, true);
    // Define el tipo de respuesta esperada
    xhr.responseType = options.dataType || '';

    // Ejecuta cualquier configuración previa al envío
    if (options.beforeSend) {
        options.beforeSend(xhr);
    }

    // Establece el tiempo máximo antes de que la solicitud sea abortada
    xhr.timeout = options.timeout || 0;
    // Establece el tipo de contenido de la solicitud HTTP
    xhr.setRequestHeader('Content-Type', options.contentType || 'application/x-www-form-urlencoded');

    // Maneja la carga completa de la respuesta
    xhr.onload = function () {
        // Verifica el estado de la respuesta
        if (xhr.status >= 200 && xhr.status < 300) {
            // Llama a la función de éxito si la respuesta es exitosa
            options.success && options.success(xhr.response, xhr.status, xhr);
        } else {
            // Llama a la función de error si la respuesta falla
            options.error && options.error(xhr, xhr.status, xhr.statusText);
        }
        // Ejecuta la función completa al terminar la solicitud
        options.complete && options.complete(xhr, xhr.status);
    };

    // Maneja errores de red
    xhr.onerror = function () {
        options.error && options.error(xhr, xhr.status, "Network error");
        options.complete && options.complete(xhr, xhr.status);
    };

    // Maneja el tiempo de espera superado
    xhr.ontimeout = function () {
        options.error && options.error(xhr, xhr.status, "Request timed out");
        options.complete && options.complete(xhr, xhr.status);
    };

    // Prepara los datos para ser enviados con la solicitud
    if (options.type.toUpperCase() === 'GET') {
        // Si es GET, no se envían datos en el cuerpo de la solicitud
        xhr.send();
    } else {
        // Si es otro método, se envían los datos en el cuerpo de la solicitud
        var data = prepareData(options);
        xhr.send(data);
    }
}

/**
 * Prepara los datos para ser enviados en una solicitud HTTP.
 * @param {Object} options - Configuraciones de la solicitud, incluyendo los datos a enviar.
 * @returns {string|null} Datos formateados para la solicitud.
 */
function prepareData(options) {
    var data = null;
    // Si el contenido es JSON y los datos son un objeto, convierte a string JSON
    if (options.contentType === 'application/json' && typeof options.data === 'object') {
        data = JSON.stringify(options.data);
    } else if (typeof options.data === 'object') {
        // Si los datos son un objeto, serializa como cadena de consulta URL
        data = Object.keys(options.data).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(options.data[key]);
        }).join('&');
    } else {
        // Usa los datos directamente si no son un objeto
        data = options.data;
    }
    return data;
}
