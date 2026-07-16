import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens as exchangeCodeForTokensGeneric,
  getGoogleEmail as getGoogleEmailGeneric,
  refreshAccessToken,
} from "@/lib/google-oauth";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/integrations/google-sheets/callback`;
}

export function buildGoogleSheetsAuthUrl(state: string): string {
  return buildGoogleAuthUrl({ redirectUri: getRedirectUri(), scope: SHEETS_SCOPE, state });
}

export async function exchangeCodeForTokens(code: string) {
  return exchangeCodeForTokensGeneric(code, getRedirectUri());
}

export const getGoogleEmail = getGoogleEmailGeneric;
export { refreshAccessToken };

export async function appendSheetRowsWithToken(params: {
  accessToken: string;
  spreadsheetId: string;
  sheetName: string;
  rows: string[][];
}): Promise<{ ok: boolean; error?: string }> {
  const range = encodeURIComponent(`${params.sheetName}!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: params.rows }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return {
      ok: false,
      error: data?.error?.message ?? `Lỗi Google Sheets API (${res.status})`,
    };
  }
  return { ok: true };
}

export async function appendSheetRowWithToken(params: {
  accessToken: string;
  spreadsheetId: string;
  sheetName: string;
  row: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const range = encodeURIComponent(`${params.sheetName}!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [params.row] }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return {
      ok: false,
      error: data?.error?.message ?? `Lỗi Google Sheets API (${res.status})`,
    };
  }
  return { ok: true };
}

export async function appendSheetRow(params: {
  refreshToken: string;
  spreadsheetId: string;
  sheetName: string;
  row: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const accessToken = await refreshAccessToken(params.refreshToken);
  if (!accessToken) {
    return { ok: false, error: "Không thể làm mới access token Google" };
  }
  return appendSheetRowWithToken({ accessToken, ...params });
}

export async function verifySpreadsheetAccess(params: {
  refreshToken: string;
  spreadsheetId: string;
}): Promise<{ ok: boolean; title?: string; error?: string }> {
  const accessToken = await refreshAccessToken(params.refreshToken);
  if (!accessToken) {
    return { ok: false, error: "Không thể làm mới access token Google" };
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}?fields=properties.title`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return {
      ok: false,
      error:
        res.status === 404
          ? "Không tìm thấy spreadsheet — kiểm tra lại Spreadsheet ID"
          : res.status === 403
            ? "Không có quyền truy cập — hãy chia sẻ sheet với tài khoản Google đã kết nối"
            : `Lỗi Google Sheets API (${res.status})`,
    };
  }
  const data = await res.json();
  return { ok: true, title: data.properties?.title };
}
