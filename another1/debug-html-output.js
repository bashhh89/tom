// Debug script to see what HTML is being generated
const { generateScorecardHTML } = require('./app/api/generate-scorecard-weasyprint-report/html-generator.ts');

const testData = {
  UserInformation: {
    UserName: "Test User",
    CompanyName: "Test Company", 
    Industry: "Technology",
    Email: "test@example.com"
  },
  ScoreInformation: {
    AITier: "Enabler",
    FinalScore: 75,
    ReportID: "TEST_123"
  },
  QuestionAnswerHistory: [{
    question: "Test question?",
    answer: "Test answer",
    phaseName: "Test Phase"
  }],
  FullReportMarkdown: `## Key Strengths
• Strong AI implementation
• Good data infrastructure

## Areas for Improvement  
• Need better AI strategy
• Improve team training

## Strategic Action Plan
1. Develop comprehensive AI strategy
2. Invest in team training
3. Upgrade technology infrastructure`
};

async function debugHTML() {
  try {
    console.log('Generating HTML...');
    const html = await generateScorecardHTML(testData);
    
    // Save HTML to file for inspection
    const fs = require('fs');
    fs.writeFileSync('debug-output.html', html);
    
    console.log('HTML generated and saved to debug-output.html');
    console.log('First 2000 characters:');
    console.log(html.substring(0, 2000));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugHTML();