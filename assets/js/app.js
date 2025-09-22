$(document).ready(function() {

  let currentSectionIndex = 0;
  const totalSections = $('.section').length;
  let isAnimating = false;

  // Инициализация
  $('.section').eq(0).addClass('active');

  // ================================
  // Основная функция перехода
  // ================================
  window.goToSection = function(index, callbackBefore, callbackAfter) {
    if (
      isAnimating ||
      index < 0 ||
      index >= totalSections ||
      index === currentSectionIndex
    ) return;

    isAnimating = true;

    const $currentSection = $('.section').eq(currentSectionIndex);
    const $nextSection = $('.section').eq(index);

    // ВСТАВЬ СВОЙ КОД ЗДЕСЬ — перед началом анимации
    if (typeof callbackBefore === 'function') {
      callbackBefore($currentSection, $nextSection);
    }

    // Скрываем текущую секцию
    $currentSection.removeClass('active');

    // Показываем следующую
    $nextSection.addClass('active');
    

    // ВСТАВЬ СВОЙ КОД ЗДЕСЬ — после смены секций (но до сброса isAnimating)
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
  $(window).on('wheel', function(e) {
    if (isAnimating) return;

    if (e.originalEvent.deltaY > 0) {
      goToSection(currentSectionIndex + 1);
    } else {
      goToSection(currentSectionIndex - 1);
    }
  });


  // ================================
  // Обработчик свайпа (мобильные)
  // ================================
  let startY = 0;

  $(window).on('touchstart', function(e) {
    startY = e.originalEvent.touches[0].clientY;
  });

  $(window).on('touchend', function(e) {
    if (isAnimating) return;
    const endY = e.originalEvent.changedTouches[0].clientY;
    const diff = startY - endY;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      goToSection(currentSectionIndex + 1);
    } else {
      goToSection(currentSectionIndex - 1);
    }
  });

});