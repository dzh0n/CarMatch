// CarMatch Chat Integration - только боевые данные
class CarMatchChat {
    constructor() {
        this.host = "https://carmatch.ru";
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.carRecommendations = document.getElementById('carRecommendations');
        
        this.conversationId = null;
        this.conversationStarted = false;
        this.carSwiper = null;
        this.isSending = false; // Флаг для блокировки повторной отправки
        this.pendingRecommendations = null; // Рекомендации, ожидающие показа
        this.messageCount = 0; // Счетчик отправленных сообщений
        
        this.init();
    }
    
    init() {
        // Проверяем согласие на cookies при инициализации
        if (localStorage.getItem('cookiesAccepted')) {
            this.enableChat();
        } else {
            this.disableChat();
        }

        // Добавляем защиту от конфликтов скроллинга
        this.setupScrollProtection();
        
        // Подавляем ошибки от расширений браузера
        this.suppressExtensionErrors();

        // Хэштеги убраны для упрощения интерфейса
    }
    
    suppressExtensionErrors() {
        // Подавляем ошибки от расширений браузера
        window.addEventListener('error', (e) => {
            if (e.message && e.message.includes('message channel closed')) {
                e.preventDefault();
                return true;
            }
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            if (e.reason && e.reason.message && e.reason.message.includes('message channel closed')) {
                e.preventDefault();
                return true;
            }
        });
    }
    
    setupScrollProtection() {
        // Предотвращаем конфликты между основным скроллингом и Swiper'ом
        document.addEventListener('DOMContentLoaded', () => {
            const carSection = document.querySelector('[data-section="6"]');
            if (carSection) {
                let isInCarSection = false;
                
                // Отслеживаем когда пользователь в секции с автомобилями
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        isInCarSection = entry.isIntersecting;
                    });
                }, { threshold: 0.3 });
                
                observer.observe(carSection);
                
                // Обработчик для предотвращения конфликтов скроллинга (passive)
                document.addEventListener('wheel', (e) => {
                    if (isInCarSection) {
                        const swiperContainer = document.querySelector('.car_swiper');
                        if (swiperContainer && swiperContainer.contains(e.target)) {
                            // Если скролл происходит внутри Swiper'а, ограничиваем его
                            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                                // Горизонтальный скролл - позволяем Swiper'у обработать
                                return;
                            } else {
                                // Вертикальный скролл - предотвращаем конфликт
                                e.preventDefault();
                                // Передаем скролл родительскому элементу
                                window.scrollBy(0, e.deltaY * 0.5);
                            }
                        }
                    }
                }, { passive: false });
            }
        });
    }
    
    enableChat() {
        // Активируем чат после принятия cookies
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Обработка активности кнопки отправки
        this.chatInput.addEventListener('input', () => {
            const hasText = this.chatInput.value.trim().length > 0;
            this.sendButton.classList.toggle('active', hasText);
        });
        
        // Делаем элементы интерактивными
        this.chatInput.disabled = false;
        this.sendButton.disabled = false;
        this.chatInput.placeholder = 'Расскажите, что вас интересует...';
    }
    
    disableChat() {
        // Блокируем чат до принятия cookies
        this.chatInput.disabled = true;
        this.sendButton.disabled = true;
        this.chatInput.placeholder = 'Для начала работы примите согласие на использование cookies';
    }
    
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    blinkCookies() {
        const cookiesElement = document.querySelector('.cookies');
        if (cookiesElement) {
            cookiesElement.classList.add('blink');
            setTimeout(() => {
                cookiesElement.classList.remove('blink');
            }, 1000);
        }
    }

    async startConversation() {
        if (!localStorage.getItem('cookiesAccepted')) {
            this.blinkCookies();
            return;
        }

        console.log('🔗 startConversation called');
        try {
            const response = await fetch(this.host + '/api/v1/chat/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            
            console.log('📥 Start conversation response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Start conversation data:', data);
            
            if (data.success) {
                this.conversationId = data.conversation_id;
                this.conversationStarted = true;
                console.log('✅ Conversation started:', this.conversationId);
            } else {
                throw new Error(data.error || 'Failed to start conversation');
            }
        } catch (error) {
            console.error('❌ Error starting conversation:', error);
            this.showError('Не удалось начать разговор с сервером');
        }
    }
    
    addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat_item ${isUser ? 'right' : 'left'}`;
        
        // Обрабатываем markdown-разметку для сообщений бота
        if (!isUser) {
            messageDiv.innerHTML = this.parseMessageMarkdown(message);
        } else {
            messageDiv.textContent = message;
        }
        
        // Убираем исходное сообщение бота если добавляем новое
        if (!isUser) {
            const existingBotMessages = this.chatMessages.querySelectorAll('.chat_item.left');
            if (existingBotMessages.length > 1) {
                existingBotMessages[0].remove();
            }
        }
        
        this.chatMessages.appendChild(messageDiv);
        //this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        // Прокручиваем контейнер чата в самый низ           
        $('.chat_texts').scrollTop($('.chat_texts')[0].scrollHeight);
    }
    
    parseMessageMarkdown(message) {
        // Экранируем HTML для безопасности
        const escapedMessage = message
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Временно заменяем двойные звёздочки на маркер
        let parsedMessage = escapedMessage.replace(/\*\*(.*?)\*\*/g, '<!DOUBLE_STAR!>$1<!DOUBLE_STAR_END!>');
        
        // Обрабатываем одинарные звёздочки как жирный текст
        parsedMessage = parsedMessage.replace(/\*([^*]+)\*/g, '<span class="chat-bold">$1</span>');
        
        // Возвращаем двойные звёздочки обратно как жирный текст
        parsedMessage = parsedMessage.replace(/<!DOUBLE_STAR!>(.*?)<!DOUBLE_STAR_END!>/g, '<span class="chat-bold">$1</span>');
        
        // Обрабатываем переносы строк
        parsedMessage = parsedMessage.replace(/\n/g, '<br>');
        
        return parsedMessage;
    }

    addMessageWithButton(message, buttonText) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat_item left';
        
        // Создаем контейнер для сообщения и кнопки
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
        
        // Добавляем текст сообщения
        const textDiv = document.createElement('div');
        textDiv.textContent = message;
        contentDiv.appendChild(textDiv);
        
        // Добавляем кнопку
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            align-self: flex-start;
            transition: all 0.3s ease;
        `;
        
        button.addEventListener('mouseover', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
        
        button.addEventListener('click', (e) => {
            console.log('🎯 Button "Перейти к подобранным авто" clicked');
            e.preventDefault();
            e.stopPropagation();
            this.showRecommendations();
        });
        
        contentDiv.appendChild(button);
        messageDiv.appendChild(contentDiv);
        
        // Убираем исходное сообщение бота если добавляем новое
        const existingBotMessages = this.chatMessages.querySelectorAll('.chat_item.left');
        if (existingBotMessages.length > 1) {
            existingBotMessages[0].remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showRecommendations() {
        console.log('🔍 showRecommendations called, pendingRecommendations:', this.pendingRecommendations);
        
        // ПЕРВЫМ ДЕЛОМ отправляем цель в Yandex.Metrika
        console.log('📊 Sending car_transition goal...');
        if (typeof ym !== 'undefined') {
            ym(103768419, 'reachGoal', 'car_transition');
            console.log('📊 ✅ Yandex.Metrika: car_transition sent successfully');
        } else {
            console.log('📊 ❌ Yandex.Metrika not available');
        }
        
        if (this.pendingRecommendations && this.pendingRecommendations.length > 0) {
            // Отображаем рекомендации
            this.displayRecommendations(this.pendingRecommendations);
            
            // Переход к секции с автомобилями
            setTimeout(() => {
                this.scrollToCarsSection();
            }, 500);
            
            // Очищаем pending рекомендации
            this.pendingRecommendations = null;
        } else {
            console.warn('⚠️ No pending recommendations to show');
        }
    }
    
    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat_item left loading';
        loadingDiv.textContent = 'Ищу подходящие автомобили...';
        loadingDiv.id = 'loadingMessage';
        this.chatMessages.appendChild(loadingDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        this.sendButton.disabled = true;
    }
    
    hideLoading() {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.remove();
        }
        this.sendButton.disabled = false;
    }
    
    showError(message) {
        console.error('Ошибка:', message);
        this.addMessage(`Извините, произошла ошибка: ${message}. Попробуйте еще раз.`);
    }
    
    // Блокировка интерфейса во время отправки
    setUIBlocked(blocked) {
        this.isSending = blocked;
        
        if (blocked) {
            // Блокируем кнопку и делаем поле серым
            this.sendButton.disabled = true;
            this.sendButton.style.opacity = '0.5';
            this.sendButton.style.cursor = 'not-allowed';
            
            this.chatInput.style.backgroundColor = '#f5f5f5';
            this.chatInput.style.color = '#999';
            this.chatInput.placeholder = 'Ожидание ответа...';
        } else {
            // Разблокируем
            this.sendButton.disabled = false;
            this.sendButton.style.opacity = '1';
            this.sendButton.style.cursor = 'pointer';
            
            this.chatInput.style.backgroundColor = '';
            this.chatInput.style.color = '';
            this.chatInput.placeholder = 'Введите ваш вопрос...';
        }
    }
    
    async sendMessage() {
        if (!localStorage.getItem('cookiesAccepted')) {
            this.blinkCookies();
            return;
        }

        const message = this.chatInput.value.trim();
        if (!message || this.isSending) return; // Блокируем если уже отправляется
        
        console.log('🚀 sendMessage called with:', message);
        console.log('🔄 conversationStarted:', this.conversationStarted);
        
        // Отправка цели Yandex.Metrika для начала чата
        if (!this.conversationStarted && typeof ym !== 'undefined') {
            ym(103768419, 'reachGoal', 'chat_start');
            console.log('📊 Yandex.Metrika: chat_start');
        }
        
        // Блокируем интерфейс
        this.setUIBlocked(true);
        
        try {
            // Начинаем разговор если еще не начали
            if (!this.conversationStarted) {
                console.log('🔗 Starting conversation...');
                await this.startConversation();
                if (!this.conversationStarted) {
                    console.log('❌ Failed to start conversation');
                    this.setUIBlocked(false);
                    return; // Если не удалось начать разговор
                }
            }
            
            this.addMessage(message, true);
            this.chatInput.value = '';
            this.sendButton.classList.remove('active'); // Убираем активность кнопки
            this.showLoading();
            
            // Увеличиваем счетчик сообщений и отправляем цели
            this.messageCount++;
            if (typeof ym !== 'undefined') {
                ym(103768419, 'reachGoal', 'chat_message_sent');
                console.log('📊 Yandex.Metrika: chat_message_sent', this.messageCount);
                
                // Отправляем цель при достижении 10 сообщений
                if (this.messageCount === 10) {
                    ym(103768419, 'reachGoal', 'chat_10_messages');
                    console.log('📊 Yandex.Metrika: chat_10_messages');
                }
            }
            
            console.log('📤 Sending message to backend:', {
                message: message,
                conversation_id: this.conversationId
            });
            
            const response = await fetch(this.host + '/api/v1/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversation_id: this.conversationId
                })
            });
            
            console.log('📥 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Response data:', data);
            
            this.hideLoading();
            
            if (data.error) {
                console.log('❌ Error in response:', data.error);
                this.showError(data.error);
                return;
            }
            
            this.addMessage(data.message);

            if (data.message.toLowerCase().includes("выполнить подбор?")) {
                // Не делаем ничего, ждем ответа пользователя
            } else if (data.recommendations && data.recommendations.length > 0) {
                console.log('🚗 Received recommendations:', data.recommendations);
                
                // Отправляем цель о показе подбора автомобилей
                if (typeof ym !== 'undefined') {
                    ym(103768419, 'reachGoal', 'car_selection_shown');
                    console.log('📊 Yandex.Metrika: car_selection_shown');
                }
                
                // Сохраняем рекомендации для последующего отображения
                this.pendingRecommendations = data.recommendations;
                
                // Добавляем сообщение в чат про подбор с кнопкой
                setTimeout(() => {
                    this.addMessageWithButton("Мы подобрали для Вас автомобили - готовы показать варианты. Если они будут вам интересны — оставьте свой номер и наш эксперт поможет подобрать лучшее предложение на рынке — в России, из-за рубежа, новые или с пробегом.", "Перейти к подобранным авто");
                }, 1000); // Ждем 1 секунду после ответа модели
            } else {
                console.log('ℹ️ No recommendations received');
            }
            
        } catch (error) {
            this.hideLoading();
            console.error('💥 Error sending message:', error);
            this.showError('Не удалось получить ответ от сервера. Проверьте соединение.');
        } finally {
            // Всегда разблокируем интерфейс
            this.setUIBlocked(false);
        }
    }
    
    displayRecommendations(recommendations) {
        console.log('Displaying recommendations:', recommendations);
        this.carRecommendations.innerHTML = '';
        
        recommendations.forEach((car, index) => {
            console.log('Processing car:', car);
            const carSlide = document.createElement('div');
            carSlide.className = 'swiper-slide';
            
            // Используем боевые данные из API
            const carData = car.car || car; // Поддерживаем оба формата
            const carTitle = `${carData.mark_name || carData.make || 'Неизвестная марка'} ${carData.model_name || carData.model || ''}`.trim();
            const year = carData.year_from || carData.year || 'Не указан';
            const price = carData.offers_price_from || car.price_range || car.price || 'Цена по запросу';
            const bodyType = carData.body_type || carData.configuration_name || 'Не указан';
            const fuelType = carData.engine_type || carData.fuel_type || 'Не указано';
            const description = car.description || '';
            const carUrl = car.url || '#';
            
            // Используем изображения по умолчанию или из API
            const defaultImages = [
                'assets/img/cars1.png',
                'assets/img/cars2.png', 
                'assets/img/cars3.png'
            ];
            const carImage = car.image_url || defaultImages[index % defaultImages.length];
            
            carSlide.innerHTML = `
                <a href="${carUrl}" target="_blank" class="cars_item">
                    <div class="item_img">
                        <img src="${carImage}" alt="${carTitle}" onerror="this.src='${defaultImages[0]}'"> 
                    </div> 
                    <div class="item_texts">
                        <div class="item_title">${carTitle}</div> 
                        <ul>
                            <li>
                                <span>Год выпуска:</span>
                                <span>${year}</span>
                            </li>
                            <li>
                                <span>Цена:</span>
                                <span>${typeof price === 'number' ? this.formatPrice(price) : price}</span>
                            </li>
                            ${bodyType !== 'Не указан' ? `
                            <li>
                                <span>Тип кузова:</span>
                                <span>${bodyType}</span>
                            </li>` : ''}
                            ${fuelType !== 'Не указано' ? `
                            <li>
                                <span>Топливо:</span>
                                <span>${fuelType}</span>
                            </li>` : ''}
                        </ul> 
                        ${description ? `<div class="item_description">${description}</div>` : ''}
                    </div>
                    <div class="item_buttons">
                        <div class="blue button book_btn" data-car="${carTitle}">Хочу</div> 
                        <div class="white button more_options_btn">Ещё больше вариантов</div> 
                        <div class="white button expert_btn" data-car="${carTitle}">Обсудить с экспертом</div> 
                    </div> 
                </a>
            `;
            
            // Добавляем обработчики событий для кнопок
            const bookBtn = carSlide.querySelector('.book_btn');
            const moreOptionsBtn = carSlide.querySelector('.more_options_btn');
            const expertBtn = carSlide.querySelector('.expert_btn');
            
            if (bookBtn) {
                bookBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.bookCar(carTitle);
                });
            }
            
            if (moreOptionsBtn) {
                moreOptionsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showMoreOptions();
                });
            }
            
            if (expertBtn) {
                expertBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.contactExpert(carTitle);
                });
            }
            
            this.carRecommendations.appendChild(carSlide);
            console.log(`✅ Added car slide ${index + 1}: ${carTitle}`);
        });
        
        // Инициализация Swiper для карточек автомобилей
        setTimeout(() => {
            this.initCarSwiper();
        }, 100);
    }
    
    initCarSwiper() {
        if (this.carSwiper) {
            this.carSwiper.destroy(true, true);
        }
        
        // Проверяем количество слайдов
        const slides = document.querySelectorAll('.car_swiper .swiper-slide').length;
        const shouldLoop = slides > 2; // Loop только если больше 2 слайдов
        
        console.log(`🔧 Initializing Swiper with ${slides} slides, loop: ${shouldLoop}`);
        
        this.carSwiper = new Swiper('.car_swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: shouldLoop,
            autoplay: shouldLoop ? {
                delay: 5000,
                disableOnInteraction: false,
            } : false,
            navigation: {
                nextEl: '.right_button',
                prevEl: '.left_button',
            },
            // Защита от конфликтов скроллинга
            touchEventsTarget: 'container',
            simulateTouch: true,
            allowTouchMove: true,
            touchRatio: 1,
            touchAngle: 45,
            grabCursor: true,
            // Предотвращение хаотичного скроллинга
            preventInteractionOnTransition: true,
            resistanceRatio: 0.85,
            // Более точное управление touch-событиями
            touchStartPreventDefault: false,
            touchStartForcePreventDefault: false,
            touchMoveStopPropagation: false,
            // Отключение автоплея при взаимодействии
            autoplay: {
                delay: 5000,
                disableOnInteraction: true,
                pauseOnMouseEnter: true,
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                }
            }
        });
    }
    
    scrollToCarsSection() {
        // Используем существующую навигацию сайта для перехода к секции автомобилей
        const carsSection = document.querySelector('[data-section="5"]');
        if (carsSection) {
            console.log('🎯 Found cars section:', carsSection);
            try {
                // С fullPage.js v2.9.7 - исправляем индекс секции
                if (typeof $.fn.fullpage !== 'undefined' && $.fn.fullpage.moveTo) {
                    console.log('📍 Using fullpage.moveTo(6)'); // Исправлено: секция 5 = индекс 6
                    $.fn.fullpage.moveTo(6);
                }
                // Дополнительные попытки на случай различий в API
                else if (window.fp_utils) {
                    console.log('📍 Using fp_utils.index = 5'); // Исправлено: секция 5 = индекс 5
                    window.fp_utils.index = 5;
                }
                // Обычный скролл, если ничего другого не сработало
                else {
                    console.log('📍 Using scrollIntoView fallback');
                    carsSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Принудительно показываем секцию
                setTimeout(() => {
                    const carsSection = document.querySelector('[data-section="5"]');
                    if (carsSection) {
                        carsSection.style.display = 'block';
                        carsSection.style.visibility = 'visible';
                        carsSection.style.opacity = '1';
                        console.log('✅ Cars section made visible');
                    }
                }, 1000);
            } catch (error) {
                console.error('Error scrolling to cars section:', error);
                // Фолбэк на обычный скролл
                carsSection.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            console.error('❌ Cars section not found with selector [data-section="5"]');
            // Попробуем альтернативные селекторы
            const altSection = document.querySelector('.cars') || document.querySelector('.section.cars');
            if (altSection) {
                console.log('📍 Using alternative selector for cars section');
                altSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
    
    formatPrice(price) {
        if (typeof price === 'number') {
            return new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(price);
        }
        return price.toString();
    }
    
    // Методы для взаимодействия с карточками
    bookCar(carTitle) {
        console.log(`Забронировать автомобиль: ${carTitle}`);
        this.openModal('book', carTitle);
    }
    
    showMoreOptions() {
        console.log('Показать больше вариантов');
        // Здесь можно добавить логику показа дополнительных вариантов
        alert('Функция "Больше вариантов" будет доступна в ближайшее время.');
    }
    
    contactExpert(carTitle) {
        console.log(`Обсудить с экспертом: ${carTitle}`);
        this.openModal('expert', carTitle);
    }

    openModal(action, carTitle) {
        const modal = document.querySelector('.modal.booking');
        if (!modal) {
            console.error('Modal not found');
            return;
        }

        const modalTitle = modal.querySelector('.modal_title');
        const selectedCarInput = modal.querySelector('input[name="car"]');
        const actionInput = modal.querySelector('input[name="action"]');
        
        if (selectedCarInput) selectedCarInput.value = carTitle;
        if (actionInput) actionInput.value = action;
        
        if (modalTitle) {
            if (action === 'book') {
                modalTitle.textContent = `Забронировать ${carTitle}`;
            } else {
                modalTitle.textContent = `Обсудить ${carTitle} с экспертом`;
            }
        }
        
        modal.classList.add('active');
        
        // Отправляем цель в Yandex.Metrika
        if (typeof ym !== 'undefined') {
            ym(103768419, 'reachGoal', 'modal_open');
            console.log('📊 Yandex.Metrika: modal_open (from chat-integration)');
        }
    }
}

// Инициализация чата при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Ждем загрузки всех библиотек
    setTimeout(() => {
        window.carMatchChat = new CarMatchChat();
    }, 1000);
});