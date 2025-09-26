$(document).ready(function () {

  let currentSectionIndex = 0;
  const totalSections = $('.section').length;
  let isAnimating = false;

  if (window.carMatchChat) {
    window.carMatchChat.enableChat();
  }


  // Инициализация
  $('.section').eq(0).addClass('active');

  animateSection1();

  // ================================
  // Основная функция перехода
  // ================================
  window.goToSection = function (index, callbackBefore, callbackAfter) {
    if (
      isAnimating ||
      index < 0 ||
      index >= totalSections ||
      index === currentSectionIndex
    ) return;

    isAnimating = true;

    const $currentSection = $('.section').eq(currentSectionIndex);
    const $nextSection = $('.section').eq(index);

    // СВОЙ КОД ЗДЕСЬ — перед началом анимации
    if (typeof callbackBefore === 'function') {
      callbackBefore($currentSection, $nextSection);
    }

    // Скрываем текущую секцию
    $currentSection.removeClass('active');

    // Показываем следующую
    $nextSection.addClass('active');


    // СВОЙ КОД ЗДЕСЬ — после смены секций (но до сброса isAnimating)
    if (typeof callbackAfter === 'function') {
      callbackAfter($currentSection, $nextSection);
    }

    // Через 500мс (время анимации opacity) — разблокируем переходы
    setTimeout(() => {
      currentSectionIndex = index;
      isAnimating = false;
    }, 500); // ← синхронизировано с CSS transition

  };

  // ================================
  // Обработчик скролла
  // ================================
  $(window).on('wheel', function (e) {
    if (isAnimating) return;

    if (e.originalEvent.deltaY > 0) {
      //goToSection(currentSectionIndex + 1);
      if (currentSectionIndex === 0) {
        
        goToSection(currentSectionIndex + 1, function (current, next) {
          // Перед анимацией
          $('.bg-video').eq(0).addClass('zoom-in');
          $('.bg-video').eq(1).addClass('zoom-in');
        },
          function (current, next) {
            // После анимации
            setTimeout(() => {
              $('.bg-video').eq(0).animate({ opacity: 0 }).removeClass('zoom-in');
              $('.bg-video').eq(0).removeClass('active zoom-in');
              $('.bg-video').eq(1).removeClass('zoom-in').addClass('active').animate({ opacity: 1 });
              animateSection2();
            }, 2000);
            
          }
        );
      }

      //#2
      if (currentSectionIndex === 1) {
        
        goToSection(currentSectionIndex + 1, function (current, next) {
          // Перед анимацией
          $('.bg-video').eq(1).addClass('zoom-in');
          $('.bg-video').eq(2).addClass('zoom-in');
        },
          function (current, next) {
            // После анимации
            setTimeout(() => {
              $('.bg-video').eq(1).animate({ opacity: 0 }).removeClass('zoom-in');
              $('.bg-video').eq(1).removeClass('active zoom-in');
              $('.bg-video').eq(2).removeClass('zoom-in').addClass('active').animate({ opacity: 1 });
              animateSection3();
            }, 2000);
            
          }
        );
      }


    } else {
      //goToSection(currentSectionIndex - 1);

      if (currentSectionIndex === 1) {
        goToSection(currentSectionIndex - 1, function (current, next) {
          // Перед анимацией
          $('.bg-video').eq(1).addClass('zoom-in');
          $('.bg-video').eq(0).addClass('zoom-in');
        },
          function (current, next) {
            // После анимации
            setTimeout(() => {
              $('.bg-video').eq(1).animate({ opacity: 0 }).removeClass('zoom-in');
              $('.bg-video').eq(1).removeClass('active');
              $('.bg-video').eq(0).addClass('active zoom-out').animate({ opacity: 1 }).removeClass('zoom-in zoom-out');
              animateSection1();
            }, 2000);
          }
        );
      }



    }
  });


  // ================================
  // Обработчик свайпа (мобильные)
  // ================================
  let startY = 0;

  $(window).on('touchstart', function (e) {
    startY = e.originalEvent.touches[0].clientY;
  });

  $(window).on('touchend', function (e) {
    if (isAnimating) return;
    const endY = e.originalEvent.changedTouches[0].clientY;
    const diff = startY - endY;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      //goToSection(currentSectionIndex + 1);
      if (currentSectionIndex === 0) {

      }


    } else {
      goToSection(currentSectionIndex - 1);
    }
  });

});


function animateSection1() {
  // Анимация для секции 1
  $('.animated').css({ opacity: 0 }); // Сброс анимации
  var section = $('.section').eq(0);
  section.find('.main-screen__logo img').animate({ opacity: 1 }, 2000);
  section.find('.main-screen__text').delay(500).animate({ opacity: 1 }, 2000);
  section.find('.main-screen__next').delay(500).animate({ opacity: 1 }, 2000);
}

function animateSection2() {
  // Анимация для секции 2
  $('.animated').css({ opacity: 0 }); // Сброс анимации
  var section = $('.section').eq(1);
  section.find('.second-section__logo').animate({ opacity: 1 }, 2000);
  section.find('.info-titles span').each(function (index) {
    $(this).delay(10 + index * 500).animate({ opacity: 1 }, 2000);
  });
  section.find('.info-digits__item').each(function (index) {
    $(this).delay(10 + index * 500).animate({ opacity: 1 }, 2000);
  });
  section.find('.main-screen__next').delay(500).animate({ opacity: 1 }, 2000);

}

function animateSection3() {
  // Анимация для секции 3
  $('.animated').css({ opacity: 0 }); // Сброс анимации
  var section = $('.section').eq(2);
  section.find('.second-section__logo').animate({ opacity: 1 }, 2000);
  section.find('.chat').delay(500).animate({ opacity: 1 }, 2000);

}


// jQuery код для управления прокруткой
$(document).ready(function() {
    const $chatContainer = $('.chat_texts');
    const $messagesContainer = $chatContainer.find('.chat_texts-inner');
    
    // Флаг для отслеживания, находится ли пользователь внизу
    let isScrolledToBottom = true;
    
    // Функция прокрутки к самому низу
    function scrollToBottom() {
        $chatContainer.scrollTop($chatContainer[0].scrollHeight);
        isScrolledToBottom = true;
    }
    
    // Прокрутка к низу при загрузке
    scrollToBottom();
    
    // Обработчик скролла для отслеживания позиции пользователя
    $chatContainer.on('scroll', function() {
        const scrollTop = $chatContainer.scrollTop();
        const scrollHeight = $chatContainer[0].scrollHeight;
        const clientHeight = $chatContainer[0].clientHeight;
        
        // Проверяем, находится ли пользователь внизу (с небольшим запасом в 10px)
        isScrolledToBottom = (scrollHeight - scrollTop - clientHeight <= 10);
    });
    
    // Функция для добавления нового сообщения
    function addMessage(messageText) {
        const $newMessage = $('<div class="message">' + messageText + '</div>');
        $messagesContainer.append($newMessage);
        
        // Если пользователь был внизу, прокручиваем к новому сообщению
        if (isScrolledToBottom) {
            scrollToBottom();
        }
    }
    
    // Обработчик для свайпов (touch events)
    let startY = 0;
    let isSwiping = false;
    
    $chatContainer.on('touchstart', function(e) {
        startY = e.originalEvent.touches[0].clientY;
        isSwiping = true;
    });
    
    $chatContainer.on('touchmove', function(e) {
        if (!isSwiping) return;
        
        const currentY = e.originalEvent.touches[0].clientY;
        const deltaY = startY - currentY;
        
        // Прокручиваем контейнер вручную для плавности
        $chatContainer.scrollTop($chatContainer.scrollTop() + deltaY);
        startY = currentY;
        
        e.preventDefault();
    });
    
    $chatContainer.on('touchend', function() {
        isSwiping = false;
    });
    
    // Автоматическая прокрутка при изменении размера контента
    const resizeObserver = new ResizeObserver(function() {
        if (isScrolledToBottom) {
            scrollToBottom();
        }
    });
    
    if ($messagesContainer[0]) {
        resizeObserver.observe($messagesContainer[0]);
    }
    
    
    
    // Публичные методы для внешнего использования
    window.chatScroll = {
        scrollToBottom: scrollToBottom,
        addMessage: addMessage
    };
});


function initCookiesNotification(options) {
  const settings = $.extend({
    storageKey: 'cookiesAccepted',
    notificationId: 'cookies-notification',
    acceptButtonId: 'accept-cookies',
    expirationDays: 365,
    showDelay: 500
  }, options);

  function checkCookiesAcceptance() {
    const cookiesAccepted = localStorage.getItem(settings.storageKey);

    console.log(cookiesAccepted);

    if (cookiesAccepted === 'true') {
      $(`#${settings.notificationId}`).hide();
    } else {
      // Показываем с небольшой задержкой для лучшего UX
      setTimeout(() => {
        $(`#${settings.notificationId}`).fadeIn();
      }, settings.showDelay);
    }
  }

  function acceptCookies() {
    localStorage.setItem(settings.storageKey, 'true');

    // Устанавливаем срок действия (опционально)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + settings.expirationDays);
    document.cookie = `cookiesAccepted=true; expires=${expirationDate.toUTCString()}; path=/`;

    $(`#${settings.notificationId}`).hide();
  }

  // Инициализация
  $(document).ready(function () {
    checkCookiesAcceptance();

    $(`#${settings.acceptButtonId}`).on('click', function () {
      acceptCookies();
    });
  });
}

// Использование
initCookiesNotification({
  notificationId: 'cookies-block',
  acceptButtonId: 'accept-btn',
  expirationDays: 30,
  showDelay: 2000
});