'use strict';

const express = require('express');
const { query } = require('../db');
const { generateComplaintId } = require('../utils/complaintId');
const {
  s, langRows, langButtonIdMap, universalWelcome,
  getCategoryByButtonId,
} = require('../utils/strings');

const router = express.Router();

// ─── Meta Cloud API helpers ───────────────────────────────────────────────────

function isMock() {
  const token = process.env.WA_ACCESS_TOKEN || '';
  const phoneId = process.env.WA_PHONE_NUMBER_ID || '';
  return !token || !phoneId || token.startsWith('EAAxxxxx') || phoneId === '1234567890123456';
}

async function metaPost(payload) {
  if (isMock()) {
    const type = payload.type || payload.status || 'unknown';
    console.log(`[MOCK metaPost type=${type}]`);
    return;
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      }
    );
   if (!res.ok) {
  const raw = await res.text().catch(() => '');
  console.error('Meta API error status:', res.status, res.statusText);
  console.error('Meta API error body:', raw);
}
  } catch (err) {
    console.error('Meta send failed (network):', err.message);
  }
}

async function sendText(to, body) {
  if (isMock()) { console.log(`[TEXT→${to}]: ${body.substring(0,120)}`); return; }
  await metaPost({ messaging_product: 'whatsapp', to, type: 'text', text: { body, preview_url: false } });
}

async function sendList(to, bodyText, buttonLabel, sections) {
  if (isMock()) {
    console.log(`[LIST→${to}]: ${bodyText}`);
    sections.forEach(sec => sec.rows.forEach(r => console.log(`  [${r.id}] ${r.title}`)));
    return;
  }
  await metaPost({
    messaging_product: 'whatsapp', to, type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: { button: buttonLabel, sections },
    },
  });
}

async function sendButtons(to, bodyText, buttons) {
  if (isMock()) {
    console.log(`[BUTTONS→${to}]: ${bodyText}`);
    buttons.forEach(b => console.log(`  [${b.id}] ${b.title}`));
    return;
  }
  await metaPost({
    messaging_product: 'whatsapp', to, type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
    },
  });
}

async function markRead(msgId) {
  if (isMock()) return;
  metaPost({ messaging_product: 'whatsapp', status: 'read', message_id: msgId }).catch(() => {});
}

async function resolveMediaUrl(mediaId) {
  if (isMock() || !mediaId) return null;
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}` },
    });
    return (await res.json()).url || null;
  } catch { return null; }
}

// ─── Composed send helpers ────────────────────────────────────────────────────

async function sendLangPicker(to) {
  await sendList(to, universalWelcome, 'Select Language', [{ rows: langRows }]);
}

async function sendMainMenu(to, lang) {
  await sendList(to, s(lang, 'mainMenuBody'), 'Choose Option', [{ rows: s(lang, 'mainMenuRows') }]);
}

async function sendCategoryMenu(to, lang) {
  await sendList(to, s(lang, 'categoryBody'), 'Choose Category', [{ rows: s(lang, 'categoryRows') }]);
}

async function sendConfirm(to, lang, data) {
  await sendButtons(to, s(lang, 'confirmBody', data), [
    { id: 'confirm_yes', title: 'Submit' },
    { id: 'confirm_no',  title: 'Cancel' },
  ]);
}

async function sendSkipPhoto(to, lang) {
  await sendButtons(to, s(lang, 'askPhoto'), [
    { id: 'photo_skip', title: 'Skip Photo' },
  ]);
}

// ─── Session helpers ──────────────────────────────────────────────────────────

async function getSession(phone) {
  const r = await query('SELECT * FROM whatsapp_sessions WHERE phone_number = $1', [phone]);
  return r.rows[0] || null;
}

async function upsertSession(phone, state, lang, data = {}) {
  await query(
    `INSERT INTO whatsapp_sessions (phone_number, state, language, session_data)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (phone_number) DO UPDATE
     SET state=$2, language=$3, session_data=$4, updated_at=NOW()`,
    [phone, state, lang, JSON.stringify(data)]
  );
}

async function clearSession(phone, lang) {
  await upsertSession(phone, 'MAIN_MENU', lang, {});
}

// ─── GET — Meta webhook verification ─────────────────────────────────────────

router.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    console.log('✅ Meta webhook verified');
    return res.status(200).send(challenge);
  }
  console.warn('❌ Webhook verification failed — check WA_VERIFY_TOKEN');
  res.sendStatus(403);
});

// ─── POST — Incoming messages ─────────────────────────────────────────────────

router.post('/webhook', express.json(), async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;
    const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return;

    const from  = msg.from;
    const msgId = msg.id;

    let text     = '';
    let buttonId = null;
    let mediaId  = null;
    let lat = null, lng = null;

    switch (msg.type) {
      case 'text':
        text = (msg.text?.body || '').trim();
        break;
      case 'interactive':
        buttonId = msg.interactive?.list_reply?.id || msg.interactive?.button_reply?.id || null;
        text     = buttonId || '';
        break;
      case 'image':
        mediaId = msg.image?.id;
        text    = msg.image?.caption?.trim() || '';
        break;
      case 'document':
        mediaId = msg.document?.id;
        break;
      case 'location':
        lat  = msg.location?.latitude;
        lng  = msg.location?.longitude;
        text = `${lat}, ${lng}`;
        break;
    }

    markRead(msgId);

    const upper = text.toUpperCase();
    const session = await getSession(from);

    // New user — start lang selection
    if (!session) {
      await upsertSession(from, 'LANG_SELECT', 'en', {});
      await sendLangPicker(from);
      return;
    }

    // Destructure early so `state` is available for the greeting reset check below
    const { state, language: lang, session_data } = session;
    const data = session_data || {};

    // FIX 1: Only allow MENU/greeting reset when NOT in LANG_SELECT state,
    // so language selection flow isn't interrupted by the user's text.
    if (state !== 'LANG_SELECT' && (['MENU', 'HI', 'HELLO', 'START', 'HELP'].includes(upper) || buttonId === 'menu_back')) {
      await upsertSession(from, 'LANG_SELECT', lang, {});
      await sendLangPicker(from);
      return;
    }

    switch (state) {

      case 'LANG_SELECT': {
        const chosen = langButtonIdMap[buttonId];
        if (!chosen) { await sendLangPicker(from); return; }
        await upsertSession(from, 'MAIN_MENU', chosen, {});
        await sendMainMenu(from, chosen);
        break;
      }

      case 'MAIN_MENU': {
        // FIX 2: Compare buttonId in lowercase (Meta sends ids as lowercase)
        const action = (buttonId || '').toLowerCase();
        if      (action === 'menu_register' || text === '1') {
          await upsertSession(from, 'COMPLAINT_CATEGORY', lang, {});
          await sendCategoryMenu(from, lang);
        } else if (action === 'menu_emergency' || text === '2') {
          await sendText(from, s(lang, 'emergency'));
        } else if (action === 'menu_track' || text === '3') {
          await upsertSession(from, 'TRACK_COMPLAINT', lang, {});
          await sendText(from, s(lang, 'askTrackId'));
        } else if (action === 'menu_contact' || text === '4') {
          await sendText(from, s(lang, 'contactDept'));
        } else {
          await sendMainMenu(from, lang);
        }
        break;
      }

      case 'COMPLAINT_CATEGORY': {
        const textFallbackMap = {
          '1':'cat_theft','2':'cat_harass','3':'cat_missing',
          '4':'cat_traffic','5':'cat_noise','6':'cat_cyber','7':'cat_other',
        };
        const catId = buttonId || textFallbackMap[text] || null;
        const cat   = catId ? getCategoryByButtonId(catId, lang) : null;
        if (!cat) { await sendCategoryMenu(from, lang); return; }
        await upsertSession(from, 'COMPLAINT_DESC', lang, { ...data, category: cat.key, categoryLabel: cat.label });
        await sendText(from, s(lang, 'askDescription'));
        break;
      }

      case 'COMPLAINT_DESC': {
        if (!text || text.length < 10) { await sendText(from, s(lang, 'descTooShort')); return; }
        await upsertSession(from, 'COMPLAINT_LOCATION', lang, { ...data, description: text });
        await sendText(from, s(lang, 'askLocation'));
        break;
      }

      case 'COMPLAINT_LOCATION': {
        let locationText = text;
        let locLat = null, locLng = null;
        if (lat && lng) {
          locationText = `GPS ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`;
          locLat = lat; locLng = lng;
        } else if (!text) {
          await sendText(from, s(lang, 'askLocation')); return;
        }
        await upsertSession(from, 'COMPLAINT_NAME', lang, { ...data, location: locationText, lat: locLat, lng: locLng });
        await sendText(from, s(lang, 'askName'));
        break;
      }

      case 'COMPLAINT_NAME': {
        if (!text || text.length < 2) { await sendText(from, s(lang, 'askName')); return; }
        await upsertSession(from, 'COMPLAINT_PHONE', lang, { ...data, name: text });
        await sendText(from, s(lang, 'askPhone'));
        break;
      }

      case 'COMPLAINT_PHONE': {
        const digits = text.replace(/\D/g, '');
        if (digits.length < 10) { await sendText(from, s(lang, 'invalidPhone')); return; }
        await upsertSession(from, 'COMPLAINT_PHOTO', lang, { ...data, phone: digits });
        await sendSkipPhoto(from, lang);
        break;
      }

      case 'COMPLAINT_PHOTO': {
        const skipped    = buttonId === 'photo_skip' || upper === 'SKIP';
        const attachment = (!skipped && mediaId) ? await resolveMediaUrl(mediaId) : null;
        const newData    = { ...data, attachment };
        await upsertSession(from, 'COMPLAINT_CONFIRM', lang, newData);
        await sendConfirm(from, lang, { ...newData, phone: data.phone || from });
        break;
      }

      case 'COMPLAINT_CONFIRM': {
        // FIX 3: Compare buttonId in lowercase (Meta sends ids as lowercase)
        const action = (buttonId || '').toLowerCase();
        if (action === 'confirm_yes' || upper === 'YES') {
          try {
            const complaintId = await generateComplaintId();
            await query(
              `INSERT INTO complaints
               (complaint_id, category, description, location_text, location_lat, location_lng,
                complainant_name, complainant_phone, attachment_url, language)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [
                complaintId, data.category, data.description, data.location,
                data.lat || null, data.lng || null,
                data.name, data.phone || from, data.attachment || null, lang,
              ]
            );
            await clearSession(from, lang);
            await sendText(from, s(lang, 'submitted', complaintId));
          } catch (err) {
            console.error('Save complaint error:', err);
            await sendText(from, s(lang, 'errorMsg'));
          }
        } else if (action === 'confirm_no' || upper === 'NO') {
          await clearSession(from, lang);
          await sendText(from, s(lang, 'cancelled'));
        } else {
          await sendConfirm(from, lang, { ...data, phone: data.phone || from });
        }
        break;
      }

      case 'TRACK_COMPLAINT': {
        const trackId = text.toUpperCase();
        if (!trackId.match(/^[A-Z]{2}-\d{4}-\d{5}$/)) {
          await sendText(from, s(lang, 'trackNotFound', trackId)); return;
        }
        const result = await query(
          'SELECT complaint_id, category, status, created_at FROM complaints WHERE complaint_id = $1',
          [trackId]
        );
        if (!result.rows.length) {
          await sendText(from, s(lang, 'trackNotFound', trackId));
        } else {
          await sendText(from, s(lang, 'trackResult', result.rows[0], lang));
          await upsertSession(from, 'MAIN_MENU', lang, {});
        }
        break;
      }

      default: {
        await upsertSession(from, 'MAIN_MENU', lang, {});
        await sendMainMenu(from, lang);
      }
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

module.exports = router;