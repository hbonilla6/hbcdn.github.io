/**
 * Normaliza un texto en español convirtiéndolo a minúsculas o mayúsculas,
 * eliminando acentos y caracteres especiales.
 * 
 * @param {string} texto - El texto en español que se desea normalizar.
 * @param {string|null} [caseOption=null] - Opción para convertir el texto a minúsculas ('lower'), mayúsculas ('upper') o no hacer cambios (null).
 * @returns {string} - El texto normalizado.
 */
function normalizeText(texto, caseOption = null) {
    // Normalizar caracteres Unicode para descomponer acentos y diacríticos
    texto = texto.normalize("NFD"); // Convierte caracteres como "á" en "a" + acento separado

    // Eliminar los acentos y diacríticos utilizando un rango Unicode
    texto = texto.replace(/[\u0300-\u036f]/g, "");

    // Eliminar caracteres especiales, dejando solo letras, números y espacios
    texto = texto.replace(/[^a-zA-Z0-9\s]/g, "");

    // Eliminar espacios en blanco al inicio y al final del texto
    texto = texto.trim();

    // Convertir el texto según la opción de caso, si se proporciona
    if (caseOption === false) {
        return texto.toLowerCase();
    } else if (caseOption === true) {
        return texto.toUpperCase();
    }

    // Si no se pasa una opción de caso, devolver el texto tal cual fue normalizado
    return texto.trim();
}

/**
 * Transforma un valor en un número decimal preciso.
 * 
 * @param {any} value - El valor a convertir en decimal.
 * @param {number} defaultValue - El valor por defecto si `value` no es un número válido (por defecto es 0).
 * @param {number} decimals - La cantidad de decimales a retornar (por defecto es 2).
 * @returns {number} - El número transformado con la precisión especificada.
 */
function toDecimal(value, defaultValue = 0, decimals = 2) {
    // Asegurarse de que `decimals` sea un número entero no negativo
    decimals = Math.max(0, Math.trunc(decimals));

    // Intentar convertir el valor en un número
    let number = parseFloat(value);

    // Validar si el resultado es un número válido
    if (isNaN(number)) {
        number = defaultValue;
    }

    // Redondear el número a la cantidad exacta de decimales
    return parseFloat(number.toFixed(decimals));
}

/**
 * Transforma un valor en un número entero preciso.
 * 
 * @param {any} value - El valor a convertir en entero.
 * @param {number} defaultValue - El valor por defecto si `value` no es un número válido (por defecto es 0).
 * @returns {number} - El número transformado como entero.
 */
function toInt(value, defaultValue = 0) {
    // Intentar convertir el valor en un número
    let number = parseInt(value, 10);

    // Validar si el resultado es un número válido
    if (isNaN(number)) {
        number = defaultValue;
    }

    return number;
}

//#region generateUUID
/**
 * Genera un identificador único universal (UUID) versión 4.
 * El UUID tiene el formato xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx.
 *
 * @returns {string} Un UUID generado aleatoriamente.
 */
function generateUUID() {
    // Inicia la creación del UUID con un patrón que será reemplazado.
    // Las letras 'x' y 'y' serán reemplazadas por valores generados aleatoriamente.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        // Genera un número aleatorio entre 0 y 15 (número hexadecimal de 0 a 15).
        var r = Math.random() * 16 | 0;

        // Si el carácter es 'x', usa el número aleatorio generado.
        // Si el carácter es 'y', se aplica una máscara para garantizar que siga
        // el formato del UUID versión 4 (con bits específicos ajustados).
        var v = c == 'x' ? r : (r & 0x3 | 0x8);

        // Convierte el número a su representación hexadecimal (de 0 a f)
        return v.toString(16);
    });
}
//#endregion

//#region convertCase
/**
 * Convierte el texto de los campos de entrada y textarea con la clase "text-uppercase" a mayúsculas.
 *
 * @returns {boolean} Devuelve true al completar la conversión de texto a mayúsculas.
 */
function convertCase() {
    // Obtiene todos los elementos con la clase "text-uppercase".
    const elementos = document.getElementsByClassName("text-uppercase");

    // Recorre todos los elementos obtenidos.
    for (let elemento of elementos) {
        // Verifica si el elemento es un campo de entrada (INPUT) o un textarea.
        if (elemento.tagName === "INPUT" || elemento.tagName === "TEXTAREA") {
            // Convierte el valor del campo a mayúsculas.
            elemento.value = elemento.value.toUpperCase();
        }
    }
    // Retorna true después de convertir el texto.
    return true;
}

//#endregion

//#region veriryIntlTelInput
/**
 * Verifica si los campos de entrada de tipo "tel" con el atributo "data-jq-toggle='inputTel'" tienen un número válido.
 * Si el número no está vacío, se enfoca en el campo correspondiente.
 *
 * @returns {boolean} Devuelve true después de la verificación de los inputs telefónicos.
 */
function veriryIntlTelInput() {
    // Selecciona todos los inputs de tipo "tel" con el atributo 'data-jq-toggle="inputTel"'.
    h('input[type="tel"][data-jq-toggle="inputTel"]')?.each((index, currentInput) => {
        // Obtiene la instancia de intlTelInput asociada al input actual.
        var iti = window.intlTelInputGlobals.getInstance(currentInput);

        // Obtiene el valor inicial del input en formato de número completo.
        const initialValue = iti.getNumber();

        // Si el valor inicial no está vacío (es decir, si contiene un número válido).
        if (initialValue) {
            // Enfoca el campo de entrada telefónico.
            $(currentInput).focus();
        }
    });
    // Retorna true después de verificar los inputs.
    return true;
}

//#endregion



//#region requestAsync
/**
 * @description Realiza una solicitud asincrónica a una URL especificada.
 * @param {object} options - Opciones de solicitud.
 * @param {string} options.url - URL a la que se realizará la solicitud.
 * @param {string} options.id - ID del elemento HTML donde se mostrará la respuesta.
 * @param {string} [options.method="GET"] - Método HTTP de la solicitud (GET, POST, PUT, DELETE).
 * @param {function} [callback] - Función de devolución de llamada que se ejecuta después de la solicitud.
 */
function requestAsync({ url, id, method = "GET", callback }) {
    try {
        // Mostrar un toast de carga con mensaje "Cargando..."
        const uuid = toast({
            icon: tToast.info, // Ícono informativo
            position: tToasPosition.bottomStart, // Posición del toast
            title: "Cargando...", // Título del mensaje de carga
            timer: 10000 // Tiempo de espera del toast (10 segundos)
        });

        // Obtener el elemento HTML donde se va a mostrar la respuesta
        const tag = document.getElementById(id);

        // Verificar el tipo de elemento HTML (si existe) y mostrar un mensaje provisional
        if (tag) {
            const tagName = tag.tagName || ''; // Obtener el nombre del tag
            switch (tagName) {
                case "SELECT":
                    // Si es un SELECT, mostrar "Cargando..." como opción
                    tag.innerHTML = "<option disabled selected value=''>Cargando...</option>";
                    break;
                case "DIV":
                    if (tag.id === "modalContent") {
                        // Si es un modal (DIV con id "modalContent"), mostrar un ícono de carga
                        tag.innerHTML = "<div class='overlay'><i class='fas fa-2x fa-sync fa-spin'></i></div>";
                    } else {
                        // Si es otro tipo de DIV, mostrar una barra de progreso
                        tag.innerHTML = "<progress></progress>";
                    }
                    break;
                default:
                    // En otros casos, también se muestra una barra de progreso
                    tag.innerHTML = "<progress></progress>";
            }
        }

        // Crear una instancia de XMLHttpRequest para realizar la solicitud AJAX
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            // Verificar si la solicitud ha finalizado (estado 4)
            if (xmlhttp.readyState === 4) {
                // Cerrar el toast de carga
                const toastInstance = toastMap.get(uuid); // Obtener la instancia del toast por su uuid
                if (toastInstance) {
                    toastInstance.close(); // Cerrar el toast si está presente
                    toastMap.delete(uuid); // Eliminar el uuid de la lista de toasts
                }

                // Si la solicitud fue exitosa (estado 200)
                if (xmlhttp.status === 200) {
                    // Verificar si el elemento HTML existe y mostrar la respuesta
                    if (tag) {
                        // Si el tag es un SELECT, reemplazar las opciones con la respuesta
                        tag.innerHTML = xmlhttp.responseText;
                        // Inicializar los elementos select2 en el contenido del modal
                        let isSignIn = tag.querySelector('form[data-signin]') != null;
                        if (isSignIn) { // Si es un formulario de inicio de sesión
                            window.location.reload(); // Recargar la página
                            return; // Salir de la función
                        }
                    }

                    // Si se proporciona un callback, ejecutarlo con la respuesta XMLHttpRequest
                    if (typeof callback === "function") callback(xmlhttp);
                } else {
                    // Si ocurre un error en la solicitud, manejarlo
                    handleRequestError(url);
                }
            }
        };

        // Abrir la solicitud (método, URL, asíncrona)
        xmlhttp.open(method, url, true);
        // Enviar la solicitud
        xmlhttp.send();
    } catch (e) {
        h.error(e);
        // Manejar cualquier error que ocurra en el bloque try
        handleRequestError(url);
    }
}
//#endregion

//#region handleRequestError
/**
 * @description Maneja errores de solicitudes asincrónicas.
 * @param {string} url - La ruta URL completa de la solicitud.
 */
function handleRequestError(url) {
    // Dividir la URL en segmentos utilizando "/"
    const segmentsRoute = url.split("/");

    // Verificar que haya al menos 4 segmentos en la URL
    if (segmentsRoute.length < 4) {
        h.error(`Error: URL incompleta: ${url}`); // Mostrar un error si la URL es incompleta
        return;
    }

    // Obtener el cuarto segmento de la URL sin el query string
    const segTwo = getSegmentWithoutQuery(segmentsRoute[4]);

    // Obtener el tercer segmento de la URL
    const segOne = segmentsRoute[3];

    // Mostrar un mensaje de error en la consola con los segmentos extraídos
    h.error(`${segTwo} => ${segOne}`);
}
//#endregion

//#region getSegmentWithoutQuery
/**
 * @description Obtiene un segmento de una URL sin el query string.
 * @param {string} segment - El segmento de la URL.
 * @returns {string} El segmento sin el query string.
 */
function getSegmentWithoutQuery(segment) {
    // Dividir el segmento por "?" y devolver solo la parte antes del query string
    return segment.split("?")[0];
}
//#endregion

//#region disableAllSubmitButtons
/**
 * Habilita o deshabilita todos los botones de tipo "submit" dentro de un formulario.
 *
 * @param {Event} form - El evento del formulario que contiene los botones de tipo "submit".
 * @param {boolean} [disable=true] - Indica si los botones deben ser deshabilitados (true) o habilitados (false).
 */
function disableAllSubmitButtons(form, disable = true) {
    // Selecciona todos los botones de tipo 'submit' dentro del formulario recibido.
    h(form).find("[type='submit']").each((i, element) => {
        // Itera sobre cada botón de tipo 'submit' y le asigna el valor de la propiedad 'disabled'.
        element.disabled = disable
    });
}

//#endregion

// Función para obtener la ruta completa actual
function getFullPath() {
    return window.location.pathname + window.location.search;
}

// Función para agregar la ruta al formulario
function addCurrentPathToForm(form) {
    if (!form || !(form instanceof HTMLFormElement)) {
        console.error('Se requiere un elemento form válido');
        return;
    }

    // Obtener la URL actual (ruta completa)
    const currentPath = getFullPath();

    // Verificar si ya existe un input con el nombre 'currentPath'
    let existingInput = form.querySelector('input[name="currentPath"]');

    if (existingInput) {
        // Actualizar el valor si ya existe
        existingInput.value = currentPath;
    } else {
        // Crear nuevo input si no existe
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "currentPath";
        input.value = currentPath;
        // Insertar el input al inicio del formulario
        form.insertBefore(input, form.firstChild);
    }
};

//#region validateForm
/**
 * Valida un formulario y gestiona el estado de los botones de envío.
 * Si las validaciones pasan, el formulario se envía; de lo contrario, se habilitan los botones y no se envía.
 *
 * @param {Event} form - El evento del formulario que se va a validar y enviar.
 * @returns {boolean|void} Devuelve false si la validación falla; de lo contrario, envía el formulario.
 */
function validateForm(form) {
    // Deshabilitar todos los botones de tipo 'submit' para evitar múltiples envíos.
    showLoadingAlert(true);
    //disableAllSubmitButtons(form, true);

    // Solo llamar a swalTimer si el documento aún se está cargando (readyState === 'loading').
    if (document.readyState === 'loading') {
        swalTimer({});
    }

    // Verifica si las funciones de validación convertCase() y veriryIntlTelInput() son verdaderas.
    if (convertCase() && veriryIntlTelInput()) {
        addCurrentPathToForm(form); // Agregar la ruta actual al formulario.

        // Si las validaciones pasan, vuelve a habilitar los botones de envío.
        //disableAllSubmitButtons(form, false);
        showLoadingAlert(false);

        // Envía el formulario si todo es correcto.
        return form.submit();
    } else {
        // Si alguna validación falla, habilitar los botones de envío nuevamente.
        showLoadingAlert(false);

        // No enviar el formulario debido a la falla en las validaciones.
        return false;
    }
}

//#endregion

// #region FORMULARIO REQUERIOD
/**
 * Función para confirmar el envío de un formulario, mostrando errores en los campos requeridos inválidos.
 *
 * @param {Event} event - El evento de envío del formulario.
 * @returns {boolean} `false` para prevenir el envío del formulario, `true` si no hay errores.
 */
function confirmForm(event) {
    const form = event.target; // Obtiene el formulario desde el evento de envío.
    event.preventDefault(); // Previene el envío predeterminado del formulario para poder realizar validaciones.

    // Obtiene todos los elementos requeridos que están vacíos o son inválidos.
    const elemInvalids = [...form.querySelectorAll('[data-val-required], [required]')].filter((element) =>
        !element.value.trim() || !isValidElement(element) || element.getAttribute("aria-invalid") === 'true'
    );

    if (elemInvalids.length > 0) {
        // Si hay elementos inválidos, muestra un grupo de errores en la consola.
        h.groupCollapsed('Campos Requeridos Inválidos:');
        elemInvalids.forEach((element) => {
            // Obtiene la etiqueta del elemento o usa el nombre del elemento como fallback.
            const label = element.labels?.[0]?.textContent?.trim() || element.name?.trim() || 'Sin etiqueta';
            h.error(`- ${label}`); // Muestra el error en la consola.
            element.focus(); // Focaliza el primer campo inválido para la corrección del usuario.
        });
        h.groupEnd();
        return false; // Previene el envío del formulario si hay errores.
    }

    // Muestra una confirmación usando SweetAlert antes de enviar el formulario.
    swalConfirmation({
        type: tToast.confirm, // Tipo de notificación.
        title: "¿Desea confirmar?", // Título de la confirmación.
        options: {
            buttons: {
                deny: { show: false }, // Oculta el botón de denegar.
                confirm: { color: '#4caf50' } // Configura el color del botón de confirmación.
            },
            onConfirm: function () {
                validateForm(form); // Llama a la función de validación del formulario si se confirma.
            }
        }
    });

    return false; // Previene el envío del formulario hasta que se confirme.
}

/**
 * Valida elementos requeridos y muestra notificaciones.
 *
 * @param {HTMLFormElement} form - El formulario a verificar.
 * @returns {boolean} `true` si se deben verificar los campos requeridos.
 */
function checkRequiredElements(form) {
    // Obtiene todos los elementos requeridos en el formulario.
    const requiredElements = form.querySelectorAll('[data-val-required], [required]');
    if (requiredElements.length > 0) {
        // Muestra una notificación sobre los campos obligatorios.
        toastR({
            title: "Los elementos marcados con <b style='color: red; font-size: x-large;'>*</b> son obligatorios.",
            type: tToast.info
        });

        requiredElements.forEach((element) => {
            // Obtiene la etiqueta asociada al elemento, si existe.
            const labelForElement = document.querySelector(`label[for="${element.id}"]:not(.label-not-required)`);
            if (labelForElement) {
                labelForElement.classList.add('label-required'); // Marca la etiqueta como requerida.
            } else if (!element.id) {
                // Muestra una advertencia si el elemento requerido no tiene un atributo "id".
                h.warn('Elemento con `data-val-required` no tiene un atributo "id":', element);
            }
        });
    }

    // Asigna el manejador de confirmación al evento de envío del formulario.
    form.addEventListener("submit", confirmForm);
}

/**
 * Función para verificar si un elemento es válido.
 * @param {HTMLInputElement} element - El elemento a validar.
 * @returns {boolean} - `true` si el elemento es válido, `false` en caso contrario.
 */
function isValidElement(element) {
    return element.checkValidity(); // Verifica la validez del elemento basado en las reglas de HTML5.
}
//#endregion

//#region Función onSelect2
/**
 * Inicializa los elementos `select2` en el DOM y configura un evento para limpiar los mensajes de validación
 * asociados cuando se selecciona una nueva opción.
 */
function onSelect2() {
    $.fn.select2.defaults.set('language', 'es');
    // Selecciona todos los elementos <select> con la clase `select2`
    let selectors = $('select.select2');

    // Inicializa el plugin select2 en los elementos seleccionados
    selectors.select2();

    // Agrega un evento que se dispara antes de que se seleccione un elemento en `select2`
    $('.select2').on('select2:selecting', function (e) {
        // Limpia los mensajes de validación para el campo del select cuando se selecciona un nuevo valor
        h(`[data-valmsg-for="${e.params.args.data.element.closest('select').name}"]`)?.html('');
    });
}
//#endregion

//#region Función simplePostUnobtrusiveAjax
/**
 * Configura atributos de `data-ajax` en los elementos que tienen el atributo `data-post-simple` para habilitar 
 * peticiones Ajax unobtrusive con las respectivas configuraciones de alertas y carga.
 */
function simplePostUnobtrusiveAjax() {
    // Selecciona todos los elementos que tienen el atributo `data-post-simple="true"`
    h("*[data-post-simple='true']")
        // Establece que la solicitud Ajax sea activada
        .attr("data-ajax", "true")
        // Define que el método de la solicitud Ajax sea POST
        .attr("data-ajax-method", "POST")
        // Define el método a llamar en caso de éxito de la solicitud
        .attr("data-ajax-success", "onSuccessAlert")
        // Define el método a llamar en caso de fallo de la solicitud
        .attr("data-ajax-failure", "onFailureAlert")
        // Define el método a llamar antes de iniciar la solicitud (mostrar carga)
        .attr("data-ajax-begin", "showLoadingAlert")
        // Define el método a llamar cuando la solicitud esté completa (ocultar carga)
        .attr("data-ajax-complete", "hideLoadingAlert")
}
//#endregion

//#region Función onSelect2Individual
/**
 * Inicializa un elemento select con el plugin select2, manteniendo el estado abierto si ya lo estaba.
 * 
 * @param {string} id - El ID del elemento select que debe ser inicializado con select2.
 */
function onSelect2Individual(id) {
    try {
        // Variable para almacenar si el select estaba abierto antes de la inicialización
        let isOpen = false;

        // Selecciona el elemento <select> que tiene la clase `select2` y el ID proporcionado
        const select = $(`select.select2#${id}`);

        // Verifica si el elemento ya tiene la clase de select2 aplicada
        const exists = select.hasClass('select2-hidden-accessible');

        // Si el elemento ya está inicializado con select2, verifica si está abierto
        if (exists) {
            isOpen = select.select2('isOpen');
        }

        // Inicializa el select2 en el elemento seleccionado
        select.select2();

        // Si el select estaba abierto antes de la inicialización, lo abre nuevamente
        if (isOpen) {
            select.select2('open');
        }
    } catch (e) {
        // Manejo de errores (actualmente vacío)
    }
}
//#endregion

//#region Función utilityModal
/**
 * Muestra un modal de utilidad y ejecuta las acciones configuradas al cargar su contenido de manera asincrónica.
 * @param {string} urlOptions - URL desde donde se cargará el contenido del modal.
 * @param {function} actionCallBack - Función que se ejecutará luego de que el contenido del modal sea cargado.
 */
function utilityModal(urlOptions, actionCallBack) {
    // Realiza una solicitud asincrónica para cargar contenido en el modal
    requestAsync({
        // URL del contenido a cargar
        url: `${urlOptions}`,
        // ID del contenedor donde se insertará el contenido
        id: 'modalContent',
        // Función de callback que se ejecuta cuando la solicitud es completada
        callback: (function () {
            // Muestra un mensaje en la consola indicando que el modal se completó
            h.info('completed utility modal');

            h("#modalContent").find("form").each(form => checkRequiredElements(form));

            // Configura los elementos con `data-post-simple` para habilitar peticiones Ajax unobtrusive
            simplePostUnobtrusiveAjax();

            // Muestra el modal después de cargar el contenido
            const modal = document.querySelector('#modal-overlay');

            if (modal) {
                // Muestra el modal utilizando Bootstrap si está disponible
                if (typeof bootstrap !== 'undefined') {
                    // Crea una instancia de Bootstrap Modal y la muestra
                    const bsModal = new bootstrap.Modal(modal);
                    // Muestra el modal
                    bsModal.show();
                }

                // Inicializa los elementos select2 en el contenido del modal
                onSelect2();

                // Obtiene el primer elemento de entrada en el formulario del modal
                const firstInput = modal.querySelector('input[type="text"]:not([type="hidden"]):not([disabled]), textarea:not([disabled])');

                // Verifica si se encontró un elemento de entrada en el formulario
                if (firstInput) {
                    // Enfoca el primer elemento de entrada en el formulario
                    firstInput.focus();

                    // Selecciona el texto en el campo de entrada si es un campo de texto
                    if (firstInput.setSelectionRange) {
                        // Selecciona todo el texto en el campo de entrada
                        firstInput.setSelectionRange(firstInput.value.length, firstInput.value.length);
                    }
                    // Desplaza la vista al primer elemento de entrada en el formulario
                    firstInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    // Muestra un mensaje en la consola si no se encontraron elementos de entrada en el formulario
                    h.warn('No focusable elements found in form');
                }
            } else {
                // Muestra un mensaje en la consola si no se encuentra el modal
                h.warn('Modal element not found');
            }

            // Reinicializa las validaciones unobtrusive de jQuery en el contenido dinámicamente cargado del modal
            $.validator.unobtrusive.parse('#modalContent');

            // Ejecuta el callback si se proporciona uno (función que puede ser pasada como parámetro)
            if (actionCallBack) actionCallBack();
        })
    });
}
//#endregion

/**
     * Verifica y actualiza el enlace de WhatsApp basado en el valor del input.
     *
     * @param {HTMLInputElement} input - El elemento de entrada que contiene el número de teléfono.
     * @param {string} [value=null] - El valor del número de teléfono a verificar. Si no se proporciona, se usará el valor del input.
     */
function verifyWhatsApp(input, value = null) {
    // Si no se proporciona un valor, usar el valor del input
    if (!value) value = input.value;

    // Normalizar el número de teléfono removiendo espacios y guiones
    const number = String(value).replace(/[\s-]/g, "");

    // Obtener el elemento `a` adyacente al `input` usando la biblioteca personalizada `h`
    const linkToWhatsApp = h(input).closest('.icon-input-container').find('.input-icon').get(0);

    // Verificar si hay un número válido
    if (number) {
        // Actualizar el estilo y el enlace del elemento `a`
        h(linkToWhatsApp)
            .removeClass("text-dark")
            .addClass("text-success,text-shadow-success")
            .attr("target", "_blank")
            .attr("href", `https://wa.me/${number}`);
    } else {
        // Restablecer el estilo y el enlace del elemento `a`
        h(linkToWhatsApp)
            .removeClass("text-success,text-shadow-success")
            .addClass("text-dark")
            .removeAttr("target")
            .attr("href", `#`);
    }
}

/**
 * Formatea el valor de un campo de entrada cuando pierde el foco, asegurando
 * que tenga la longitud específica agregando ceros a la izquierda. Si no se
 * proporciona una longitud, se utiliza un valor predeterminado de 3.
 *
 * @param {HTMLInputElement} input - El campo de entrada cuyo valor será formateado.
 * @param {number} [length=2] - La longitud deseada que debe tener el valor (por defecto es 2).
 */
function formatInputOnBlur(input, length = 2) {

    // Obtener el valor del campo de entrada y eliminar cualquier carácter no numérico
    let value = input.value.replace(/\D/g, '');

    // Asegurarse de que el valor tenga la longitud especificada
    if (value.length > 0) {
        value = value.padStart(length, '0'); // Agregar ceros a la izquierda si es necesario
    }

    // Asignar el valor formateado de nuevo al campo de entrada
    input.value = value;
}

/**
     * Cambia el tipo de un campo de contraseña entre 'text' y 'password'.
     *
     * @param {HTMLElement} button - El botón que activa la visualización de la contraseña.
     * @param {boolean} show - Indica si se debe mostrar la contraseña (true) o no (false).
     */
function togglePassword(button, show) {
    // Encuentra el campo de contraseña asociado al botón
    var passwordField = button.previousElementSibling;

    // Cambia el tipo del campo de contraseña según el valor de "show"
    if (show) {
        passwordField.setAttribute('type', 'text'); // Cambiar a texto
    } else {
        passwordField.setAttribute('type', 'password'); // Volver a tipo password
    }
}

/**
 * Muestra una alerta de carga y deshabilita los botones de envío.
 * @param {boolean} [loading=true] - Indica si se debe mostrar el estado de carga (true) o no (false).
 */
function showLoadingAlert(loading = true) {
    // Si 'loading' es true, muestra el mensaje de "Cargando..." y deshabilita los botones de envío.
    if (loading) {
        // Muestra un toast (notificación) con ícono de información y el mensaje "Cargando...".
        toast({ icon: tToast.info, title: "Cargando..." });

        // Deshabilita todos los inputs y botones de tipo submit.
        h("input[type='submit'], button[type='submit']").attr("disabled", true);
    } else {
        // Si 'loading' es false, habilita nuevamente los inputs y botones de tipo submit.
        h("input[type='submit'], button[type='submit']").removeAttr("disabled");
    }
}

/**
 * Transforma un valor en un número decimal preciso.
 * 
 * @param {any} value - El valor a convertir en decimal.
 * @param {number} defaultValue - El valor por defecto si `value` no es un número válido (por defecto es 0).
 * @param {number} decimals - La cantidad de decimales a retornar (por defecto es 2).
 * @returns {number} - El número transformado con la precisión especificada.
 */
function toDecimal(value, defaultValue = 0, decimals = 2) {
    // Asegurarse de que `decimals` sea un número entero no negativo
    decimals = Math.max(0, Math.trunc(decimals));

    // Intentar convertir el valor en un número
    let number = parseFloat(value);

    // Validar si el resultado es un número válido
    if (isNaN(number)) {
        number = defaultValue;
    }

    // Redondear el número a la cantidad exacta de decimales
    return parseFloat(number.toFixed(decimals));
}

/**
 * Transforma un valor en un número entero preciso.
 * 
 * @param {any} value - El valor a convertir en entero.
 * @param {number} defaultValue - El valor por defecto si `value` no es un número válido (por defecto es 0).
 * @returns {number} - El número transformado como entero.
 */
function toInt(value, defaultValue = 0) {
    // Intentar convertir el valor en un número
    let number = parseInt(value, 10);

    // Validar si el resultado es un número válido
    if (isNaN(number)) {
        number = defaultValue;
    }

    return number;
}

// Función para aplicar atributos según los data-attributes
function applyAttributes() {
    h("*[data-disabled='true']")?.attr("disabled", "disabled");
    h("*[data-checked='true']")?.attr("checked", "checked");
    h("*[data-readonly='true']")?.attr("readonly", "readonly");
    h("*[data-hidden='true']")?.attr("hidden", "hidden");
    h("*[data-interactive='false']")?.css({ 'pointer-events': 'none', opacity: 0.7 });
}

// 1. Definimos el objeto global actionFunctions
const actionFunctions = {};

// 2. Función para agregar dinámicamente una nueva acción a actionFunctions
function addActionFunction(functionName, functionImplementation) {
    // Verificamos si el nombre de la función es un string y si la implementación es una función
    if (typeof functionName === 'string' && typeof functionImplementation === 'function') {
        // Agregamos la función al objeto actionFunctions
        actionFunctions[functionName] = functionImplementation;
    } else {
        // Si hay algún error, lo mostramos en la consola
        console.error('El nombre de la función debe ser un string y la implementación debe ser una función.');
    }
}
// Función para manejar el estado de las cartas (si deben ser abiertas o cerradas)
function handleCards(cardToOpen, cardsToClose = []) {
    // Si se especifica una carta para abrir
    if (cardToOpen) {
        const cardElementToOpen = document.getElementById(cardToOpen);
        if (cardElementToOpen) {
            cardElementToOpen.classList.remove('collapsed-card');
            // Mostramos el card-body
            const cardBody = cardElementToOpen.querySelector('.card-body');
            if (cardBody) {
                cardBody.style.display = 'block';  // Muestra el card-body cuando está abierto
            }
            // Actualizamos el ícono de la carta abierta
            const buttonIcon = cardElementToOpen.querySelector('.card-tools .btn-tool i');
            if (buttonIcon) {
                buttonIcon.classList.remove('fa-plus');
                buttonIcon.classList.add('fa-minus');
            }
        }
    }

    // Si no se especifican cartas a cerrar, se cierran todas las cartas
    const cards = cardsToClose.length === 0 ? document.querySelectorAll('.card') : cardsToClose;

    // Si se especifica una carta o varias para cerrar
    cards.forEach(card => {
        const cardElementToClose = typeof card === 'string' ? document.getElementById(card) : card;
        if (cardElementToClose && cardElementToClose !== document.getElementById(cardToOpen)) {
            cardElementToClose.classList.add('collapsed-card');
            // Ocultamos el card-body
            const cardBody = cardElementToClose.querySelector('.card-body');
            if (cardBody) {
                cardBody.style.display = 'none';  // Oculta el card-body cuando está cerrado
            }
            // Actualizamos el ícono de la carta cerrada
            const buttonIcon = cardElementToClose.querySelector('.card-tools .btn-tool i');
            if (buttonIcon) {
                buttonIcon.classList.remove('fa-minus');
                buttonIcon.classList.add('fa-plus');
            }
        }
    });
}

// 4. Función que devuelve todos los elementos que se pueden enfocar (input, select, textarea)
function getFocusableElements() {
    // Definimos los selectores para los elementos enfocados
    const selectors = [
        'input:not([disabled]):not([type="hidden"]):not([data-exclude-apply])',
        'select:not([disabled]):not([type="hidden"]):not([data-exclude-apply])',
        'textarea:not([disabled]):not([type="hidden"]):not([data-exclude-apply])'
    ];
    
    // Obtenemos todos los elementos que cumplen con esos selectores y los filtramos para asegurarnos de que sean visibles y de tamaño
    return Array.from(document.querySelectorAll(selectors.join(',')))
        .filter(el => {
            const style = window.getComputedStyle(el);
            return style.visibility !== 'hidden' && 
                   style.display !== 'none' && 
                   el.offsetWidth > 0 && 
                   el.offsetHeight > 0;
        });
}

// 5. Función para manejar el evento `Enter` como un "Tab" (pasar al siguiente elemento)
function handleEnterAsTab(e) {
    // Si la tecla presionada es "Enter"
    if (e.key === 'Enter') {
        e.preventDefault();  // Prevenimos el comportamiento por defecto del Enter (como enviar un formulario)
        
        const currentElement = e.target;  // Elemento que activó el evento
        
        // Obtener el ID del siguiente elemento al que se quiere mover
        const targetId = currentElement.getAttribute('data-next-element-id');
        
        // Obtener la función que debe ejecutarse antes de mover al siguiente elemento (si existe)
        const beforeFunction = currentElement.getAttribute('data-function-before-navigation');
        
        // Obtener y parsear los parámetros para la función
        let functionParams = [];
        const paramsAttr = currentElement.getAttribute('data-function-parameters');
        if (paramsAttr) {
            try {
                // Intentamos convertir el string a un array de parámetros de forma segura
                functionParams = JSON.parse(paramsAttr.replace(/'/g, '"'));
            } catch (error) {
                console.error('Error parsing function parameters:', error);
            }
        }
        
        // Ejecutamos la función antes de cambiar al siguiente elemento si está definida
        if (beforeFunction && actionFunctions[beforeFunction]) {
            actionFunctions[beforeFunction](...functionParams);
        }
        
        // Buscar el siguiente elemento enfocable
        let nextElement;
        if (targetId) {
            // Si existe un ID destino, lo buscamos
            nextElement = document.getElementById(targetId);
        } else {
            // Si no hay ID, buscamos el siguiente elemento dentro de los elementos enfocados
            const focusable = getFocusableElements();
            const currentIndex = focusable.indexOf(currentElement);
            nextElement = focusable[currentIndex + 1] || focusable[0];  // Si no hay siguiente, vamos al primero
        }

        // Si encontramos el siguiente elemento, lo enfocamos
        if (nextElement) {
            nextElement.focus();  // Establecemos el enfoque al siguiente elemento
            // Si el siguiente elemento es un input de tipo texto, seleccionamos su contenido
            if (nextElement instanceof HTMLInputElement && 
                ['text', 'search', 'url', 'tel', 'password'].includes(nextElement.type)) {
                nextElement.select();
            }
        }
    }
}


/**
         * Función para manejar la validación de inputs de tipo number.
         */
function handleNumberInput() {
    // Escucha global para inputs de tipo number
    h('input[hbnumber]').on('input', (event) => {
        const input = event.target; // El input que activó el evento
        const value = toDecimal(input.value); // Valor actual del input
        const max = input.hasAttribute('max') ? toDecimal(input.max) : null; // Solo tomar max si existe
        const min = input.hasAttribute('min') ? toDecimal(input.min) : null; // Solo tomar min si existe

        // Validamos solo si el valor no está vacío y es un número
        if (input.value !== '' && !isNaN(value)) {
            if (max !== null && value > max) input.value = max; // Ajustamos al máximo permitido si existe
            if (min !== null && value < min) input.value = min; // Ajustamos al mínimo permitido si existe
        }
    });
}