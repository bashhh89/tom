# Installation and Usage Guide for AnythingLLM SOW Generator Skill

## Prerequisites

- AnythingLLM instance with admin access
- Google Account with access to Google Sheets
- Google Sheets template for SOW (see Template Setup section)

## Step 1: Set Up Google Sheets Template

1. Create a new Google Sheet that will serve as your SOW template
2. Structure the template with the following sections (adjust as needed):
   - Scope Name (cell B2)
   - Overview (cell B3)
   - What's Included (cell B4)
   - Outcomes (cell B5)
   - Assumptions (cell B6)
3. Create a second sheet named "Individual Scopes" with the following columns:
   - Role (column A)
   - Tasks (column B)
   - Hours (column C)
   - Deliverables (column D)
   - Assumptions (column E)
4. Note the ID of your template sheet (you can find it in the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`)

## Step 2: Set Up Google Apps Script

1. Open your template Google Sheet
2. Go to Extensions > Apps Script
3. Copy the content from `google-apps-script-example.js` into the script editor
4. Replace `YOUR_TEMPLATE_SHEET_ID` with your actual template sheet ID
5. Save the script
6. Deploy as a Web App:
   - Click on "Deploy" > "New deployment"
   - Select "Web app" as the deployment type
   - Set "Who has access" to "Anyone, even anonymous"
   - Click "Deploy"
   - Authorize the script when prompted
7. Copy the Web App URL (you'll need this for the AnythingLLM skill configuration)

## Step 3: Install the AnythingLLM Skill

1. Navigate to your AnythingLLM installation directory
2. Create a new directory for the skill in the skills folder (usually `server/skills/`)
   ```bash
   mkdir -p server/skills/sow-generator
   ```
3. Copy all files from this skill package into the new directory
4. Install dependencies:
   ```bash
   cd server/skills/sow-generator
   npm install
   ```
5. Restart AnythingLLM

## Step 4: Configure the Skill

1. Log in to your AnythingLLM instance as an admin
2. Go to Settings > Skills
3. Find the "SOW Generator" skill in the list
4. Click "Configure"
5. Enter the Google Apps Script URL you copied in Step 2
6. Save the configuration

## Step 5: Use the Skill

1. Start a new conversation with AnythingLLM
2. Use a prompt like this to generate an SOW:
   ```
   Generate a Statement of Work for a website redesign project with the following requirements:

   - Modern, responsive design
   - Content management system integration
   - SEO optimization
   - Mobile-friendly layout
   - Project timeline: 3 months
   - Team: Project manager, UI/UX designer, frontend developer, backend developer
   ```

3. The skill will:
   - Generate the SOW content using the LLM
   - Structure it as JSON
   - Send it to your Google Apps Script endpoint
   - Return a link to the newly created Google Sheet

## Troubleshooting

### Skill Not Appearing in AnythingLLM

- Make sure the skill files are in the correct directory
- Check that the `plugin.json` file is valid
- Restart AnythingLLM after adding the skill

### Google Sheet Not Created

- Verify the Google Apps Script URL is correct
- Check the Google Apps Script execution logs for errors
- Ensure the Web App is deployed with "Anyone, even anonymous" access

### SOW Data Not Correctly Formatted

- The skill uses a structured prompt to ensure all required sections are included
- If the LLM doesn't return valid JSON, the skill will fall back to a basic structure
- You can modify the structured prompt in the `generateSOWContent` method if needed

## Customization

### Modifying the JSON Structure

If your Google Sheets template uses a different structure, you can modify the JSON schema in the `generateSOWContent` method of the skill.

### Enhancing the LLM Prompt

You can enhance the structured prompt in the `generateSOWContent` method to better suit your specific SOW requirements.

### Adding Additional Fields

If you need additional fields in your SOW, you can:
1. Update the Google Sheets template
2. Modify the Google Apps Script to handle the new fields
3. Update the JSON structure in the skill
