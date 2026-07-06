/*
 * leads.js - chuyen form Elementor sang gui ve /api/lead
 * CHUA GAN VAO TRANG. Bat o Giai doan 2 bang cach chen truoc </body>:
 *   <script src="/assets/leads.js" defer></script>
 * Giao dien form giu nguyen 100%, chi thay noi nhan du lieu.
 */
(function () {
  'use strict';

  function showMessage(form, ok, text) {
    var old = form.querySelector('.lead-js-message');
    if (old) old.remove();
    var div = document.createElement('div');
    div.className = 'lead-js-message elementor-message ' + (ok ? 'elementor-message-success' : 'elementor-message-danger');
    div.setAttribute('role', 'alert');
    div.textContent = text;
    form.appendChild(div);
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = busy;
      if (busy) { btn.dataset.oldText = btn.textContent; btn.textContent = 'Đang gửi...'; }
      else if (btn.dataset.oldText) { btn.textContent = btn.dataset.oldText; }
    }
  }

  // Honeypot: o input an, nguoi that khong thay, bot tu dien vao
  function addHoneypot(form) {
    if (form.querySelector('[name="hp_field"]')) return;
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.name = 'hp_field';
    inp.setAttribute('autocomplete', 'off');
    inp.setAttribute('tabindex', '-1');
    inp.setAttribute('aria-hidden', 'true');
    inp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    form.appendChild(inp);
  }
  function initHoneypots() {
    document.querySelectorAll('form.elementor-form').forEach(addHoneypot);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHoneypots);
  } else {
    initHoneypots();
  }
  // Form trong popup co the sinh sau, quet lai dinh ky nhe nhang
  setInterval(initHoneypots, 3000);

  // Bat submit o pha capture de chan handler ajax cua Elementor
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.classList || !form.classList.contains('elementor-form')) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    var fd = new FormData(form);
    fd.append('page_url', window.location.href);

    // Gui dang urlencoded de serverless function doc duoc truc tiep
    var params = new URLSearchParams();
    fd.forEach(function (v, k) { if (typeof v === 'string') params.append(k, v); });

    setBusy(form, true);
    fetch('/api/lead', { method: 'POST', body: params })
      .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
      .then(function (data) {
        setBusy(form, false);
        if (data && data.success) {
          showMessage(form, true, 'Gửi thành công. 1PDM sẽ liên hệ với anh chị sớm nhất.');
          form.reset();
          if (window.dataLayer) {
            // pdm_lead: dung dung ten su kien ma trigger Google Ads dang cho
            // (da doi chieu truc tiep trong GTM ngay 06/07/2026, khong duoc doi ten)
            window.dataLayer.push({
              event: 'pdm_lead',
              form_id: form.getAttribute('id') || 'elementor-form',
              page_path: window.location.pathname
            });
            // generate_lead: su kien chuan de dung them cho GA4 ve sau
            window.dataLayer.push({ event: 'generate_lead' });
          }
        } else {
          showMessage(form, false, (data && data.message) || 'Có lỗi xảy ra, vui lòng liên hệ qua Zalo hoặc hotline.');
        }
      })
      .catch(function () {
        setBusy(form, false);
        showMessage(form, false, 'Không gửi được, vui lòng liên hệ qua Zalo hoặc hotline.');
      });
  }, true);
})();
