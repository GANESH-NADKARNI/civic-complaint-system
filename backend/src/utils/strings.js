'use strict';

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusEmoji(status) {
  return { pending: '🟡', in_progress: '🔵', resolved: '✅', rejected: '❌' }[status] || '⚪';
}

function statusLabel(status) {
  return { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected' }[status] || status;
}

// ─── Category map ─────────────────────────────────────────────────────────────

const categoryMap = {
  cat_theft:   { key: 'theft',            label: 'Theft' },
  cat_harass:  { key: 'harassment',        label: 'Harassment' },
  cat_missing: { key: 'missing_person',    label: 'Missing Person' },
  cat_traffic: { key: 'traffic_incident',  label: 'Traffic Incident' },
  cat_noise:   { key: 'noise_disturbance', label: 'Noise / Disturbance' },
  cat_cyber:   { key: 'cyber_crime',       label: 'Cyber Crime' },
  cat_other:   { key: 'other',             label: 'Other' },
};

function getCategoryByButtonId(id) {
  return categoryMap[id] || null;
}

// ─── Language picker ──────────────────────────────────────────────────────────

const universalWelcome =
  `🙏 Welcome to the *Karnataka Police Complaint Portal*.\n\nPlease select your language / ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ / भाषा चुनें`;

const langRows = [
  { id: 'lang_en', title: 'English',  description: 'Continue in English' },
  { id: 'lang_kn', title: 'ಕನ್ನಡ',    description: 'ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ' },
  { id: 'lang_hi', title: 'हिन्दी',   description: 'हिन्दी में जारी रखें' },
];

const langButtonIdMap = {
  lang_en: 'en',
  lang_kn: 'kn',
  lang_hi: 'hi',
};

// ─── String tables (per language) ────────────────────────────────────────────
// Add 'kn' and 'hi' keys to each entry for Kannada / Hindi support.
// Falls back to 'en' if a translation is missing.

const strings = {

  // ── Main Menu ──────────────────────────────────────────────────────────────
  mainMenuBody: {
    en: `📋 *Main Menu*\n\nHow can we help you today?`,
    kn: `📋 *ಮುಖ್ಯ ಮೆನು*\n\nನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?`,
    hi: `📋 *मुख्य मेनू*\n\nहम आपकी कैसे मदद कर सकते हैं?`,
  },
  mainMenuBtn: {
    en: 'Main Menu',
    kn: 'ಮೆನು',
    hi: 'मेनू',
  },
  mainMenuRows: {
    en: [
      { id: 'menu_register',  title: '📝 Register Complaint' },
      { id: 'menu_emergency', title: '🚨 Emergency Help' },
      { id: 'menu_track',     title: '🔍 Track Complaint' },
      { id: 'menu_contact',   title: '📞 Contact Department' },
    ],
    kn: [
      { id: 'menu_register',  title: '📝 ದೂರು ನೋಂದಾಯಿಸಿ' },
      { id: 'menu_emergency', title: '🚨 ತುರ್ತು ಸಹಾಯ' },
      { id: 'menu_track',     title: '🔍 ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ' },
      { id: 'menu_contact',   title: '📞 ಇಲಾಖೆ ಸಂಪರ್ಕ' },
    ],
    hi: [
      { id: 'menu_register',  title: '📝 शिकायत दर्ज करें' },
      { id: 'menu_emergency', title: '🚨 आपातकालीन सहायता' },
      { id: 'menu_track',     title: '🔍 शिकायत ट्रैक करें' },
      { id: 'menu_contact',   title: '📞 विभाग से संपर्क करें' },
    ],
  },

  // ── Category Menu ──────────────────────────────────────────────────────────
  categoryBody: {
    en: `📂 *Complaint Category*\n\nPlease select the type of complaint.`,
    kn: `📂 *ದೂರಿನ ವಿಭಾಗ*\n\nದೂರಿನ ಪ್ರಕಾರ ಆಯ್ಕೆ ಮಾಡಿ.`,
    hi: `📂 *शिकायत श्रेणी*\n\nकृपया शिकायत का प्रकार चुनें।`,
  },
  categoryBtn: {
    en: 'Select Category',
    kn: 'ವಿಭಾಗ ಆಯ್ಕೆ',
    hi: 'श्रेणी चुनें',
  },
  categoryRows: {
    en: [
      { id: 'cat_theft',   title: '🔓 Theft' },
      { id: 'cat_harass',  title: '😠 Harassment' },
      { id: 'cat_missing', title: '🔎 Missing Person' },
      { id: 'cat_traffic', title: '🚗 Traffic Incident' },
      { id: 'cat_noise',   title: '🔊 Noise / Disturbance' },
      { id: 'cat_cyber',   title: '💻 Cyber Crime' },
      { id: 'cat_other',   title: '📌 Other' },
    ],
    kn: [
      { id: 'cat_theft',   title: '🔓 ಕಳ್ಳತನ' },
      { id: 'cat_harass',  title: '😠 ಕಿರುಕುಳ' },
      { id: 'cat_missing', title: '🔎 ನಾಪತ್ತೆ ವ್ಯಕ್ತಿ' },
      { id: 'cat_traffic', title: '🚗 ಸಂಚಾರ ಘಟನೆ' },
      { id: 'cat_noise',   title: '🔊 ಗದ್ದಲ / ಅಶಾಂತಿ' },
      { id: 'cat_cyber',   title: '💻 ಸೈಬರ್ ಅಪರಾಧ' },
      { id: 'cat_other',   title: '📌 ಇತರೆ' },
    ],
    hi: [
      { id: 'cat_theft',   title: '🔓 चोरी' },
      { id: 'cat_harass',  title: '😠 उत्पीड़न' },
      { id: 'cat_missing', title: '🔎 लापता व्यक्ति' },
      { id: 'cat_traffic', title: '🚗 ट्रैफिक घटना' },
      { id: 'cat_noise',   title: '🔊 शोर / गड़बड़ी' },
      { id: 'cat_cyber',   title: '💻 साइबर अपराध' },
      { id: 'cat_other',   title: '📌 अन्य' },
    ],
  },

  // ── Complaint flow ─────────────────────────────────────────────────────────
  askDescription: {
    en: `📝 Please describe your complaint in detail.\n\n_Include what happened, when, and any other relevant details._`,
    kn: `📝 ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರನ್ನು ವಿವರವಾಗಿ ತಿಳಿಸಿ.\n\n_ಏನಾಯಿತು, ಯಾವಾಗ ಎಂಬುದನ್ನು ಸೇರಿಸಿ._`,
    hi: `📝 कृपया अपनी शिकायत विस्तार से बताएं।\n\n_क्या हुआ, कब हुआ, और अन्य जानकारी दें।_`,
  },
  descTooShort: {
    en: `⚠️ Please provide more detail — at least 10 characters.`,
    kn: `⚠️ ದಯವಿಟ್ಟು ಹೆಚ್ಚು ವಿವರ ನೀಡಿ — ಕನಿಷ್ಠ 10 ಅಕ್ಷರಗಳು.`,
    hi: `⚠️ कृपया अधिक विवरण दें — कम से कम 10 अक्षर।`,
  },
  askLocation: {
    en: `📍 Please share your *location*.\n\n• Type the area / address, OR\n• Tap 📎 → *Location* in WhatsApp to share GPS pin`,
    kn: `📍 ದಯವಿಟ್ಟು ನಿಮ್ಮ *ಸ್ಥಳ* ತಿಳಿಸಿ.\n\n• ವಿಳಾಸ ಟೈಪ್ ಮಾಡಿ, ಅಥವಾ\n• WhatsApp ನಲ್ಲಿ 📎 → *Location* ಒತ್ತಿ`,
    hi: `📍 कृपया अपना *स्थान* बताएं।\n\n• क्षेत्र / पता टाइप करें, या\n• WhatsApp में 📎 → *Location* दबाएं`,
  },
  askName: {
    en: `👤 Please enter your *full name*.`,
    kn: `👤 ದಯವಿಟ್ಟು ನಿಮ್ಮ *ಪೂರ್ಣ ಹೆಸರು* ನಮೂದಿಸಿ.`,
    hi: `👤 कृपया अपना *पूरा नाम* दर्ज करें।`,
  },
  askPhone: {
    en: `📞 Please enter your *10-digit phone number* for follow-up.`,
    kn: `📞 ದಯವಿಟ್ಟು ಅನುಸರಣೆಗಾಗಿ ನಿಮ್ಮ *10-ಅಂಕಿಯ ದೂರವಾಣಿ ಸಂಖ್ಯೆ* ನಮೂದಿಸಿ.`,
    hi: `📞 कृपया फॉलो-अप के लिए अपना *10 अंकों का फोन नंबर* दर्ज करें।`,
  },
  invalidPhone: {
    en: `⚠️ Please enter a valid 10-digit phone number.`,
    kn: `⚠️ ದಯವಿಟ್ಟು ಮಾನ್ಯ 10-ಅಂಕಿಯ ದೂರವಾಣಿ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.`,
    hi: `⚠️ कृपया एक वैध 10 अंकों का फोन नंबर दर्ज करें।`,
  },
  askPhoto: {
    en: `📎 You may attach a *photo* as evidence _(optional)_.\n\nSend a photo now, or tap *Skip* below.`,
    kn: `📎 ನೀವು ಪುರಾವೆಯಾಗಿ *ಫೋಟೋ* ಲಗತ್ತಿಸಬಹುದು _(ಐಚ್ಛಿಕ)_.\n\nಈಗ ಫೋಟೋ ಕಳುಹಿಸಿ ಅಥವಾ *ಬಿಟ್ಟುಬಿಡಿ* ಒತ್ತಿ.`,
    hi: `📎 आप साक्ष्य के रूप में एक *फोटो* संलग्न कर सकते हैं _(वैकल्पिक)_.\n\nअभी फोटो भेजें, या नीचे *Skip* दबाएं।`,
  },
  skipBtn: {
    en: 'Skip',
    kn: 'ಬಿಟ್ಟುಬಿಡಿ',
    hi: 'छोड़ें',
  },

  // ── Confirm ────────────────────────────────────────────────────────────────
  confirmBody: {
    en: (d) =>
      `✅ *Please confirm your complaint:*\n\n` +
      `📂 Category: ${d.categoryLabel}\n` +
      `📝 Description: ${d.description?.substring(0, 120)}\n` +
      `📍 Location: ${d.location}\n` +
      `👤 Name: ${d.name}\n` +
      `📞 Phone: ${d.phone}\n\n` +
      `Tap *Yes* to submit or *No* to cancel.`,
    kn: (d) =>
      `✅ *ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರನ್ನು ದೃಢೀಕರಿಸಿ:*\n\n` +
      `📂 ವಿಭಾಗ: ${d.categoryLabel}\n` +
      `📝 ವಿವರಣೆ: ${d.description?.substring(0, 120)}\n` +
      `📍 ಸ್ಥಳ: ${d.location}\n` +
      `👤 ಹೆಸರು: ${d.name}\n` +
      `📞 ದೂರವಾಣಿ: ${d.phone}\n\n` +
      `ಸಲ್ಲಿಸಲು *ಹೌದು* ಅಥವಾ ರದ್ದು ಮಾಡಲು *ಇಲ್ಲ* ಒತ್ತಿ.`,
    hi: (d) =>
      `✅ *कृपया अपनी शिकायत की पुष्टि करें:*\n\n` +
      `📂 श्रेणी: ${d.categoryLabel}\n` +
      `📝 विवरण: ${d.description?.substring(0, 120)}\n` +
      `📍 स्थान: ${d.location}\n` +
      `👤 नाम: ${d.name}\n` +
      `📞 फोन: ${d.phone}\n\n` +
      `सबमिट करने के लिए *हाँ* या रद्द करने के लिए *नहीं* दबाएं।`,
  },
  confirmYes: {
    en: '✅ Yes, Submit',
    kn: '✅ ಹೌದು, ಸಲ್ಲಿಸಿ',
    hi: '✅ हाँ, सबमिट करें',
  },
  confirmNo: {
    en: '❌ No, Cancel',
    kn: '❌ ಇಲ್ಲ, ರದ್ದು',
    hi: '❌ नहीं, रद्द करें',
  },

  // ── Post-submit ────────────────────────────────────────────────────────────
  submitted: {
    en: (id) =>
      `🎉 *Complaint Registered!*\n\n` +
      `🔖 Your ID: *${id}*\n\n` +
      `_Save this ID to track your complaint anytime._\n\n` +
      `We will act promptly. Type *MENU* to go back.`,
    kn: (id) =>
      `🎉 *ದೂರು ನೋಂದಾಯಿಸಲಾಗಿದೆ!*\n\n` +
      `🔖 ನಿಮ್ಮ ID: *${id}*\n\n` +
      `_ಈ ID ಉಳಿಸಿಕೊಳ್ಳಿ — ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಬಳಸಿ._\n\n` +
      `ನಾವು ತ್ವರಿತವಾಗಿ ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳುತ್ತೇವೆ. ಹಿಂದೆ ಹೋಗಲು *MENU* ಟೈಪ್ ಮಾಡಿ.`,
    hi: (id) =>
      `🎉 *शिकायत दर्ज हो गई!*\n\n` +
      `🔖 आपकी ID: *${id}*\n\n` +
      `_यह ID सेव करें — शिकायत ट्रैक करने के लिए उपयोग करें।_\n\n` +
      `हम शीघ्र कार्रवाई करेंगे। वापस जाने के लिए *MENU* टाइप करें।`,
  },
  cancelled: {
    en: `❌ Complaint cancelled.\n\nType *MENU* to start over.`,
    kn: `❌ ದೂರು ರದ್ದು ಮಾಡಲಾಗಿದೆ.\n\nಮತ್ತೆ ಪ್ರಾರಂಭಿಸಲು *MENU* ಟೈಪ್ ಮಾಡಿ.`,
    hi: `❌ शिकायत रद्द कर दी गई।\n\nदोबारा शुरू करने के लिए *MENU* टाइप करें।`,
  },
  errorMsg: {
    en: `⚠️ Something went wrong on our end. Please try again.\n\nType *MENU* to restart.`,
    kn: `⚠️ ನಮ್ಮ ಕಡೆಯಿಂದ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.\n\nಮರುಪ್ರಾರಂಭಿಸಲು *MENU* ಟೈಪ್ ಮಾಡಿ.`,
    hi: `⚠️ हमारी तरफ से कुछ गलत हो गया। कृपया पुनः प्रयास करें।\n\nपुनः आरंभ करने के लिए *MENU* टाइप करें।`,
  },

  // ── Tracking ───────────────────────────────────────────────────────────────
  askTrackId: {
    en: `🔍 Enter your *Complaint ID* (e.g. KA-2026-00421).`,
    kn: `🔍 ನಿಮ್ಮ *ದೂರು ID* ನಮೂದಿಸಿ (ಉದಾ: KA-2026-00421).`,
    hi: `🔍 अपनी *शिकायत ID* दर्ज करें (जैसे KA-2026-00421)।`,
  },
  trackNotFound: {
    en: (id) => `❌ No complaint found with ID *${id}*.\n\nCheck the ID and try again, or type *MENU* to go back.`,
    kn: (id) => `❌ ID *${id}* ನೊಂದಿಗೆ ಯಾವುದೇ ದೂರು ಕಂಡುಬಂದಿಲ್ಲ.\n\nID ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ *MENU* ಟೈಪ್ ಮಾಡಿ.`,
    hi: (id) => `❌ ID *${id}* के साथ कोई शिकायत नहीं मिली।\n\nID जांचें और पुनः प्रयास करें, या *MENU* टाइप करें।`,
  },
  trackResult: {
    en: (c) =>
      `📋 *Complaint Status*\n\n` +
      `🔖 ID: ${c.complaint_id}\n` +
      `📂 Category: ${c.category.replace(/_/g, ' ')}\n` +
      `📊 Status: ${statusEmoji(c.status)} ${statusLabel(c.status)}\n` +
      `📅 Filed: ${new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n\n` +
      `_Type MENU to return to the main menu._`,
    kn: (c) =>
      `📋 *ದೂರಿನ ಸ್ಥಿತಿ*\n\n` +
      `🔖 ID: ${c.complaint_id}\n` +
      `📂 ವಿಭಾಗ: ${c.category.replace(/_/g, ' ')}\n` +
      `📊 ಸ್ಥಿತಿ: ${statusEmoji(c.status)} ${statusLabel(c.status)}\n` +
      `📅 ದಾಖಲಿಸಲಾಗಿದೆ: ${new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n\n` +
      `_ಮುಖ್ಯ ಮೆನುಗೆ ಹಿಂದಿರುಗಲು MENU ಟೈಪ್ ಮಾಡಿ._`,
    hi: (c) =>
      `📋 *शिकायत की स्थिति*\n\n` +
      `🔖 ID: ${c.complaint_id}\n` +
      `📂 श्रेणी: ${c.category.replace(/_/g, ' ')}\n` +
      `📊 स्थिति: ${statusEmoji(c.status)} ${statusLabel(c.status)}\n` +
      `📅 दर्ज: ${new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n\n` +
      `_मुख्य मेनू पर वापस जाने के लिए MENU टाइप करें।_`,
  },

  // ── Emergency / Contact ────────────────────────────────────────────────────
  emergency: {
    en:
      `🚨 *EMERGENCY HELP*\n\n` +
      `📞 *Police Control Room: 100*\n` +
      `📞 *Women Helpline: 1091*\n` +
      `📞 *Ambulance: 108*\n` +
      `📞 *Fire Brigade: 101*\n\n` +
      `_For non-emergency complaints, type MENU._`,
    kn:
      `🚨 *ತುರ್ತು ಸಹಾಯ*\n\n` +
      `📞 *ಪೊಲೀಸ್ ನಿಯಂತ್ರಣ ಕೊಠಡಿ: 100*\n` +
      `📞 *ಮಹಿಳಾ ಸಹಾಯವಾಣಿ: 1091*\n` +
      `📞 *ಆಂಬ್ಯುಲೆನ್ಸ್: 108*\n` +
      `📞 *ಅಗ್ನಿಶಾಮಕ: 101*\n\n` +
      `_ತುರ್ತುರಹಿತ ದೂರುಗಳಿಗೆ MENU ಟೈಪ್ ಮಾಡಿ._`,
    hi:
      `🚨 *आपातकालीन सहायता*\n\n` +
      `📞 *पुलिस कंट्रोल रूम: 100*\n` +
      `📞 *महिला हेल्पलाइन: 1091*\n` +
      `📞 *एम्बुलेंस: 108*\n` +
      `📞 *दमकल: 101*\n\n` +
      `_गैर-आपातकालीन शिकायतों के लिए MENU टाइप करें।_`,
  },
  contactDept: {
    en:
      `📞 *Department Contacts*\n\n` +
      `🏛️ District HQ: 0831-2404000\n` +
      `👮 Traffic Police: 0831-2404100\n` +
      `💻 Cyber Cell: cybercell@ksp.gov.in\n` +
      `📍 Visit your nearest police station for in-person help.\n\n` +
      `_Type MENU to return._`,
    kn:
      `📞 *ಇಲಾಖೆ ಸಂಪರ್ಕಗಳು*\n\n` +
      `🏛️ ಜಿಲ್ಲಾ ಮುಖ್ಯಾಲಯ: 0831-2404000\n` +
      `👮 ಸಂಚಾರ ಪೊಲೀಸ್: 0831-2404100\n` +
      `💻 ಸೈಬರ್ ಸೆಲ್: cybercell@ksp.gov.in\n` +
      `📍 ವೈಯಕ್ತಿಕ ಸಹಾಯಕ್ಕಾಗಿ ನಿಮ್ಮ ಹತ್ತಿರದ ಠಾಣೆಗೆ ಭೇಟಿ ನೀಡಿ.\n\n` +
      `_ಹಿಂದಿರುಗಲು MENU ಟೈಪ್ ಮಾಡಿ._`,
    hi:
      `📞 *विभाग संपर्क*\n\n` +
      `🏛️ जिला मुख्यालय: 0831-2404000\n` +
      `👮 ट्रैफिक पुलिस: 0831-2404100\n` +
      `💻 साइबर सेल: cybercell@ksp.gov.in\n` +
      `📍 व्यक्तिगत सहायता के लिए निकटतम थाने में जाएं।\n\n` +
      `_वापस जाने के लिए MENU टाइप करें।_`,
  },
};

// ─── s() — language-aware string getter ──────────────────────────────────────
// Usage: s(lang, 'key')           → plain string
//        s(lang, 'key', arg)      → calls the function with arg
//        s(lang, 'mainMenuRows')  → returns array

function s(lang, key, ...args) {
  const entry = strings[key];
  if (!entry) {
    console.warn(`[strings] Missing key: "${key}"`);
    return '';
  }

  // Resolve language with 'en' fallback
  const val = entry[lang] ?? entry['en'];
  if (val === undefined) {
    console.warn(`[strings] No value for key "${key}" lang "${lang}"`);
    return '';
  }

  if (typeof val === 'function') return val(...args);
  return val;
}

// ─── Legacy getString (plain English, kept for compatibility) ─────────────────

function getString(key, ...args) {
  return s('en', key, ...args);
}

module.exports = {
  s,
  getString,
  langRows,
  langButtonIdMap,
  universalWelcome,
  getCategoryByButtonId,
  categoryMap,
  statusEmoji,
  statusLabel,
};