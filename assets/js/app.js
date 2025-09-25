$(document).ready(function () {

  let currentSectionIndex = 0;
  const totalSections = $('.section').length;
  let isAnimating = false;
  

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
              $('.bg-video').eq(0).animate({opacity: 0}).removeClass('zoom-in');
              $('.bg-video').eq(0).removeClass('active zoom-in');
              $('.bg-video').eq(1).removeClass('zoom-in').addClass('active').animate({opacity: 1});  
              animateSection2();            
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
              $('.bg-video').eq(1).animate({opacity: 0}).removeClass('zoom-in');
              $('.bg-video').eq(1).removeClass('active');
              $('.bg-video').eq(0).addClass('active zoom-out').animate({opacity: 1}).removeClass('zoom-in zoom-out');  
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
  $('.animated').css({opacity: 0}); // Сброс анимации
  var section = $('.section').eq(0);
  section.find('.main-screen__logo img').animate({opacity: 1},2000);
  section.find('.main-screen__text').delay(500).animate({opacity: 1},2000);
  section.find('.main-screen__next').delay(500).animate({opacity: 1},2000);
}

function animateSection2() {
  // Анимация для секции 2
  $('.animated').css({opacity: 0}); // Сброс анимации
  var section = $('.section').eq(1);
  section.find('.second-section__logo').animate({opacity: 1},2000);
  section.find('.main-screen__next').delay(500).animate({opacity: 1},2000);
}