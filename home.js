// Home page: scroll reveal and plan buttons. Menu, cookie notice and the form live in site.js.
(function () {
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.head, .reel, .statement p, .svc .card, .compare .col, .steps li, .plan, .founder, .cta-box, .chapter, .life-item')
      .forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }

  // Reels autoplay (muted) while on screen and pause when scrolled away.
  // Skipped for visitors who ask for reduced motion; they can press play themselves.
  var reels = document.querySelectorAll('.reel video');
  if (reels.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) en.target.play().catch(function () {});
        else en.target.pause();
      });
    }, { threshold: 0.5 });
    reels.forEach(function (v) { vo.observe(v); });
  }

  // Add-on buttons tick the matching checkbox in the form
  document.querySelectorAll('[data-addon]').forEach(function (a) {
    a.addEventListener('click', function () {
      var box = document.getElementById(a.dataset.addon);
      if (box) box.checked = true;
    });
  });

  // Plan buttons pre-select the matching package in the form
  document.querySelectorAll('[data-package]').forEach(function (a) {
    a.addEventListener('click', function () {
      var r = document.querySelector('#book-form input[name="package"][value="' + a.dataset.package + '"]');
      if (r) r.checked = true;
    });
  });
})();
