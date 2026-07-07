import "server-only";
import { google } from "googleapis";

// Integración real con Google Drive vía Service Account.
// Requiere las env: GOOGLE_SERVICE_ACCOUNT_JSON (JSON completo de la SA) y
// DRIVE_FOLDER_ID (id de la carpeta compartida "EFX Control").
// Scope acotado a drive.file (solo archivos creados por la app).

const SCOPE = "https://www.googleapis.com/auth/drive.file";

export function driveConfigurado(): boolean {
  return (
    !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !!process.env.DRIVE_FOLDER_ID
  );
}

function getDriveClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no está configurada.");
  let creds: { client_email?: string; private_key?: string };
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido.");
  }
  if (!creds.client_email || !creds.private_key) {
    throw new Error("La Service Account no tiene client_email / private_key.");
  }
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [SCOPE],
  });
  return google.drive({ version: "v3", auth });
}

export interface DriveSubida {
  id: string;
  webViewLink: string | null;
  thumbnailLink: string | null;
  size: string | null;
  mimeType: string | null;
}

export async function subirArchivoADrive(params: {
  nombre: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<DriveSubida> {
  if (!driveConfigurado()) throw new Error("Drive no configurado.");
  const drive = getDriveClient();
  const folderId = process.env.DRIVE_FOLDER_ID!;
  const { Readable } = await import("node:stream");

  const res = await drive.files.create({
    requestBody: { name: params.nombre, parents: [folderId] },
    media: { mimeType: params.mimeType, body: Readable.from(params.buffer) },
    fields: "id, webViewLink, thumbnailLink, size, mimeType",
  });

  const d = res.data;
  return {
    id: d.id ?? "",
    webViewLink: d.webViewLink ?? null,
    thumbnailLink: d.thumbnailLink ?? null,
    size: d.size ?? null,
    mimeType: d.mimeType ?? null,
  };
}
