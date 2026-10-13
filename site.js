// Brine Creative: small, dependency-free site script.
// No analytics, no tracking, no third-party code. The only browser storage is
// one localStorage key remembering that the cookie notice was dismissed.
(function () {
  document.documentElement.classList.add('js');

  var CONTACT_EMAIL = 'BrineCreative@brinemarketing.com';
  var NOTICE_KEY = 'brine-notice-dismissed';

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('open')) menuBtn.click();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { menuBtn.click(); menuBtn.focus(); }
    });
  }

  // The brine line fills once, on first view
  var fills = document.querySelectorAll('.brine.rise');
  if (fills.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.6 });
      fills.forEach(function (el) { io.observe(el); });
    } else {
      fills.forEach(function (el) { el.classList.add('in'); });
    }
  }

  // Cookie notice: informational. The site sets no cookies and loads no trackers.
  var notice = document.getElementById('cookie-notice');
  function readDismissed() { try { return localStorage.getItem(NOTICE_KEY) === '1'; } catch (e) { return false; } }
  function writeDismissed() { try { localStorage.setItem(NOTICE_KEY, '1'); } catch (e) { /* storage blocked: notice just reappears next visit */ } }
  if (notice) {
    if (!readDismissed()) notice.hidden = false;
    notice.querySelector('[data-dismiss]').addEventListener('click', function () {
      notice.hidden = true;
      writeDismissed();
    });
  }
  document.querySelectorAll('[data-open-notice]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!notice) return;
      notice.hidden = false;
      notice.querySelector('[data-dismiss]').focus();
    });
  });

  // Booking form: validates, then opens the visitor's email app. Nothing is sent to or stored on a server.
  var form = document.getElementById('book-form');
  if (!form) return;
  var status = document.getElementById('form-status');

  function setError(input, msg) {
    var err = document.getElementById(input.id + '-err');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var firstBad = null;
    var checks = [
      [f.name, !f.name.value.trim(), 'Enter your name.'],
      [f.business, !f.business.value.trim(), 'Enter your business name.'],
      [f.email, !f.email.value.trim() || !f.email.checkValidity(), 'Enter an email we can reply to, like you@yourbusiness.com.'],
      [f.privacy, !f.privacy.checked, 'Please confirm you have read the Privacy Policy so we can reply.'],
      [f.adult, !f.adult.checked, 'This form is for adults booking for a business. Please confirm you are 18 or older.']
    ];
    checks.forEach(function (c) {
      setError(c[0], c[1] ? c[2] : '');
      if (c[1] && !firstBad) firstBad = c[0];
    });
    if (firstBad) {
      status.hidden = false;
      status.dataset.kind = 'error';
      status.textContent = 'A few details are missing. Check the highlighted fields.';
      firstBad.focus();
      return;
    }

    var body = [
      'Name: ' + f.name.value.trim(),
      'Business: ' + f.business.value.trim(),
      'Email: ' + f.email.value.trim(),
      'Phone: ' + (f.phone.value.trim() || 'not given'),
      'Interested in: ' + f.package.value,
      'Okay to email occasional updates: ' + (f.updates.checked ? 'yes' : 'no'),
      '',
      f.message.value.trim()
    ].join('\n');

    window.location.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent('Consult request: ' + f.business.value.trim()) +
      '&body=' + encodeURIComponent(body);

    status.hidden = false;
    status.dataset.kind = 'ok';
    status.textContent = 'Your email app should open with the request filled in. Press send there and weâ€™ll reply within one business day. If nothing opened, email ' + CONTACT_EMAIL + ' or call (970) 534-4163.';
  });

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
  });
})();
