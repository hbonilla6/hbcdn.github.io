/**
 * Sistema genérico de campos Material Design para Bootstrap
 */
class MaterialFields {
    constructor() {
        this.init();
    }

    init() {
        this.setupFields();
        this.convertSelectsToCustom();
        this.detectInitialDisabledFields(); // AGREGADO
    }

    setupFields() {
        const fields = document.querySelectorAll(
            '.hb-material-field input, .hb-material-field textarea'
        );

        fields.forEach((field) => {
            // Eventos básicos
            field.addEventListener('input', () => this.handleInput(field));
            field.addEventListener('focus', () => this.handleFocus(field));
            field.addEventListener('blur', () => this.handleBlur(field));

            // Para números, prevenir notación científica
            if (field.type === 'number') {
                field.addEventListener('input', (e) => {
                    if (
                        e.target.value.includes('e') ||
                        e.target.value.includes('E')
                    ) {
                        e.target.value = e.target.value.replace(/[eE][+-]?\d+/, '');
                    }
                });
            }

            // Estado inicial CON CONTADOR
            this.updateFieldState(field);
            this.updateCounter(field);
            this.updateDisabledState(field);
        });
    }

    convertSelectsToCustom() {
        const selects = document.querySelectorAll(
            '.hb-material-field select'
        );

        selects.forEach((select) => {
            this.createCustomSelect(select);
        });
    }

    createCustomSelect(originalSelect) {
        const parent = originalSelect.closest('.hb-material-field');
        const placeholder =
            originalSelect.getAttribute('data-placeholder') ||
            originalSelect.options[0]?.text ||
            'Seleccionar...';
        const required = originalSelect.hasAttribute('required');
        const disabled = originalSelect.hasAttribute('disabled');
        const id = originalSelect.id;
        const name = originalSelect.name || originalSelect.id;

        // Crear estructura del select personalizado
        const customSelect = document.createElement('div');
        customSelect.className = 'hb-material-select';
        customSelect.setAttribute('tabindex', disabled ? '-1' : '0');
        customSelect.setAttribute('data-value', originalSelect.value || '');
        if (required) customSelect.setAttribute('required', '');
        if (disabled) customSelect.setAttribute('disabled', '');
        if (id) customSelect.id = id;
        if (name) customSelect.setAttribute('data-name', name);

        const trigger = document.createElement('div');
        trigger.className = 'hb-material-select-trigger';

        const valueElement = document.createElement('span');
        valueElement.className = 'hb-material-select-value';

        // Establecer valor inicial
        const selectedOption = Array.from(originalSelect.options).find(
            (opt) => opt.selected
        );
        if (selectedOption && selectedOption.value) {
            valueElement.textContent = selectedOption.text;
            customSelect.setAttribute('data-value', selectedOption.value);
        } else {
            valueElement.textContent = '';
        }

        const arrow = document.createElement('div');
        arrow.className = 'hb-material-select-arrow';

        const panel = document.createElement('div');
        panel.className = 'hb-material-select-panel';

        // Crear opciones
        Array.from(originalSelect.options).forEach((option, index) => {
            if (index === 0 && option.value === '') return; // Skip placeholder option

            const customOption = document.createElement('div');
            customOption.className = 'hb-material-option';
            customOption.setAttribute('data-value', option.value);
            customOption.textContent = option.text;

            if (option.selected) {
                customOption.classList.add('selected');
            }

            panel.appendChild(customOption);
        });

        // Ensamblar estructura
        trigger.appendChild(valueElement);
        trigger.appendChild(arrow);
        customSelect.appendChild(trigger);
        customSelect.appendChild(panel);

        // Reemplazar select original
        originalSelect.style.display = 'none';
        originalSelect.parentNode.insertBefore(customSelect, originalSelect);

        // Configurar eventos
        this.setupCustomSelectEvents(
            customSelect,
            originalSelect,
            parent,
            valueElement,
            placeholder
        );

        // Estado inicial
        this.updateSelectState(
            customSelect,
            parent,
            valueElement,
            placeholder
        );
        
        // Manejar estado disabled
        this.updateSelectDisabledState(customSelect, parent);
    }

    setupCustomSelectEvents(
        select,
        originalSelect,
        parent,
        valueElement,
        placeholder
    ) {
        const trigger = select.querySelector('.hb-material-select-trigger');
        const panel = select.querySelector('.hb-material-select-panel');
        const options = select.querySelectorAll('.hb-material-option');

        // Click en TODO el select (no solo el trigger)
        select.addEventListener('click', (e) => {
            if (select.hasAttribute('disabled')) return;
            
            e.stopPropagation();
            document
                .querySelectorAll('.hb-material-select.open')
                .forEach((s) => {
                    if (s !== select) s.classList.remove('open');
                });
            select.classList.toggle('open');
        });

        // Click en opciones
        options.forEach((option) => {
            option.addEventListener('click', (e) => {
                if (select.hasAttribute('disabled')) return;
                
                e.stopPropagation();

                options.forEach((opt) => opt.classList.remove('selected'));
                option.classList.add('selected');

                const value = option.getAttribute('data-value');
                valueElement.textContent = option.textContent;
                select.setAttribute('data-value', value);

                // Actualizar select original
                originalSelect.value = value;
                originalSelect.dispatchEvent(new Event('change'));

                this.updateSelectState(select, parent, valueElement, placeholder);

                if (select.hasAttribute('required')) {
                    parent.classList.remove('invalid');
                }

                select.classList.remove('open');
            });
        });

        // Focus y blur
        select.addEventListener('focus', () => {
            if (select.hasAttribute('disabled')) return;
            
            parent.classList.add('focused');
            this.updateSelectState(select, parent, valueElement, placeholder);
        });

        select.addEventListener('blur', () => {
            if (select.hasAttribute('disabled')) return;
            
            parent.classList.remove('focused');
            parent.classList.add('touched');
            this.updateSelectState(select, parent, valueElement, placeholder);
            this.validateSelect(select, parent);
        });

        // Teclado
        select.addEventListener('keydown', (e) => {
            if (select.hasAttribute('disabled')) return;
            
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                select.classList.toggle('open');
            } else if (e.key === 'Escape') {
                select.classList.remove('open');
            }
        });

        // Cerrar al click fuera
        document.addEventListener('click', () => {
            select.classList.remove('open');
        });
    }

    updateSelectState(select, parent, valueElement, placeholder) {
        const hasValue =
            select.getAttribute('data-value') &&
            select.getAttribute('data-value') !== '';

        if (hasValue) {
            parent.classList.add('filled');
        } else {
            parent.classList.remove('filled');
            if (
                parent.classList.contains('focused') ||
                parent.classList.contains('filled')
            ) {
                valueElement.textContent = placeholder;
            } else {
                valueElement.textContent = '';
            }
        }
    }

    updateSelectDisabledState(select, parent) {
        if (select.hasAttribute('disabled')) {
            parent.classList.add('disabled');
            select.setAttribute('tabindex', '-1');
        } else {
            parent.classList.remove('disabled');
            select.setAttribute('tabindex', '0');
        }
    }

    validateSelect(select, parent) {
        if (!parent.classList.contains('touched')) return;

        let isValid = true;

        if (
            select.hasAttribute('required') &&
            !select.getAttribute('data-value')
        ) {
            isValid = false;
        }

        if (isValid) {
            parent.classList.remove('invalid');
        } else {
            parent.classList.add('invalid');
        }
    }

    handleInput(field) {
        if (field.hasAttribute('disabled') || field.hasAttribute('readonly')) {
            return;
        }
        
        this.updateCounter(field);
        this.updateFieldState(field);
        this.validateField(field);
    }

    handleFocus(field) {
        if (field.hasAttribute('disabled')) {
            return;
        }
        
        field.closest('.hb-material-field').classList.add('focused');
    }

    handleBlur(field) {
        if (field.hasAttribute('disabled')) {
            return;
        }
        
        const parent = field.closest('.hb-material-field');
        parent.classList.remove('focused');
        parent.classList.add('touched');
        this.validateField(field);
    }

    updateFieldState(field) {
        const parent = field.closest('.hb-material-field');
        const hasValue = field.value && field.value.trim() !== '';

        if (hasValue) {
            parent.classList.add('filled');
        } else {
            parent.classList.remove('filled');
        }
    }

    // MÉTODO MEJORADO para manejar disabled/readonly
    updateDisabledState(field) {
        const parent = field.closest('.hb-material-field');
        
        if (field.hasAttribute('disabled')) {
            parent.classList.add('disabled');
            
            // Para inputs de fecha, forzar estilos directamente
            if (field.type === 'date' || field.type === 'datetime-local' || field.type === 'time') {
                field.style.backgroundColor = '#f5f5f5';
                field.style.color = '#4e4e4e';
                field.style.borderColor = '#e0e0e0';
            }
        } else {
            parent.classList.remove('disabled');
            
            // Restaurar estilos normales para inputs de fecha
            if (field.type === 'date' || field.type === 'datetime-local' || field.type === 'time') {
                field.style.backgroundColor = '';
                field.style.color = '';
                field.style.borderColor = '';
            }
        }
        
        if (field.hasAttribute('readonly')) {
            parent.classList.add('readonly');
        } else {
            parent.classList.remove('readonly');
        }
    }

    updateCounter(field) {
        const parent = field.closest('.hb-material-field');
        const counter = parent.querySelector('.hb-material-char-counter');

        if (!counter) return;

        if (field.type === 'number') {
            const value = field.value ? parseFloat(field.value) : '';
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');

            let counterText = value !== '' ? value.toString() : '0';

            if (max) {
                counterText += ` / ${max}`;
            } else if (min) {
                counterText += ` (mín: ${min})`;
            }

            counter.textContent = counterText;
        } else {
            const maxLength = field.getAttribute('maxlength');
            const minLength = field.getAttribute('minlength');
            const current = field.value.length;

            let counterText = `${current}`;

            if (maxLength) {
                counterText += ` / ${maxLength}`;
            } else if (minLength && current < minLength) {
                counterText += ` (mín: ${minLength})`;
            }

            counter.textContent = counterText;
        }
    }

    validateField(field) {
        const parent = field.closest('.hb-material-field');

        if (!parent.classList.contains('touched')) return;
        
        if (field.hasAttribute('disabled')) return;

        let isValid = true;

        if (
            field.hasAttribute('required') &&
            (!field.value || field.value.trim() === '')
        ) {
            isValid = false;
        } else if (
            field.hasAttribute('minlength') &&
            field.value.length > 0 &&
            field.value.length < parseInt(field.getAttribute('minlength'))
        ) {
            isValid = false;
        } else if (
            field.hasAttribute('maxlength') &&
            field.value.length > parseInt(field.getAttribute('maxlength'))
        ) {
            isValid = false;
        } else if (field.type === 'number' && field.value) {
            const value = parseFloat(field.value);
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');

            if (min && value < parseFloat(min)) {
                isValid = false;
            } else if (max && value > parseFloat(max)) {
                isValid = false;
            }
        } else if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
            }
        } else if (!field.validity.valid) {
            isValid = false;
        }

        if (isValid) {
            parent.classList.remove('invalid');
        } else {
            parent.classList.add('invalid');
        }
    }

    // NUEVO: Detectar campos disabled/readonly al cargar
    detectInitialDisabledFields() {
        // Para inputs y textareas
        const fields = document.querySelectorAll(
            '.hb-material-field input, .hb-material-field textarea'
        );
        
        fields.forEach((field) => {
            if (field.hasAttribute('disabled') || field.hasAttribute('readonly')) {
                this.updateDisabledState(field);
            }
        });
        
        // Para selects originales que ya están disabled
        const selects = document.querySelectorAll(
            '.hb-material-field select'
        );
        
        selects.forEach((select) => {
            const parent = select.closest('.hb-material-field');
            const customSelect = parent.querySelector('.hb-material-select');
            
            if (select.hasAttribute('disabled') && customSelect) {
                customSelect.setAttribute('disabled', '');
                this.updateSelectDisabledState(customSelect, parent);
            }
        });
    }

    // Métodos públicos para manejar disabled/readonly dinámicamente
    setFieldDisabled(fieldId, disabled = true) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const parent = field.closest('.hb-material-field');
        
        if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
            if (disabled) {
                field.setAttribute('disabled', '');
            } else {
                field.removeAttribute('disabled');
            }
            this.updateDisabledState(field);
        } else {
            // Para selects personalizados
            const customSelect = parent.querySelector('.hb-material-select');
            if (customSelect) {
                if (disabled) {
                    customSelect.setAttribute('disabled', '');
                } else {
                    customSelect.removeAttribute('disabled');
                }
                this.updateSelectDisabledState(customSelect, parent);
            }
        }
    }

    setFieldReadonly(fieldId, readonly = true) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
            if (readonly) {
                field.setAttribute('readonly', '');
            } else {
                field.removeAttribute('readonly');
            }
            this.updateDisabledState(field);
        }
    }

    validateAll() {
        const fields = document.querySelectorAll(
            '.hb-material-field input, .hb-material-field textarea'
        );
        const selects = document.querySelectorAll(
            '.hb-material-field .hb-material-select'
        );
        let isFormValid = true;

        fields.forEach((field) => {
            if (field.hasAttribute('disabled')) return;
            
            const parent = field.closest('.hb-material-field');
            parent.classList.add('touched');
            this.validateField(field);

            if (parent.classList.contains('invalid')) {
                isFormValid = false;
            }
        });

        selects.forEach((select) => {
            if (select.hasAttribute('disabled')) return;
            
            const parent = select.closest('.hb-material-field');
            parent.classList.add('touched');
            this.validateSelect(select, parent);

            if (parent.classList.contains('invalid')) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    getFormData() {
        const fields = document.querySelectorAll(
            '.hb-material-field input, .hb-material-field textarea'
        );
        const selects = document.querySelectorAll(
            '.hb-material-field .hb-material-select'
        );
        const radios = document.querySelectorAll(
            'input[type="radio"]:checked'
        );
        const data = {};

        fields.forEach((field) => {
            if (field.id) {
                data[field.id] = field.value;
            }
        });

        selects.forEach((select) => {
            const name = select.getAttribute('data-name') || select.id;
            if (name) {
                data[name] = select.getAttribute('data-value') || '';
            }
        });

        radios.forEach((radio) => {
            data[radio.name] = radio.value;
        });

        return data;
    }

    clearForm() {
        const fields = document.querySelectorAll(
            '.hb-material-field input, .hb-material-field textarea'
        );
        const selects = document.querySelectorAll(
            '.hb-material-field .hb-material-select'
        );
        const radios = document.querySelectorAll('input[type="radio"]');

        fields.forEach((field) => {
            if (field.hasAttribute('disabled') || field.hasAttribute('readonly')) {
                return;
            }
            
            field.value = '';
            const parent = field.closest('.hb-material-field');
            parent.classList.remove('filled', 'focused', 'touched', 'invalid');

            const counter = parent.querySelector('.hb-material-char-counter');
            if (counter) counter.textContent = '0';
        });

        selects.forEach((select) => {
            if (select.hasAttribute('disabled')) {
                return;
            }
            
            select.setAttribute('data-value', '');
            const parent = select.closest('.hb-material-field');
            const valueElement = select.querySelector(
                '.hb-material-select-value'
            );

            parent.classList.remove('filled', 'focused', 'touched', 'invalid');
            valueElement.textContent = '';

            const counter = parent.querySelector('.hb-material-char-counter');
            if (counter) counter.textContent = '';

            select
                .querySelectorAll('.hb-material-option')
                .forEach((opt) => opt.classList.remove('selected'));
        });

        radios.forEach((radio) => {
            if (radio.hasAttribute('disabled')) {
                return;
            }
            
            radio.checked = false;
        });
    }
}