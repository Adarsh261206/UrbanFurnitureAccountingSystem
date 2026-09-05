import bwipjs from 'bwip-js';

/** Render a Code128 barcode as a PNG buffer (for PDF embedding). */
export async function generateBarcodePng(text: string, width = 180, height = 48): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128',
        text,
        scale: 2,
        height: Math.max(6, Math.floor(height / 2)),
        includetext: true,
        textxalign: 'center',
        paddingwidth: 4,
        paddingheight: 4,
        backgroundcolor: 'FFFFFF',
        barcolor: '000000',
      },
      (err, png) => {
        if (err) reject(err);
        else resolve(png as Buffer);
      },
    );
  });
}

/** Render a QR code as a PNG buffer (for PDF embedding). */
export async function generateQrPng(text: string, width = 120, height = 120): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'qrcode',
        text,
        scale: 6,
        width,
        height,
        paddingwidth: 2,
        paddingheight: 2,
        backgroundcolor: 'FFFFFF',
        barcolor: '000000',
      },
      (err, png) => {
        if (err) reject(err);
        else resolve(png as Buffer);
      },
    );
  });
}