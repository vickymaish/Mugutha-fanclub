'use strict';

// WhatsApp message templates for Mugutha FC.
//
// One place defines each template: what we SUBMIT to Meta for approval
// (scripts/submit-templates.js) and how we FILL IT IN when sending
// (buildComponents below). Keep the two in step: if you change the
// wording here, re-submit it to Meta before sending.
//
// Rules Meta enforces (templates get rejected otherwise):
// - Variables are {{1}}, {{2}}... in order, and every one needs an example.
// - The body can't start or end with a variable, and variable values
//   can't contain line breaks, tabs or more than 4 spaces in a row.
// - UTILITY = about the member's own membership or payment (cheaper).
//   MARKETING = news and promotions. Meta has the final say on category.

const LANGUAGE = 'en';
const STOP_FOOTER = 'Reply STOP to stop these messages';

const TEMPLATES = {
  match_day_alert: {
    category: 'MARKETING',
    params: ['name', 'opponent', 'when', 'venue', 'weather'],
    components: [
      { type: 'HEADER', format: 'TEXT', text: 'Match day is coming' },
      {
        type: 'BODY',
        text: 'Hi {{1}}, Mugutha FC plays {{2}} on {{3}} at {{4}}. Weather forecast: {{5}}. Come with your voice and bring a friend. Tuko pamoja!',
        example: { body_text: [['James', 'Kahawa United', 'Saturday 15 Nov, 3:00 pm', 'Mugutha Grounds, Ruiru', '24°C, light rain likely']] },
      },
      { type: 'FOOTER', text: STOP_FOOTER },
      {
        type: 'BUTTONS',
        buttons: [{
          type: 'URL',
          text: 'Get directions',
          url: 'https://www.google.com/maps/search/?api=1&query={{1}}',
          example: ['Mugutha+Grounds+Ruiru'],
        }],
      },
    ],
    // The directions button needs the venue as a URL-safe search term.
    buttonParams: (p) => [encodeURIComponent(p.mapQuery || p.venue).replace(/%20/g, '+')],
  },

  membership_welcome: {
    category: 'UTILITY',
    params: ['name', 'tier', 'expires', 'memberNumber'],
    components: [
      {
        type: 'BODY',
        text: 'Welcome to Mugutha FC, {{1}}! Your {{2}} membership is active until {{3}}. Your member number is {{4}}. Tap Get my card to receive your member card.',
        example: { body_text: [['James', 'Gold', '14 Nov 2027', 'MFC-0148']] },
      },
      { type: 'FOOTER', text: 'Mugutha FC, Ruiru' },
      { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Get my card' }] },
    ],
  },

  payment_receipt: {
    category: 'UTILITY',
    params: ['name', 'amount', 'item', 'reference'],
    components: [
      {
        type: 'BODY',
        text: 'Payment received, thank you {{1}}. We got KSh {{2}} for {{3}}. M-Pesa reference: {{4}}. Keep this message as your receipt.',
        example: { body_text: [['James', '2,000', 'Gold membership 2026/27', 'SKB7H2X9QP']] },
      },
      { type: 'FOOTER', text: 'Mugutha FC, Ruiru' },
    ],
  },

  renewal_reminder: {
    category: 'UTILITY',
    params: ['name', 'tier', 'expires', 'amount'],
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your Mugutha FC {{2}} membership ends on {{3}}. Renew for KSh {{4}} to keep your membership active. Tap Renew now and we will send you an M-Pesa prompt.',
        example: { body_text: [['James', 'Gold', '14 Nov 2027', '2,000']] },
      },
      { type: 'FOOTER', text: STOP_FOOTER },
      { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Renew now' }] },
    ],
  },

  club_update: {
    category: 'MARKETING',
    params: ['name', 'message'],
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, here is an update from Mugutha FC: {{2}} Reply MENU for fixtures, membership and more.',
        example: { body_text: [['James', 'We won 2-1 against Kahawa United. Thank you for the support!']] },
      },
      { type: 'FOOTER', text: STOP_FOOTER },
    ],
  },
};

// Meta rejects variable values with line breaks, tabs or 4+ spaces in a row.
function cleanValue(value) {
  return String(value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim();
}

/** Builds the `components` array for sending template `name` with `values`. */
function buildComponents(name, values = {}) {
  const def = TEMPLATES[name];
  if (!def) throw new Error(`Unknown WhatsApp template: ${name}`);

  const missing = def.params.filter((key) => !cleanValue(values[key]));
  if (missing.length) throw new Error(`Template ${name} is missing: ${missing.join(', ')}`);

  const components = [{
    type: 'body',
    parameters: def.params.map((key) => ({ type: 'text', text: cleanValue(values[key]) })),
  }];

  if (def.buttonParams) {
    def.buttonParams(values).forEach((text, index) => {
      components.push({ type: 'button', sub_type: 'url', index: String(index), parameters: [{ type: 'text', text }] });
    });
  }
  return components;
}

/** The definition exactly as Meta's "create template" API expects it. */
function submissionPayload(name) {
  const def = TEMPLATES[name];
  return { name, language: LANGUAGE, category: def.category, components: def.components };
}

module.exports = { TEMPLATES, LANGUAGE, buildComponents, submissionPayload };
