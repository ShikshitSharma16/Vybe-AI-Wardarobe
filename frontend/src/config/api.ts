// Backend address for the VYBE mobile app
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredApiUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_API_URL. Set it in frontend/.env and restart Expo.'
  );
}

export const API_URL = configuredApiUrl.replace(/\/+$/, '');
