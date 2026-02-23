import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as { message?: string } | undefined;
  if (typeof data?.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  return fallback;
}
