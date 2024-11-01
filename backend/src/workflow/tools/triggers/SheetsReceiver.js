import EventEmitter from 'events';
import { google } from 'googleapis';

async function getGoogleAuth() {
  try {
    const clientEmail = process.env.GOOGLESHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLESHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      throw new Error("Google credentials not found in environment variables");
    }

    const jwtClient = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    await jwtClient.authorize();
    return jwtClient;
  } catch (error) {
    console.error('Error getting Google auth:', error);
    throw error;
  }
}

class SheetsReceiver extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.spreadsheetId = config.spreadsheetId;
    this.sheetName = config.sheetName;
    this.isListening = false;
    this.lastRowCount = 0;
    this.checkNewRows = this.checkNewRows.bind(this);
  }
  async start() {
    if (this.isListening) return;
    this.isListening = true;
    await this.initializeLastRowCount();
    this.intervalId = setInterval(this.checkNewRows, 30000);
    console.log(`GoogleSheetsReceiver started for ${this.spreadsheetId} - ${this.sheetName}`);
  }
  stop() {
    this.isListening = false;
    clearInterval(this.intervalId);
    console.log(`GoogleSheetsReceiver stopped for ${this.spreadsheetId} - ${this.sheetName}`);
  }
  async initializeLastRowCount() {
    try {
      const auth = await getGoogleAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.sheetName,
      });
      this.lastRowCount = response.data.values ? response.data.values.length : 0;
    } catch (error) {
      console.error(`Error initializing row count for ${this.spreadsheetId} - ${this.sheetName}:`, error);
    }
  }
  async checkNewRows() {
    if (!this.isListening) return;

    try {
      const auth = await getGoogleAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.sheetName,
      });

      const rows = response.data.values || [];
      if (rows.length > this.lastRowCount) {
        const newRows = rows.slice(this.lastRowCount);
        for (const row of newRows) {
          this.emit('newRow', { newRow: row });
        }
        this.lastRowCount = rows.length;
      }
    } catch (error) {
      console.error(`Error checking for new rows in ${this.spreadsheetId} - ${this.sheetName}:`, error);
    }
  }
}

export default SheetsReceiver;