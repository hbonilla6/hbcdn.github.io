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