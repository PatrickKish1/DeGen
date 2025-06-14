/* eslint-disable @typescript-eslint/no-require-imports */
// Script to generate QR codes for testing purposes
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const qrDir = path.join(__dirname, '..', 'public', 'qr-demo');

// Ensure directory exists
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

// Sample data to encode in QR codes
const sampleData = [
  {
    id: 've1',
    name: 'AccraMall MoMo Agent',
    type: 'agent',
    identifier: '0277123456'
  },
  {
    id: 've2',
    name: 'GlobalPay Services',
    type: 'service',
    identifier: 'GP829135'
  },
  {
    id: 've3',
    name: 'ElectroTech Store',
    type: 'merchant',
    identifier: 'MER456789'
  }
];

// Generate and save QR codes
async function generateQRCodes() {
  console.log('Generating QR codes...');

  for (let i = 0; i < sampleData.length; i++) {
    const filename = path.join(qrDir, `qr${i + 1}.png`);
    const data = JSON.stringify(sampleData[i]);
    
    await QRCode.toFile(filename, data, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    console.log(`Generated QR code: ${filename}`);
  }
  
  console.log('All QR codes generated successfully!');
}

generateQRCodes().catch(console.error);
