function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  appName: 'NUR',
} as const;
