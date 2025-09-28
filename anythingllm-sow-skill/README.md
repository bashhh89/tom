# AnythingLLM SOW Generator Skill

This custom agent skill for AnythingLLM generates Statements of Work (SOW) and sends them to a Google Apps Script Web App endpoint to create a new Google Sheet based on a template.

## Features

- Generates all SOW sections (scope name, overview, what's included, outcomes, assumptions, and individual scopes of work)
- Structures data as JSON payload matching Google Sheet template
- POSTs JSON to Google Apps Script Web App endpoint
- Returns link to newly created Google Sheet

## Installation

1. Copy this skill to your AnythingLLM skills directory
2. Configure the Google Apps Script Web App URL in the skill settings
3. Restart AnythingLLM

## Usage

In AnythingLLM, provide your requirements for the SOW, and the skill will:
1. Generate the SOW content
2. Send it to the Google Apps Script endpoint
3. Return a link to the newly created Google Sheet

## Configuration

- **Google Apps Script URL**: The endpoint URL of your Google Apps Script Web App
- **JSON Schema**: Must match your Google Sheet template structure

## Prompt Structure

To get the required data fields, use a prompt like:

```
Generate a Statement of Work with the following sections:
- Scope name
- Overview
- What's included
- Outcomes
- Assumptions
- Individual scopes of work (each with roles, tasks, hours, deliverables, and assumptions)

[Your specific requirements here]
```
