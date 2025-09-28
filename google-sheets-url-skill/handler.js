const { google } = require('googleapis');

module.exports.runtime = {
  handler: async function ({ sowJson }) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    try {
      this.introspect(`${callerId}: Skill invoked. Beginning process.`);

      // --- 1. Authenticate with Google --- //
      const credentialsJson = this.runtimeArgs.SERVICE_ACCOUNT_CREDENTIALS;
      if (!credentialsJson || credentialsJson.includes('your-project-id')) {
        return 'ERROR: Google Service Account credentials are not configured. Please configure them in the skill settings.';
      }
      const credentials = JSON.parse(credentialsJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
      });
      const sheets = google.sheets({ version: 'v4', auth });
      const drive = google.drive({ version: 'v3', auth });
      this.introspect('Authentication successful.');

      // --- 2. Parse the SOW JSON --- //
      let sowData;
      try {
        // The agent may pass the JSON as a string within a JSON payload, so we parse twice.
        const innerJson = JSON.parse(sowJson).sowJson;
        sowData = JSON.parse(innerJson);
      } catch (e) {
        // Fallback for simpler JSON structures
        try {
            sowData = JSON.parse(sowJson);
        } catch (e2) {
            this.logger(`Failed to parse SOW JSON: ${e2.message}`);
            return `ERROR: Invalid SOW JSON format received. Could not parse.`;
        }
      }
      this.introspect(`Successfully parsed SOW titled: ${sowData.Title}`);

      // --- 3. Copy the Template Sheet --- //
      const templateId = this.runtimeArgs.TEMPLATE_SHEET_ID;
      const newSheetTitle = sowData.Title || 'New SOW';
      const copyRequest = {
        fileId: templateId,
        resource: {
          name: newSheetTitle,
        },
      };
      this.introspect(`Copy request: ${JSON.stringify(copyRequest)}`);
      const copiedSheet = await drive.files.copy(copyRequest);
      const newSheetId = copiedSheet.data.id;
      this.introspect(`Template sheet copied. New sheet ID: ${newSheetId}`);

      // --- 4. Prepare Data for Summary Sheet --- //
      const summarySheetName = 'Project Summary';
      const requests = [
        {
          updateSheetProperties: {
            properties: { sheetId: 0, title: summarySheetName },
            fields: 'title',
          },
        },
      ];
      await sheets.spreadsheets.batchUpdate({ spreadsheetId: newSheetId, resource: { requests } });

      const summaryRows = [];
      summaryRows.push(['Project Title', sowData.Title]);
      summaryRows.push([]); // Spacer
      summaryRows.push(['Overview']);
      summaryRows.push([sowData.Overview]);
      summaryRows.push([]); // Spacer
      summaryRows.push(['Outcomes']);
      sowData.Outcomes.forEach(outcome => summaryRows.push([outcome]));
      summaryRows.push([]); // Spacer
      summaryRows.push(['Pricing Summary']);
      const pricingHeader = Object.keys(sowData['Pricing Summary'].Roles[0]);
      summaryRows.push(pricingHeader);
      sowData['Pricing Summary'].Roles.forEach(role => {
        summaryRows.push(pricingHeader.map(h => role[h]));
      });
      summaryRows.push(['','','Total Hours', sowData['Pricing Summary']['Total Estimated Hours']]);
      summaryRows.push(['','','Total Investment', sowData['Pricing Summary']['Total Investment (Excl. GST)']]);
      summaryRows.push([]); // Spacer
      summaryRows.push(['Assumptions']);
      sowData.Assumptions.forEach(assumption => summaryRows.push([assumption]));

      await sheets.spreadsheets.values.update({
        spreadsheetId: newSheetId,
        range: `${summarySheetName}!A3`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: summaryRows },
      });
      this.introspect('Summary sheet populated.');

      // --- 5. Create and Populate Phase Sheets --- //
      const phaseRequests = [];
      for (let i = 0; i < sowData['Phases & Deliverables'].length; i++) {
        const phase = sowData['Phases & Deliverables'][i];
        const phaseKey = Object.keys(phase)[0];
        const phaseTitle = `Phase ${i + 1}: ${phase[phaseKey].substring(0, 50)}`;
        phaseRequests.push({ addSheet: { properties: { title: phaseTitle } } });
      }
      const phaseSheetResponses = await sheets.spreadsheets.batchUpdate({ spreadsheetId: newSheetId, resource: { requests: phaseRequests } });
      this.introspect(`${phaseRequests.length} phase sheets are being created.`);

      for (let i = 0; i < sowData['Phases & Deliverables'].length; i++) {
        const phase = sowData['Phases & Deliverables'][i];
        const phaseKey = Object.keys(phase)[0];
        const phaseTitle = phaseSheetResponses.data.replies[i].addSheet.properties.title;
        const phaseRows = [];
        phaseRows.push([phaseKey]);
        phaseRows.push([]);
        phaseRows.push(['Deliverables']);
        phase.Deliverables.forEach(d => phaseRows.push([d]));
        phaseRows.push([]);
        phaseRows.push(['Activities']);
        phase.Activities.forEach(a => phaseRows.push([a]));

        await sheets.spreadsheets.values.update({
            spreadsheetId: newSheetId,
            range: `${phaseTitle}!A3`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: phaseRows },
        });
        this.introspect(`Populated sheet: ${phaseTitle}`);
      }

      // --- 6. Return the URL --- //
      const finalUrl = `https://docs.google.com/spreadsheets/d/${newSheetId}`;
      this.introspect(`Process complete. Returning URL.`);
      return `Success! Your Google Sheet has been created: ${finalUrl}`;

    } catch (e) {
      this.logger(`${callerId} failed to invoke. Full error: ${JSON.stringify(e, null, 2)}`);
      this.introspect(`${callerId} failed. See logs for details.`);
      return `The tool failed to run. Here is all we know: ${e.message}`;
    }
  },
};