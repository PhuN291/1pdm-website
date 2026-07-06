// =============================================================
// /api/lead - Vercel serverless function nhan lead cho 1pdm.agency
// Lead di 2 kenh: ClickUp (chinh) + Google Sheet webhook (du phong)
// Secrets khai bao trong Vercel: Project > Settings > Environment Variables
//   CLICKUP_TOKEN        (bat buoc)  : ClickUp > Settings > Apps > API Token
//   CLICKUP_LIST_ID      (tuy chon)  : mac dinh 901819272476, List "[Lead] Website"
//   RECAPTCHA_SECRET     (nen co)    : secret key reCAPTCHA cua site
//   GOOGLE_SHEET_WEBHOOK (tuy chon)  : URL Apps Script ghi lead vao Google Sheet
// =============================================================

const RATE_LIMIT_PER_HOUR = 10;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Sai phuong thuc' });
  }

  const body = req.body || {};
  const val = (k) => (Array.isArray(body[k]) ? body[k].join(', ') : String(body[k] || ''));

  // 1. Honeypot: bot dien vao truong an thi gia vo thanh cong
  if (val('hp_field')) return res.status(200).json({ success: true });

  // 2. Gioi han tan suat theo IP (best effort tren moi instance)
  const ip = (String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown').trim();
  const bucket = ip + ':' + new Date().toISOString().slice(0, 13);
  const hits = global.__leadHits || (global.__leadHits = new Map());
  const n = (hits.get(bucket) || 0) + 1;
  hits.set(bucket, n);
  if (hits.size > 2000) hits.clear();
  if (n > RATE_LIMIT_PER_HOUR) {
    return res.status(429).json({ success: false, message: 'Ban gui qua nhieu, vui long thu lai sau' });
  }

  // 3. Xac thuc reCAPTCHA (neu co secret). Google loi mang thi cho qua
  //    de khong mat lead that; spam van bi honeypot + rate limit chan.
  const secret = process.env.RECAPTCHA_SECRET || '';
  if (secret) {
    const token = val('g-recaptcha-response');
    if (!token) return res.status(400).json({ success: false, message: 'Thieu xac thuc reCAPTCHA' });
    try {
      const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token, remoteip: ip })
      });
      const v = await r.json();
      if (!v.success) return res.status(400).json({ success: false, message: 'Xac thuc reCAPTCHA that bai' });
    } catch (e) {
      console.error('recaptcha network error', e);
    }
  }

  // 4. Gom du lieu form, bo cac truong ky thuat
  const skip = new Set(['hp_field', 'g-recaptcha-response', 'post_id', 'form_id', 'referer_title', 'queried_id', 'action', 'referrer', 'page_url']);
  const fields = {};
  for (const k of Object.keys(body)) {
    if (skip.has(k)) continue;
    const key = k.replace(/^form_fields\[(.+)\]$/, '$1');
    const v = val(k).replace(/<[^>]*>/g, '').trim().slice(0, 2000);
    if (v) fields[key] = v;
  }
  if (!Object.keys(fields).length) {
    return res.status(400).json({ success: false, message: 'Form trong' });
  }

  const page = val('page_url').slice(0, 300);
  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const name = fields.name || fields.ten || 'Khach moi';
  const service = fields.services || fields.dich_vu || '';
  const lines = Object.entries(fields).map(([k, v]) => k + ': ' + v);
  lines.push('Trang gui: ' + page, 'Thoi gian: ' + time);
  const description = lines.join('\n');

  // 5. Kenh chinh: tao task ClickUp
  let clickupOk = false;
  const cuToken = process.env.CLICKUP_TOKEN || '';
  const listId = process.env.CLICKUP_LIST_ID || '901819272476';
  if (cuToken) {
    try {
      const r = await fetch('https://api.clickup.com/api/v2/list/' + encodeURIComponent(listId) + '/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': cuToken },
        body: JSON.stringify({
          name: 'Lead website: ' + name + (service ? ' - ' + service : ''),
          description
        })
      });
      const d = await r.json().catch(() => ({}));
      clickupOk = r.ok && !!d.id;
      if (!clickupOk) console.error('clickup fail', r.status, JSON.stringify(d).slice(0, 300));
    } catch (e) {
      console.error('clickup error', e);
    }
  }

  // 6. Kenh du phong: Google Sheet qua Apps Script webhook
  let sheetOk = false;
  const hook = process.env.GOOGLE_SHEET_WEBHOOK || '';
  if (hook) {
    try {
      const r = await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time, page, ...fields })
      });
      sheetOk = r.ok;
    } catch (e) {
      console.error('sheet error', e);
    }
  }

  console.log('LEAD', JSON.stringify({ time, ip, page, name, clickupOk, sheetOk }));
  if (clickupOk || sheetOk) return res.status(200).json({ success: true });
  return res.status(500).json({ success: false, message: 'He thong dang ban, vui long lien he qua Zalo hoac hotline' });
};
