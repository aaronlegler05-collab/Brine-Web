// Brine Creative: small, dependency-free site script.
// Google Analytics and the Meta Pixel load ONLY after the visitor clicks Accept,
// and never when the browser sends a Global Privacy Control signal.
(function () {
  document.documentElement.classList.add('js');

  // >>> Paste your IDs here. While both are empty, nothing loads and no notice shows.
  var GA_ID = 'G-FE8EQ3X87P';      // Google Analytics 4 Measurement ID, like 'G-XXXXXXXXXX'
  var PIXEL_ID = '1167517992469722';   // Meta Pixel ID, a 15-16 digit number
  var CONSENT_KEY = 'brine-consent';

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

  // Cookie consent. Nothing non-essential loads until the visitor accepts.
  var notice = document.getElementById('cookie-notice');
  var tracking = !!(GA_ID || PIXEL_ID);
  var gpc = navigator.globalPrivacyControl === true;
  function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) { /* storage blocked: asked again next visit */ } }
  var loaded = false;
  function loadTracking() {
    if (loaded || gpc) return;
    loaded = true;
    if (GA_ID) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA_ID);
    }
    if (PIXEL_ID) {
      /* Standard Meta Pixel loader */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('set', 'autoConfig', false, PIXEL_ID); // don't auto-collect form fields or button text
      window.fbq('init', PIXEL_ID);
      window.fbq('track', 'PageView');
    }
    // A booking request just went through: count it as a lead
    if (document.body.dataset.page === 'thanks') {
      if (window.gtag) window.gtag('event', 'generate_lead');
      if (window.fbq) window.fbq('track', 'Lead');
    }
  }
  function clearTrackingCookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^(_ga|_gid|_fbp|_fbc)/.test(name)) {
        [location.hostname, '.' + location.hostname.replace(/^www\./, '')].forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/; domain=' + d;
        });
        document.cookie = name + '=; Max-Age=0; path=/';
      }
    });
  }
  if (notice) {
    if (!tracking) {
      document.querySelectorAll('[data-open-notice]').forEach(function (b) { b.hidden = true; });
    } else {
      var choice = getConsent();
      if (choice === 'granted') loadTracking();
      else if (!choice && !gpc) notice.hidden = false;
      notice.querySelectorAll('[data-consent]').forEach(function (b) {
        b.addEventListener('click', function () {
          var was = getConsent();
          setConsent(b.dataset.consent);
          notice.hidden = true;
          if (b.dataset.consent === 'granted') loadTracking();
          else if (was === 'granted') { clearTrackingCookies(); location.reload(); }
        });
      });
      document.querySelectorAll('[data-open-notice]').forEach(function (b) {
        b.addEventListener('click', function () {
          notice.hidden = false;
          notice.querySelector('[data-consent]').focus();
        });
      });
    }
  }

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
      signal: AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (String(res.success) !== 'true') throw new Error(res.message || 'not sent');
        window.location.href = 'thanks.html';
      })
      .catch(function () {
        // Background send failed (slow reply, ad blocker, flaky network). Fall back to a normal
        // form post so the request still reaches us; FormSubmit then sends the visitor to thanks.html.
        status.textContent = 'Still sending...';
        [['_subject', data._subject], ['_cc', data._cc], ['_next', new URL('thanks.html', location.href).href]].forEach(function (p) {
          var input = form.querySelector('input[name="' + p[0] + '"]') || form.appendChild(Object.assign(document.createElement('input'), { type: 'hidden', name: p[0] }));
          input.value = p[1];
        });
        HTMLFormElement.prototype.submit.call(form);
      });
  });

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
  });
})();
