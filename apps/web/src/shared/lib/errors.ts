import axios from 'axios';
import type { ApiErrorResponse } from '@/features/auth/types/auth.types';

export function getErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message)) {
      return 'Server uyg‘onyapti. 20–40 soniya kutib, qayta «Kirish»ni bosing.';
    }
    if (error.message === 'Network Error') {
      return 'Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.';
    }
  }
  if (error instanceof Error && error.message) {
    if (/timeout/i.test(error.message)) {
      return 'Server uyg‘onyapti. 20–40 soniya kutib, qayta «Kirish»ni bosing.';
    }
    return error.message;
  }
  return fallback;
}
