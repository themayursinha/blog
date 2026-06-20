(function () {
  'use strict';

  var page = document.querySelector('[data-manifesto]');
  if (!page) return;

  page.classList.add('manifesto-enhanced');

  var cards = page.querySelectorAll('.manifesto-card');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setPointer(card, event) {
    var rect = card.getBoundingClientRect();
    card.style.setProperty('--pointer-x', ((event.clientX - rect.left) / rect.width * 100) + '%');
    card.style.setProperty('--pointer-y', ((event.clientY - rect.top) / rect.height * 100) + '%');
  }

  for (var i = 0; i < cards.length; i++) {
    (function (card) {
      card.setAttribute('tabindex', '0');
      card.addEventListener('pointermove', function (event) { setPointer(card, event); });
      card.addEventListener('pointerenter', function () { card.classList.add('is-active'); });
      card.addEventListener('pointerleave', function () { card.classList.remove('is-active'); });
      card.addEventListener('focus', function () { card.classList.add('is-active'); });
      card.addEventListener('blur', function () { card.classList.remove('is-active'); });
    }(cards[i]));
  }

  if (reducedMotion || typeof IntersectionObserver === 'undefined') {
    for (var j = 0; j < cards.length; j++) cards[j].classList.add('is-visible');
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    for (var k = 0; k < entries.length; k++) {
      if (!entries[k].isIntersecting) continue;
      entries[k].target.classList.add('is-visible');
      observer.unobserve(entries[k].target);
    }
  }, { threshold: 0.12 });

  for (var n = 0; n < cards.length; n++) observer.observe(cards[n]);
}());
