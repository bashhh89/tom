const { fetch } = require("undici");

class SOWGeneratorSkill {
  constructor() {
    this.name = "SOW Generator";
    this.description = "Generates Statements of Work and creates Google Sheets via Google Apps Script";
  }

  async generateSOW(prompt, context) {
    // Extract the Google Apps Script URL from settings
    const googleAppsScriptUrl = context.settings?.googleAppsScriptUrl;

    if (!googleAppsScriptUrl) {
      return {
        success: false,
        message: "Google Apps Script URL is not configured. Please configure it in the skill settings."
      };
    }

    try {
      // Use the LLM to generate the SOW content
      const sowContent = await this.generateSOWContent(prompt, context);

      // Structure the content as JSON
      const sowJson = this.structureSOWAsJSON(sowContent);

      // POST the JSON to the Google Apps Script endpoint
      const response = await fetch(googleAppsScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sowJson),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: `SOW generated successfully! You can access it here: ${result.sheetUrl}`,
        data: result
      };
    } catch (error) {
      console.error("Error generating SOW:", error);
      return {
        success: false,
        message: `Error generating SOW: ${error.message}`
      };
    }
  }

  async generateSOWContent(prompt, context) {
    // Create a structured prompt to ensure we get all required sections
    const structuredPrompt = `
Generate a comprehensive Statement of Work (SOW) based on the following requirements:

${prompt}

Please structure the SOW with the following sections:
1. Scope Name: A clear, concise name for the project
2. Overview: A high-level description of the project
3. What's Included: A detailed list of what is included in the scope
4. Outcomes: The expected results and deliverables
5. Assumptions: Any assumptions made for this SOW
6. Individual Scopes of Work: A list of individual scopes, each containing:
   - Role: The role responsible for this scope
   - Tasks: A list of tasks to be performed
   - Hours: Estimated hours for completion
   - Deliverables: What will be delivered
   - Assumptions: Any assumptions specific to this scope

Please format your response as a structured JSON object with the following schema:
{
  "scopeName": "string",
  "overview": "string",
  "whatsIncluded": ["string"],
  "outcomes": ["string"],
  "assumptions": ["string"],
  "individualScopes": [
    {
      "role": "string",
      "tasks": ["string"],
      "hours": number,
      "deliverables": ["string"],
      "assumptions": ["string"]
    }
  ]
}
`;

    // Use the LLM to generate the content
    const llmResponse = await context.llm.generate(structuredPrompt);

    // Try to parse the response as JSON
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      let jsonContent = llmResponse;
      const jsonMatch = llmResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1];
      }

      return JSON.parse(jsonContent);
    } catch (error) {
      console.error("Error parsing LLM response as JSON:", error);
      // If parsing fails, return the raw response and let the structureSOWAsJSON method handle it
      return { rawContent: llmResponse };
    }
  }

  structureSOWAsJSON(sowContent) {
    // If the content is already structured as JSON, return it
    if (sowContent.scopeName && sowContent.overview) {
      return sowContent;
    }

    // If we have raw content, we need to parse it and structure it
    // This is a fallback in case the LLM didn't return valid JSON
    // In a real implementation, you might want to use more sophisticated parsing

    // For now, we'll return a basic structure with the raw content
    return {
      scopeName: "Generated SOW",
      overview: sowContent.rawContent || "Statement of Work generated based on your requirements",
      whatsIncluded: [],
      outcomes: [],
      assumptions: [],
      individualScopes: []
    };
  }
}

module.exports = SOWGeneratorSkill;
