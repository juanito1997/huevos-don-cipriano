import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Índices de columna (0-based) según nuevo esquema:
// A=0 Fecha | B=1 Mes | C=2 Semana | D=3 Cliente | E=4 Dirección
// F=5 Apto  | G=6 WhatsApp | H=7 Portería | I=8 Instrucciones
// J=9 Regular | K=10 Frecuencia | L=11 Cant_A | M=12 Cant_AA | N=13 Cant_AAA
// O=14 Total_Cubetas | P=15 Total_Huevos | Q=16 Total_Precio
// R=17 Comentarios | S=18 PagoStatus

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Faltan credenciales de Google");
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      return NextResponse.json({ error: "GOOGLE_SHEET_ID no configurado" }, { status: 500 });
    }

    const auth   = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:S",   // ahora llega hasta columna S
    });

    const rows = res.data.values ?? [];

    const orders = rows
      .map((row, i) => ({ row, sheetRow: i + 1 }))
      .filter(({ row }) => {
        const client = ((row[3] as string) ?? "").trim(); // D=3: Cliente
        if (!client || client.toLowerCase() === "cliente") return false;
        if (query) return client.toLowerCase().includes(query);
        return true;
      })
      .map(({ row, sheetRow }) => ({
        sheetRow,
        fecha:      ((row[0]  as string) ?? "").trim(),  // A: Fecha
        mes:        ((row[1]  as string) ?? "").trim(),  // B: Mes
        semana:     ((row[2]  as string) ?? "").trim(),  // C: Semana
        client:     ((row[3]  as string) ?? "").trim(),  // D: Cliente
        address:    ((row[4]  as string) ?? "").trim(),  // E: Dirección
        phone:      ((row[6]  as string) ?? "").trim(),  // G: WhatsApp
        total:      ((row[16] as string) ?? "0").trim(), // Q: Total_Precio
        pagoStatus: ((row[18] as string) ?? "Pendiente").trim(), // S: PagoStatus
      }))
      .reverse()    // más recientes primero
      .slice(0, 60);

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[orders]", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
