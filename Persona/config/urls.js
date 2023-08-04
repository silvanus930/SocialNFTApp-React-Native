import { ENV } from './env';

let baseApiUrl = '';

if (ENV === 'local') {
  baseApiUrl = 'http://localhost:8080';
}

if (ENV === 'development') {
  baseApiUrl = 'https://api.persona.nyc';
}

export const BASE_API_URL = baseApiUrl;
