/**
 * HTML Generator for AI Efficiency Scorecard (WeasyPrint Version)
 * Simplified approach that builds the HTML template block by block
 */

export interface AnswerHistoryEntry {
  question: string;
  answer: string;
  phaseName?: string;
  reasoningText?: string;
  answerType?: string;
  options?: string[] | null;
  index?: number;
  answerSource?: string;
}

export interface ScorecardData {
  UserInformation: {
    UserName: string;
    CompanyName: string;
    Industry: string;
    Email: string;
  };
  ScoreInformation: {
    AITier: string;
    FinalScore: number | null;
    ReportID: string;
  };
  QuestionAnswerHistory: AnswerHistoryEntry[];
  FullReportMarkdown: string;
}

/**
 * Extracts a specific section from markdown text
 * @param text - Full markdown text
 * @param sectionTitle - Title of the section to extract
 * @param stopAtSections - Section titles where extraction should stop
 * @returns Content of the specified section
 */
function extractSection(text: string, sectionTitle: string, stopAtSections: string[] = []): string {
  const lines = text.split('\n');
  let inSection = false;
  let sectionContent: string[] = [];
  
  for (const line of lines) {
    // Check if we're starting the target section
    if (line.toLowerCase().includes(sectionTitle.toLowerCase()) && 
        (line.startsWith('#') || line.startsWith('**') || line.match(/^\d+\./))) {
      inSection = true;
      continue;
    }
    
    // Check if we hit a stop section
    if (inSection && stopAtSections.some(stop => 
      line.toLowerCase().includes(stop.toLowerCase()) && 
      (line.startsWith('#') || line.startsWith('**') || line.match(/^\d+\./))
    )) {
      break;
    }
    
    // Collect content if we're in the section
    if (inSection) {
      sectionContent.push(line);
    }
  }
  
  return sectionContent.join('\n').trim();
}

/**
 * Extracts strategic plan/recommendations from the report markdown
 * @param text - Full report markdown
 * @returns Array of strategic plan items
 */
function extractStrategicPlan(text: string): string[] {
  console.log('Extracting strategic plan from text length:', text.length);
  
  // Try different patterns to identify strategic plan sections
  const strategicSections = [
    'Strategic Recommendations',
    'Action Plan',
    'Next Steps',
    'Recommendations',
    'Implementation Plan'
  ];
  
  // Try to find content from any of the strategic sections
  let strategicContent = '';
  for (const section of strategicSections) {
    strategicContent = extractSection(text, section, ['Conclusion', 'Summary', 'Contact']);
    if (strategicContent.length > 0) break;
  }
  if (!strategicContent) {
    console.log('No strategic section found, returning empty array');
    return [];
  }
  
  console.log('Found strategic content:', strategicContent.substring(0, 200) + '...');
  
  // Parse the content into individual items
  const lines = strategicContent.split('\n');
  const items: string[] = [];
  let currentItem = '';
  let collectingItem = false;
  
  for (const line of lines) {
    // Check if this line starts a new numbered or bullet item
    if (/^\d+\./.test(line.trim()) || /^[•\-]/.test(line.trim())) {
      // If we were collecting a previous item, save it
      if (collectingItem && currentItem.trim()) {
        items.push(currentItem.trim());
      }
      
      // Start collecting a new item
      currentItem = line.trim();
      collectingItem = true;
    } 
    // If we're collecting an item and this is a continuation line
    else if (collectingItem && line.trim()) {
      currentItem += ' ' + line.trim();
    }
  }
  
  // Don't forget to add the last item
  if (collectingItem && currentItem.trim()) {
    items.push(currentItem.trim());
  }
  
  console.log(`Found ${items.length} strategic plan items`);
  
  // Format the items for better display
  return items.map(item => {
    // Handle bullet points
    if (item.startsWith('•') || item.startsWith('-')) {
      const content = item.replace(/^[•\-]\s*/, '').trim();
      
      // Try to extract the title if it's in bold format
      const boldTitleMatch = content.match(/\*\*([^:]+):\*\*\s*(.*)/);
      if (boldTitleMatch) {
        return `<strong>${boldTitleMatch[1]}</strong>: ${boldTitleMatch[2]}`;
      }
      
      // Try to extract the title if it's in regular format
      const regularTitleMatch = content.match(/([^:]+):\s*(.*)/);
      if (regularTitleMatch) {
        return `<strong>${regularTitleMatch[1]}</strong>: ${regularTitleMatch[2]}`;
      }
      
      return content;
    }
    
    // Try to extract the title if it's in bold format: "1. **Title:** Description"
    const boldTitleMatch = item.match(/^\d+\.\s+\*\*([^:]+):\*\*\s*(.*)/);
    if (boldTitleMatch) {
      return `<strong>${boldTitleMatch[1]}</strong>: ${boldTitleMatch[2]}`;
    }
    
    // Try to extract the title if it's in regular format: "1. Title: Description"
    const regularTitleMatch = item.match(/^\d+\.\s+([^:]+):\s*(.*)/);
    if (regularTitleMatch) {
      return `<strong>${regularTitleMatch[1]}</strong>: ${regularTitleMatch[2]}`;
    }
    
    // Otherwise, just remove the number prefix if present
    return item.replace(/^\d+\.\s*/, '');
  });
}

/**
 * Extract strengths from markdown content
 */
function extractStrengths(markdownContent: string): string[] {
  if (!markdownContent) {
    console.log('No markdown content provided to extractStrengths');
    return [];
  }
  
  console.log('Extracting strengths from markdown content...');
  
  // Look for "Your Strengths" heading followed by a list (handles both • and - bullet points and variations in spacing)
  const strengthsMatch = markdownContent.match(/Your Strengths\s*[\r\n]+([\s\S]*?)(?=Focus Areas|Areas for Improvement|##|$)/i);
  if (strengthsMatch && strengthsMatch[1]) {
    const strengthContent = strengthsMatch[1].trim();
    console.log('Found Your Strengths section with content:', strengthContent.substring(0, 100) + '...');
    // Extract bullet points (handles both • and - and leading/trailing whitespace)
    const bulletPoints = strengthContent.split(/[\r\n]+/).filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    return bulletPoints.map(point => renderMarkdown(point.trim().replace(/^[•-]\s*/, '').trim()));
  }

  // Fallback to previous logic if new pattern not found
  const keyFindingsMatch = markdownContent.match(/## Key Findings([\s\S]*?)(?=##|$)/i);
  if (keyFindingsMatch) {
    const strengthsMatchFallback = keyFindingsMatch[1].match(/\*\*Strengths:\*\*([\s\S]*?)(?=\*\*Weaknesses|$)/i);
    if (strengthsMatchFallback) {
      const strengthContent = strengthsMatchFallback[1].trim();
      console.log('Found Strengths section with content:', strengthContent.substring(0, 100) + '...');
      const bulletPoints = strengthContent.split('\n').filter(line => line.trim().startsWith('-'));
      return bulletPoints.map(point => point.replace(/^-\s*/, '').trim());
    }
  }
  
  console.log('No strengths found in markdown content');
  return [];
}

/**
 * Extract weaknesses (Focus Areas) from markdown content
 */
function extractWeaknesses(markdownContent: string): string[] {
  if (!markdownContent) {
    console.log('No markdown content provided to extractWeaknesses');
    return [];
  }
  
  console.log('Extracting weaknesses/focus areas from markdown content...');
  
  // Look for "Focus Areas" heading followed by a list (handles both • and - bullet points and variations in spacing)
  const focusAreasMatch = markdownContent.match(/Focus Areas\s*[\r\n]+([\s\S]*?)(?=Next Steps|##|$)/i);
  if (focusAreasMatch && focusAreasMatch[1]) {
    const focusAreasContent = focusAreasMatch[1].trim();
    console.log('Found Focus Areas section with content:', focusAreasContent.substring(0, 100) + '...');
    // Extract bullet points (handles both • and - and leading/trailing whitespace)
    const bulletPoints = focusAreasContent.split(/[\r\n]+/).filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    return bulletPoints.map(point => renderMarkdown(point.trim().replace(/^[•-]\s*/, '').trim()));
  }

  // Fallback to previous logic if new pattern not found
  const keyFindingsMatch = markdownContent.match(/## Key Findings([\s\S]*?)(?=##|$)/i);
  if (keyFindingsMatch) {
    const weaknessesMatchFallback = keyFindingsMatch[1].match(/\*\*Weaknesses:\*\*([\s\S]*?)(?=##|$)/i);
    if (weaknessesMatchFallback) {
      const weaknessContent = weaknessesMatchFallback[1].trim();
      console.log('Found Weaknesses section with content:', weaknessContent.substring(0, 100) + '...');
      const bulletPoints = weaknessContent.split('\n').filter(line => line.trim().startsWith('-'));
      return bulletPoints.map(point => point.replace(/^-\s*/, '').trim());
    }
  }
  
  // Additional fallback for "Areas for Improvement" terminology
  const areasForImprovementMatch = markdownContent.match(/Areas for Improvement\s*[\r\n]+([\s\S]*?)(?=Next Steps|##|$)/i);
  if (areasForImprovementMatch && areasForImprovementMatch[1]) {
    const improvementContent = areasForImprovementMatch[1].trim();
    console.log('Found Areas for Improvement section with content:', improvementContent.substring(0, 100) + '...');
    const bulletPoints = improvementContent.split(/[\r\n]+/).filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    return bulletPoints.map(point => renderMarkdown(point.trim().replace(/^[•-]\s*/, '').trim()));
  }
  
  console.log('No weaknesses/focus areas found in markdown content');
  return [];
}

/**
 * Format answers based on answerType
 */
function formatAnswer(item: AnswerHistoryEntry): string {
  if (item.answer === undefined || item.answer === null || item.answer === '') return 'No answer provided';
  
  // Handle different answer types
  if (item.answerType === 'scale' && !isNaN(Number(item.answer))) {
    return `<span class="scale-value">${item.answer}</span>`;
  }
  
  if (item.answerType === 'checkbox' || item.answerType === 'radio') {
    // Handle array answers
    if (Array.isArray(item.answer)) {
      return item.answer.join(', ');
    }
    
    // Handle pipe-delimited string answers
    if (typeof item.answer === 'string' && item.answer.includes('|')) {
      return item.answer.split('|').map(a => a.trim()).join(', ');
    }
    
    // Handle newline-delimited string answers (common in checkbox responses)
    if (typeof item.answer === 'string' && item.answer.includes('\n')) {
      return item.answer.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.startsWith('-') ? line.substring(1).trim() : line)
        .join(', ');
    }
  }
  
  // For text answers, ensure we're returning a string
  return String(item.answer);
}

/**
 * Group questions and answers by phase
 */
function groupByPhase(questionAnswerHistory: AnswerHistoryEntry[]): Record<string, AnswerHistoryEntry[]> {
  const grouped: Record<string, AnswerHistoryEntry[]> = {};
  
  questionAnswerHistory.forEach((item, index) => {
    const phase = item.phaseName || 'Uncategorized';
    if (!grouped[phase]) {
      grouped[phase] = [];
    }
    grouped[phase].push({...item, index});
  });
  
  return grouped;
}

/**
 * Helper function to get tier description
 */
const getTierDescription = (tier: string | null): string => {
  if (!tier) return "";
  
  switch(tier.toLowerCase()) {
    case 'leader':
      return "This means your organization has developed mature AI capabilities, with well-established processes for developing, deploying, and managing AI solutions. You have a strong foundation of data infrastructure, AI talent, governance frameworks, and strategic alignment.";
    case 'enabler':
      return "This means your organization has begun to develop significant AI capabilities with some successful implementations. You have established basic data infrastructure and are working toward more systematized approaches to AI development and deployment.";
    case 'dabbler':
      return "This means your organization is in the early stages of AI adoption, with limited formal processes and capabilities. You may have experimented with some AI applications but lack a comprehensive strategy and infrastructure for AI implementation.";
    default:
      return "Your assessment results indicate you're at an early stage of AI adoption. The recommendations in this report will help you establish a solid foundation for AI implementation.";
  }
};

/**
 * Basic Markdown to HTML converter
 */
function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  // Basic replacements for common markdown elements - FIX BOLD RENDERING FIRST
  let html = markdown
    // Replace bold - improved regex to ensure complete capture
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Replace italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>');

  // Handle headings (H1 to H6) - process from smallest to largest to avoid issues
  for (let i = 6; i >= 1; i--) {
    const regex = new RegExp(`^#{${i}}\\s+(.*)$`, 'gm');
    html = html.replace(regex, `<h${i}>$1</h${i}>`);
  }

  // Completely rewritten list handling to properly process lists and paragraphs
  const lines = html.split('\n');
  let processedLines = [];
  let inList = false;
  let listType = '';
  let inParagraph = false;
  let paragraphContent = '';
  let inKeyFindings = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're entering or leaving the Key Findings section
    if (line.match(/^<h2>Key Findings<\/h2>$/)) {
      inKeyFindings = true;
    } else if (line.match(/^<h2>/)) {
      inKeyFindings = false;
    }
    
    // Skip empty lines
    if (!line) {
      if (inParagraph) {
        // End current paragraph
        processedLines.push(`<p>${paragraphContent}</p>`);
        inParagraph = false;
        paragraphContent = '';
      }
      continue;
    }

    // Check if line is a heading
    if (line.match(/^<h[1-6]>.*<\/h[1-6]>$/)) {
      // Close any open paragraph
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent}</p>`);
        inParagraph = false;
        paragraphContent = '';
      }
      
      // Close any open list
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
      }
      
      // Add the heading
      processedLines.push(line);
      continue;
    }

    // Check if line is a list item
    const isUnorderedListItem = line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ');
    const isOrderedListItem = /^\d+\.\s/.test(line);
    
    if (isUnorderedListItem || isOrderedListItem) {
      // Close any open paragraph
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent}</p>`);
        inParagraph = false;
        paragraphContent = '';
      }
      
      const newListType = isUnorderedListItem ? 'ul' : 'ol';
      
      // If we're changing list types or starting a new list
      if (!inList || listType !== newListType) {
        if (inList) {
          processedLines.push(`</${listType}>`);
        }
        processedLines.push(`<${newListType}>`);
        inList = true;
        listType = newListType;
      }
      
      // Extract the content after the list marker
      const content = isUnorderedListItem 
        ? line.replace(/^[*+-]\s+/, '') 
        : line.replace(/^\d+\.\s+/, '');
      
      // Apply special styling for Key Findings section
      if (inKeyFindings) {
        processedLines.push(`<li class="finding-item-card">${content}</li>`);
      } else {
        processedLines.push(`<li class="list-item-block">${content}</li>`);
      }
    } else {
      // Close any open list
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
      }
      
      // Handle regular paragraph content
      if (!inParagraph) {
        inParagraph = true;
        paragraphContent = line;
      } else {
        paragraphContent += ' ' + line;
      }
    }
  }
  
  // Close any open elements at the end
  if (inParagraph) {
    processedLines.push(`<p>${paragraphContent}</p>`);
  }
  
  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  return processedLines.join('\n');
}

/**
 * Debug function to log the structure of the report data
 */
function debugReportData(data: ScorecardData): void {
  console.log('=== DEBUG REPORT DATA STRUCTURE ===');
  console.log('User Information:', JSON.stringify(data.UserInformation, null, 2));
  console.log('Score Information:', JSON.stringify(data.ScoreInformation, null, 2));
  
  console.log('Question Answer History length:', data.QuestionAnswerHistory?.length || 0);
  if (data.QuestionAnswerHistory && data.QuestionAnswerHistory.length > 0) {
    console.log('First question sample:', JSON.stringify(data.QuestionAnswerHistory[0], null, 2));
    
    // Check for required fields in all Q&A items
    const missingFields = data.QuestionAnswerHistory.map((item, index) => {
      const missing = [];
      if (!item.question) missing.push('question');
      if (item.answer === undefined || item.answer === null) missing.push('answer');
      return { index, missing };
    }).filter(item => item.missing.length > 0);
    
    if (missingFields.length > 0) {
      console.log('WARNING: Some Q&A items are missing required fields:', missingFields);
    }
    
    // Group by phase to check what phases are available
    const phases = data.QuestionAnswerHistory.reduce((acc, item) => {
      const phase = item.phaseName || 'Uncategorized';
      if (!acc[phase]) acc[phase] = 0;
      acc[phase]++;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Questions by phase:', phases);
  } else {
    console.log('WARNING: No QuestionAnswerHistory data available!');
  }
  
  // Check if markdown content exists and log its structure
  if (data.FullReportMarkdown) {
    console.log('Full Report Markdown length:', data.FullReportMarkdown.length);
    
    // Log section headings to understand structure
    const headings = data.FullReportMarkdown.match(/##\s+(.*?)$/gm);
    if (headings) {
      console.log('Markdown sections found:', headings);
    }
    
    // Check for specific sections
    const hasKeyFindings = data.FullReportMarkdown.includes('## Key Findings');
    const hasStrengths = data.FullReportMarkdown.includes('Your Strengths') || 
                        data.FullReportMarkdown.includes('**Strengths:**');
    const hasWeaknesses = data.FullReportMarkdown.includes('Focus Areas') || 
                         data.FullReportMarkdown.includes('Areas for Improvement') ||
                         data.FullReportMarkdown.includes('**Weaknesses:**');
    const hasDetailedAnalysis = data.FullReportMarkdown.includes('## Detailed Analysis');
    const hasRecommendations = data.FullReportMarkdown.includes('## Recommendations');
    const hasIllustrativeBenchmarks = data.FullReportMarkdown.includes('### Illustrative Benchmarks');
    const hasLearningPath = data.FullReportMarkdown.includes('### Your Personalized AI Learning Path') ||
                           data.FullReportMarkdown.includes('### Getting Started & Resources');
    
    console.log('Section presence check:', {
      hasKeyFindings,
      hasStrengths,
      hasWeaknesses,
      hasDetailedAnalysis, 
      hasRecommendations,
      hasIllustrativeBenchmarks,
      hasLearningPath
    });
  }
  
  console.log('=== END DEBUG REPORT DATA STRUCTURE ===');
}

/**
 * Ensure all sections from the markdown are included in the HTML
 */
function renderFullReportMarkdown(markdownContent: string): string {
  if (!markdownContent) {
    console.log('No markdown content provided to renderFullReportMarkdown');
    return '';
  }
  
  console.log('Rendering full report markdown...');
  
  // First, render the entire markdown to HTML
  const fullHtml = renderMarkdown(markdownContent);
  
  // Replace the Final Score section with a styled version
  const withStyledFinalScore = fullHtml.replace(
    /## Final Score: \d+\/100/g, 
    match => `<div class="final-score">${match}</div>`
  );
  
  // Process Key Findings section
  const withStyledKeyFindings = withStyledFinalScore.replace(
    /## Key Findings([\s\S]*?)(?=##|$)/g, 
    match => {
      console.log('Found and styling Key Findings section');
      
      // Extract the content after "## Key Findings"
      const content = match.replace(/## Key Findings/, '').trim();
      
      // Check if we have both strengths and weaknesses sections
      const hasStrengths = content.includes('<h4>Your Strengths</h4>') || 
                          content.includes('<strong>Strengths:</strong>');
      const hasWeaknesses = content.includes('<h4>Focus Areas</h4>') || 
                           content.includes('<h4>Areas for Improvement</h4>') ||
                           content.includes('<strong>Weaknesses:</strong>');
      
      if (hasStrengths && hasWeaknesses) {
        // Split content into strengths and weaknesses
        let strengthsContent = '';
        let weaknessesContent = '';
        
        if (content.includes('<h4>Your Strengths</h4>')) {
          const strengthsMatch = content.match(/<h4>Your Strengths<\/h4>([\s\S]*?)(?=<h4>|$)/);
          if (strengthsMatch && strengthsMatch[1]) {
            strengthsContent = strengthsMatch[1].trim();
          }
        } else if (content.includes('<strong>Strengths:</strong>')) {
          const strengthsMatch = content.match(/<strong>Strengths:<\/strong>([\s\S]*?)(?=<strong>Weaknesses:|$)/);
          if (strengthsMatch && strengthsMatch[1]) {
            strengthsContent = `<h4>Your Strengths</h4>${strengthsMatch[1].trim()}`;
          }
        }
        
        if (content.includes('<h4>Focus Areas</h4>')) {
          const weaknessesMatch = content.match(/<h4>Focus Areas<\/h4>([\s\S]*?)(?=<h4>|$)/);
          if (weaknessesMatch && weaknessesMatch[1]) {
            weaknessesContent = weaknessesMatch[1].trim();
          }
        } else if (content.includes('<h4>Areas for Improvement</h4>')) {
          const weaknessesMatch = content.match(/<h4>Areas for Improvement<\/h4>([\s\S]*?)(?=<h4>|$)/);
          if (weaknessesMatch && weaknessesMatch[1]) {
            weaknessesContent = weaknessesMatch[1].trim();
          }
        } else if (content.includes('<strong>Weaknesses:</strong>')) {
          const weaknessesMatch = content.match(/<strong>Weaknesses:<\/strong>([\s\S]*?)(?=<strong>|$)/);
          if (weaknessesMatch && weaknessesMatch[1]) {
            weaknessesContent = `<h4>Focus Areas</h4>${weaknessesMatch[1].trim()}`;
          }
        }
        
        // Create two-column layout
        if (strengthsContent && weaknessesContent) {
          return `<div class="key-findings-section">
            <h3>Key Findings</h3>
            <div class="key-findings-columns">
              <div class="key-findings-column">
                <h4>Your Strengths</h4>
                ${strengthsContent.replace(/<h4>Your Strengths<\/h4>/, '')}
              </div>
              <div class="key-findings-column">
                <h4>Focus Areas</h4>
                ${weaknessesContent.replace(/<h4>Focus Areas<\/h4>|<h4>Areas for Improvement<\/h4>/, '')}
              </div>
            </div>
          </div>`;
        }
      }
      
      // Default to original processing if we couldn't extract both sections
      return `<div class="key-findings-section"><h3>Key Findings</h3>${content}</div>`;
    }
  );
  
  // Process Strengths and Focus Areas headings
  const withStyledHeadings = withStyledKeyFindings
    .replace(/### Your Strengths/g, '<h4>Your Strengths</h4>')
    .replace(/### Focus Areas/g, '<h4>Focus Areas</h4>')
    .replace(/### Areas for Improvement/g, '<h4>Areas for Improvement</h4>');
  
  // Process all list items to use the list-item-block class
  const withStyledListItems = withStyledHeadings.replace(
    /<li>([^<]+)<\/li>/g, 
    match => {
      const content = match.replace(/<\/?li>/g, '');
      return `<li class="list-item-block">${content}</li>`;
    }
  );
  
  // Process special sections like Illustrative Benchmarks, Example Prompts, etc.
  const specialSections = [
    'Sample AI Goal-Setting Meeting Agenda',
    'Example Prompts for Your Team',
    'Illustrative Benchmarks',
    'Recommendations',
    'Detailed Analysis'
  ];
  
  let processedHtml = withStyledListItems;
  
  // Process standard sections
  specialSections.forEach(section => {
    const sectionRegex = new RegExp(`### ${section}([\\s\\S]*?)(?=###|##|$)`, 'g');
    processedHtml = processedHtml.replace(
      sectionRegex,
      match => {
        console.log(`Found and styling section: ${section}`);
        return `<div class="key-findings-section"><h3>${section}</h3>${match.replace(`### ${section}`, '')}</div>`;
      }
    );
  });
  
  // Process Learning Path and Resources sections with potential two-column layout
  const learningPathSections = [
    'Personalized AI Learning Path',
    'Getting Started & Resources',
    'Your Learning Path & Resources'
  ];
  
  learningPathSections.forEach(section => {
    const sectionRegex = new RegExp(`### ${section}([\\s\\S]*?)(?=###|##|$)`, 'g');
    processedHtml = processedHtml.replace(
      sectionRegex,
      match => {
        console.log(`Found and styling learning path section: ${section}`);
        
        const content = match.replace(`### ${section}`, '').trim();
        
        // Check if we can identify distinct subsections for a two-column layout
        // Look for common patterns like "Learning Path" and "Recommended Resources" subsections
        const hasLearningPath = content.includes('<h4>Your Learning Path</h4>') || 
                               content.includes('<strong>Learning Path:</strong>') ||
                               content.includes('<h4>Personalized Learning Path</h4>');
        
        const hasResources = content.includes('<h4>Recommended Resources</h4>') || 
                            content.includes('<strong>Resources:</strong>') ||
                            content.includes('<h4>Key Resources</h4>');
        
        if (hasLearningPath && hasResources) {
          // Extract learning path content
          let learningPathContent = '';
          if (content.includes('<h4>Your Learning Path</h4>')) {
            const match = content.match(/<h4>Your Learning Path<\/h4>([\s\S]*?)(?=<h4>|$)/);
            if (match && match[1]) learningPathContent = match[1].trim();
          } else if (content.includes('<h4>Personalized Learning Path</h4>')) {
            const match = content.match(/<h4>Personalized Learning Path<\/h4>([\s\S]*?)(?=<h4>|$)/);
            if (match && match[1]) learningPathContent = match[1].trim();
          } else if (content.includes('<strong>Learning Path:</strong>')) {
            const match = content.match(/<strong>Learning Path:<\/strong>([\s\S]*?)(?=<strong>Resources:|$)/);
            if (match && match[1]) learningPathContent = match[1].trim();
          }
          
          // Extract resources content
          let resourcesContent = '';
          if (content.includes('<h4>Recommended Resources</h4>')) {
            const match = content.match(/<h4>Recommended Resources<\/h4>([\s\S]*?)(?=<h4>|$)/);
            if (match && match[1]) resourcesContent = match[1].trim();
          } else if (content.includes('<h4>Key Resources</h4>')) {
            const match = content.match(/<h4>Key Resources<\/h4>([\s\S]*?)(?=<h4>|$)/);
            if (match && match[1]) resourcesContent = match[1].trim();
          } else if (content.includes('<strong>Resources:</strong>')) {
            const match = content.match(/<strong>Resources:<\/strong>([\s\S]*?)(?=<strong>|$)/);
            if (match && match[1]) resourcesContent = match[1].trim();
          }
          
          // If we have both sections, create a two-column layout
          if (learningPathContent && resourcesContent) {
            return `<div class="key-findings-section learning-path-section">
              <h3>${section}</h3>
              <div class="learning-path-columns">
                <div class="learning-path-column">
                  <h4>Your Learning Path</h4>
                  ${learningPathContent}
                </div>
                <div class="learning-path-column">
                  <h4>Recommended Resources</h4>
                  ${resourcesContent}
                </div>
              </div>
            </div>`;
          }
        }
        
        // Default to single column if we couldn't identify subsections
        return `<div class="key-findings-section"><h3>${section}</h3>${content}</div>`;
      }
    );
  });
  
  // Close any open sections
  const finalHtml = processedHtml.replace(
    /### ([^#]+?)(?=###|##|$)/g, 
    match => `${match}</div>`
  );
  
  return finalHtml;
}

/**
 * Generate the complete HTML for the scorecard PDF
 */
export async function generateScorecardHTML(data: ScorecardData): Promise<string> {
  const { UserInformation, ScoreInformation, FullReportMarkdown, QuestionAnswerHistory } = data;

  // Debug the report data structure
  debugReportData(data);

  try {
    // Load the full-width template (sync read for simplicity; in production, use async)
    const fs = require('fs');
    const path = require('path');
    // In Next.js standalone builds, templates are in public/templates/ (which gets copied to .next/standalone/public/templates/)
    const templatePath = path.resolve(process.cwd(), 'public/templates/template.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Prepare dynamic content
    const strengths = extractStrengths(FullReportMarkdown || '');
    const weaknesses = extractWeaknesses(FullReportMarkdown || '');
    const actionItems = extractStrategicPlan(FullReportMarkdown || '');
    const tierDescription = getTierDescription(ScoreInformation?.AITier || '');

    // Strengths/Weaknesses HTML
    const strengthsHtml = strengths.length > 0
      ? strengths.map(strength => `<div class="strength-item"><h5>Strength</h5><p>${strength}</p></div>`).join('\n')
      : '<p>No specific strengths were identified in the assessment.</p>';
    const weaknessesHtml = weaknesses.length > 0
      ? weaknesses.map(weakness => `<div class="weakness-item"><h5>Area for Improvement</h5><p>${weakness}</p></div>`).join('\n')
      : '<p>No specific focus areas were identified in the assessment.</p>';

    // Action Plan HTML (split into 3 parts for multi-page)
    const actionPlanChunks: string[][] = [[], [], []];
    actionItems.forEach((item, i) => {
      actionPlanChunks[Math.floor(i / Math.ceil(actionItems.length / 3))].push(
        `<div class="action-item"><h4>Action ${i + 1}</h4><p>${item}</p></div>`
      );
    });
    const actionPlanHtml = actionPlanChunks.map(chunk => chunk.join('\n'));

    // Q&A Table HTML (split into 2 parts for multi-page)
    const qaRows = (QuestionAnswerHistory || []).map(item =>
      `<tr><td>${item.phaseName || ''}</td><td>${item.question || ''}</td><td>${formatAnswer(item)}</td></tr>`
    );
    const qaChunkSize = Math.ceil(qaRows.length / 2) || 1;
    const qaHtml = [
      qaRows.slice(0, qaChunkSize).join('\n'),
      qaRows.slice(qaChunkSize).join('\n')
    ];

    // Learning Path Content
    const learningPathSection = extractSection(FullReportMarkdown || '', 'Learning Path', ['Next Steps', 'Recommendations']);
    const learningPathItems = extractStrategicPlan(learningPathSection);
    const learningPathChunks: string[][] = [[], []];
    learningPathItems.forEach((item, i) => {
      learningPathChunks[i % 2].push(`<div class="learning-item"><p>${item}</p></div>`);
    });
    const learningPathHtml = learningPathChunks.map(chunk => chunk.join('\n'));

    // Detailed Analysis Content
    const analysisSection = extractSection(FullReportMarkdown || '', 'Analysis', ['Conclusion', 'Summary', 'Learning Path']);
    const analysisItems = extractStrategicPlan(analysisSection);
    const analysisChunks: string[][] = [[], [], [], []];
    analysisItems.forEach((item, i) => {
      analysisChunks[i % 4].push(`<div class="analysis-item"><p>${item}</p></div>`);
    });
    const detailedAnalysisHtml = analysisChunks.map(chunk => chunk.join('\n'));

    // Replace placeholders in the template (matching the presentation template format)
    template = template
      .replace(/{{UserName}}/g, UserInformation?.UserName || 'N/A')
      .replace(/{{CompanyName}}/g, UserInformation?.CompanyName || 'N/A')
      .replace(/{{Industry}}/g, UserInformation?.Industry || 'N/A')
      .replace(/{{UserEmail}}/g, UserInformation?.Email || 'N/A')
      .replace(/{{AITier}}/g, ScoreInformation?.AITier || 'N/A')
      .replace(/{{FinalScore}}/g, ScoreInformation?.FinalScore !== null ? String(ScoreInformation.FinalScore) : 'N/A')
      .replace(/{{ReportID}}/g, ScoreInformation?.ReportID || 'N/A')
      .replace(/{{ReportDate}}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
      .replace(/{{{STRENGTHS_CONTENT}}}/g, strengthsHtml)
      .replace(/{{{CHALLENGES_CONTENT}}}/g, weaknessesHtml)
      .replace(/{{{ACTION_PLAN_CONTENT_PART_1}}}/g, actionPlanHtml[0] || '')
      .replace(/{{{ACTION_PLAN_CONTENT_PART_2}}}/g, actionPlanHtml[1] || '')
      .replace(/{{{ACTION_PLAN_CONTENT_PART_3}}}/g, actionPlanHtml[2] || '')
      .replace(/{{{QA_CONTENT_PART_1}}}/g, qaHtml[0] || '')
      .replace(/{{{QA_CONTENT_PART_2}}}/g, qaHtml[1] || '')
      .replace(/{{{LEARNING_PATH_CONTENT_PART_1}}}/g, learningPathHtml[0] || '')
      .replace(/{{{LEARNING_PATH_CONTENT_PART_2}}}/g, learningPathHtml[1] || '')
      .replace(/{{{DETAILED_ANALYSIS_CONTENT_PART_1}}}/g, detailedAnalysisHtml[0] || '')
      .replace(/{{{DETAILED_ANALYSIS_CONTENT_PART_2}}}/g, detailedAnalysisHtml[1] || '')
      .replace(/{{{DETAILED_ANALYSIS_CONTENT_PART_3}}}/g, detailedAnalysisHtml[2] || '')
      .replace(/{{{DETAILED_ANALYSIS_CONTENT_PART_4}}}/g, detailedAnalysisHtml[3] || '');

    return template;
  } catch (error) {
    console.error('Error generating HTML:', error);
    throw new Error(`Failed to generate scorecard HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
