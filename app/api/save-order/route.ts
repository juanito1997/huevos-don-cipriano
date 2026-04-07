import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

/* ─── Types ─────────────────────────────────────────────── */
interface OrderPayload {
  partner:              string;
  client:               string;
  address:              string;
  addressExtra:         string;
  phone:                string;
  canLeaveAtDoor:       boolean;
  deliveryInstructions: string;
  isRegularClient:      boolean;
  deliveryFrequency:    string;
  qtyA:                 number;
  qtyAA:                number;
  qtyAAA:               number;
  total:                number;
  comments:             string;
}

/* ─── Google Auth ────────────────────────────────────────── */
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error("Faltan credenciales de Google en las variables de entorno");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key:  key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/* ─── Handler ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json();

    const {
      partner, client, address, addressExtra, phone,
      canLeaveAtDoor, deliveryInstructions,
      isRegularClient, deliveryFrequency,
      qtyA, qtyAA, qtyAAA, total, comments,
    } = body;

    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      return NextResponse.json(
        { error: "GOOGLE_SHEET_ID no está configurado" },
        { status: 500 }
      );
    }

    const auth   = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Build date/time in Colombian timezone
    const now   = new Date();
    const fecha = now.toLocaleDateString("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const hora = now.toLocaleTimeString("es-CO", {
      timeZone: "America/Bogota",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

    const totalTrays = qtyA + qtyAA + qtyAAA;
    const totalEggs  = totalTrays * 30;

    const row = [
      `${fecha} ${hora}`,           // A: Fecha y hora (Colombia)
      partner,                      // B: Socio
      client,                       // C: Cliente
      address,                      // D: Dirección principal
      addressExtra || "",           // E: Info adicional
      `'${phone}`,                   // F: WhatsApp (apóstrofe fuerza texto en Sheets)
      canLeaveAtDoor ? "SÍ" : "NO", // G: ¿Portería?
      deliveryInstructions || "",   // H: Instrucciones
      isRegularClient ? "SÍ" : "NO",// I: ¿Cliente regular?
      deliveryFrequency || "",      // J: Frecuencia de entrega
      qtyA,                         // K: Huevo A (bandejas)
      qtyAA,                        // L: Huevo AA (bandejas)
      qtyAAA,                       // M: Huevo AAA (bandejas)
      totalTrays,                   // N: Total bandejas
      totalEggs,                    // O: Total huevos
      total,                        // P: Total pesos
      comments || "",               // Q: Comentarios
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range:         "A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[save-order]", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
