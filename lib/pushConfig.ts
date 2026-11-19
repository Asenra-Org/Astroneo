export const PUSH_CONFIG = {
  vapidPublicKey:
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BC2UyHeYVYT62tRrEIXOptnrY6a0uutrZxIt-MGJiqCRJhkxF_O4U0NGnfuuCj71_EFzAamcYFEsCO95bYfb9Uo',
  vapidPrivateKey:
    process.env.VAPID_PRIVATE_KEY || 'dioIrjZ5dBn4NCXfpKT_z1lceBN8ydITQp0TD72m0tI',
  vapidMailto: process.env.VAPID_MAILTO || 'mailto:contact@astroneo.space',
};
