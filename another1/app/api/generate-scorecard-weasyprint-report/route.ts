import { NextResponse } from 'next/server';
import { generateScorecardHTML } from './html-generator';

/**
 * Generate PDF using WeasyPrint service (self-hosted)
 * @param html HTML content to convert to PDF
 * @returns PDF buffer
 */
async function generatePDFWithWeasyPrint(html: string): Promise<Buffer> {
  try {
  // WeasyPrint service URL - use the correct /pdf endpoint
  const weasyPrintServiceUrl = process.env.WEASYPRINT_SERVICE_URL || 'https://socialgarden-theweasyprint.ul2dku.easypanel.host/pdf';
    
    // Make request to WeasyPrint service using simple HTML body
    const response = await fetch(weasyPrintServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html',
      },
      body: html,
    });

    if (!response.ok) {
      throw new Error(`WeasyPrint service returned ${response.status}: ${response.statusText}`);
    }

    // Get PDF as buffer
    const pdfBuffer = await response.arrayBuffer();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF with WeasyPrint:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Get the report data from the request body
    const reportData = await request.json();
    
    // Generate HTML using the scorecard HTML generator (reusing v6 generator)
    const html = await generateScorecardHTML(reportData);
    
    // Debug: Save HTML to file for inspection
    require('fs').writeFileSync('/tmp/debug-generated.html', html);
    console.log('DEBUG: HTML saved to /tmp/debug-generated.html, length:', html.length);
    
    // Generate PDF from HTML
    const pdfBuffer = await generatePDFWithWeasyPrint(html);
    
    // Extract company name for the filename if available
    let fileName = 'ai-scorecard-report.pdf';
    try {
      const companyName = reportData?.UserInformation?.CompanyName;
      if (companyName && companyName !== 'N/A') {
        const sanitizedName = companyName.replace(/[^\w\s-]/g, '').trim();
        if (sanitizedName) {
          fileName = `ai-scorecard-${sanitizedName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        }
      }
    } catch (e) {
      console.error('Error extracting company name:', e);
    }
    
    // Return the PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating scorecard report with WeasyPrint:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// For simple debugging and testing
export async function GET() {
  return new NextResponse(JSON.stringify({ status: 'WeasyPrint PDF service is running' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
} 