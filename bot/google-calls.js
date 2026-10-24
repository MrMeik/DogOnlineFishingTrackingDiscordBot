import "dotenv/config";
import { google } from "googleapis";

const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } =
  process.env;

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
  throw new Error(
    "Missing GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY or GOOGLE_SHEET_ID in environment.",
  );
}

// Some hosts store the key with literal "\n" instead of real newlines
const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

if (!privateKey.includes("BEGIN PRIVATE KEY")) {
  throw new Error("GOOGLE_PRIVATE_KEY appears to be missing or malformed.");
}

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_NAME = "Fishing Logs";
const SESSION_RANGE = `'${SHEET_NAME}'!A:A`; // quoted because the name has a space

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

export async function appendFishingLogs(sessionId, session) {
  try {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).format(new Date());

    const logs = session.catches.map((fish) => [
      `'${sessionId}`, // force this to be text
      session.userName,
      fish.value, // TODO: Decide if the caught misc. items should go elsewhere
      session.location,
      session.time,
      session.weather,
      session.bait,
      formattedDate,
    ]);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: SESSION_RANGE,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: logs },
    });

    console.log(`Success! ${response.data.updates.updatedRows} rows appended.`);
  } catch (error) {
    console.error("The API returned an error:", error);
  }
}

// Replaces column A with "revoked" on every row belonging to this session ID.
export async function revokeFishingLogs(sessionId) {
  try {
    const target = String(sessionId);

    // Find the logs associated with this session
    const read = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: SESSION_RANGE,
    });

    // Format them into one data request for each row to be revoked
    const rows = read.data.values ?? [];
    const data = [];
    rows.forEach((row, index) => {
      if (String(row[0] ?? "") === target) {
        data.push({
          range: `'${SHEET_NAME}'!A${index + 1}`,
          values: [["revoked"]],
        });
      }
    });

    if (data.length === 0) {
      console.log(`No logs found for session ${target}.`);
      return 0;
    }

    // Update all matching cells in one request
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: GOOGLE_SHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data,
      },
    });

    console.log(`Revoked ${data.length} rows for session ${target}.`);
    return data.length;
  } catch (error) {
    console.error("The API returned an error:", error);
    throw error;
  }
}
