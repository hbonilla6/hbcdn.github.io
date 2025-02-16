/**
 * Ejecuta un paso específico del tour guiado en la aplicación.
 * Esta función principal inicializa y controla todo el proceso del tour.
 * 
 * @param {number} step - El número del paso a ejecutar (comienza en 1)
 * @param {Object} sections - Objeto que contiene todas las secciones del tour
 * @param {Object} [globalConfig={}] - Configuración global del driver (opcional)
 */
function executeStep(step, sections, globalConfig = {}) {
    // Obtiene la referencia al driver usando optional chaining para prevenir errores
    const driver = window.driver?.js?.driver;

    // Verifica la disponibilidad del driver antes de continuar
    if (!driver) {
        console.error('La función driver no está disponible.');
        return;
    }

    // Define la configuración común base que se aplicará a todos los tours
    const commonConfig = {
        showProgress: true,      // Controla la visibilidad de la barra de progreso
        progressText: 'Paso {{current}} de {{total}}', // Plantilla para el texto de progreso
    };

    /**
     * Clase principal que gestiona toda la funcionalidad del tour guiado
     */
    class TourManager {
        /**
         * Inicializa una nueva instancia del gestor de tours
         */
        constructor(sections, globalConfig) {
            this.sections = sections; // Almacena las secciones del tour
            this.globalConfig = { ...commonConfig, ...globalConfig }; // Combina configuraciones
            this.mainTour = null; // Referencia al tour principal activo
            this.eventListeners = new Map(); // Almacena los event listeners
        }

        /**
         * Combina diferentes niveles de configuración
         * @param {Object} specificConfig - Configuración específica a combinar
         */
        mergeConfigurations(specificConfig = {}) {
            // Combina la configuración global con la específica
            return {
                ...this.globalConfig,
                ...specificConfig,
                // Maneja especialmente la configuración del popover
                popover: {
                    ...this.globalConfig.popover,
                    ...specificConfig.popover
                }
            };
        }

        /**
         * Obtiene el elemento form-group más cercano o el elemento original
         * @param {HTMLElement} element - Elemento DOM base
         */
        getTargetElement(element) {
            // Busca el contenedor form-group más cercano
            const formGroup = element.closest('.form-group');
            // Retorna el form-group si existe, si no, el elemento original
            return formGroup || element;
        }

        /**
         * Maneja la interacción con elementos específicos dentro de una sección
         */
        handleElementInteraction(section, nextStepIndex, element) {
            // Busca el índice del campo que corresponde al elemento clickeado
            const fieldIndex = section.fields.findIndex(field => {
                const targetElement = document.querySelector(`#${field.id}`);
                const elementToCheck = this.getTargetElement(targetElement);
                return elementToCheck && (elementToCheck === element || elementToCheck.contains(element));
            });

            // Si se encontró un campo correspondiente
            if (fieldIndex !== -1) {
                // Crea los pasos para el sub-tour
                const subSteps = this.createSubSteps(section.fields, section.fieldsConfig);
                // Aplica la configuración específica del sub-tour
                const subTourConfig = this.mergeConfigurations(section.fieldsConfig);

                // Crea el sub-tour con los pasos generados
                const subTour = this.createTour(subSteps, () => {
                    subTour.destroy(); // Limpia el sub-tour
                    this.removeAllEventListeners(); // Elimina listeners

                    // Recrea el tour principal
                    this.mainTour = this.createTour(this.createMainSteps(), () => {
                        // Verifica si se debe terminar el tour
                        if (!this.mainTour.hasNextStep() || confirm('¿Quieres terminar el recorrido?')) {
                            this.mainTour.destroy();
                            this.removeAllEventListeners();
                            return;
                        }
                    }, section.config);
                }, subTourConfig);

                // Inicia el sub-tour desde el campo seleccionado
                subTour.drive(fieldIndex);
            }
        }

        /**
         * Crea un manejador de eventos para la interacción con secciones
         */
        handleInteraction(section, nextStepIndex) {
            return (event) => {
                this.handleElementInteraction(section, nextStepIndex, event.target);
            };
        }

        /**
         * Registra un event listener para una sección
         */
        addSectionEventListener(section, sectionElement, nextStepIndex) {
            // Crea el manejador del evento
            const handler = this.handleInteraction(section, nextStepIndex);
            // Registra el event listener
            sectionElement.addEventListener('click', handler);

            // Almacena el listener para limpieza posterior
            if (!this.eventListeners.has(sectionElement)) {
                this.eventListeners.set(sectionElement, []);
            }
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
                listeners.forEach(({ type, handler }) => {
                    element.removeEventListener(type, handler);
                });
            });
            // Limpia el mapa de listeners
            this.eventListeners.clear();
        }

        /**
         * Configura los eventos para una sección específica
         */
        setupSectionEvents(section, sectionElement, nextStepIndex) {
            this.addSectionEventListener(section, sectionElement, nextStepIndex);
        }

        /**
         * Crea los pasos para el sub-tour basados en los campos
         */
        createSubSteps(fields, fieldsConfig = {}) {
            return fields.map(field => {
                // Obtiene el elemento base del DOM
                const baseElement = document.querySelector(`#${field.id}`);
                if (!baseElement) return null;

                // Obtiene el título y descripción del campo
                let title = field.title;
                let description = field.description;

                // Maneja contenido dinámico si existe
                if (field.getDynamicContent) {
                    const dynamicContent = field.getDynamicContent();
                    if (dynamicContent) {
                        title = dynamicContent.title;
                        description = dynamicContent.description;
                    }
                }

                // Obtiene el elemento a resaltar
                const elementToHighlight = this.getTargetElement(baseElement);
                const fieldConfig = field.config || {};

                // Retorna la configuración del paso
                return {
                    element: elementToHighlight,
                    popover: {
                        title: title,
                        description: description,
                        position: 'bottom',
                        ...fieldsConfig.popover,
                        ...fieldConfig.popover
                    },
                    ...this.mergeConfigurations(fieldConfig)
                };
            }).filter(step => step !== null); // Elimina pasos nulos
        }

        /**
 * Crea los pasos para el tour principal
 */
        createMainSteps() {
            return Object.entries(this.sections).map(([key, section], index) => {
                // Verificamos que el elemento existe y lo obtenemos correctamente
                const elementSelector = section.id.startsWith('#') ? section.id : `#${section.id}`;
                const element = document.querySelector(elementSelector);

                if (!element) {
                    console.warn(`Elemento no encontrado para la sección ${key}: ${section.id}`);
                    return null;
                }

                return {
                    element: elementSelector, // Usamos el selector completo con #
                    popover: {
                        title: section.title || 'Sin título',
                        description: section.description || 'Sin descripción',
                        position: 'bottom',
                        showButtons: ['next', 'previous'],
                        doneBtnText: 'Finalizar',
                        closeBtnText: 'Cerrar',
                        nextBtnText: 'Siguiente',
                        prevBtnText: 'Anterior',
                        ...section.config?.popover
                    },
                    onHighlightStarted: () => this.controlCards(elementSelector),
                    onHighlighted: () => {
                        this.setupSectionEvents(section, element, index + 1);
                    },
                    ...this.mergeConfigurations(section.config)
                };
            }).filter(step => step !== null); // Filtramos los pasos nulos
        }

        /**
         * Controla el estado de las tarjetas (expandido/colapsado)
         */
        controlCards(activeCardId) {
            Object.values(this.sections).forEach(section => {
                // Obtiene el elemento jQuery
                const element = $(section.id);
                const collapsedCard = element.hasClass('collapsed-card');

                // Alterna el estado de colapso
                element.toggleClass('collapsed-card', section.id !== activeCardId);

                // Maneja el icono del botón
                const buttonIcon = element.find('.card-tools .btn-tool i').get(0);
                if (buttonIcon) {
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
 */
        createTour(steps, onDestroyCallback = null, specificConfig = {}) {
            // Combina las configuraciones
            const tourConfig = this.mergeConfigurations(specificConfig);

            // Aseguramos que la configuración del popover esté presente
            const finalConfig = {
                ...tourConfig,
                animate: true,
                opacity: 0.75,
                padding: 5,
                allowClose: true,
                overlayClickNext: false,
                showButtons: true,
                popover: {
                    ...tourConfig.popover,
                    className: 'driver-popover',
                    showButtons: true,
                    position: 'bottom',
                    doneBtnText: 'Finalizar',
                    closeBtnText: 'Cerrar',
                    nextBtnText: 'Siguiente',
                    prevBtnText: 'Anterior'
                }
            };

            // Crea y retorna la instancia del tour
            return driver({
                ...finalConfig,
                steps,
                onDestroyStarted: onDestroyCallback,
            });
        }

        /**
         * Inicia el tour desde el paso especificado
         */
        start() {
            // Limpia listeners existentes
            this.removeAllEventListeners();

            // Crea el tour principal
            this.mainTour = this.createTour(this.createMainSteps(), () => {
                // Verifica si se debe terminar el tour
                if (!this.mainTour.hasNextStep() || confirm('¿Quieres terminar el recorrido?')) {
                    this.mainTour.destroy();
                    this.removeAllEventListeners();
                }
            });

            // Inicia el tour desde el paso indicado (ajustando el índice base-0)
            this.mainTour.drive(step - 1);
        }
    }

    // Crea e inicia una instancia del TourManager
    const tourManager = new TourManager(sections, globalConfig);
    tourManager.start();
}