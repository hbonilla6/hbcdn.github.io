function inicializarFormulariosHbHbx(formSelector) {
  // Obtiene todos los elementos requeridos en el formulario.
  const requiredElements = h(formSelector)
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
  $(formSelector).off('submit').on('submit', function (e) {
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

    // ⚠️ Si el formulario tiene el atributo personalizado `d-cv`, ejecutar directamente:
    if (this.hasAttribute("d-cv")) {
      addCurrentPathToForm(this);
      ejecutarAjax(form);
      return false;
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
        addCurrentPathToForm(form[0]);
        ejecutarAjax(form);
      } else {
        toast({ title: '&#161;Acci&oacute;n cancelada!', icon: tToast.info });
      }
    });

    return false; // Previene el envío del formulario hasta que se confirme.
  });

  // Método 1: Imprimir todos los valores de FormData
  function mostrarValoresFormData(formData) {
    console.log("Contenido de FormData:");

    // Iterar sobre todas las entradas del FormData
    for (let par of formData.entries()) {
      console.log(par[0] + ": " + par[1]);
    }
  }

  // Método 2: Obtener los valores como objeto
  function formDataToObject(formData) {
    const objeto = {};

    formData.forEach((valor, clave) => {
      // Manejo de campos múltiples (como checkboxes)
      if (objeto[clave]) {
        if (!Array.isArray(objeto[clave])) {
          objeto[clave] = [objeto[clave]];
        }
        objeto[clave].push(valor);
      } else {
        objeto[clave] = valor;
      }
    });

    return objeto;
  }

  // Modificación de tu función para mostrar los valores
  function ejecutarAjax(form) {
 if (form.is('[d-cv]')) {
    showLoadingAlert(false);
} else {
    showLoadingAlert(true);
}

    

    const dataForm = new FormData(form[0]);

    // Mostrar valores usando el Método 1
    mostrarValoresFormData(dataForm);

    // Mostrar valores como objeto usando el Método 2
    const formDataComoObjeto = formDataToObject(dataForm);
    h.log("FormData como objeto:", formDataComoObjeto);

    // Continuar con la petición AJAX
    $.ajax({
      url: form.attr('action'),
      method: form.attr('method'),
      data: dataForm,
      processData: false,
      contentType: false,
      beforeSend: getBeforeSendCallback(form),
      success: getCallback(form, 'hb-success', handleSuccessMessageOnly),
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

  function getCallback(form, attribute, defaultCallback) {
    const functionName = form.data(attribute);
    console.log('Buscando función:', functionName, 'en window:', typeof window[functionName]);

    return function (...args) {
      if (typeof window[functionName] === 'function') {
        console.log('Ejecutando función personalizada');
        window[functionName](...args, form);
      } else {
        console.log('Ejecutando función por defecto');
        defaultCallback(...args, form);
      }
    };
  }

  // Función por defecto que se ejecuta antes de enviar la petición
  function beforeDefault(form) {
    form.find('button').prop('disabled', true); // Deshabilita el botón de envío
    //Swal.showLoading(); // Muestra un loader de SweetAlert
  }

  /**
 * Function executed when the request is successful.
 * Displays a toast message, hides modals, and resets UI states.
 * @param {Object} response - The response returned by the server.
 * @param {string} status - The status of the request.
 * @param {XMLHttpRequest} xhr - The XMLHttpRequest object.
 * @param {jQuery} form - The form that was submitted.
 */
  function handleSuccessMessageOnly(response, status, xhr, form) {
    // Ocultar cualquier modal abierto
    $('.modal').modal('hide');
    $('.modal').hide();

    // Eliminar la clase 'modal-open' del cuerpo para restablecer el estado de la interfaz
    $('body').removeClass('modal-open');
    // Eliminar los elementos de fondo de modal
    $('.modal-backdrop').remove();

    showLoadingAlert(false);

    // Mostrar una alerta de éxito utilizando SweetAlert2
    Swal.fire({
      icon: 'success', // Tipo de icono a mostrar
      title: 'Operación completada con éxito', // Título de la alerta
      showConfirmButton: false, // No mostrar el botón de confirmación
      timer: 1500 // Duración de la alerta en milisegundos
    });
  }
  /**
   * @function showNotification
   * @description Muestra notificaciones al usuario usando SweetAlert o alert como respaldo
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación (success, error, info, etc.)
   */
  window.showNotification = function (message, type = 'info') {
    // Verifica si existe la librería SweetAlert
    if (typeof Swal !== 'undefined') {
      // Configura y muestra una notificación tipo toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      Toast.fire({
        icon: type,
        title: message
      });
    } else {
      // Si no existe SweetAlert, usa alert como respaldo
      alert(message);
    }
  }

  function closeModalAndRemoveBackdrop(modalId) {
    const $modal = $(modalId);

    const onHidden = () => {
      const modalsOpen = $('.modal.show').length;
      const backdrops = $('.modal-backdrop.fade.show');

      // Si hay más backdrops que modales abiertos, eliminamos los sobrantes (del final al principio)
      const excess = backdrops.length - modalsOpen;
      if (excess > 0) {
        backdrops.slice(-excess).remove();
      }

      // Si ya no quedan modales abiertos, limpiamos body
      if (modalsOpen === 0) {
        $('body').removeClass('modal-open');
        $('body').css('padding-right', '');
      }

      // Desvinculamos este listener
      $modal.off('hidden.bs.modal', onHidden);
    };

    $modal.on('hidden.bs.modal', onHidden);
    $modal.modal('hide');
  }




  window.handleSuccessCloseModal3 = function () {
    closeModalAndRemoveBackdrop('#modal-overlay3');
    // Muestra mensaje de éxito
    showNotification('Operación completada con éxito', 'success');
  }

  /**
   * Function executed on success, only shows a success alert without UI cleanup.
   */
  window.handleSuccessCatalogo = function () {
    // Trigger a custom success alert rendering in a specific DOM element
    onSuccessAlert({
      successTitle: 'Operación completada con éxito',
      renderTarget: '#renderBody'
    });
  };

  function errorDefault(xhr, status, error, form) {
    showLoadingAlert(false);

    cerrarModal(form);

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
      html: htmlContent || 'Error desconocido',
      showConfirmButton: true
    });
  }
  // // Función por defecto que se ejecuta en caso de error
  // function errorDefault(xhr, status, error, form) {
  //   toastR({ title: "Error", msg: xhr.responseJSON?.message || 'Error en la solicitud' }); // Muestra una alerta de error
  //   cerrarModal(form); // Cierra el modal que contiene el formulario
  // }

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
    showLoadingAlert(false);
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
 */
function initializeAjaxForm(formSelector) {
  // Configuración por defecto
  const config = {
    successTitle: 'Operación exitosa',
    errorTitle: 'Ocurrió un error al enviar el formulario',
    confirmTitle: '¿Estás seguro?',
    confirmText: '¿Deseas enviar el formulario?',
    renderTarget: '#renderBody'
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
 * Convierte un valor a un número decimal con precisión, controlando errores comunes.
 *
 * @param {any} value - El valor que se desea convertir a decimal.
 * @param {number} [defaultValue=0] - Valor de retorno si `value` no es numérico o no se puede convertir.
 * @param {number} [decimals=2] - Número de decimales a los que se debe redondear (mínimo 0).
 * @returns {number} - Número redondeado con la precisión especificada.
 */
function toDecimal(value, defaultValue = 0, decimals = 2) {
  // Asegura que `decimals` sea un entero no negativo
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 2;

  // Intenta convertir el valor a número
  const num = parseFloat(value);

  // Si no es un número válido, usa el valor por defecto
  if (isNaN(num)) {
    return Number(
      defaultValue.toExponential
        ? Math.round(defaultValue + 'e' + safeDecimals) + 'e-' + safeDecimals
        : defaultValue
    );
  }

  // Usa notación exponencial para evitar errores con decimales
  return Number(Math.round(num + 'e' + safeDecimals) + 'e-' + safeDecimals);
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
          if (tag.id === "modalContent" || tag.id === "modalContent2" || tag.id === "modalContent3") {
            // Si es un modal (DIV con id "modalContent"), mostrar un ícono de carga
            tag.innerHTML = `<div class="overlay"><i class="fas fa-2x fa-sync fa-spin"></i></div><div class="modal-header"><h4 class="modal-title">Cargando...</h4></div>`;
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

function initialFunctions() {
  h("form[data-verify-form='true']").each(form => checkRequiredElements(form));

  // Agregar evento a todos los elementos editables
  h('input:not([data-exclude-apply]), select:not([data-exclude-apply]), textarea:not([data-exclude-apply]), [contenteditable]:not([data-exclude-apply])').on('keydown', handleEnterAsTab);

  // Llamar a la función para manejar la validación de inputs de tipo number
  handleNumberInput();

  // Aplicar atributos inicialmente
  applyAttributes();
  initImageUpload();

  initializeAjaxForm("form[hb-catalog]");
  inicializarFormulariosHbHbx("form[hb-hbx]");

  // Inicializa los elementos select2 en el contenido del modal
  onSelect2();

  generatehbqrs();
}

//#region Función utilityModal
/**
 * Muestra un modal de utilidad y ejecuta las acciones configuradas al cargar su contenido de manera asincrónica.
 * @param {string} urlOptions - URL desde donde se cargará el contenido del modal.
 * @param {function} actionCallBack - Función que se ejecutará luego de que el contenido del modal sea cargado.
 * @param {string} containerId - ID del contenedor del contenido del modal (por defecto: 'modalContent').
 */
function utilityModal(urlOptions, actionCallBack, containerId = 'modalContent') {
  // Realiza una solicitud asincrónica para cargar contenido en un contenedor
  requestAsync({
    url: urlOptions,
    id: containerId,
    callback: () => {
      h.info('completed utility modal');
      initialFunctions();

      const container = document.getElementById(containerId);
      const modal = container?.closest('.modal');

      if (!modal) {
        h.warn(`Modal element not found for container ID "${containerId}"`);
        return;
      }

      // Si Bootstrap está disponible
      if (typeof bootstrap !== 'undefined') {
        // Verificación mejorada: revisar tanto display calculado como clase show
        const isVisible = window.getComputedStyle(modal).display !== 'none' &&
          modal.classList.contains('show') &&
          document.querySelector('.modal-backdrop') !== null;

        if (!isVisible) {
          // Limpia cualquier estado inconsistente del modal
          cleanModalState(modal);

          // Crea y muestra el modal usando Bootstrap
          const bootstrapModal = new bootstrap.Modal(modal);
          bootstrapModal.show();

          h.info('Modal shown successfully');
        } else {
          h.info('Modal already visible; skipping show()');
        }
      } else {
        h.warn('Bootstrap is not available');
      }

      // Enfocar primer campo disponible
      const firstInput = modal.querySelector(
        'input[type="text"]:not([type="hidden"]):not([disabled]), textarea:not([disabled])'
      );

      if (firstInput) {
        firstInput.focus();
        if (firstInput.setSelectionRange) {
          const length = firstInput.value.length;
          firstInput.setSelectionRange(length, length);
        }
        firstInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        h.warn('No focusable elements found in form');
      }

      // Aplicar validaciones unobtrusive de jQuery
      if (typeof $.validator !== 'undefined' && $.validator.unobtrusive) {
        $.validator.unobtrusive.parse(`#${containerId}`);
      }

      // Ejecutar el callback si está definido
      if (typeof actionCallBack === 'function') {
        actionCallBack();
      }
    }
  });
}

/**
 * Limpia el estado inconsistente del modal
 * @param {HTMLElement} modalElement - Elemento del modal a limpiar
 */
function cleanModalState(modalElement) {
  // Elimina cualquier backdrop anterior
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

  // Si hay clases inconsistentes, las limpia
  if (modalElement.classList.contains('show') &&
    window.getComputedStyle(modalElement).display === 'none') {
    modalElement.classList.remove('show');
    modalElement.style.display = '';
    modalElement.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('overflow');
  }
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
 * Muestra una alerta de carga animada con círculos rebotando y texto con puntos secuenciales.
 * @param {boolean} [loading=true] - Indica si se debe mostrar el estado de carga (true) o no (false).
 */
function showLoadingAlert(loading = true) {
  if (loading) {
    // Mostrar SweetAlert con ambas animaciones usando etiquetas semánticamente correctas
    alertLoading = Swal.fire({
      html: `
        <div class="loading-container">
          <p class="loading-text">Cargando<span class="dots"></span></p>
          <div class="loading-animation">
            <div class="spinner">
              <div class="bounce1"></div>
              <div class="bounce2"></div>
              <div class="bounce3"></div>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        // Agregar estilos CSS para las animaciones
        const style = document.createElement('style');
        style.innerHTML = `
          .loading-container {
            padding: 10px;
          }
          .loading-text {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
          }
          .dots:after {
            content: '.';
            animation: dots 1.5s steps(5, end) infinite;
          }
          @keyframes dots {
            0%, 20% {
              content: '.';
            }
            40% {
              content: '..';
            }
            60%, 80% {
              content: '...';
            }
            100% {
              content: '';
            }
          }
          .loading-animation {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .spinner {
            margin: 0 auto;
            width: 70px;
            text-align: center;
          }
          .spinner > div {
            width: 18px;
            height: 18px;
            background-color: #3085d6;
            border-radius: 100%;
            display: inline-block;
            margin: 0 3px;
            animation: sk-bouncedelay 1.4s infinite ease-in-out both;
          }
          .spinner .bounce1 {
            animation-delay: -0.32s;
          }
          .spinner .bounce2 {
            animation-delay: -0.16s;
          }
          @keyframes sk-bouncedelay {
            0%, 80%, 100% { 
              transform: scale(0);
            } 
            40% { 
              transform: scale(1.0);
            }
          }
        `;
        document.head.appendChild(style);
      }
    });

    // Deshabilita todos los inputs y botones de tipo submit
    document.querySelectorAll("input[type='submit'], button[type='submit']").forEach(el => {
      el.setAttribute("disabled", true);
    });
  } else {
    // Cerrar la alerta si existe
    if (alertLoading) {
      Swal.close();
    }

    // Habilitar nuevamente los inputs y botones
    document.querySelectorAll("input[type='submit'], button[type='submit']").forEach(el => {
      el.removeAttribute("disabled");
    });
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
      h(options.renderTarget).empty().append(response);

      // Ocultar cualquier modal abierto
      $('.modal').modal('hide');
      $('.modal').hide();

      // Eliminar la clase 'modal-open' del cuerpo para restablecer el estado de la interfaz
      $('body').removeClass('modal-open');
      // Eliminar los elementos de fondo de modal
      $('.modal-backdrop').remove();

      showLoadingAlert(false);

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
      h.error('Error', e);
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
  h("*[data-selected='true']")?.attr("selected", "selected");
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

function initMultiHBFiles(containerSelector = '.hb-upload-container') {
  // Obtener el contenedor principal usando el selector proporcionado (por clase)
  const uploadContainer = document.querySelector(containerSelector);

  // Acceder al contenedor que envuelve el input de archivos
  const fileInputContainer = uploadContainer.querySelector('.hb-file-input-container');

  // Acceder al área de drop (arrastrar y soltar archivos)
  const dropArea = fileInputContainer.querySelector('.hb-file-drop-area');

  // Acceder al input de archivos oculto (de tipo file)
  const fileInput = fileInputContainer.querySelector('input[type="file"]');

  // Acceder al botón que permite seleccionar archivos manualmente
  const selectFilesBtn = fileInputContainer.querySelector('button');

  // Acceder al contenedor que mostrará la previsualización de los archivos
  const previewContainer = uploadContainer.querySelector('.hb-preview-container');

  // Convierte la cadena JSON almacenada en el atributo 'data-files' del contenedor 'previewContainer' en un objeto JavaScript.
  const existingFiles = JSON.parse(previewContainer.getAttribute("hb-files") || "[]");

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

  // Función para procesar archivos existentes
  function processExistingFiles() {
    if (!existingFiles || existingFiles.length === 0) return;

    // Elimina el atributo 'data-files' del elemento 'previewContainer'.
    previewContainer.removeAttribute("hb-files");

    // Limpiar cualquier indicador de carga existente
    const existingIndicator = document.querySelector('.hb-loading-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Crear contenedor específico para el indicador de carga (fuera del grid)
    const loadingContainer = document.createElement('div');
    loadingContainer.style.width = '100%';
    loadingContainer.style.marginBottom = '20px';
    previewContainer.parentNode.insertBefore(loadingContainer, previewContainer);

    // Crear y mostrar indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'hb-loading-indicator';
    loadingIndicator.innerHTML = `
    <div class="hb-spinner"></div>
    <p>Cargando archivos, por favor espere...</p>
    <p class="hb-loading-count">0/${existingFiles.length} archivos cargados</p>
  `;
    loadingContainer.appendChild(loadingIndicator);

    // Contador para seguir el progreso
    let loadedFilesCount = 0;
    const loadingCountElement = loadingIndicator.querySelector('.hb-loading-count');

    // Procesar cada archivo
    const promises = existingFiles.map((fileInfo, index) => {
      // Crear un objeto File a partir de la información proporcionada
      const lastModifiedDate = new Date(fileInfo.LastModified);

      // Crear un objeto Blob que simulará el archivo
      return fetch(fileInfo?.url)
        .then(response => response.blob())
        .then(blob => {
          // Crear un objeto File a partir del Blob
          const file = new File([blob], fileInfo?.fileName, {
            type: blob.type,
            lastModified: lastModifiedDate.getTime()
          });

          // Generar ID y verificar si ya existe
          const fileId = generateFileId(file);

          if (!uploadedFileIds.has(fileId)) {
            // Añadir a la lista de archivos
            uploadedFiles.push(file);
            uploadedFileIds.add(fileId);

            // Mostrar la previsualización pasando el índice original
            displayFilePreview(file, index);
          }

          // Actualizar contador de carga
          loadedFilesCount++;
          loadingCountElement.textContent = `${loadedFilesCount}/${existingFiles.length} archivos cargados`;
        })
        .catch(error => {
          console.error(`Error al cargar el archivo existente ${fileInfo?.fileName}:`, error);

          // También actualizamos el contador en caso de error
          loadedFilesCount++;
          loadingCountElement.textContent = `${loadedFilesCount}/${existingFiles.length} archivos cargados`;
        });
    });

    // Cuando todos los archivos terminen de cargarse
    Promise.all(promises)
      .finally(() => {
        // Eliminar todo el contenedor de carga
        loadingContainer.remove();

        // Actualizar el input después de procesar todos los archivos existentes
        updateFileInput();
      });
  }

  // Función para actualizar los índices de los inputs ocultos
  function updateFileToKeepIndices() {
    const fileToKeepInputs = document.querySelectorAll('.file-to-keep');
    fileToKeepInputs.forEach((input, index) => {
      // Actualizar el name con el nuevo índice
      input.name = `FilesToKeep[${index}]`;
    });
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

  /**
   * Genera un ID único para un archivo basado en su nombre, tamaño y última fecha de modificación.
   * Este ID se usa para identificar archivos de manera única.
   *
   * @param {File} file - El archivo al que se le generará el ID.
   * @returns {string} - El ID único generado para el archivo.
   */
  function generateFileId(file) {
    return `${file.name}-${file.size}`;
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
  
    const minSize = 10; // 10 bytes
    const maxSize = 100 * 1024 * 1024; // 100 MB en bytes
  
    // Array para almacenar archivos válidos de esta selección
    const validFiles = [];
    
    // Procesar cada archivo individualmente
    newFiles.forEach((file) => {
      const fileId = generateFileId(file);
  
      // Verificar si ya existe
      if (uploadedFileIds.has(fileId)) {
        console.log(`Archivo duplicado ignorado: ${file.name}`);
        return; // Continuar con el siguiente archivo
      }
  
      // Validación de peso mínimo
      if (file.size < minSize) {
        toastr.error(`El archivo "${file.name}" es demasiado pequeño. Tamaño mínimo: 10 bytes`);
        return; // Continuar con el siguiente archivo
      }
  
      // Validación de peso máximo
      if (file.size > maxSize) {
        toastr.error(`El archivo "${file.name}" es demasiado grande. Tamaño máximo: 100 MB`);
        return; // Continuar con el siguiente archivo
      }
  
      // Si llegamos aquí, el archivo es válido
      uploadedFileIds.add(fileId);
      validFiles.push(file);
      console.log(`Archivo válido agregado: ${file.name} (${file.size} bytes)`);
    });
  
    // Si no hay archivos válidos en esta selección, solo actualizamos el input
    // con los archivos que ya teníamos (elimina los inválidos de esta selección)
    if (validFiles.length === 0) {
      console.log('No hay archivos válidos en esta selección');
      
      // Actualizar el input solo con los archivos que ya estaban válidos
      updateFileInput();
      return;
    }
  
    // Añadir solo los archivos válidos de esta selección al array principal
    uploadedFiles = [...uploadedFiles, ...validFiles];
  
    // Mostrar preview solo para archivos válidos
    validFiles.forEach((file) => {
      displayFilePreview(file);
    });
  
    // Actualizar el input file con TODOS los archivos válidos (anteriores + nuevos)
    updateFileInput();
  
    console.log(`${validFiles.length} archivos válidos procesados. Total: ${uploadedFiles.length}`);
  }
  
  // Función auxiliar para limpiar completamente el input si es necesario
  function clearFileInput() {
    try {
      // Crear un nuevo DataTransfer vacío
      const emptyDataTransfer = new DataTransfer();
      
      // Asignar el DataTransfer vacío al input
      fileInput.files = emptyDataTransfer.files;
      
      console.log('Input de archivos limpiado completamente');
    } catch (error) {
      console.error("Error al limpiar el input de archivo:", error);
      
      // Fallback: recrear el input si DataTransfer falla
      const newFileInput = fileInput.cloneNode(true);
      fileInput.parentNode.replaceChild(newFileInput, fileInput);
      
      // Reasignar la referencia al nuevo input
      fileInput = fileInputContainer.querySelector('input[type="file"]');
      
      // Reasignar los event listeners
      fileInput.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
          handleNewFiles(Array.from(e.target.files));
        }
      });
    }
  }
  
  // Función mejorada para sincronizar uploadedFiles con el input de archivo
  function updateFileInput() {
    try {
      const dataTransfer = new DataTransfer();
  
      // Agregar SOLO los archivos válidos (uploadedFiles) al objeto DataTransfer
      uploadedFiles.forEach(file => {
        dataTransfer.items.add(file);
      });
  
      // Asignar los archivos al input
      fileInput.files = dataTransfer.files;
  
      console.log(`Input actualizado con ${fileInput.files.length} archivos válidos.`);
    } catch (error) {
      console.error("Error al actualizar el input de archivo:", error);
    }
  }

  /**
   * Muestra la previsualización de un archivo, que incluye su nombre, tipo,
   * y un botón de eliminación. Si el archivo es previsualizable, también se
   * agrega un botón para verlo en pantalla completa.
   *
   * @param {File} file - El archivo para el que se desea mostrar una previsualización.
   */
  function displayFilePreview(file, originalIndex = null) {
    const fileId = generateFileId(file);

    const previewItem = document.createElement('div');
    previewItem.className = 'hb-preview-item';
    previewItem.id = `hb-preview-${fileId}`;
    previewItem.dataset.filename = file.name;

    // Si viene de archivos existentes, añadir input oculto
    if (originalIndex !== null) {
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = `FilesToKeep[${originalIndex}]`; // Formato correcto para List<string> en C#
      hiddenInput.value = file.name;
      hiddenInput.className = 'file-to-keep';
      previewItem.appendChild(hiddenInput);
    }

    if (!fileInputContainer.hasAttribute("hidden")) { // Solo añadir el botón de eliminar si el input no está oculto
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

        // Actualizar los índices de los inputs ocultos
        updateFileToKeepIndices();
      });
      previewItem.appendChild(deleteBtn);
    }

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
    fileName.className = 'hb-file-name';
    fileName.textContent = file.name;
    fileName.title = file.name;
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
    // First check if it has a type property
    if (file.type) {
      // Handle specific MIME types for Office documents
      if (file.type.includes('spreadsheetml') ||
        file.type.includes('excel')) {
        return 'EXCEL';
      }
      if (file.type.includes('wordprocessingml') ||
        file.type.includes('document')) {
        return 'WORD';
      }
      if (file.type.includes('presentationml') ||
        file.type.includes('powerpoint')) {
        return 'POWERPOINT';
      }

      // General MIME type handling
      const parts = file.type.split('/');
      if (parts.length > 1) {
        return parts[1].toUpperCase();
      }
      return parts[0].toUpperCase();
    }

    // If no MIME type, try to determine by extension
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
  // Implementar funcionalidad para el botón de cerrar
  // Llama a la función que permite arrastrar el botón de cerrar dentro del modal.
  implementDragForCloseButton();

  // Hacer que el detalle del archivo en el modal sea arrastrable
  makeElementDraggable(fileDetails);
}

class HBFormValidator {
  /**
   * Constructor
   * @param {Object} config - Configuración global para el validador
   * @param {boolean} [config.focusOnInvalid=false] - Si debe hacer foco en el primer campo inválido
   * @param {boolean} [config.showErrors=true] - Si debe mostrar mensajes de error en la UI
   * @param {Function} [config.onError] - Callback que se ejecuta cuando hay errores
   */
  constructor(config = {}) {
    // Configuración por defecto
    this.config = {
      focusOnInvalid: false,
      showErrors: true,
      onError: null,
      ...config
    };

    // Bind de métodos para mantener el contexto this
    this.validateFields = this.validateFields.bind(this);
    this.showFieldError = this.showFieldError.bind(this);
  }

  /**
   * Valida campos según los selectores proporcionados
   * @param {Object} options - Opciones de configuración
   * @param {string[]|Function} options.selectors - Array de selectores o función que devuelve selectores
   * @param {boolean} [options.focusOnInvalid] - Si es true, hace foco en el primer campo inválido
   * @param {boolean} [options.showErrors] - Si es true, muestra mensajes de error en la UI
   * @param {Function} [options.onError] - Callback que se ejecuta cuando hay errores, recibe array de errores
   * @returns {boolean} - Devuelve true si todos los campos son válidos, false en caso contrario
   */
  validateFields(options) {
    // Valores predeterminados combinados con la configuración global
    const settings = {
      ...this.config,
      selectors: [],
      ...options
    };

    // Array para almacenar información de errores
    const errors = [];

    // Obtiene los selectores a validar
    let selectorsToValidate = [];

    // Si es una función, la ejecuta para obtener los selectores
    if (typeof settings.selectors === 'function') {
      selectorsToValidate = settings.selectors();
    }
    // Si es un string, lo convierte en array
    else if (typeof settings.selectors === 'string') {
      selectorsToValidate = [settings.selectors];
    }
    // Si ya es un array, lo usa directamente
    else if (Array.isArray(settings.selectors)) {
      selectorsToValidate = settings.selectors;
    }

    // Evalúa todos los campos y retorna true solo si cada uno de ellos es válido
    const isValid = selectorsToValidate.every((selector) => {
      // Selecciona el elemento DOM usando el helper 'h' (similar a jQuery)
      const field = $(selector);

      // Obtiene el valor actual del campo
      const value = field.val();

      // Obtiene el tipo de campo (text, number, date, etc.)
      const fieldType = field.prop("type");

      // Guarda el nombre del campo para mensajes de error más descriptivos
      const fieldName = field.attr("name") || field.attr("id") || selector;

      // Estado inicial de validación
      let isValid = true;

      // Mensaje de error inicial vacío
      let errorMessage = "";

      // Verifica si el elemento existe en el DOM antes de continuar
      if (field.length === 0) {
        // Registra error si el campo no existe y retorna falso
        console.error(`Campo '${selector}' no encontrado en el DOM`);
        return false;
      }

      // Si el campo está deshabilitado o es de solo lectura, se considera válido automáticamente
      if (field.prop("disabled") || field.prop("readonly")) {
        return true;
      }

      // Determina si el campo es requerido mediante varios métodos posibles
      const isRequired = field.attr("hb-required") !== undefined ||
        field.hasClass("hb-required") ||
        field.closest('.form-group').find('.required-mark').length > 0;

      // Valida que campos requeridos no estén vacíos
      if (isRequired && (value === null || value.trim() === "")) {
        isValid = false;
        errorMessage = `El campo ${fieldName} es obligatorio`;
      }

      // Si ya falló la validación por requerido, no continúa con más validaciones
      if (!isValid) {
        // Hace foco en el campo si se solicita
        if (settings.focusOnInvalid) field.focus();

        // Guarda el error para reportes
        errors.push({ field: fieldName, message: errorMessage, element: field });
        return false;
      }

      // Si el campo está vacío pero no es requerido, se considera válido
      if (value === null || value.trim() === "") {
        return true;
      }

      // Validaciones específicas según el tipo de campo usando switch
      switch (fieldType) {
        case "number":
        case "range":
          // Convierte el valor a número decimal
          const numValue = toDecimal(value);

          // Obtiene restricciones del campo desde sus atributos
          const min = field.attr("min") !== undefined ? parseFloat(field.attr("min")) : null;
          const max = field.attr("max") !== undefined ? parseFloat(field.attr("max")) : null;
          const step = field.attr("step") !== undefined ? parseFloat(field.attr("step")) : null;

          // Valida que sea un número válido
          if (isNaN(numValue)) {
            isValid = false;
            errorMessage = `El campo ${fieldName} debe ser un número válido`;
          }
          // Valida el valor mínimo permitido
          else if (min !== null && numValue < min) {
            isValid = false;
            errorMessage = `El valor debe ser mayor o igual a ${min}`;
          }
          // Valida el valor máximo permitido
          else if (max !== null && numValue > max) {
            isValid = false;
            errorMessage = `El valor debe ser menor o igual a ${max}`;
          }
          // Valida que el valor cumpla con el incremento especificado
          else if (step !== null && step > 0) {
            // Considera errores de punto flotante en la división
            const remainder = (numValue - (min !== null ? min : 0)) % step;
            if (remainder > 0 && Math.abs(remainder - step) > 0.00001) {
              isValid = false;
              errorMessage = `El valor debe ser un múltiplo de ${step} desde ${min !== null ? min : 0}`;
            }
          }
          break;

        case "date":
        case "datetime":
        case "datetime-local":
        case "month":
        case "week":
        case "time":
          // Variables para almacenar formato y valor de fecha
          let dateFormat, dateValue;

          // Determina el formato según el tipo específico de campo de fecha/hora
          if (fieldType === "date") dateFormat = 'YYYY-MM-DD';
          else if (fieldType === "datetime" || fieldType === "datetime-local") dateFormat = 'YYYY-MM-DDTHH:mm:ss';
          else if (fieldType === "month") dateFormat = 'YYYY-MM';
          else if (fieldType === "week") dateFormat = 'YYYY-[W]WW';
          else if (fieldType === "time") dateFormat = 'HH:mm';

          // Parsea el valor usando moment.js con el formato adecuado
          dateValue = moment(value, dateFormat);

          // Verifica si la fecha es válida según el formato esperado
          if (!dateValue.isValid()) {
            isValid = false;
            errorMessage = `El formato de fecha/hora no es válido`;
          } else {
            // Valida contra fecha mínima si está especificada
            const minDate = field.attr("min") ? moment(field.attr("min"), dateFormat) : null;
            if (minDate !== null && minDate.isValid() && dateValue.isBefore(minDate)) {
              isValid = false;
              errorMessage = `La fecha debe ser igual o posterior a ${minDate.format(dateFormat)}`;
            }

            // Valida contra fecha máxima si está especificada
            const maxDate = field.attr("max") ? moment(field.attr("max"), dateFormat) : null;
            if (maxDate !== null && maxDate.isValid() && dateValue.isAfter(maxDate)) {
              isValid = false;
              errorMessage = `La fecha debe ser igual o anterior a ${maxDate.format(dateFormat)}`;
            }
          }
          break;

        case "email":
          // Expresión regular para validar emails según RFC 5322
          const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

          // Valida el formato del email
          if (!emailPattern.test(value)) {
            isValid = false;
            errorMessage = `El email no tiene un formato válido`;
          }

          // Validación adicional para campos que permiten múltiples emails
          if (isValid && field.attr("multiple") !== undefined) {
            // Divide la cadena en emails individuales separados por comas
            const emails = value.split(/\s*,\s*/);
            for (let email of emails) {
              // Valida cada email individualmente
              if (!emailPattern.test(email)) {
                isValid = false;
                errorMessage = `Uno o más emails no tienen un formato válido`;
                break;
              }
            }
          }
          break;

        case "url":
          // Valida URLs usando el constructor URL nativo
          try {
            new URL(value);
          } catch (e) {
            isValid = false;
            errorMessage = `La URL no tiene un formato válido`;
          }
          break;

        case "tel":
          // Usa un patrón definido en el atributo pattern o un patrón predeterminado para teléfonos
          const telPattern = field.attr("pattern") || /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

          // Valida el formato de teléfono
          if (typeof telPattern === "string") {
            // Si el patrón es una cadena, crea una expresión regular
            if (!new RegExp(telPattern).test(value)) {
              isValid = false;
              errorMessage = `El teléfono no tiene un formato válido`;
            }
          } else if (!telPattern.test(value)) {
            // Si ya es una expresión regular, la usa directamente
            isValid = false;
            errorMessage = `El teléfono no tiene un formato válido`;
          }
          break;

        case "password":
          // Obtiene la longitud mínima o usa 8 como predeterminado
          const minLength = field.attr("minlength") ? parseInt(field.attr("minlength")) : 8;

          // Patrón para validar fuerza de contraseña (contiene mayúsculas, minúsculas, números y caracteres especiales)
          const strengthPattern = field.attr("data-strength-pattern") ||
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

          // Valida longitud mínima
          if (value.length < minLength) {
            isValid = false;
            errorMessage = `La contraseña debe tener al menos ${minLength} caracteres`;
          }
          // Valida fuerza si se solicita
          else if (field.attr("data-validate-strength") && typeof strengthPattern === "string") {
            if (!new RegExp(strengthPattern).test(value)) {
              isValid = false;
              errorMessage = field.attr("data-strength-message") ||
                `La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales`;
            }
          }

          // Verifica coincidencia con otro campo (confirm password)
          const matchField = field.attr("data-match-field");
          if (matchField) {
            const matchValue = h(matchField).val();
            if (value !== matchValue) {
              isValid = false;
              errorMessage = `Las contraseñas no coinciden`;
            }
          }
          break;

        case "file":
          // Obtiene la colección de archivos seleccionados
          const files = field[0].files;

          // Valida si se seleccionó un archivo cuando es requerido
          if (isRequired && (!files || files.length === 0)) {
            isValid = false;
            errorMessage = `Debe seleccionar un archivo`;
          } else if (files && files.length > 0) {
            // Valida número máximo de archivos permitidos
            const maxFiles = field.attr("data-max-files") ? parseInt(field.attr("data-max-files")) :
              (field.attr("multiple") ? null : 1);
            if (maxFiles !== null && files.length > maxFiles) {
              isValid = false;
              errorMessage = `Puede seleccionar máximo ${maxFiles} archivo(s)`;
            }

            // Valida tipos de archivo permitidos según el atributo accept
            const accept = field.attr("accept");
            if (accept) {
              // Divide la lista de tipos aceptados
              const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());

              // Revisa cada archivo seleccionado
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let fileMatched = false;

                // Compara con cada tipo aceptado
                for (let acceptType of acceptedTypes) {
                  if (acceptType.startsWith('.')) {
                    // Si es extensión de archivo (p.ej. .pdf)
                    const extension = '.' + file.name.split('.').pop().toLowerCase();
                    if (extension === acceptType) {
                      fileMatched = true;
                      break;
                    }
                  } else if (acceptType.includes('/')) {
                    // Si es tipo MIME (p.ej. image/png o image/*)
                    const [type, subtype] = acceptType.split('/');
                    const [fileType, fileSubtype] = file.type.split('/');

                    // Compara tipo y subtipo, considerando comodines (*)
                    if ((type === '*' || fileType === type) &&
                      (subtype === '*' || fileSubtype === subtype)) {
                      fileMatched = true;
                      break;
                    }
                  }
                }

                // Si algún archivo no coincide, marca como inválido
                if (!fileMatched) {
                  isValid = false;
                  errorMessage = `Uno o más archivos no tienen un formato permitido`;
                  break;
                }
              }
            }

            // Valida tamaño máximo de archivos
            const maxSize = field.attr("data-max-size") ? parseInt(field.attr("data-max-size")) : null;
            if (maxSize !== null) {
              for (let i = 0; i < files.length; i++) {
                if (files[i].size > maxSize) {
                  isValid = false;
                  // Convierte bytes a MB para mostrar mensaje más amigable
                  const sizeMB = Math.round(maxSize / (1024 * 1024) * 100) / 100;
                  errorMessage = `El tamaño máximo por archivo es de ${sizeMB} MB`;
                  break;
                }
              }
            }
          }
          break;

        case "checkbox":
          // Valida checkbox requerido (debe estar marcado)
          if (isRequired && !field.prop("checked")) {
            isValid = false;
            errorMessage = `Este campo es obligatorio`;
          }

          // Validación para grupos de checkboxes que comparten un atributo data-group
          const checkGroup = field.attr("data-group");
          if (checkGroup) {
            // Obtiene restricciones de selección mínima y máxima
            const minChecked = field.attr("data-min-checked") ? parseInt(field.attr("data-min-checked")) : null;
            const maxChecked = field.attr("data-max-checked") ? parseInt(field.attr("data-max-checked")) : null;

            // Si hay restricciones, valida la cantidad de checkboxes seleccionados del mismo grupo
            if (minChecked !== null || maxChecked !== null) {
              const checkedCount = document.querySelectorAll(`input[type="checkbox"][data-group="${checkGroup}"]:checked`).length;

              // Valida selección mínima
              if (minChecked !== null && checkedCount < minChecked) {
                isValid = false;
                errorMessage = `Debe seleccionar al menos ${minChecked} opciones`;
              }
              // Valida selección máxima
              else if (maxChecked !== null && checkedCount > maxChecked) {
                isValid = false;
                errorMessage = `Puede seleccionar máximo ${maxChecked} opciones`;
              }
            }
          }
          break;

        case "radio":
          // Valida que se haya seleccionado un radio button del grupo cuando es requerido
          if (isRequired) {
            // Obtiene el nombre del grupo de radio buttons
            const radioGroup = field.attr("name");

            // Verifica si algún radio button del grupo está seleccionado
            const anyChecked = document.querySelector(`input[type="radio"][name="${radioGroup}"]:checked`);
            if (!anyChecked) {
              isValid = false;
              errorMessage = `Debe seleccionar una opción`;
            }
          }
          break;

        default:
          // Para otros tipos de campos (text, textarea, select, etc.)

          // Obtiene restricciones de longitud
          const minLen = field.attr("minlength") ? parseInt(field.attr("minlength")) : null;
          const maxLength = field.attr("maxlength") ? parseInt(field.attr("maxlength")) : null;

          // Valida longitud mínima
          if (minLen !== null && value.length < minLen) {
            isValid = false;
            errorMessage = `Debe tener al menos ${minLen} caracteres`;
          }
          // Valida longitud máxima
          else if (maxLength !== null && value.length > maxLength) {
            isValid = false;
            errorMessage = `Debe tener máximo ${maxLength} caracteres`;
          }

          // Valida contra patrón regex definido en el atributo pattern
          const pattern = field.attr("pattern");
          if (pattern && !new RegExp(`^${pattern}$`).test(value)) {
            isValid = false;
            // Usa el atributo title como mensaje de error si está disponible
            errorMessage = field.attr("title") || `El formato no es válido`;
          }

          // Valida contra lista de valores permitidos en un datalist
          const dataListId = field.attr("list");
          if (dataListId) {
            const dataList = document.getElementById(dataListId);
            if (dataList) {
              // Extrae todos los valores permitidos del datalist
              const allowedValues = Array.from(dataList.querySelectorAll('option')).map(opt => opt.value);

              // Si se requiere estrictamente un valor de la lista y no coincide, marca como inválido
              if (!allowedValues.includes(value) && field.attr("data-strict-datalist")) {
                isValid = false;
                errorMessage = `Debe seleccionar un valor de la lista`;
              }
            }
          }

          // Ejecuta función de validación personalizada si está definida
          if (field.attr("data-validation-function")) {
            try {
              // Crea y ejecuta la función de validación definida en el atributo
              const validationFn = new Function('value', 'element', field.attr("data-validation-function"));
              const customResult = validationFn(value, field[0]);

              // Si no devuelve true, considera que falló la validación
              if (customResult !== true) {
                isValid = false;
                // Usa el resultado como mensaje si es un string, o el mensaje predeterminado
                errorMessage = typeof customResult === 'string' ? customResult :
                  field.attr("data-validation-message") || `Validación personalizada fallida`;
              }
            } catch (e) {
              // Registra errores en la función de validación
              console.error(`Error en la validación personalizada del campo ${fieldName}:`, e);
            }
          }
          break;
      }

      // Utiliza la API nativa de validación HTML5 como último recurso
      if (isValid && field[0] && typeof field[0].checkValidity === "function" && !field[0].checkValidity()) {
        isValid = false;
        // Usa el mensaje de validación nativo o uno genérico
        errorMessage = field[0].validationMessage || `El campo no es válido`;
      }

      // Si hay un error, realiza acciones finales
      if (!isValid) {
        // Guarda el error para posible reporte
        errors.push({ field: fieldName, message: errorMessage, element: field });

        // Hace foco en el campo inválido si se solicitó
        if (settings.focusOnInvalid) {
          field.focus();
        }

        // Muestra el error visualmente si está habilitado
        if (settings.showErrors) {
          this.showFieldError(field, errorMessage);
        }

        return false;
      }

      // Si pasó todas las validaciones, retorna true
      return true;
    });

    // Si hay errores y se proporcionó una función de callback, la ejecuta
    if (!isValid && errors.length > 0 && typeof settings.onError === 'function') {
      settings.onError(errors);
    }

    return isValid;
  }

  /**
   * Método de compatibilidad para adaptar el método original
   * @param {string[]|Function} selectors - Array de selectores o función que devuelve selectores
   * @param {boolean} focusOnInvalid - Si es true, hace foco en el primer campo inválido
   * @returns {boolean} - Devuelve true si todos los campos son válidos
   */
  areFieldsValid(selectors, focusOnInvalid = false) {
    return this.validateFields({
      selectors: selectors,
      focusOnInvalid: focusOnInvalid
    });
  }

  /**
   * Muestra visualmente un mensaje de error asociado a un campo
   * @param {Object} field - El elemento DOM o jQuery del campo
   * @param {string} message - El mensaje de error a mostrar
   */
  showFieldError(field, message) {
    // Encuentra el contenedor del campo (normalmente un div.form-group)
    const formGroup = field.closest('.form-group');

    // Elimina mensajes de error previos para evitar duplicados
    formGroup.find('.validation-error').remove();

    // Añade clase de error al campo para estilizarlo
    field.addClass('is-invalid');

    // Crea el elemento para el mensaje de error
    const errorDiv = $(`<div class="validation-error text-danger small mt-1">${message}</div>`);

    // Decide dónde insertar el mensaje de error
    if (formGroup.find('label').length > 0) {
      // Si hay etiqueta, inserta después del campo
      errorDiv.insertAfter(field);
    } else {
      // Si no hay etiqueta, añade al final del grupo
      formGroup.append(errorDiv);
    }

    // Configuración para remover el mensaje cuando el usuario corrija el error
    field.one('input change', function () {
      // Quita la clase de error
      field.removeClass('is-invalid');

      // Elimina el mensaje con animación
      formGroup.find('.validation-error').fadeOut(300, function () {
        $(this).remove();
      });
    });
  }

  /**
   * Método estático para crear una instancia con configuración predeterminada
   * @returns {HBFormValidator} - Nueva instancia del validador
   */
  static create(config = {}) {
    return new HBFormValidator(config);
  }
}

/**
 * @function createInputField
 * @description Crea elementos input HTML con escape de caracteres para prevenir XSS
 * @param {Object} config - Configuración del campo de entrada
 * @param {string} config.type - Tipo de input
 * @param {string} config.className - Clases CSS
 * @param {string} config.name - Nombre del campo
 * @param {string} config.value - Valor del campo
 * @param {number} config.min - Valor mínimo (para inputs numéricos)
 * @param {number} config.max - Valor máximo (para inputs numéricos)
 * @param {boolean} config.readonly - Si el campo es de solo lectura
 * @returns {string} Elemento input HTML como string
 */
function createInputField({ type, className, name, value, min, max, readonly }) {
  // Sanitiza las entradas para prevenir XSS
  type = type ? escapeHTML(type) : 'text';
  className = className ? escapeHTML(className) : '';
  name = name ? escapeHTML(name) : '';
  value = value !== undefined && value !== null ? escapeHTML(value.toString()) : '';

  // Comienza a construir el elemento input
  let inputField = `<input type="${type}"`;

  // Agrega atributos si existen
  if (className) inputField += ` class="${className}"`;
  if (name) inputField += ` name="${name}"`;
  if (value !== '') inputField += ` value="${value}"`;
  if (min !== undefined) inputField += ` min="${min}"`;
  if (max !== undefined) inputField += ` max="${max}"`;
  if (readonly) inputField += ` readonly="readonly"`;

  // Cierra la etiqueta de input
  inputField += '>';
  return inputField;
}

/**
 * @function escapeHTML
 * @description Escapa caracteres especiales para prevenir ataques XSS
 * @param {string} str - Cadena a escapar
 * @returns {string} Cadena con caracteres especiales escapados
 */
function escapeHTML(str) {
  // Reemplaza caracteres especiales con entidades HTML
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * @function reindexTable
 * @description Actualiza los índices de las filas y nombres de campos después de eliminar o modificar filas
 * @param {string} tbodyId - El id del tbody que se va a reindexar
 * @param {string} dtoName - El nombre del DTO que se usa en los campos de entrada
 */
function reindexTable(tbodyId, dtoName) { // Recibe el id del tbody y el nombre del DTO
  h(`#${tbodyId} tr`).each(function (index, element) { // Itera sobre cada fila de la tabla usando el ID proporcionado
    h(element).find(`input[name^="${dtoName}["]`).each(function () { // Busca los campos de entrada con nombre que empieza con el nombre del DTO
      const name = h(this).attr('name'); // Obtiene el nombre del campo
      // Reemplaza correctamente la parte del nombre que contiene el índice
      const newName = name.replace(new RegExp(`${dtoName}\\[\\d+\\]`), `${dtoName}[${index}]`);
      h(this).attr('name', newName); // Establece el nuevo nombre del campo
    });
  });
}

/**
 * Genera códigos QR para todos los elementos con el atributo `hbQR` usando la librería hbqr-generator.
 *
 * Esta función recorre todos los elementos con el atributo `hbQR`, toma los atributos `size` y `level`,
 * genera un código QR con esa información, y reemplaza el contenido del elemento con una imagen `<img>`.
 * 
 * Requiere la librería `hbqr-generator` y una función tipo jQuery (`h` o `$`).
 * 
 * Si `hbqr` no está definido, no hace nada y muestra un mensaje de advertencia en la consola.
 *
 * @function generatehbqrs
 * @returns {void} No retorna ningún valor. Actualiza el DOM.
 */
function generatehbqrs() {
  // Validar que la librería hbqr-generator esté cargada
  if (typeof hbqr !== 'function') {
    // console.warn('hbqr-generator no está disponible. ¿Olvidaste cargar hbqr.js?');
    return;
  }

  // Buscar todos los elementos que tengan el atributo personalizado "hbQR"
  h('[hbQR]').each(function () {
    const $element = h(this); // Seleccionar el elemento actual

    const value = $element.attr('hbQR'); // Contenido que se codificará en el QR
    const size = parseInt($element.attr('size')) || 200; // Tamaño del QR (por defecto 200px)
    const level = $element.attr('level') || 'M'; // Nivel de corrección de errores (L, M, Q, H)

    // Crear una nueva instancia del generador de QR
    const qr = hbqr(0, level);
    qr.addData(value);  // Agregar el valor a codificar
    qr.make();          // Generar el QR

    const moduleSize = Math.max(1, Math.floor(size / 25)); // Calcular tamaño del módulo
    const imgHtml = qr.createImgTag(moduleSize); // Generar <img> como HTML

    $element.html(imgHtml); // Reemplazar contenido con el QR
  });
}

/**
 * Valida la fecha de un input tipo date y envía el formulario si es válida.
 * Muestra mensajes toast con toastr si la fecha no es válida o está fuera de rango.
 * 
 * @param {HTMLElement} inputElement - El input date que dispara la validación (normalmente 'this').
 * @param {string} formNameOrId - Nombre o id del formulario a enviar.
 * @returns {boolean} - Retorna true si se envió el formulario, false si no.
 */
function validateDateAndSubmit(inputElement, formNameOrId) {
  const $input = $(inputElement); // jQuery wrapper del input

  // Obtener valor, mínimo y máximo desde atributos del input
  const value = moment($input.val(), "YYYY-MM-DD");
  const min = moment($input.attr("min"), "YYYY-MM-DD");
  const max = moment($input.attr("max"), "YYYY-MM-DD");

  // Validar si la fecha tiene formato válido
  if (!value.isValid()) {
    toastR({
      type: 'error',
      title: "Fecha inválida"
    });
    return false;
  }

  // Validar que la fecha esté dentro del rango permitido
  if (value.isBefore(min) || value.isAfter(max)) {
    toastR({
      type: 'warning',
      title: "Fecha fuera de rango",
    });
    return false;
  }

  // Buscar el formulario por nombre o id
  const $form = $(`form[name='${formNameOrId}'], form#${formNameOrId}`);

  if ($form.length === 0) {
    toastR({
      type: 'error',
      title: "Formulario no encontrado",
      msg: `No se encontró el formulario '${formNameOrId}'.`
    });
    return false;
  }

  // Enviar el formulario
  $form[0].submit();
  return true;
}

/**
 * Desactiva opciones de un select2 según el tipo de argumentos pasados.
 *
 * @function disableSelect2Option
 * @param {string} selectId - ID del select2.
 * @param {string|Array|string|Object} arg2 - Puede ser un valor string, un array de strings, o un objeto clave-valor.
 * @param {string} [relatedSelectId] - (Opcional) Otro select2 relacionado, para futuras extensiones.
 * @param {Array} [arrayToDisable] - (Opcional) Array de valores a deshabilitar.
 * @param {string} [title] - (Opcional) Título o texto para tooltip.
 */
function disableSelect2Option(selectId, arg2, relatedSelectId, arrayToDisable, title) {
  const $select = $(`#${selectId}`);

  // Si arg2 es un string → Caso 1: valor único
  if (typeof arg2 === 'string') {
    const value = arg2;
    const $option = $select.find(`option[value="${value}"]`);

    if ($option.length) {
      $option.prop('disabled', true);
      if (title) {
        $option.attr('title', title);
      }
      $select.trigger('change.select2');
    }

    // Si arg2 es un array → Caso 2: múltiples valores
  } else if (Array.isArray(arg2)) {
    arg2.forEach(value => {
      const $option = $select.find(`option[value="${value}"]`);
      if ($option.length) {
        $option.prop('disabled', true);
        if (title) {
          $option.attr('title', title);
        }
      }
    });
    $select.trigger('change.select2');

    // Si arg2 es un objeto → Caso 3: { valor: titulo, ... }
  } else if (typeof arg2 === 'object' && arg2 !== null) {
    Object.entries(arg2).forEach(([value, customTitle]) => {
      const $option = $select.find(`option[value="${value}"]`);
      if ($option.length) {
        $option.prop('disabled', true);
        if (customTitle) {
          $option.attr('title', customTitle);
        }
      }
    });
    $select.trigger('change.select2');
  }
}

// Cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  try {
    initialFunctions();
  } catch (e) {
    h.error(e);
  }
});