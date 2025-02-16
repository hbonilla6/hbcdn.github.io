/**
 * Ejecuta un paso específico del tour.
 * 
 * @param {number} step - El número del paso a ejecutar (comienza en 1).
 */
function executeStep(step) {

    // Obtener la función driver del objeto global window.driver.js usando optional chaining
    const driver = window.driver?.js?.driver;
    // Verificar si el driver está disponible
    if (!driver) {
        console.error('La función driver no está disponible.');
        return;
    }

    // Configuración común que se aplicará a todos los tours
    const commonConfig = {
        showProgress: true,      // Mostrar barra de progreso
        progressText: 'Paso {{current}} de {{total}}', // Formato del texto de progreso
    };

    /**
     * Clase que maneja la funcionalidad del tour guiado en la aplicación
     */
    class TourManager {
        /**
         * Constructor de la clase TourManager
         * @param {Object} sections - Objeto que contiene todas las secciones del tour
         * @param {Object} driverConfig - Configuración para el driver del tour
         */
        constructor(sections, driverConfig) {
            // Almacena las secciones del tour para uso posterior
            this.sections = sections;
            // Almacena la configuración del driver
            this.driverConfig = driverConfig;
            // Variable para almacenar la referencia al tour principal
            this.mainTour = null;
            // Mapa para almacenar los event listeners asociados a elementos
            this.eventListeners = new Map();
        }

        /**
         * Obtiene el elemento objetivo para el evento, buscando el contenedor form-group más cercano
         * @param {HTMLElement} element - Elemento DOM base
         * @returns {HTMLElement} - Elemento form-group encontrado o el elemento original
         */
        getTargetElement(element) {
            // Busca el contenedor form-group más cercano al elemento
            const formGroup = element.closest('.form-group');
            // Retorna el form-group si existe, si no, retorna el elemento original
            return formGroup || element;
        }

        /**
         * Maneja la interacción con elementos específicos dentro de una sección
         * @param {Object} section - Sección actual del tour
         * @param {number} nextStepIndex - Índice del siguiente paso
         * @param {HTMLElement} element - Elemento con el que se interactuó
         */
        handleElementInteraction(section, nextStepIndex, element) {
            // Busca el índice del campo que corresponde al elemento clickeado
            const fieldIndex = section.fields.findIndex(field => {
                // Obtiene el elemento del DOM correspondiente al campo
                const targetElement = document.querySelector(`#${field.id}`);
                // Obtiene el elemento objetivo (form-group o el elemento original)
                const elementToCheck = this.getTargetElement(targetElement);
                // Verifica si el elemento clickeado corresponde o está contenido en el elemento objetivo
                return elementToCheck && (elementToCheck === element || elementToCheck.contains(element));
            });

            // Si se encontró un campo correspondiente
            if (fieldIndex !== -1) {
                // Crea los pasos para el sub-tour basados en los campos
                const subSteps = this.createSubSteps(section.fields);
                // Crea el sub-tour con los pasos generados
                const subTour = this.createTour(subSteps, () => {
                    // Destruye el sub-tour cuando termine 
                    subTour.destroy();
                    // Elimina todos los event listeners al cerrar el sub-tour
                    this.removeAllEventListeners();
                    // Recrea el tour principal
                    this.mainTour = this.createTour(this.createMainSteps(), () => {
                        // Verifica si se debe terminar el tour
                        if (!this.mainTour.hasNextStep() || confirm('¿Quieres terminar el recorrido?')) {
                            this.mainTour.destroy();
                            // Elimina los event listeners al terminar
                            this.removeAllEventListeners();
                            return;
                        }
                    });
                    return;
                });
                // Inicia el sub-tour desde el campo seleccionado
                subTour.drive(fieldIndex);
            }
        }

        /**
         * Crea un manejador de interacción para una sección específica
         * @param {Object} section - Sección actual
         * @param {number} nextStepIndex - Índice del siguiente paso
         * @returns {Function} - Función manejadora del evento
         */
        handleInteraction(section, nextStepIndex) {
            // Retorna una función que manejará el evento click
            return (event) => {
                this.handleElementInteraction(section, nextStepIndex, event.target);
            };
        }

        /**
         * Agrega y registra un event listener a una sección
         * @param {Object} section - Sección a la que se agregará el listener
         * @param {HTMLElement} sectionElement - Elemento DOM de la sección
         * @param {number} nextStepIndex - Índice del siguiente paso
         */
        addSectionEventListener(section, sectionElement, nextStepIndex) {
            // Crea el manejador del evento
            const handler = this.handleInteraction(section, nextStepIndex);
            // Agrega el event listener al elemento
            sectionElement.addEventListener('click', handler);

            // Inicializa el array de listeners para este elemento si no existe
            if (!this.eventListeners.has(sectionElement)) {
                this.eventListeners.set(sectionElement, []);
            }
            // Guarda la referencia del listener
            this.eventListeners.get(sectionElement).push({
                type: 'click',
                handler: handler
            });
        }

        /**
         * Elimina todos los event listeners registrados
         */
        removeAllEventListeners() {
            // Itera sobre todos los elementos y sus listeners
            this.eventListeners.forEach((listeners, element) => {
                // Elimina cada listener del elemento
                listeners.forEach(({ type, handler }) => {
                    element.removeEventListener(type, handler);
                });
            });
            // Limpia el mapa de listeners
            this.eventListeners.clear();
        }

        /**
         * Configura los eventos para una sección específica
         * @param {Object} section - Sección a configurar
         * @param {HTMLElement} sectionElement - Elemento DOM de la sección
         * @param {number} nextStepIndex - Índice del siguiente paso
         */
        setupSectionEvents(section, sectionElement, nextStepIndex) {
            // Agrega el event listener a la sección
            this.addSectionEventListener(section, sectionElement, nextStepIndex);
        }

        /**
         * Crea los pasos para el sub-tour basados en los campos
         * @param {Array} fields - Array de campos de la sección
         * @returns {Array} - Array de pasos configurados para el sub-tour
         */
        createSubSteps(fields) {
            // Mapea cada campo a un paso del tour
            return fields.map(field => {
                // Obtiene el elemento base del DOM
                const baseElement = document.querySelector(`#${field.id}`);
                if (!baseElement) return null;

                // Obtiene el título y descripción del campo
                let title = field.title;
                let description = field.description;
                // Si existe una función para contenido dinámico, la ejecuta
                if (field.getDynamicContent) {
                    const dynamicContent = field.getDynamicContent();
                    if (dynamicContent) {
                        title = dynamicContent.title;
                        description = dynamicContent.description;
                    }
                }

                // Obtiene el elemento a resaltar
                const elementToHighlight = this.getTargetElement(baseElement);

                // Retorna la configuración del paso
                return {
                    element: elementToHighlight,
                    popover: {
                        title: title,
                        description: description,
                        position: 'bottom',
                    }
                };
            }).filter(step => step !== null); // Elimina los pasos nulos
        }

        /**
         * Crea los pasos para el tour principal
         * @returns {Array} - Array de pasos configurados para el tour principal
         */
        createMainSteps() {
            // Mapea cada sección a un paso del tour principal
            return Object.entries(this.sections).map(([key, section], index) => ({
                element: section.id,
                popover: {
                    title: section.title,
                    description: section.description,
                    position: 'bottom',
                },
                // Callback cuando se inicia el resaltado
                onHighlightStarted: () => this.controlCards(section.id),
                // Callback cuando se completa el resaltado
                onHighlighted: () => {
                    const sectionElement = document.querySelector(section.id);
                    if (sectionElement) {
                        this.setupSectionEvents(section, sectionElement, index + 1);
                    }
                },
            }));
        }

        /**
         * Controla el estado de las tarjetas (expandido/colapsado)
         * @param {string} activeCardId - ID de la tarjeta activa
         */
        controlCards(activeCardId) {
            // Itera sobre todas las secciones
            Object.values(this.sections).forEach(section => {
                // Obtiene el elemento jQuery
                const element = $(section.id);
                // Verifica si la tarjeta está colapsada
                const collapsedCard = element.hasClass('collapsed-card');
                // Alterna la clase collapsed-card según corresponda
                element.toggleClass('collapsed-card', section.id !== activeCardId);

                // Obtiene el icono del botón
                const buttonIcon = element.find('.card-tools .btn-tool i').get(0);
                if (buttonIcon) {
                    // Actualiza las clases del icono según el estado
                    if (section.id !== activeCardId) {
                        if (!collapsedCard) {
                            buttonIcon.classList.add('fa-minus');
                            buttonIcon.classList.remove('fa-plus');
                        }
                    } else {
                        buttonIcon.classList.remove('fa-minus');
                        buttonIcon.classList.add('fa-plus');
                    }
                }
            });
        }

        /**
         * Crea una nueva instancia del tour
         * @param {Array} steps - Pasos del tour
         * @param {Function} onDestroyCallback - Callback para cuando se destruye el tour
         * @returns {Object} - Instancia del tour
         */
        createTour(steps, onDestroyCallback = null) {
            // Crea y retorna una nueva instancia del driver con la configuración proporcionada
            return driver({
                ...this.driverConfig,
                steps,
                onDestroyStarted: onDestroyCallback,
            });
        }

        /**
         * Inicia el tour
         */
        start() {
            // Limpia cualquier event listener existente antes de comenzar
            this.removeAllEventListeners();
            // Crea el tour principal
            this.mainTour = this.createTour(this.createMainSteps(), () => {
                // Verifica si se debe terminar el tour
                if (!this.mainTour.hasNextStep() || confirm('¿Quieres terminar el recorrido?')) {
                    this.mainTour.destroy();
                    // Elimina los event listeners al terminar
                    this.removeAllEventListeners();
                }
            });
            // Inicia el tour desde el paso indicado
            this.mainTour.drive(step - 1);
        }
    }

    // Crea una instancia del TourManager y comienza el tour
    const tourManager = new TourManager(sections, commonConfig);
    tourManager.start();
}