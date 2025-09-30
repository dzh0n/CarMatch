// Modal functionality for contact forms
class ModalManager {
    constructor() {
        this.policyAccepted = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Close modal when clicking close button
        document.addEventListener('click', (e) => {
            if (e.target.closest('.close_btn')) {
                this.closeModal();
            }
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Policy checkbox toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.checked')) {
                this.togglePolicy();
            }
        });

        // Form submission
        const form = document.querySelector('.modal_inputs');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    setupFormValidation() {
        // Add required attributes and setup validation
        const modal = document.querySelector('.modal.booking');
        if (!modal) return;

        // Add hidden fields if they don't exist
        if (!modal.querySelector('input[name="car"]')) {
            const carInput = document.createElement('input');
            carInput.type = 'hidden';
            carInput.name = 'car';
            modal.querySelector('.modal_inputs').appendChild(carInput);
        }

        if (!modal.querySelector('input[name="action"]')) {
            const actionInput = document.createElement('input');
            actionInput.type = 'hidden';
            actionInput.name = 'action';
            modal.querySelector('.modal_inputs').appendChild(actionInput);
        }

        // Add error containers if they don't exist
        const inputs = modal.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('error')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error';
                errorDiv.style.color = 'red';
                errorDiv.style.fontSize = '14px';
                errorDiv.style.marginTop = '5px';
                input.parentNode.insertBefore(errorDiv, input.nextSibling);
            }
        });
    }

    closeModal() {
        const modal = document.querySelector('.modal.booking');
        if (modal) {
            modal.classList.remove('active');
            this.clearForm();
        }
    }

    openModal(carData, action) {
        const modal = document.querySelector('.modal.booking');
        if (!modal) {
            console.error('Modal not found');
            return;
        }

        // Отправляем цель Yandex.Metrika об открытии модального окна
        if (typeof ym !== 'undefined') {
            ym(103768419, 'reachGoal', 'modal_open');
            console.log('📊 Yandex.Metrika: modal_open');
        }

        // Set car data
        const carInput = modal.querySelector('input[name="car"]');
        if (carInput) {
            carInput.value = carData;
        }

        // Set action type
        const actionInput = modal.querySelector('input[name="action"]');
        if (actionInput) {
            actionInput.value = action;
        }

        // Update modal title based on action
        const title = modal.querySelector('.modal_inner h3');
        if (title) {
            if (action === 'want') {
                title.textContent = 'Хочу этот автомобиль';
            } else if (action === 'discuss') {
                title.textContent = 'Обсудить с экспертом';
            } else {
                title.textContent = 'Связаться с нами';
            }
        }

        // Show modal
        modal.classList.add('active');
        
        // Clear any previous form data
        this.clearForm();
        
        // Reset policy checkbox
        this.policyAccepted = false;
        const policyCheck = document.querySelector('.checked');
        const submitBtn = document.querySelector('.thank_btn');
        
        if (policyCheck) policyCheck.classList.remove('active');
        if (submitBtn) submitBtn.disabled = true;
    }

    togglePolicy() {
        const policyCheck = document.querySelector('.checked');
        const submitBtn = document.querySelector('.thank_btn');
        
        this.policyAccepted = !this.policyAccepted;
        
        if (this.policyAccepted) {
            policyCheck.classList.add('active');
            if (submitBtn) submitBtn.disabled = false;
        } else {
            policyCheck.classList.remove('active');
            if (submitBtn) submitBtn.disabled = true;
        }
        
        this.clearError('policyError');
    }

    validateForm(formData) {
        let isValid = true;
        
        // Clear previous errors
        this.clearAllErrors();
        
        // Validate name
        const name = formData.get('name');
        if (!name || !name.trim()) {
            this.showError('nameError', 'Пожалуйста, введите имя');
            isValid = false;
        }
        
        // Validate email
        const email = formData.get('mail');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !email.trim()) {
            this.showError('mailError', 'Пожалуйста, введите email');
            isValid = false;
        } else if (!emailRegex.test(email.trim())) {
            this.showError('mailError', 'Пожалуйста, введите корректный email');
            isValid = false;
        }
        
        // Validate phone
        const phone = formData.get('number');
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phone || !phone.trim()) {
            this.showError('numberError', 'Пожалуйста, введите телефон');
            isValid = false;
        } else if (!phoneRegex.test(phone.trim())) {
            this.showError('numberError', 'Пожалуйста, введите корректный номер телефона');
            isValid = false;
        }
        
        // Validate policy
        if (!this.policyAccepted) {
            this.showError('policyError', 'Необходимо принять условия соглашения');
            isValid = false;
        }
        
        return isValid;
    }

    showError(inputName, message) {
        const input = document.querySelector(`input[name="${inputName}"]`);
        if (input && input.nextElementSibling && input.nextElementSibling.classList.contains('error')) {
            input.nextElementSibling.textContent = message;
        }
    }

    clearError(inputName) {
        const input = document.querySelector(`input[name="${inputName}"]`);
        if (input && input.nextElementSibling && input.nextElementSibling.classList.contains('error')) {
            input.nextElementSibling.textContent = '';
        }
    }

    clearAllErrors() {
        const errors = document.querySelectorAll('.modal .error');
        errors.forEach(error => error.textContent = '');
    }

    clearForm() {
        const form = document.querySelector('.modal_inputs');
        if (form) {
            const inputs = form.querySelectorAll('input[type="text"]');
            inputs.forEach(input => input.value = '');
            
            this.policyAccepted = false;
            const policyCheck = document.querySelector('.checked');
            if (policyCheck) policyCheck.classList.remove('active');
            
            const submitBtn = document.querySelector('.thank_btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Отправить';
            }
            
            this.clearAllErrors();
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        if (!this.validateForm(formData)) {
            return;
        }
        
        const submitBtn = document.querySelector('.thank_btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
        }
        
        try {
            // Convert FormData to regular object for JSON
            const data = {
                name: formData.get('name'),
                email: formData.get('mail'),
                phone: formData.get('number'),
                car: formData.get('car'),
                action: formData.get('action'),
                timestamp: new Date().toISOString()
            };
            
            // Добавляем ID чата, если он существует
            if (window.carMatchChat && window.carMatchChat.conversationId) {
                data.conversation_id = window.carMatchChat.conversationId;
                console.log('✅ Added conversation_id to form submission:', data.conversation_id);
            } else {
                console.warn('⚠️ No conversation_id available for form submission');
            }
            
            const response = await fetch('/api/v1/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Отправляем цель Yandex.Metrika об успешной отправке формы
                if (typeof ym !== 'undefined') {
                    ym(103768419, 'reachGoal', 'form_submit_success');
                    console.log('📊 Yandex.Metrika: form_submit_success');
                }
                
                this.showSuccess('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
                setTimeout(() => {
                    this.closeModal();
                }, 2000);
            } else {
                throw new Error('Network response was not ok');
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.showError('nameError', 'Произошла ошибка при отправке. Попробуйте позже.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить';
            }
        }
    }

    showSuccess(message) {
        // Create or find success element
        let successEl = document.querySelector('.modal .success');
        if (!successEl) {
            successEl = document.createElement('div');
            successEl.className = 'success';
            successEl.style.color = 'green';
            successEl.style.fontSize = '14px';
            successEl.style.marginTop = '10px';
            successEl.style.textAlign = 'center';
            
            const submitBtn = document.querySelector('.thank_btn');
            if (submitBtn) {
                submitBtn.parentNode.insertBefore(successEl, submitBtn.nextSibling);
            }
        }
        successEl.textContent = message;
    }
}

// Initialize modal manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.modalManager = new ModalManager();
});

// Global function for easy access
window.openContactModal = function(carData, action) {
    if (window.modalManager) {
        window.modalManager.openModal(carData, action);
    } else {
        console.error('Modal manager not initialized');
    }
};
