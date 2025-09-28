import { logger } from './logger';
import { OpenRouterProvider } from './openrouter-provider';
import { ZAIProvider } from './zai-provider';

// AI Provider Interface
export interface AIProvider {
  name: string;
  generateReport: (systemPrompt: string, userPrompt: string) => Promise<string>;
  generateNextQuestion: (systemPrompt: string, userPrompt: string) => Promise<any>;
  isAvailable: () => Promise<boolean>;
}

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  apiKey: string;
  model: string;
  
  constructor(apiKey?: string, model?: string) {
    const envKey = process.env.OPENAI_API_KEY;
    this.apiKey = apiKey || envKey || '';
    this.model = model || process.env.OPENAI_MODEL || 'gpt-4o';
    logger.debug(`Initializing OpenAI provider with model: ${this.model}. API Key present: ${!!this.apiKey}`);
    if (!this.apiKey) {
      // This will be caught by isAvailable or when a call is made
      logger.warn('OpenAI provider initialized without API key. It will not be available.');
    }
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      logger.error('OpenAI availability check failed: No API key provided.');
      return false;
    }
    
    logger.debug(`OpenAI: Checking availability with API key: ${this.apiKey.substring(0, 7)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      logger.debug(`OpenAI availability response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        logger.error(`OpenAI provider availability check failed. Status: ${response.status}. Response: ${errorData.substring(0,300)}`);
        return false;
      }
      logger.provider('OpenAI provider is available and working correctly.');
      return true;
    } catch (error: any) {
      logger.error('OpenAI availability check failed with exception:', error.message);
      return false;
    }
  }
  
  async generateReport(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured.');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7, max_tokens: 4000
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`OpenAI API error for generateReport: ${response.status}. Details: ${errorData.substring(0,500)}`);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  async generateNextQuestion(systemPrompt: string, userPrompt: string): Promise<any> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured.');
    logger.debug('OpenAI: Generating next question...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7, max_tokens: 1500, response_format: { type: "json_object" }
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`OpenAI API error for generateNextQuestion: ${response.status}. Details: ${errorData.substring(0,500)}`);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }
    const data = await response.json();
    try {
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        if (typeof content !== 'string') return content;
        if (content.startsWith('<!DOCTYPE') || content.startsWith('<html')) {
          logger.error('OpenAI returned HTML instead of JSON for question:', content.substring(0, 100));
          throw new Error('Invalid response format: received HTML instead of JSON from OpenAI');
        }
        
        const parsedJson = JSON.parse(content);
        return parsedJson;
      }
      logger.error('Unexpected response structure from OpenAI (question):', data);
      throw new Error('Unexpected response structure from OpenAI API (question)');
    } catch (parseError: any) {
      logger.error('Error processing/parsing OpenAI question response:', parseError);
      throw parseError;
    }
  }
}

// Pollinations Provider with Fallback Support
export class PollinationsProvider implements AIProvider {
  name = 'Pollinations';
  apiUrl: string;
  fallbackModels: string[];

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || 'https://text.pollinations.ai/';
    // Prioritized fallback list as specified by user
    this.fallbackModels = ['openai', 'gemini', 'mistral', 'openai-fast', 'qwen-coder', 'bidara', 'midijourney'];
    logger.debug(`Initializing Pollinations provider with API URL: ${this.apiUrl}`);
    logger.debug(`Fallback models: ${this.fallbackModels.join(', ')}`);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test with the first fallback model
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.fallbackModels[0],
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5
        })
      });
      if (!response.ok) {
        logger.error(`Pollinations provider availability check failed. Status: ${response.status}`);
        return false;
      }
      logger.provider('Pollinations provider is available.');
      return true;
    } catch (error: any) {
      logger.error('Pollinations availability check failed with exception:', error.message);
      return false;
    }
  }

  private async _generateWithFallback(systemPrompt: string, userPrompt: string, max_tokens: number, expectJson: boolean = false): Promise<any> {
    let lastError: Error | null = null;

    // Try each model in the fallback list
    for (const model of this.fallbackModels) {
      try {
        logger.debug(`Pollinations: Trying model ${model}...`);

        // Build request body with model-specific adjustments
        const requestBody: any = {
          model: model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          max_tokens
        };

        // Adjust temperature based on model (some models don't support custom temperature)
        if (model === 'openai') {
          // For OpenAI model in Pollinations, don't specify temperature to avoid errors
          logger.debug(`Pollinations: Using default temperature for model ${model}`);
        } else {
          requestBody.temperature = 0.7;
        }

        if (expectJson) {
          if (model === 'gemini') {
            // For Gemini, we need to add JSON instruction to the system prompt
            // as it may not support response_format parameter
            if (!systemPrompt.toLowerCase().includes('json')) {
              logger.debug(`Pollinations: Adding JSON instruction to prompt for ${model}`);
              requestBody.messages[0].content = systemPrompt + " Please respond with valid JSON only.";
            }
          } else {
            // Use the jsonMode parameter as specified in the documentation
            requestBody.jsonMode = true;
          }
        }

        // Use the OpenAI-compatible endpoint
        const response = await fetch(`${this.apiUrl}openai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.text();
          logger.warn(`Pollinations API error with model ${model}: ${response.status}. Details: ${errorData.substring(0,200)}`);

          // Check if it's a model-specific error that should trigger fallback
          if (errorData.includes('Model not found') || errorData.includes('tier not high enough') ||
              errorData.includes('Unsupported value') || errorData.includes('does not support') ||
              response.status === 402 || response.status === 400) {
            logger.debug(`Model ${model} not available, trying next fallback...`);
            continue; // Try next model
          }

          // For other errors, throw immediately
          throw new Error(`Pollinations API error: ${response.status} ${errorData}`);
        }

        const data = await response.json();
        logger.debug(`Pollinations: Successfully used model ${model}`);

        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          const content = data.choices[0].message.content;

          if (expectJson) {
            if (typeof content !== 'string') return content; // Already object
            if (content.startsWith('<!DOCTYPE') || content.startsWith('<html')) {
              logger.error('Pollinations returned HTML instead of JSON:', content.substring(0, 100));
              throw new Error('Invalid response format: received HTML instead of JSON from Pollinations');
            }

            // Try to parse JSON, handling potential markdown code blocks
            try {
              // Remove markdown code block formatting if present
              let cleanedContent = content;
              if (content.includes('```json')) {
                cleanedContent = content.replace(/```json\s*/g, '').replace(/\s*```$/g, '');
              } else if (content.includes('```')) {
                cleanedContent = content.replace(/```\s*/g, '').replace(/\s*```$/g, '');
              }

              const parsedJson = JSON.parse(cleanedContent);
              return parsedJson;
            } catch (parseError) {
              logger.warn(`Failed to parse JSON from model ${model}, trying next fallback...`);
              lastError = new Error(`JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
              continue; // Try next model
            }
          }

          return content; // For text responses
        }

        logger.error('Unexpected response structure from Pollinations:', data);
        throw new Error('Unexpected response structure from Pollinations API');

      } catch (error: any) {
        lastError = error;
        logger.warn(`Model ${model} failed: ${error.message}`);

        // Continue to next model if this is a model-specific error
        if (error.message.includes('Model not found') || error.message.includes('tier not high enough') ||
            error.message.includes('402') || error.message.includes('400') || 
            error.message.includes('Unsupported value') || error.message.includes('does not support') ||
            error.message.includes('JSON parse error')) {
          continue;
        }

        // For other errors, don't continue
        break;
      }
    }

    // If we get here, all models failed
    const errorMsg = `All Pollinations fallback models failed. Last error: ${lastError?.message || 'Unknown error'}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  async generateReport(systemPrompt: string, userPrompt: string): Promise<string> {
    logger.debug('Pollinations: Generating report with fallback...');
    return this._generateWithFallback(systemPrompt, userPrompt, 4000, false) as Promise<string>;
  }

  async generateNextQuestion(systemPrompt: string, userPrompt: string): Promise<any> {
    logger.debug('Pollinations: Generating next question with fallback...');
    return this._generateWithFallback(systemPrompt, userPrompt, 1500, true);
  }
}

// Groq Provider
export class GroqProvider implements AIProvider {
  name = 'Groq';
  apiKey: string;
  model: string;
  
  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    this.model = model || process.env.DEV_AI_MODEL || 'qwen-qwq-32b'; // Default qwen-qwq-32b
    logger.debug(`Initializing Groq provider with model: ${this.model}. API Key present: ${!!this.apiKey}`);
    if (!this.apiKey) {
      logger.warn('Groq provider initialized without API key. It will not be available.');
    }
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      logger.error('Groq availability check failed: No API key provided.');
      return false;
    }
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', { // Corrected URL
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
       if (!response.ok) {
        const errorData = await response.text();
        logger.error(`Groq provider availability check failed. Status: ${response.status}. Response: ${errorData.substring(0,300)}`);
        return false;
      }
      logger.provider('Groq provider is available.');
      return true;
    } catch (error: any) {
      logger.error('Groq availability check failed with exception:', error.message);
      return false;
    }
  }

  private async _generate(systemPrompt: string, userPrompt: string, max_tokens: number, isJsonOutput: boolean): Promise<any> {
    if (!this.apiKey) throw new Error('Groq API key not configured.');
    const body: any = {
        model: this.model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7,
        max_tokens
    };
    if (isJsonOutput) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`Groq API error: ${response.status}. Details: ${errorData.substring(0,500)}`);
      throw new Error(`Groq API error: ${response.status} ${errorData}`);
    }
    const data = await response.json();
    
    if (isJsonOutput) {
        try {
            if (data && data.choices && data.choices[0] && data.choices[0].message) {
              const content = data.choices[0].message.content;
              if (typeof content !== 'string') return content; // Already object
              if (content.startsWith('<!DOCTYPE') || content.startsWith('<html')) {
                logger.error('Groq returned HTML instead of JSON:', content.substring(0, 100));
                throw new Error('Invalid response format: received HTML instead of JSON from Groq');
              }
              return JSON.parse(content);
            }
            logger.error('Unexpected response structure from Groq (JSON mode):', data);
            throw new Error('Unexpected response structure from Groq API (JSON mode)');
        } catch (parseError: any) {
            logger.error('Error processing/parsing Groq JSON response:', parseError);
            throw parseError;
        }
    } else {
        // For text output like generateReport
        if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        }
        logger.error('Unexpected response structure for text report from Groq:', data);
        throw new Error('Unexpected text report response structure from Groq API');
    }
  }
  
  async generateReport(systemPrompt: string, userPrompt: string): Promise<string> {
    logger.info('Groq: Generating report...');
    return this._generate(systemPrompt, userPrompt, 4000, false) as Promise<string>;
  }
  
  async generateNextQuestion(systemPrompt: string, userPrompt: string): Promise<any> {
    logger.info('Groq: Generating next question...');
    return this._generate(systemPrompt, userPrompt, 1500, true);
  }
}

// Google Gemini Provider
export class GoogleProvider implements AIProvider {
  name = 'Google';
  apiKey: string;
  model: string;
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || '';
    this.model = model || 'gemini-2.5-flash'; // Changed to gemini-2.5-flash
    logger.debug(`Initializing Google Gemini provider with model: ${this.model}. API Key present: ${!!this.apiKey}`);
    if (!this.apiKey) {
      logger.warn('Google Gemini provider initialized without API key. It will not be available.');
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      logger.error('Google Gemini availability check failed: No API key provided.');
      return false;
    }
    try {
      // Simple check by trying to get model info. Gemini API lists models at /models or /models/{model_id}
      const response = await fetch(`${this.baseUrl}/${this.model}?key=${this.apiKey}`);
      if (!response.ok) {
        const errorData = await response.text();
        logger.error(`Google Gemini provider availability check failed. Status: ${response.status}. Response: ${errorData.substring(0,300)}`);
        return false;
      }
      logger.provider('Google Gemini provider is available.');
      return true;
    } catch (error: any) {
      logger.error('Google Gemini availability check failed with exception:', error.message);
      return false;
    }
  }

  private async _generateContent(systemPrompt: string, userPrompt: string, maxOutputTokens: number, expectJson: boolean): Promise<any> {
    if (!this.apiKey) throw new Error('Google Gemini API key not configured.');

    const requestUrl = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      // Gemini API structure: contents array, with parts array for text
      // System prompt can be part of the first message or a separate instruction
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] } 
      ],
      generationConfig: {
        // Not directly 'temperature' and 'max_tokens' like OpenAI.
        // 'temperature' is available. 'maxOutputTokens' is the equivalent for token limit.
        temperature: 0.7,
        maxOutputTokens: maxOutputTokens,
        // For JSON output, Gemini typically infers from prompt or can be guided by specific model versions.
        // If a direct "response_mime_type": "application/json" is supported for the model, it would be here.
        // For gemini-1.5-flash, it's good at following instructions for JSON in the prompt.
        // If `expectJson` is true, ensure the systemPrompt instructs JSON output.
      }
    };

    if (expectJson) {
        // For Gemini, ensure the system prompt explicitly asks for JSON output.
        // Example: "You must respond in JSON format: { \"questionText\": ..., ... }"
        // Some newer Gemini models might support a response_mime_type in generationConfig.
        // For now, relying on prompt engineering for JSON.
        if (!systemPrompt.toLowerCase().includes('json')) {
            logger.warn("GoogleProvider: expectJson is true, but systemPrompt might not be instructing JSON output effectively.");
        }
    }

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`Google Gemini API error: ${response.status}. Details: ${errorData.substring(0,500)}`);
      throw new Error(`Google Gemini API error: ${response.status} ${errorData}`);
    }
    const data = await response.json();

    // Gemini response structure: data.candidates[0].content.parts[0].text
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const textContent = data.candidates[0].content.parts[0].text;
      if (expectJson) {
        let cleanedJson = ""; // Declare here
        try {
          // Gemini might wrap JSON in markdown ```json ... ``` or just ``` ... ```
          cleanedJson = textContent.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
          return JSON.parse(cleanedJson);
        } catch (parseError: any) {
          logger.error('Error parsing Google Gemini JSON response. Raw text:', textContent.substring(0, 500));
          logger.error('Parse error:', parseError);
          // Fallback: attempt to extract JSON from within the string if it's embedded
          // Note: cleanedJson from the try block might be an empty string if textContent was only ```json``` etc.
          // So, it's better to use the original textContent for fallback search if cleanedJson is empty or fails.
          const stringToSearchForJson = cleanedJson.length > 0 ? cleanedJson : textContent;
          try {
            const jsonMatch = stringToSearchForJson.match(/\{([\s\S]*)\}/); // Try to find a JSON object within, mimic dotAll
            if (jsonMatch && jsonMatch[0]) {
              logger.debug("Attempting to parse extracted JSON from fallback match...");
              return JSON.parse(jsonMatch[0]);
            }
          } catch (fallbackParseError: any) {
            logger.error('Fallback JSON parsing also failed:', fallbackParseError);
            throw new Error('Failed to parse JSON response from Google Gemini (initial and fallback): ' + parseError.message + ". Raw text: " + textContent.substring(0, 200));
          }
          throw new Error('Failed to parse JSON response from Google Gemini: ' + parseError.message + ". Raw text: " + textContent.substring(0, 200));
        }
      }
      return textContent; // For text report
    }
    logger.error('Unexpected response structure from Google Gemini:', data);
    throw new Error('Unexpected response structure from Google Gemini API');
  }

  async generateReport(systemPrompt: string, userPrompt: string): Promise<string> {
    logger.info('Google Gemini: Generating report...');
    // Ensure systemPrompt does NOT ask for JSON for reports.
    return this._generateContent(systemPrompt, userPrompt, 8192, false) as Promise<string>;
  }

  async generateNextQuestion(systemPrompt: string, userPrompt: string): Promise<any> {
    logger.info('Google Gemini: Generating next question...');
    // Ensure systemPrompt for questions DOES ask for JSON.
    return this._generateContent(systemPrompt, userPrompt, 4096, true);
  }
}

// AI Provider Manager
export class AIProviderManager {
  private openAIProvider: OpenAIProvider | undefined; // Primary
  private pollinationsProvider: PollinationsProvider | undefined; // Fallback
  private lastReportProviderName: string | undefined;
  private lastQuestionProviderName: string | undefined;

  constructor() {
    logger.debug('============================================');
    logger.debug('AIProviderManager: INITIALIZING PROVIDER MANAGER');
    logger.debug('============================================');

    logger.debug('Initializing AI providers with OpenAI as primary...');

    // Initialize OpenAI Provider as primary if API key is provided
    const openAIAPIKey = process.env.OPENAI_API_KEY || '';
    if (openAIAPIKey) {
      try {
        this.openAIProvider = new OpenAIProvider(openAIAPIKey, process.env.OPENAI_MODEL || 'gpt-4o');
        logger.debug('OpenAI Provider initialized as primary');
      } catch (e: any) {
        logger.warn('OpenAI primary provider initialization failed:', e.message);
      }
    }

    // Initialize Pollinations Provider as fallback
    try {
      this.pollinationsProvider = new PollinationsProvider();
      logger.debug('Pollinations Provider initialized as fallback (FREE)');
    } catch (e: any) {
      logger.error("Failed to instantiate PollinationsProvider:", e.message);
      this.pollinationsProvider = new PollinationsProvider();
    }

    logger.debug('AIProviderManager constructor finished - OpenAI primary, Pollinations fallback');
  }

  async initialize(): Promise<void> {
    logger.debug('Verifying AI provider availability (OpenAI Primary)...');

    // Check OpenAI (Primary - Paid)
    if (this.openAIProvider) {
      if (await this.openAIProvider.isAvailable()) {
        logger.debug('OpenAI provider is available (Primary - Paid).');
      } else {
        logger.warn('OpenAI provider configured but not available.');
      }
    }

    // Check Pollinations fallback
    if (this.pollinationsProvider) {
      if (await this.pollinationsProvider.isAvailable()) {
        logger.debug('Pollinations provider is available (Fallback - FREE).');
      } else {
        logger.warn('Pollinations provider configured but not available.');
      }
    }

    logger.debug('AI Provider availability check complete.');
  }

  async generateNextQuestion(systemPrompt: string, userPrompt: string): Promise<any> {
    this.lastQuestionProviderName = undefined;

    // Use OpenAI (Paid) as primary
    if (this.openAIProvider) {
      try {
        logger.debug('AIProviderManager: Using OpenAI for question generation (Primary).');
        const question = await this.openAIProvider.generateNextQuestion(systemPrompt, userPrompt);
        this.lastQuestionProviderName = this.openAIProvider.name;
        logger.debug('AIProviderManager: OpenAI question generation SUCCESSFUL');
        return question;
      } catch (error: any) {
        logger.warn('AIProviderManager: OpenAI question generation failed, trying fallback:', error.message);
      }
    }

    // Fallback to Pollinations if OpenAI fails
    if (this.pollinationsProvider) {
      try {
        logger.debug('AIProviderManager: Using Pollinations fallback for question generation (FREE).');
        const question = await this.pollinationsProvider.generateNextQuestion(systemPrompt, userPrompt);
        this.lastQuestionProviderName = this.pollinationsProvider.name;
        logger.debug('AIProviderManager: Pollinations question generation SUCCESSFUL (fallback)');
        return question;
      } catch (error: any) {
        logger.error('AIProviderManager: Pollinations fallback question generation failed:', error.message);
        throw new Error(`Question generation failed: ${error.message}`);
      }
    } else {
      throw new Error('No AI providers available for question generation');
    }
  }

  async generateReport(systemPrompt: string, userPrompt: string): Promise<string> {
    this.lastReportProviderName = undefined;

    // Use OpenAI (Paid) as primary
    if (this.openAIProvider) {
      try {
        logger.debug('AIProviderManager: Using OpenAI for report generation (Primary).');
        const report = await this.openAIProvider.generateReport(systemPrompt, userPrompt);
        this.lastReportProviderName = this.openAIProvider.name;
        logger.debug('AIProviderManager: OpenAI report generation SUCCESSFUL');
        return report;
      } catch (error: any) {
        logger.warn('AIProviderManager: OpenAI report generation failed, trying fallback:', error.message);
      }
    }

    // Fallback to Pollinations if OpenAI fails
    if (this.pollinationsProvider) {
      try {
        logger.debug('AIProviderManager: Using Pollinations fallback for report generation (FREE).');
        const report = await this.pollinationsProvider.generateReport(systemPrompt, userPrompt);
        this.lastReportProviderName = this.pollinationsProvider.name;
        logger.debug('AIProviderManager: Pollinations report generation SUCCESSFUL (fallback)');
        return report;
      } catch (error: any) {
        logger.error('AIProviderManager: Pollinations fallback report generation failed:', error.message);
        throw new Error(`Report generation failed: ${error.message}`);
      }
    } else {
      throw new Error('No AI providers available for report generation');
    }
  }

  getReportProviderName(): string | undefined {
    return this.lastReportProviderName;
  }
  
  getQuestionProviderName(): string | undefined {
    return this.lastQuestionProviderName;
  }
}

// Create and export a singleton instance
const aiManager = new AIProviderManager();
export default aiManager;
