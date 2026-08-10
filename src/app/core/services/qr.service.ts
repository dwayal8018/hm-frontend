import { Injectable } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('qrcode');

/**
 * Generates QR code images entirely in the browser — no internet required.
 * Uses the `qrcode` npm package which runs 100% client-side via canvas.
 */
@Injectable({ providedIn: 'root' })
export class QrService {

  /**
   * Returns a base64 PNG data URL of the QR code.
   * Fully offline — no external API calls at all.
   */
  async generateDataUrl(text: string, size = 200): Promise<string> {
    if (!text) return '';
    try {
      return await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      }) as string;
    } catch {
      return '';
    }
  }
}
