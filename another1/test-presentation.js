const fetch = require('node-fetch');

async function testPresentationPDF() {
  const testData = {
    "UserInformation": {
      "Industry": "Property/Real Estate",
      "UserName": "Test User",
      "CompanyName": "Test Company",
      "Email": "test@example.com"
    },
    "ScoreInformation": {
      "AITier": "Dabbler",
      "FinalScore": 25,
      "ReportID": "TEST123"
    },
    "QuestionAnswerHistory": [
      {
        "question": "How would you describe your organization's current use of AI tools?",
        "answer": "We are just beginning to explore AI tools",
        "phaseName": "Current AI Usage",
        "answerType": "radio"
      }
    ],
    "FullReportMarkdown": `## Overall Tier: Dabbler
Final Score: 25/100

## Key Findings
**Strengths:**
- Willingness to explore new technologies

**Weaknesses:**
- Limited AI implementation experience

### Strategic Action Plan
1. Start Small
2. Build Knowledge`
  };

  try {
    console.log('Testing presentation PDF generation...');
    
    const response = await fetch('http://localhost:3006/api/generate-presentation-weasyprint-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    if (response.ok) {
      const pdfBuffer = await response.buffer();
      console.log('Presentation PDF generated successfully!');
      console.log('PDF size:', pdfBuffer.length, 'bytes');
      
      // Save the test PDF
      const fs = require('fs');
      fs.writeFileSync('test-presentation-output.pdf', pdfBuffer);
      console.log('Test presentation PDF saved as test-presentation-output.pdf');
    } else {
      const errorText = await response.text();
      console.error('Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPresentationPDF();
