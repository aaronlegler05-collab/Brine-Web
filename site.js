// Brine Creative: small, dependency-free site script.
// No analytics, no tracking, no third-party code. The only browser storage is
// one localStorage key remembering that the cookie notice was dismissed.
(function () {
  document.documentElement.classList.add('js');

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

  // Booking form: validates, then posts to FormSubmit, which emails us the request and emails the visitor a copy.
  var form = document.getElementById('book-form');
  if (!form) return;
  var status = document.getElementById('form-status');

  function setError(input, msg) {
    var err = document.getElementById(input.id + '-err');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  }

  form.addEventListener('submit', function (e) {
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
      e.preventDefault();
      status.hidden = false;
      status.dataset.kind = 'error';
      status.textContent = 'A few details are missing. Check the highlighted fields.';
      firstBad.focus();
      return;
    }

    // Send in the background so the visitor never leaves our site. The visitor is CC'd, so they get a copy.
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var data = Object.fromEntries(new FormData(form));
    data._subject = 'Brine Creative consult request: ' + data.business;
    data._cc = data.email;
    btn.disabled = true;
    status.hidden = false;
    status.dataset.kind = 'ok';
    status.textContent = 'Sending your request...';

    fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (String(res.success) !== 'true') throw new Error(res.message || 'not sent');
        window.location.href = 'thanks.html';
      })
      .catch(function () {
        btn.disabled = false;
        status.dataset.kind = 'error';
        status.textContent = "Sorry, that didn't go through. Please try again, or email BrineCreative@brinemarketing.com or call (970) 587-3824.";
      });
  });

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
  });
})();
