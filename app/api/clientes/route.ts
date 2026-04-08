import { NextResponse } from "next/server";
import { google } from "googleapis";

interface ClientData {
  name:                 string;
  address:              string;
  addressExtra:         string;
  phone:                string;
  canLeaveAtDoor:       boolean;
  deliveryInstructions: string;
  isRegularClient:      boolean;
  deliveryFrequency:    string;
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Faltan credenciales de Google");
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      return NextResponse.json({ error: "GOOGLE_SHEET_ID no configurado" }, { status: 500 });
    }

    const auth   = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:J", // columns needed: C=nombre … J=frecuencia
    });

    const rows = res.data.values ?? [];

    // Last row per client wins (most recent entry)
    const clientMap = new Map<string, ClientData>();

    for (const row of rows) {
      const name = ((row[2] as string) ?? "").trim();
      if (!name) continue;

      clientMap.set(name.toLowerCase(), {
        name,
        address:              ((row[3] as string) ?? "").trim(),
        addressExtra:         ((row[4] as string) ?? "").trim(),
        // Sheet stores leading apostrophe to force text; strip it if present
        phone:                ((row[5] as string) ?? "").replace(/^'/, "").trim(),
        canLeaveAtDoor:       ((row[6] as string) ?? "").toUpperCase() === "SÍ",
        deliveryInstructions: ((row[7] as string) ?? "").trim(),
        isRegularClient:      ((row[8] as string) ?? "").toUpperCase() === "SÍ",
        deliveryFrequency:    ((row[9] as string) ?? "").trim(),
      });
    }

    const clients = Array.from(clientMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "es")
    );

    return NextResponse.json({ clients });
  } catch (err) {
    console.error("[clientes]", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
