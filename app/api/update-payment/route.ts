import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Faltan credenciales de Google");
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function POST(req: NextRequest) {
  try {
    const { sheetRow } = await req.json() as { sheetRow: number };

    if (!sheetRow || sheetRow < 1) {
      return NextResponse.json({ error: "sheetRow inválido" }, { status: 400 });
    }

    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      return NextResponse.json({ error: "GOOGLE_SHEET_ID no configurado" }, { status: 500 });
    }

    const auth   = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Escribe "SÍ" en la columna S de la fila exacta
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range:         `S${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["SÍ"]] },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[update-payment]", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
