const fetch = require('node-fetch');
const fs = require('fs');

async function testWeasyPrintPDF() {
  const html = '<html><body><h1>Test PDF</h1><p>This is a test from VS Code.</p></body></html>';
  const url = 'https://socialgarden-theweasyprint.ul2dku.easypanel.host/pdf'; // Updated to /pdf endpoint

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html',
      },
      body: html,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Status:', response.status);
      console.error('Error:', text);
      return;
    }

    const buffer = await response.buffer();
    fs.writeFileSync('test-weasyprint-output.pdf', buffer);
    console.log('PDF generated and saved as test-weasyprint-output.pdf');
  } catch (err) {
    console.error('Request failed:', err);
  }
}

testWeasyPrintPDF();
