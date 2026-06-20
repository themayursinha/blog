(function () {
  'use strict';

  var page = document.querySelector('[data-home-command]');
  if (!page) return;

  page.classList.add('home-enhanced');

  var programs = page.querySelectorAll('.home-program-card');
  var revealItems = page.querySelectorAll('.home-record-card, .home-program-card, .home-system-list a, .home-transmissions li');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updatePointer(card, event) {
    var rect = card.getBoundingClientRect();
    card.style.setProperty('--pointer-x', ((event.clientX - rect.left) / rect.width * 100) + '%');
    card.style.setProperty('--pointer-y', ((event.clientY - rect.top) / rect.height * 100) + '%');
  }

  for (var i = 0; i < programs.length; i++) {
    (function (card) {
      card.setAttribute('tabindex', '0');
      card.addEventListener('pointermove', function (event) { updatePointer(card, event); });
      card.addEventListener('pointerenter', function () { card.classList.add('is-active'); });
      card.addEventListener('pointerleave', function () { card.classList.remove('is-active'); });
      card.addEventListener('focus', function () { card.classList.add('is-active'); });
      card.addEventListener('blur', function () { card.classList.remove('is-active'); });
    }(programs[i]));
  }

  if (reducedMotion || typeof IntersectionObserver === 'undefined') {
    for (var j = 0; j < revealItems.length; j++) revealItems[j].classList.add('is-visible');
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    for (var k = 0; k < entries.length; k++) {
      if (!entries[k].isIntersecting) continue;
      entries[k].target.classList.add('is-visible');
      observer.unobserve(entries[k].target);
    }
  }, { threshold: 0.1 });

  for (var n = 0; n < revealItems.length; n++) observer.observe(revealItems[n]);
}());
