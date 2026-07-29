import axios from 'axios';
import type { ApiErrorResponse } from '@/features/auth/types/auth.types';

export function getErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message)) {
      return 'Ulanish sekin. Qayta «Kirish»ni bosing.';
    }
    if (
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504
    ) {
      return 'Server band. Bir oz kutib qayta urinib ko‘ring.';
    }
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return 'Internet yoki server xatosi. Qayta urinib ko‘ring.';
    }
  }
  if (error instanceof Error && error.message) {
    if (/timeout/i.test(error.message)) {
      return 'Ulanish sekin. Qayta «Kirish»ni bosing.';
    }
    return error.message;
  }
  return fallback;
}
