// Render an HTML file to PDF via pre-installed Playwright (Node).
// usage: node render_pdf.js <abs-html-path> <abs-pdf-out>
const { chromium } = require('playwright');
(async () => {
  const htmlPath = process.argv[2];
  const pdfPath = process.argv[3];
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const pg = await b.newPage();
  await pg.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await pg.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await b.close();
  console.log('PDF written:', pdfPath);
})().catch(e => { console.error(e); process.exit(1); });
