import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

/* ─── Types ─────────────────────────────────────────────── */
interface OrderPayload {
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
  if (!email || !key) throw new Error("Faltan credenciales de Google en las variables de entorno");
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/* ─── Helpers de fecha (zona horaria Bogotá) ─────────────── */
function getBogotaDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
}

function getMonthName(): string {
  const s = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    timeZone: "America/Bogota",
  }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1); // "Mayo"
}

function getWeekOfMonth(): number {
  return Math.ceil(getBogotaDate().getDate() / 7); // 1–5
}

/* ─── Handler ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json();

    const {
      client, address, addressExtra, phone,
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

    // Fecha y hora en zona horaria colombiana
    const now   = new Date();
    const fecha = now.toLocaleDateString("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const hora = now.toLocaleTimeString("es-CO", {
      timeZone: "America/Bogota",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

    const mes         = getMonthName();          // "Mayo"
    const semana      = getWeekOfMonth();        // 1–5
    const totalTrays  = qtyA + qtyAA + qtyAAA;
    const totalEggs   = totalTrays * 30;

    // ── Orden de columnas ──────────────────────────────────────
    // A: Fecha  B: Mes  C: Semana  D: Cliente  E: Dirección
    // F: Apto   G: WhatsApp  H: Portería  I: Instrucciones
    // J: Regular  K: Frecuencia  L: Cant_A  M: Cant_AA  N: Cant_AAA
    // O: Total_Cubetas  P: Total_Huevos  Q: Total_Precio
    // R: Comentarios  S: PagoStatus
    const row = [
      `${fecha} ${hora}`,           // A: Fecha
      mes,                          // B: Mes
      semana,                       // C: Semana
      client,                       // D: Cliente
      address.trim(),               // E: Dirección principal
      addressExtra.trim() || "",    // F: Apto/Casa
      `'${phone}`,                  // G: WhatsApp
      canLeaveAtDoor ? "SÍ" : "NO", // H: Portería
      deliveryInstructions || "",   // I: Instrucciones
      isRegularClient ? "SÍ" : "NO",// J: Regular
      deliveryFrequency || "",      // K: Frecuencia
      qtyA,                         // L: Cant_A
      qtyAA,                        // M: Cant_AA
      qtyAAA,                       // N: Cant_AAA
      totalTrays,                   // O: Total_Cubetas
      totalEggs,                    // P: Total_Huevos
      total,                        // Q: Total_Precio
      comments || "",               // R: Comentarios
      "Pendiente",                  // S: PagoStatus
    ];

    // Paso 1: abrir espacio en fila 2 (debajo del header)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId:    0,
              dimension:  "ROWS",
              startIndex: 1,   // 0-indexed → fila 2 en Sheets
              endIndex:   2,
            },
            inheritFromBefore: false,
          },
        }],
      },
    });

    // Paso 2: escribir los datos en la fila recién insertada
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range:         "A2",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[save-order]", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
