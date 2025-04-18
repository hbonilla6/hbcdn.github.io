function inicializarFormulariosHbHbx(elements) {
    // Obtiene todos los elementos requeridos en el formulario.
    const requiredElements = h(elements)
        .find('[data-val-required], [required]');
    if (requiredElements.count > 0) {
        // Muestra una notificación sobre los campos obligatorios.
        toastR({
            title: "Los elementos marcados con <b style='color: red; font-size: x-large;'>*</b> son obligatorios.",
            type: tToast.info
        });

        requiredElements.each((element) => {
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
    // Selecciona todos los formularios con el atributo 'hb-hbx' y les asigna un evento 'submit'
    $('form[hb-hbx]').off('submit').on('submit', function (e) {
        e.preventDefault(); // Evita el envío tradicional del formulario
        const form = $(this); // Guarda la referencia al formulario actual
        const confirmMessage = form.data('hb-confirm') || '¿Estás seguro de realizar esta acción?'; // Obtiene el mensaje de confirmación personalizado o usa uno por defecto

        // Obtiene todos los elementos requeridos que están vacíos o son inválidos.
        const elemInvalids = [...this.querySelectorAll('[data-val-required], [required]')].filter((element) =>
            !element.value.trim() || !element.checkValidity() || element.getAttribute("aria-invalid") === 'true'
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

        // Muestra una alerta de confirmación con SweetAlert
        Swal.fire({
            title: confirmMessage,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) { // Si el usuario confirma, ejecuta la petición AJAX
                addCurrentPathToForm(form);
                ejecutarAjax(form);
            } else {
                toast({ title: '&#161;Acci&oacute;n cancelada!', icon: tToast.info });
            }
        });

        return false; // Previene el envío del formulario hasta que se confirme.
    });

    // Función para ejecutar la petición AJAX
    // Función para ejecutar la petición AJAX
    function ejecutarAjax(form) {
        $.ajax({
            url: form.attr('action'),
            method: form.attr('method'),
            data: new FormData(form[0]), // Convertir a FormData
            processData: false, // Importante para FormData
            contentType: false, // Importante para FormData
            beforeSend: getBeforeSendCallback(form), // Manejo especial para beforeSend
            success: getCallback(form, 'hb-success', successDefault),
            error: getCallback(form, 'hb-error', errorDefault),
            complete: getCallback(form, 'hb-complete', completeDefault)
        });
    }

    // Función especial para manejar beforeSend
    function getBeforeSendCallback(form) {
        return function (jqXHR, settings) {
            const functionName = form.data('hb-before');
            if (typeof window[functionName] === 'function') {
                // Ejecuta la función personalizada con jqXHR, settings y form
                window[functionName](jqXHR, settings, form);
            } else {
                // Ejecuta la función por defecto con form
                beforeDefault(form);
            }
        };
    }

    // Función para obtener el callback adecuado (personalizado o por defecto)
    function getCallback(form, attribute, defaultCallback) {
        const functionName = form.data(attribute);
        return function (...args) {
            if (typeof window[functionName] === 'function') {
                // Ejecuta la función personalizada con los argumentos de jQuery AJAX y el formulario
                window[functionName](...args, form);
            } else {
                // Ejecuta la función por defecto con los argumentos de jQuery AJAX y el formulario
                defaultCallback(...args, form);
            }
        };
    }

    // Función por defecto que se ejecuta antes de enviar la petición
    function beforeDefault(form) {
        form.find('button').prop('disabled', true); // Deshabilita el botón de envío
        //Swal.showLoading(); // Muestra un loader de SweetAlert
    }

    // Función por defecto que se ejecuta en caso de éxito
    function successDefault(response, status, xhr, form) {
        toast({
            icon: tToast.success,
            title: 'Operación realizada correctamente'
        });
        if (!(form.attr("data-hb-close-modal") === "false")) {
            cerrarModal(form); // Cierra el modal que contiene el formulario
        }
    }

    // Función por defecto que se ejecuta en caso de error
    function errorDefault(xhr, status, error, form) {
        toastR({ title: "Error", msg: xhr.responseJSON?.message || 'Error en la solicitud' }); // Muestra una alerta de error
        cerrarModal(form); // Cierra el modal que contiene el formulario
    }

    // Función por defecto que se ejecuta al completar la petición
    function completeDefault(xhr, status, form) {
        form.find('button').prop('disabled', false); // Habilita el botón de envío
    }

    // Función para cerrar el modal que contiene el formulario
    function cerrarModal(form) {
        const modal = $(form).closest('.modal'); // Busca el modal más cercano al formulario
        if (modal.length) {
            // Ocultar cualquier modal abierto
            modal.modal('hide');
            modal.removeClass('show');
            modal.css('display', 'none'); // Corregido: usar css() en lugar de asignación directa
            // Eliminar la clase 'modal-open' del cuerpo para restablecer el estado de la interfaz
            $('body').removeClass('modal-open');
            // Eliminar los elementos de fondo de modal
            $('.modal-backdrop').remove();
            // Eliminar el padding-right que Bootstrap añade
            $('body').css('padding-right', '');
        }
    }
}

/**
 * Configuraciones predefinidas para diferentes tipos de acciones
 */
const actionPresets = {
    post: {
        successTitle: 'Registro Agregado',
        errorTitle: 'Error al Agregar',
        confirmTitle: '¿Deseas agregar este registro?',
        confirmText: 'Esta acción agregará un nuevo elemento',
        confirmColor: '#28a745', // Verde
        cancelColor: '#6c757d', // Gris
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar'
    },
    put: {
        successTitle: 'Registro Modificado',
        errorTitle: 'Error al Modificar',
        confirmTitle: '¿Deseas modificar este registro?',
        confirmText: 'Esta acción actualizará la información existente',
        confirmColor: '#17a2b8', // Azul cyan
        cancelColor: '#6c757d', // Gris
        confirmButtonText: 'Modificar',
        cancelButtonText: 'Cancelar'
    },
    delete: {
        successTitle: 'Registro Eliminado',
        errorTitle: 'Error al Eliminar',
        confirmTitle: '¿Estás seguro de eliminar?',
        confirmText: 'Esta acción no se puede deshacer',
        confirmColor: '#dc3545', // Rojo
        cancelColor: '#6c757d', // Gris
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
    }
};

/**
 * Inicializa el manejo de formularios AJAX con validación y confirmación personalizable.
 * @param {string} formSelector - Selector CSS del formulario (ej. '#formAjax')
 * @param {Object} options - Opciones de configuración opcional
 */
function initializeAjaxForm(formSelector, options = {}) {
    // Configuración por defecto
    const config = {
        successTitle: 'Operación exitosa',
        errorTitle: 'Ocurrió un error al enviar el formulario',
        confirmTitle: '¿Estás seguro?',
        confirmText: '¿Deseas enviar el formulario?',
        renderTarget: '#renderBody',
        ...options
    };

    // Seleccionar todos los formularios que coinciden con el selector
    $(formSelector).each(function () {
        const form = $(this)[0]; // Obtener el elemento DOM del objeto jQuery

        // Obtener la acción predefinida desde el atributo hb-action
        const actionType = $(form).attr("hb-action");
        const actionPreset = actionPresets[actionType] || {};

        // Personalización de títulos y mensajes desde atributos
        const successTitle = $(form).attr("hb-success-title") || actionPreset.successTitle || config.successTitle;
        const errorTitle = $(form).attr("hb-error-title") || actionPreset.errorTitle || config.errorTitle;
        const confirmTitle = $(form).attr("hb-confirm-title") || actionPreset.confirmTitle || config.confirmTitle;
        const confirmText = $(form).attr("hb-confirm-text") || actionPreset.confirmText || config.confirmText;

        // Personalización de colores de botones
        const confirmButtonColor = $(form).attr("hb-confirm-color") || actionPreset.confirmColor || '#4caf50';
        const cancelButtonColor = $(form).attr("hb-cancel-color") || actionPreset.cancelColor || '#d33';

        // Personalización de texto de botones
        const confirmButtonText = $(form).attr("hb-confirm-button-text") || actionPreset.confirmButtonText || 'Confirmar';
        const cancelButtonText = $(form).attr("hb-cancel-button-text") || actionPreset.cancelButtonText || 'Cancelar';

        // Obtener todos los elementos requeridos en el formulario
        const requiredElements = form.querySelectorAll('[data-val-required], [required]');

        if (requiredElements.length > 0) {
            // Mostrar una notificación sobre campos obligatorios
            toastR({
                title: "Los elementos marcados con <b style='color: red; font-size: x-large;'>*</b> son obligatorios.",
                type: tToast.info
            });

            requiredElements.forEach((element) => {
                // Obtener la etiqueta asociada al elemento, si existe
                const labelForElement = document.querySelector(`label[for="${element.id}"]:not(.label-not-required)`);
                if (labelForElement) {
                    labelForElement.classList.add('label-required'); // Marcar la etiqueta como requerida
                } else if (!element.id) {
                    // Mostrar una advertencia si el elemento requerido no tiene un atributo "id"
                    h.warn('Elemento con `data-val-required` no tiene un atributo "id":', element);
                }
            });
        }

        // Manejar el evento submit del formulario
        $(form).submit(function (event) {
            event.preventDefault(); // Evitar el envío automático del formulario

            // Obtener referencia al formulario desde el evento
            const submittedForm = event.target;

            // Ejecutar validación de jQuery Validate
            $(submittedForm).valid();

            // Obtener todos los elementos requeridos que están vacíos o son inválidos
            const elemInvalids = [...submittedForm.querySelectorAll('[data-val-required], [required]')].filter((element) =>
                !element.value.trim() ||
                (typeof isValidElement === 'function' && !isValidElement(element)) ||
                element.getAttribute("aria-invalid") === 'true'
            );

            if (elemInvalids.length > 0) {
                // Si hay elementos inválidos, mostrar un grupo de errores en la consola
                h.groupCollapsed('Campos Requeridos Inválidos:');
                elemInvalids.forEach((element, index) => {
                    // Obtener la etiqueta del elemento o usar el nombre del elemento como alternativa
                    const label = element.labels?.[0]?.textContent?.trim() || element.name?.trim() || 'Sin etiqueta';
                    h.error(`- ${label}`); // Mostrar el error en la consola

                    // Solo enfocar el primer campo inválido
                    if (index === 0) {
                        element.focus();
                    }
                });
                h.groupEnd();
                return false; // Prevenir el envío del formulario si hay errores
            }

            swalConfirmation({
                type: tToast.confirm, // Tipo de notificación
                title: confirmTitle,
                text: confirmText,
                options: {
                    buttons: {
                        cancel: {
                            show: true,
                            text: cancelButtonText,
                            color: cancelButtonColor
                        },
                        confirm: {
                            text: confirmButtonText,
                            color: confirmButtonColor
                        },
                        deny: {
                            show: false
                        }
                    },
                    onConfirm: function () {
                        // Mostrar indicador de carga
                        showLoadingAlert(true);

                        // Verificar si las funciones de validación están definidas y devuelven true
                        const canContinue = (
                            (typeof convertCase !== 'function' || convertCase()) &&
                            (typeof verifyIntlTelInput !== 'function' || verifyIntlTelInput())
                        );

                        if (canContinue) {
                            // Enviar el formulario usando AJAX
                            $.ajax({
                                url: $(submittedForm).attr('action'),
                                type: $(submittedForm).attr('method'),
                                data: new FormData(submittedForm), // Convertir a FormData
                                processData: false, // Crucial para FormData
                                contentType: false, // Crucial para FormData
                                success: function (response) {
                                    onSuccessAlert(config);
                                },
                                error: function (xhr, status, error) {
                                    // Manejar errores
                                    h.error("Error en la solicitud AJAX:", error);

                                    // Verificar si la respuesta contiene HTML
                                    let htmlContent = xhr.responseText;

                                    // Método 1: Usar un elemento div para asegurarse que se interprete como HTML
                                    let tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = htmlContent;
                                    htmlContent = tempDiv.innerHTML;

                                    // Mostrar alerta de error usando SweetAlert2
                                    Swal.fire({
                                        icon: 'error',
                                        title: errorTitle,
                                        html: htmlContent || 'Error desconocido',
                                        showConfirmButton: true
                                    });
                                },
                                complete: function () {
                                    // Asegurar que el indicador de carga se oculte en todos los casos
                                    showLoadingAlert(false);
                                }
                            });
                        } else {
                            // Si alguna validación falla, habilitar los botones de envío nuevamente
                            showLoadingAlert(false);
                            h.warn("Falló la validación de convertCase() o verifyIntlTelInput()");
                        }
                    }
                }
            });
        });
    });
}

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
        h.error('Se requiere un elemento form válido');
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
        // Define el método a llamar antes de iniciar la solicitud (mostrar carga)
        .attr("data-ajax-begin", "onBegin")
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

function initialFunctions(hbOptions = {}) {
    h("form[data-verify-form='true']").each(form => checkRequiredElements(form));

    // Agregar evento a todos los elementos editables
    h('input:not([data-exclude-apply]), select:not([data-exclude-apply]), textarea:not([data-exclude-apply]), [contenteditable]:not([data-exclude-apply])').on('keydown', handleEnterAsTab);

    // Llamar a la función para manejar la validación de inputs de tipo number
    handleNumberInput();

    // Aplicar atributos inicialmente
    applyAttributes();
    initImageUpload();

    initializeAjaxForm("form[hb-catalog]", hbOptions);
    inicializarFormulariosHbHbx("form[hb-hbx]");

    // Inicializa los elementos select2 en el contenido del modal
    onSelect2();
}

//#region Función utilityModal
/**
 * Muestra un modal de utilidad y ejecuta las acciones configuradas al cargar su contenido de manera asincrónica.
 * @param {string} urlOptions - URL desde donde se cargará el contenido del modal.
 * @param {function} actionCallBack - Función que se ejecutará luego de que el contenido del modal sea cargado.
 */
function utilityModal(urlOptions, actionCallBack, hbOptions = {}) {
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

            initialFunctions(hbOptions);

            // Muestra el modal después de cargar el contenido
            const modal = document.querySelector('#modal-overlay');

            if (modal) {
                // Muestra el modal utilizando Bootstrap si está disponible
                if (typeof bootstrap !== 'undefined') {
                    // Elimina cualquier backdrop existente antes de mostrar un nuevo modal
                    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

                    // Crea una instancia de Bootstrap Modal y la muestra
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();
                }

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

function onBegin() {

}

let alertLoading;
/**
 * Muestra una alerta de carga y deshabilita los botones de envío.
 * @param {boolean} [loading=true] - Indica si se debe mostrar el estado de carga (true) o no (false).
 */
function showLoadingAlert(loading = true) {
    // Si 'loading' es true, muestra el mensaje de "Cargando..." y deshabilita los botones de envío.
    if (loading) {
        // Mostrar un toast de carga con mensaje "Cargando..."
        alertLoading = toast({
            icon: tToast.info, // Ícono informativo
            position: tToasPosition.bottomStart, // Posición del toast
            title: "Cargando...", // Título del mensaje de carga
            timer: 10000 // Tiempo de espera del toast (10 segundos)
        });

        // Deshabilita todos los inputs y botones de tipo submit.
        h("input[type='submit'], button[type='submit']").attr("disabled", true);
    } else {
        if (alertLoading) {
            // Cerrar el toast de carga
            const toastInstance = toastMap.get(alertLoading); // Obtener la instancia del toast por su uuid
            if (toastInstance) {
                toastInstance.close(); // Cerrar el toast si está presente
                toastMap.delete(alertLoading); // Eliminar el uuid de la lista de toasts
            }
        }
        // Si 'loading' es false, habilita nuevamente los inputs y botones de tipo submit.
        h("input[type='submit'], button[type='submit']").removeAttr("disabled");
    }
}


/**
 * @function onSuccessAlert
 * @description Realiza una solicitud Ajax GET al servidor para obtener contenido parcial y actualizar la vista.
 *              Muestra una alerta de éxito utilizando SweetAlert2 tras una operación exitosa.
 * @returns {void}
 */
function onSuccessAlert(options) {
    // Obtener la URL actual (ruta completa)
    const currentPath = getFullPath();

    // Realizar una solicitud Ajax GET al servidor
    $.ajax({
        url: currentPath, // URL de la solicitud (ruta completa)
        type: 'GET', // Método HTTP a utilizar
        data: { isPartial: true }, // Datos enviados en la solicitud para indicar que es una carga parcial
        success: function (response) {
            // Reemplazar el contenido del elemento con id 'renderBody' con la respuesta del servidor
            $(options.renderTarget).html(response);

            // Ocultar cualquier modal abierto
            $('.modal').modal('hide');
            $('.modal').hide();

            // Eliminar la clase 'modal-open' del cuerpo para restablecer el estado de la interfaz
            $('body').removeClass('modal-open');
            // Eliminar los elementos de fondo de modal
            $('.modal-backdrop').remove();

            // Mostrar una alerta de éxito utilizando SweetAlert2
            Swal.fire({
                icon: 'success', // Tipo de icono a mostrar
                title: options.successTitle, // Título de la alerta
                text: options.successMsg, // Texto del mensaje de éxito
                showConfirmButton: false, // No mostrar el botón de confirmación
                timer: 1500 // Duración de la alerta en milisegundos
            });
        },
        error: function (e) {
            // Mostrar una alerta en caso de error en la solicitud Ajax
            alert('Error', e);
        }
    });
    return false;
}



function hideLoadingAlert() {
    showLoadingAlert(false);
    return false;
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
    h("*[data-disabled='true']")?.disabled(true);
    h("*[data-checked='true']")?.checked(true);
    h("*[data-readonly='true']")?.readonly(true);
    h("*[data-hidden='true']")?.hidden(true);
    h("*[data-interactive='false']")?.pointerEvents(false);
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
        h.error('El nombre de la función debe ser un string y la implementación debe ser una función.');
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

// Función para manejar el estado de una carta (solo para abrir)
function openCard(cardToOpen) {
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
                h.error('Error parsing function parameters:', error);
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


/**
 * Inicializa la funcionalidad de subida de imágenes con jQuery.
 *
 * Configura los manejadores de eventos para la carga de archivos mediante el input y el arrastrar-soltar,
 * actualizando la vista previa de la imagen y utilizando una imagen de marcador de posición cuando sea necesario.
 *
 * @function initImageUpload
 */
function initImageUpload() {
    const $uploadContainer = h('.hb-image-upload');
    // Contenedor principal que envuelve la subida y vista previa de la imagen.

    const $preview = $uploadContainer.find('.hb-image-preview');
    // Elemento que muestra la vista previa de la imagen.

    const $fileInput = $uploadContainer.find('input[type="file"]');
    // Elemento input para seleccionar archivos.

    const placeholderImage = $preview.data('placeholder');
    // Imagen de marcador de posición que se mostrará por defecto.

    let currentBlobUrl = null;
    // Variable para almacenar la URL del blob de la imagen actual.

    /**
     * Actualiza la vista previa de la imagen con la imagen proporcionada.
     *
     * Si se pasa un objeto Blob, se crea una URL para el mismo. Si ya hay una URL activa, se revoca para liberar recursos.
     *
     * @param {(string|Blob)} imageUrl - Fuente de la imagen, ya sea una URL o un objeto Blob.
     */
    function setImage(imageUrl) {
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
            // Revoca la URL previa para liberar memoria.
        }
        currentBlobUrl = imageUrl instanceof Blob ? URL.createObjectURL(imageUrl) : imageUrl;
        // Crea una URL para el Blob o utiliza la URL proporcionada.
        $preview.attr('src', currentBlobUrl);
        // Actualiza la propiedad src del elemento de vista previa.
    }

    /**
     * Restaura la imagen de vista previa a la imagen de marcador de posición.
     *
     * Revoca cualquier URL de blob activa y asigna la imagen placeholder.
     */
    function resetImage() {
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
            currentBlobUrl = null;
        }
        $preview.attr('src', placeholderImage);
    }

    resetImage();
    // Inicializa la vista previa con la imagen de marcador de posición.

    $fileInput.on('change', function (event) {
        // Detecta cuando se selecciona un archivo mediante el input.
        const file = event.target.files[0];
        if (file) {
            setImage(file);
        } else {
            resetImage();
        }
    });

    $preview.on('dragover', function (event) {
        const $label = $fileInput.next('label'); // Obtiene el label asociado al input
        if ($label.is(':hidden')) {
            event.preventDefault(); // Evita el comportamiento predeterminado
            return;
        }
        event.preventDefault();
        $preview.addClass('hb-dragover');
    });

    $preview.on('drop', function (event) {
        const $label = $fileInput.next('label'); // Obtiene el label asociado al input
        if ($label.is(':hidden')) {
            event.preventDefault(); // Evita la carga de archivos si el label está oculto
            return;
        }
        event.preventDefault();
        $preview.removeClass('hb-dragover');
        const file = event?.originalEvent?.dataTransfer?.files[0];
        if (file && file.type.startsWith('image/')) {
            setImage(file);
            $fileInput.prop('files', event.originalEvent.dataTransfer.files);
        }
    });
}

function initMultiHBFiles(fileInputId = 'hb-file-input', existingFiles = []) {
    // Obtener el elemento del DOM con el id 'hb-dropArea' (área donde se puede arrastrar y soltar archivos)
    const dropArea = document.getElementById('hb-dropArea');

    // Obtener el elemento del DOM con el id 'hb-file-input' (campo de entrada de archivos)
    const fileInput = document.getElementById(fileInputId);

    // Obtener el elemento del DOM con el id 'hb-selectFilesBtn' (botón para seleccionar archivos)
    const selectFilesBtn = document.getElementById('hb-selectFilesBtn');

    // Obtener el elemento del DOM con el id 'hb-previewContainer' (contenedor para mostrar la vista previa de los archivos)
    const previewContainer = document.getElementById('hb-previewContainer');

    // Obtener el elemento del DOM con el id 'hb-fullscreenModal' (modal que se abrirá en pantalla completa)
    const fullscreenModal = document.getElementById('hb-fullscreenModal');

    // Obtener el elemento del DOM con el id 'hb-modalContent' (contenido del modal)
    const modalContent = document.getElementById('hb-modalContent');

    // Obtener el elemento del DOM con el id 'hb-fileDetails' (detalles del archivo seleccionado)
    const fileDetails = document.getElementById('hb-fileDetails');

    // Obtener el elemento del DOM con el id 'hb-closeModal' (botón para cerrar el modal)
    const closeModal = document.getElementById('hb-closeModal');

    // Obtener el elemento del DOM con el id 'hb-dragHandle' (manejador de arrastre para mover el modal)
    const dragHandle = document.getElementById('hb-dragHandle');

    // Mantener un array de objetos File para gestionar todos los archivos
    // Este array almacenará todos los archivos seleccionados o arrastrados por el usuario.
    let uploadedFiles = [];

    // Mantener un registro de los archivos ya subidos para evitar duplicados
    // Usamos un Set para almacenar solo los identificadores únicos de los archivos subidos.
    let uploadedFileIds = new Set();

    // Añadir esta función para procesar archivos existentes
    function processExistingFiles() {
        if (!existingFiles || existingFiles.length === 0) return;

        existingFiles.forEach(fileInfo => {
            // Crear un objeto File a partir de la información proporcionada
            const lastModifiedDate = new Date(fileInfo.LastModified);

            // Crear un objeto Blob que simulará el archivo
            $.ajax({
                url: fileInfo?.url,
                method: 'GET',
                xhrFields: {
                    responseType: 'blob'
                },
                success: function(blob) {
                    const file = new File([blob], fileInfo.FileName, {
                        type: blob.type,
                        lastModified: lastModifiedDate.getTime()
                    });
            
                    const fileId = generateFileId(file);
            
                    if (!uploadedFileIds.has(fileId)) {
                        uploadedFiles.push(file);
                        uploadedFileIds.add(fileId);
                        displayFilePreview(file);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error(`Error al cargar el archivo existente ${fileInfo.FileName}:`, errorThrown);
                }
            });
            
            // fetch(fileInfo?.url)
            //     .then(response => response.blob())
            //     .then(blob => {
            //         // Crear un objeto File a partir del Blob
            //         const file = new File([blob], fileInfo.FileName, {
            //             type: blob.type,
            //             lastModified: lastModifiedDate.getTime()
            //         });

            //         // Generar ID y verificar si ya existe
            //         const fileId = generateFileId(file);

            //         if (!uploadedFileIds.has(fileId)) {
            //             // Añadir a la lista de archivos
            //             uploadedFiles.push(file);
            //             uploadedFileIds.add(fileId);

            //             // Mostrar la previsualización
            //             displayFilePreview(file);
            //         }
            //     })
            //     .catch(error => {
            //         console.error(`Error al cargar el archivo existente ${fileInfo.FileName}:`, error);
            //     });
        });

        // Actualizar el input después de procesar todos los archivos existentes
        setTimeout(updateFileInput, 500);
    }

    // Llamar a esta función después de definir todas las funciones necesarias
    processExistingFiles();

    // Evento para seleccionar archivos con botón
    // Al hacer clic en el botón 'selectFilesBtn', se simula un clic en el input de archivos para que el usuario pueda seleccionar un archivo.
    selectFilesBtn.addEventListener('click', function () {
        fileInput.click();
    });

    // Evento para manejar archivos seleccionados mediante input
    fileInput.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            // Convierte los archivos seleccionados en un array y los pasa a la función para manejarlos
            handleNewFiles(Array.from(e.target.files));
        }
    });

    // Eventos para arrastrar y soltar
    // Se añaden múltiples eventos ('dragenter', 'dragover', 'dragleave', 'drop') a 'dropArea' para prevenir comportamientos predeterminados del navegador
    // cuando el usuario arrastra y suelta archivos en el área designada.
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    // Función para prevenir el comportamiento predeterminado de los eventos relacionados con el arrastre y la caída
    /**
     * Previne el comportamiento predeterminado y detiene la propagación del evento.
     * @param {Event} e - El evento que se está manejando.
     */
    function preventDefaults(e) {
        e.preventDefault(); // Evita la acción predeterminada del navegador, como abrir los archivos arrastrados.
        e.stopPropagation(); // Detiene la propagación del evento para que no se dispare en otros elementos.
    }

    // Eventos para destacar el área de arrastre cuando el archivo está sobre ella
    // Se añaden eventos 'dragenter' y 'dragover' para destacar el área de arrastre.
    ['dragenter', 'dragover'].forEach((eventName) => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    // Eventos para eliminar el resaltado cuando el archivo deja de estar sobre el área de arrastre o se suelta
    // Se añaden eventos 'dragleave' y 'drop' para quitar el resaltado.
    ['dragleave', 'drop'].forEach((eventName) => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Función para resaltar el área de arrastre
    /**
     * Agrega la clase 'highlight' al área de arrastre cuando el archivo entra en la zona de caída.
     */
    function highlight() {
        dropArea.classList.add('highlight'); // Añade una clase CSS que resalta el área de arrastre.
    }

    // Función para quitar el resaltado del área de arrastre
    /**
     * Elimina la clase 'highlight' cuando el archivo sale del área de caída o se suelta.
     */
    function unhighlight() {
        dropArea.classList.remove('highlight'); // Elimina la clase CSS que resaltaba el área de arrastre.
    }

    // Manejar archivos soltados
    // Cuando el usuario suelta archivos en el área de arrastre, el evento 'drop' se dispara y se procesan los archivos.
    dropArea.addEventListener('drop', function (e) {
        const dt = e.dataTransfer; // Obtener los datos de la transferencia del evento.
        const files = dt.files; // Obtener los archivos del evento.

        // Añadir los archivos nuevos al array existente
        // Convierte los archivos de la transferencia en un array y los pasa a la función para manejarlos.
        handleNewFiles(Array.from(files));
    });

    // Función para cerrar el modal y restablecer posiciones
    /**
     * Cierra el modal y restablece las posiciones y estilos de los elementos dentro de él.
     * También habilita el desplazamiento del fondo al cerrar el modal.
     */
    function closeModalAndReset() {
        fullscreenModal.style.display = 'none'; // Oculta el modal al cambiar su estilo de display.

        modalContent.innerHTML = ''; // Limpiar contenido del modal al eliminar su HTML.

        // Restablecer posición del botón de cerrar
        closeModal.style.top = '15px'; // Coloca el botón de cerrar en la parte superior de 15px.
        closeModal.style.left = 'auto'; // Restablece la posición izquierda del botón de cerrar.
        closeModal.style.right = '15px'; // Coloca el botón de cerrar a 15px del borde derecho.

        // Restablecer detalles del archivo
        fileDetails.style.top = 'auto'; // Elimina cualquier valor top en el área de detalles del archivo.
        fileDetails.style.left = '0'; // Coloca el área de detalles del archivo en la parte izquierda.
        fileDetails.style.right = '0'; // Coloca el área de detalles del archivo en la parte derecha.
        fileDetails.style.bottom = '15px'; // Coloca el área de detalles del archivo 15px desde el fondo.

        // Rehabilitar scroll del fondo al cerrar el modal
        document.body.classList.remove('hb-body-no-scroll'); // Elimina la clase que bloquea el desplazamiento en el fondo.
    }

    // Función para implementar el arrastre del botón de cerrar modal
    /**
     * Permite que el botón de cerrar modal se pueda arrastrar dentro del modal.
     * Se gestiona tanto el arrastre con el mouse como con dispositivos táctiles.
     */
    function implementDragForCloseButton() {
        let isDragging = false; // Variable que indica si se está arrastrando el botón.
        let dragStartX = 0; // Coordenada X al iniciar el arrastre.
        let dragStartY = 0; // Coordenada Y al iniciar el arrastre.
        let offsetX = 0; // Desplazamiento X del botón respecto al punto de inicio.
        let offsetY = 0; // Desplazamiento Y del botón respecto al punto de inicio.
        const dragThreshold = 5; // Umbral para detectar si el movimiento es lo suficientemente grande como para considerar que se está arrastrando.

        // Evento para iniciar el arrastre con el mouse
        dragHandle.addEventListener('mousedown', function (e) {
            document.body.style.userSelect = 'none'; // Evita que el texto sea seleccionado mientras se arrastra el botón.

            isDragging = false; // Inicia el estado de arrastre.
            dragStartX = e.clientX; // Guarda la posición inicial del mouse en X.
            dragStartY = e.clientY; // Guarda la posición inicial del mouse en Y.

            const rect = closeModal.getBoundingClientRect(); // Obtiene el tamaño y posición del botón de cerrar.
            const containerRect = fullscreenModal.getBoundingClientRect(); // Obtiene el tamaño y posición del modal.

            offsetX = dragStartX - rect.left; // Calcula el desplazamiento en X.
            offsetY = dragStartY - rect.top; // Calcula el desplazamiento en Y.

            // Evento para mover el botón durante el arrastre
            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - dragStartX; // Calcula el movimiento en X.
                const dy = moveEvent.clientY - dragStartY; // Calcula el movimiento en Y.

                if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
                    // Si el movimiento es mayor que el umbral, se considera un arrastre.
                    isDragging = true;

                    // Calcula la nueva posición del botón dentro del modal, asegurándose de que no se salga de los límites.
                    const newLeft = Math.min(
                        Math.max(0, moveEvent.clientX - containerRect.left - offsetX), // Calcula la posición en X restringida.
                        containerRect.width - rect.width // Asegura que el botón no se salga del modal.
                    );
                    const newTop = Math.min(
                        Math.max(0, moveEvent.clientY - containerRect.top - offsetY), // Calcula la posición en Y restringida.
                        containerRect.height - rect.height // Asegura que el botón no se salga del modal.
                    );

                    closeModal.style.left = `${newLeft}px`; // Actualiza la posición en X del botón de cerrar.
                    closeModal.style.top = `${newTop}px`; // Actualiza la posición en Y del botón de cerrar.
                    closeModal.style.right = 'auto'; // Elimina cualquier valor de la propiedad 'right' del botón.
                }
            };

            // Evento para finalizar el arrastre con el mouse
            const onMouseUp = () => {
                if (!isDragging) {
                    closeModalAndReset(); // Si no se arrastró, se cierra el modal y se restablecen las posiciones.
                }

                // Elimina los eventos de movimiento y de levantamiento del mouse después de soltar el botón.
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                document.body.style.userSelect = ''; // Restaura la capacidad de seleccionar texto en el cuerpo del documento.
            };

            document.addEventListener('mousemove', onMouseMove); // Escucha el movimiento del mouse mientras se arrastra.
            document.addEventListener('mouseup', onMouseUp); // Escucha cuando se suelta el mouse.
        });

        // Soporte táctil para dispositivos móviles
        dragHandle.addEventListener('touchstart', function (e) {
            document.body.style.userSelect = 'none'; // Evita la selección de texto al tocar.

            if (e.touches.length !== 1) return; // Solo permite un toque para evitar conflictos con múltiples toques.

            isDragging = false;
            dragStartX = e.touches[0].clientX; // Guarda la posición inicial del toque en X.
            dragStartY = e.touches[0].clientY; // Guarda la posición inicial del toque en Y.

            const rect = closeModal.getBoundingClientRect(); // Obtiene el tamaño y posición del botón de cerrar.
            const containerRect = fullscreenModal.getBoundingClientRect(); // Obtiene el tamaño y posición del modal.

            offsetX = dragStartX - rect.left; // Calcula el desplazamiento en X.
            offsetY = dragStartY - rect.top; // Calcula el desplazamiento en Y.

            // Evento para mover el botón durante el arrastre táctil
            const onTouchMove = (moveEvent) => {
                const dx = moveEvent.touches[0].clientX - dragStartX; // Calcula el movimiento en X.
                const dy = moveEvent.touches[0].clientY - dragStartY; // Calcula el movimiento en Y.

                if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
                    // Si el movimiento supera el umbral, se considera arrastre.
                    isDragging = true;

                    const newLeft = Math.min(
                        Math.max(
                            0,
                            moveEvent.touches[0].clientX - containerRect.left - offsetX
                        ), // Calcula la posición en X restringida.
                        containerRect.width - rect.width // Asegura que el botón no se salga del modal.
                    );
                    const newTop = Math.min(
                        Math.max(
                            0,
                            moveEvent.touches[0].clientY - containerRect.top - offsetY
                        ), // Calcula la posición en Y restringida.
                        containerRect.height - rect.height // Asegura que el botón no se salga del modal.
                    );

                    closeModal.style.left = `${newLeft}px`; // Actualiza la posición en X del botón de cerrar.
                    closeModal.style.top = `${newTop}px`; // Actualiza la posición en Y del botón de cerrar.
                    closeModal.style.right = 'auto'; // Elimina la propiedad 'right' del botón.
                }
            };

            // Evento para finalizar el arrastre táctil
            const onTouchEnd = () => {
                if (!isDragging) {
                    closeModalAndReset(); // Si no se arrastró, cierra el modal y restablece las posiciones.
                }

                // Elimina los eventos de movimiento y de finalización del toque después de soltar el dedo.
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);

                document.body.style.userSelect = ''; // Restaura la selección de texto.
            };

            document.addEventListener('touchmove', onTouchMove, { passive: false }); // Escucha el movimiento táctil.
            document.addEventListener('touchend', onTouchEnd); // Escucha cuando se suelta el toque.
        });
    }

    // Implementar funcionalidad para el botón de cerrar
    // Llama a la función que permite arrastrar el botón de cerrar dentro del modal.
    implementDragForCloseButton();

    /**
     * Genera un ID único para un archivo basado en su nombre, tamaño y última fecha de modificación.
     * Este ID se usa para identificar archivos de manera única.
     *
     * @param {File} file - El archivo al que se le generará el ID.
     * @returns {string} - El ID único generado para el archivo.
     */
    function generateFileId(file) {
        return `${file.name}-${file.size}-${file.lastModified}`;
    }

    /**
     * Maneja los archivos nuevos que son agregados. Filtra los archivos que ya han sido cargados
     * previamente y actualiza la lista de archivos subidos y las vistas previas.
     *
     * @param {File[]} newFiles - Array de nuevos archivos que han sido seleccionados.
     */
    // Reemplaza la función handleNewFiles con esta versión
    function handleNewFiles(newFiles) {
        if (!newFiles.length) return;

        // Filtrar solo los archivos que no estén ya añadidos
        const uniqueNewFiles = newFiles.filter((file) => {
            const fileId = generateFileId(file);
            if (!uploadedFileIds.has(fileId)) {
                uploadedFileIds.add(fileId);
                return true;
            }
            return false;
        });

        if (uniqueNewFiles.length === 0) return; // No hay archivos nuevos para añadir

        // Añadir al array de archivos
        uploadedFiles = [...uploadedFiles, ...uniqueNewFiles];

        // Actualizar las vistas previas solo para los nuevos archivos
        uniqueNewFiles.forEach((file) => {
            displayFilePreview(file);
        });

        // Actualizar el input con todos los archivos
        updateFileInput();
    }

    // Función para sincronizar uploadedFiles con el input de archivo
    function updateFileInput() {
        try {
            const dataTransfer = new DataTransfer();

            // Agregar cada archivo al objeto DataTransfer
            uploadedFiles.forEach(file => {
                dataTransfer.items.add(file);
            });

            // Asignar los archivos al input
            fileInput.files = dataTransfer.files;

            h.log(`Input actualizado con ${fileInput.files.length} archivos.`);
        } catch (error) {
            h.error("Error al actualizar el input de archivo:", error);
        }
    }

    /**
     * Muestra la previsualización de un archivo, que incluye su nombre, tipo,
     * y un botón de eliminación. Si el archivo es previsualizable, también se
     * agrega un botón para verlo en pantalla completa.
     *
     * @param {File} file - El archivo para el que se desea mostrar una previsualización.
     */
    function displayFilePreview(file) {
        const fileId = generateFileId(file);

        const previewItem = document.createElement('div');
        previewItem.className = 'hb-preview-item';
        previewItem.id = `hb-preview-${fileId}`;
        previewItem.dataset.filename = file.name;

        // Crear botón de eliminación
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'hb-delete-button';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation(); // Evitar que se abra la previsualización al eliminar

            // Eliminar del array de archivos
            uploadedFiles = uploadedFiles.filter((f) => generateFileId(f) !== fileId);

            // Eliminar del registro de archivos subidos
            uploadedFileIds.delete(fileId);

            // Eliminar la previsualización
            previewItem.remove();

            // Actualizar el input después de eliminar un archivo
            updateFileInput();
        });
        previewItem.appendChild(deleteBtn);

        // Determinar si el archivo es previsualizable
        const isPreviewable = isFilePreviewable(file);

        // Crear botón de pantalla completa solo si es previsualizable
        if (isPreviewable) {
            const fullscreenBtn = document.createElement('button');
            fullscreenBtn.type = 'button';
            fullscreenBtn.className = 'hb-fullscreen-button';
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            fullscreenBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                showFullScreenPreview(file);
            });
            previewItem.appendChild(fullscreenBtn);
        } else {
            // Crear botón de descarga si no es previsualizable
            const downloadBtn = document.createElement('a');
            downloadBtn.className = 'hb-fullscreen-button'; // Reutilizamos el mismo estilo
            downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
            downloadBtn.href = URL.createObjectURL(file);
            downloadBtn.download = file.name;
            downloadBtn.addEventListener('click', function (e) {
                e.stopPropagation(); // Evita que se dispare el click del previewItem
            });
            previewItem.appendChild(downloadBtn);
        }

        // Determinar el tipo de previsualización
        let previewContent;

        if (file.type.startsWith('image/')) {
            // Para imágenes
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            previewContent = img;
        } else {
            // Para otros tipos de archivo
            const fileIcon = document.createElement('div');
            fileIcon.className = 'hb-file-icon';

            let iconClass = 'fas fa-file';

            // Detectar tipo de archivo y asignar icono correspondiente
            if (file.type.includes('pdf')) {
                iconClass = 'fas fa-file-pdf';
            } else if (
                file.type.includes('word') ||
                file.name.endsWith('.doc') ||
                file.name.endsWith('.docx')
            ) {
                iconClass = 'fas fa-file-word';
            } else if (
                file.type.includes('excel') ||
                file.name.endsWith('.xls') ||
                file.name.endsWith('.xlsx')
            ) {
                iconClass = 'fas fa-file-excel';
            } else if (file.type.includes('video')) {
                iconClass = 'fas fa-file-video';
            } else if (file.type.includes('audio')) {
                iconClass = 'fas fa-file-audio';
            } else if (
                file.type.includes('zip') ||
                file.type.includes('rar') ||
                file.type.includes('archive')
            ) {
                iconClass = 'fas fa-file-archive';
            } else if (file.type.includes('text')) {
                iconClass = 'fas fa-file-alt';
            }

            const icon = document.createElement('i');
            icon.className = iconClass;
            fileIcon.appendChild(icon);

            const fileTypeName = document.createElement('span');
            fileTypeName.textContent = getSimpleFileType(file);
            fileIcon.appendChild(fileTypeName);

            previewContent = fileIcon;
        }

        previewItem.appendChild(previewContent);

        // Agregar nombre del archivo
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        previewItem.appendChild(fileName);

        // Evento de click para vista previa completa solo si es previsualizable
        if (isPreviewable) {
            previewItem.addEventListener('click', function () {
                showFullScreenPreview(file);
            });
        } else {
            // Descargar el archivo al hacer clic en el preview
            previewItem.addEventListener('click', function () {
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(file);
                downloadLink.download = file.name;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            });
        }

        previewContainer.appendChild(previewItem);
    }

    /**
     * Verifica si un archivo es previsualizable en el navegador.
     * Los tipos previsualizables son imágenes, PDFs, videos, audios y texto.
     *
     * @param {File} file - El archivo a verificar.
     * @returns {boolean} - `true` si el archivo es previsualizable, `false` si no lo es.
     */
    function isFilePreviewable(file) {
        const previewableTypes = [
            'image/',
            'application/pdf',
            'video/',
            'audio/',
            'text/',
        ];

        return previewableTypes.some((type) => file.type.startsWith(type));
    }

    /**
     * Obtiene un tipo de archivo simplificado para mostrar, como 'PDF', 'WORD', 'EXCEL', etc.
     *
     * @param {File} file - El archivo cuyo tipo se desea simplificar.
     * @returns {string} - El tipo de archivo simplificado.
     */
    function getSimpleFileType(file) {
        if (file.type) {
            const parts = file.type.split('/');
            if (parts.length > 1) {
                return parts[1].toUpperCase();
            }
            return parts[0].toUpperCase();
        }

        // Si no tiene tipo MIME, intentar determinar por extensión
        const ext = file.name.split('.').pop().toLowerCase();

        const extensionMap = {
            pdf: 'PDF',
            doc: 'WORD',
            docx: 'WORD',
            xls: 'EXCEL',
            xlsx: 'EXCEL',
            ppt: 'POWERPOINT',
            pptx: 'POWERPOINT',
            zip: 'ZIP',
            rar: 'RAR',
            txt: 'TEXT',
        };

        return extensionMap[ext] || 'FILE';
    }

    // Función para mostrar la previsualización en pantalla completa
    /**
     * Muestra una vista previa en pantalla completa de un archivo.
     * Dependiendo del tipo de archivo, la previsualización puede incluir una imagen, un PDF, un video, un audio o un archivo de texto.
     * Si el archivo no es previsualizable, se ofrece la opción de abrirlo en una nueva ventana.
     *
     * @param {File} file El archivo que se desea previsualizar.
     */
    function showFullScreenPreview(file) {
        // Limpiar contenido anterior
        modalContent.innerHTML = '';

        // Reiniciar posición del botón de cerrar
        closeModal.style.top = '15px';
        closeModal.style.left = 'auto';
        closeModal.style.right = '15px';

        // Reiniciar posición de los detalles del archivo
        fileDetails.style.top = 'auto';
        fileDetails.style.left = '0';
        fileDetails.style.right = '0';
        fileDetails.style.bottom = '15px';

        // Mostrar detalles del archivo (nombre y tamaño)
        fileDetails.textContent = `${file.name} (${formatFileSize(file.size)})`;

        // Crear previsualización según el tipo de archivo
        if (file.type.startsWith('image/')) {
            // Si es una imagen
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file); // Crear una URL para la imagen
            modalContent.appendChild(img); // Agregar la imagen al contenido del modal
        } else if (file.type === 'application/pdf') {
            // Si es un archivo PDF
            const pdfContainer = document.createElement('div');
            pdfContainer.className = 'hb-pdf-container';

            const iframe = document.createElement('iframe');
            iframe.src = URL.createObjectURL(file); // Crear una URL para el PDF
            pdfContainer.appendChild(iframe); // Agregar el iframe con el PDF al contenedor
            modalContent.appendChild(pdfContainer); // Agregar el contenedor al modal

        } else if (file.type.startsWith('video/')) {
            // Si es un archivo de video
            const video = document.createElement('video');
            video.controls = true; // Habilitar controles de reproducción
            video.autoplay = false; // No reproducir automáticamente
            video.style.maxWidth = '95%';
            video.style.maxHeight = '95%';

            const source = document.createElement('source');
            source.src = URL.createObjectURL(file); // Crear una URL para el archivo de video
            source.type = file.type; // Establecer el tipo MIME del archivo de video

            video.appendChild(source); // Agregar el archivo de video al elemento video
            modalContent.appendChild(video); // Agregar el video al contenido del modal
        } else if (file.type.startsWith('audio/')) {
            // Si es un archivo de audio
            const audioContainer = document.createElement('div');
            audioContainer.style.width = '80%';
            audioContainer.style.maxWidth = '600px';
            audioContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            audioContainer.style.padding = '20px';
            audioContainer.style.borderRadius = '10px';

            const audio = document.createElement('audio');
            audio.controls = true; // Habilitar controles de audio
            audio.style.width = '100%';

            const source = document.createElement('source');
            source.src = URL.createObjectURL(file); // Crear una URL para el archivo de audio
            source.type = file.type; // Establecer el tipo MIME del archivo de audio

            audio.appendChild(source); // Agregar el archivo de audio al elemento de audio
            audioContainer.appendChild(audio); // Agregar el audio al contenedor
            modalContent.appendChild(audioContainer); // Agregar el contenedor al modal
        } else if (file.type.startsWith('text/')) {
            // Si es un archivo de texto
            const textContainer = document.createElement('div');
            textContainer.style.width = '90%';
            textContainer.style.height = '90%';
            textContainer.style.backgroundColor = 'white';
            textContainer.style.padding = '20px';
            textContainer.style.borderRadius = '8px';
            textContainer.style.overflow = 'auto';

            const reader = new FileReader();
            reader.onload = function (e) {
                const content = document.createElement('pre');
                content.style.textAlign = 'left';
                content.style.whiteSpace = 'pre-wrap';
                content.style.wordBreak = 'break-word';
                content.textContent = e.target.result; // Contenido del archivo de texto
                textContainer.appendChild(content); // Agregar el contenido al contenedor
            };
            reader.readAsText(file); // Leer el archivo como texto

            modalContent.appendChild(textContainer); // Agregar el contenedor al modal
        } else {
            // Para archivos no previsualizables, ofrecer opción para abrir en una nueva ventana
            const notPreviewableContainer = document.createElement('div');
            notPreviewableContainer.className = 'hb-file-preview';

            const message = document.createElement('p');
            message.textContent =
                'Este tipo de archivo no se puede previsualizar directamente en el navegador.';
            message.style.marginBottom = '20px';
            notPreviewableContainer.appendChild(message);

            // Botón para abrir en nueva ventana (si es posible)
            const openButton = document.createElement('button');
            openButton.type = 'button';
            openButton.className = 'hb-external-open-button';
            openButton.innerHTML =
                '<i class="fas fa-external-link-alt"></i> Abrir en nueva ventana';
            openButton.addEventListener('click', function () {
                const fileUrl = URL.createObjectURL(file); // Crear una URL para el archivo
                window.open(fileUrl, '_blank'); // Abrir el archivo en una nueva ventana
            });
            notPreviewableContainer.appendChild(openButton);

            modalContent.appendChild(notPreviewableContainer); // Agregar el contenedor al modal
        }

        // Bloquear el scroll del fondo al mostrar el modal
        document.body.classList.add('hb-body-no-scroll');

        // Mostrar modal
        fullscreenModal.style.display = 'flex';
    }

    /**
     * Función para formatear el tamaño del archivo en unidades legibles (KB, MB, GB, etc.)
     * @param {number} bytes - El tamaño del archivo en bytes.
     * @returns {string} El tamaño del archivo formateado (Ejemplo: '1.25 MB').
     */
    function formatFileSize(bytes) {
        // Si el tamaño es 0, se devuelve '0 Bytes'
        if (bytes === 0) return '0 Bytes';

        // Array de unidades de tamaño de archivo
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        // Determinar el índice de la unidad correspondiente al tamaño de bytes
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        // Retorna el tamaño del archivo formateado con dos decimales y la unidad correspondiente
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Función para obtener los archivos actualmente subidos.
     * @returns {Array} Un array con los archivos cargados.
     */
    window.getUploadedFiles = function () {
        return uploadedFiles; // Retorna la variable global de archivos subidos
    };

    // Hacer que el detalle del archivo en el modal sea arrastrable
    makeElementDraggable(fileDetails);

    /**
     * Función para hacer que un elemento sea arrastrable solo verticalmente.
     * @param {HTMLElement} element - El elemento HTML que se hará arrastrable.
     */
    function makeElementDraggable(element) {
        let isDragging = false; // Estado para saber si estamos arrastrando
        let offsetY; // Distancia del puntero del mouse a la parte superior del elemento

        // Detectar cuando se presiona el mouse sobre el elemento
        element.addEventListener('mousedown', function (e) {
            isDragging = true; // Indicamos que estamos en el proceso de arrastrar
            offsetY = e.clientY - element.getBoundingClientRect().top; // Calculamos el desplazamiento inicial
            e.preventDefault(); // Prevenimos el comportamiento por defecto del navegador
        });

        // Detectar el movimiento del mouse
        document.addEventListener('mousemove', function (e) {
            // Solo movemos el elemento si está siendo arrastrado
            if (isDragging && element === document.getElementById('hb-fileDetails')) {
                const y = e.clientY - offsetY; // Calcular la nueva posición en el eje Y

                // Limitar el movimiento verticalmente para que el elemento no se salga de la ventana
                const maxY = window.innerHeight - element.offsetHeight;

                element.style.bottom = 'auto'; // Asegura que top funcione correctamente
                element.style.top = `${Math.min(Math.max(0, y), maxY)}px`; // Establece la nueva posición en Y dentro de los límites
            }
        });

        // Detectar cuando se suelta el botón del mouse
        document.addEventListener('mouseup', function () {
            isDragging = false; // Dejar de arrastrar
        });

        // Soporte para dispositivos táctiles (para pantallas táctiles)
        element.addEventListener('touchstart', function (e) {
            isDragging = true; // Indicamos que estamos arrastrando
            offsetY = e.touches[0].clientY - element.getBoundingClientRect().top; // Distancia del toque a la parte superior del elemento
            e.preventDefault(); // Prevenimos el comportamiento por defecto
        });

        document.addEventListener(
            'touchmove',
            function (e) {
                // Solo movemos el elemento si está siendo arrastrado
                if (isDragging && element === document.getElementById('hb-fileDetails')) {
                    const y = e.touches[0].clientY - offsetY; // Calcular la nueva posición en el eje Y

                    // Limitar el movimiento verticalmente para que el elemento no se salga de la ventana
                    const maxY = window.innerHeight - element.offsetHeight;

                    element.style.bottom = 'auto'; // Asegura que top funcione correctamente
                    element.style.top = `${Math.min(Math.max(0, y), maxY)}px`; // Establece la nueva posición en Y dentro de los límites
                }
            },
            { passive: false } // Para evitar que la acción predeterminada de desplazamiento afecte el movimiento
        );

        // Detectar cuando se suelta el toque en dispositivos táctiles
        document.addEventListener('touchend', function () {
            isDragging = false; // Dejar de arrastrar
        });
    }

    // Modificar el estilo de 'fileDetails' para que sea más claro que se puede arrastrar
    fileDetails.style.cursor = 'ns-resize'; // Cambiar el cursor para indicar que se puede redimensionar en el eje vertical
    fileDetails.style.zIndex = '102'; // Asegurar que el elemento esté por encima de otros elementos en la pantalla
}


// Cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", function () {
    try {
        initialFunctions();
    } catch (e) {
        h.error(e);
    }
});