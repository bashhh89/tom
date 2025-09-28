import { logger } from './logger';
import { AIProvider } from './ai-providers';

export class OpenRouterProvider implements AIProvider {
  name = 'OpenRouter';
  apiKey: string;
  model: string;
  baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
    logger.debug(`Initializing OpenRouter provider with model: ${this.model}. API Key present: ${!!this.apiKey}`);
    if (!this.apiKey) {
      logger.warn('OpenRouter provider initialized without API key. It will not be available.');
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      logger.error('OpenRouter availability check failed: No API key provided.');
      return false;
    }
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      if (!response.ok) {
        const errorData = await response.text();
        logger.error(`OpenRouter provider availability check failed. Status: ${response.status}. Response: ${errorData.substring(0, 300)}`);
        return false;
      }
      logger.provider('OpenRouter provider is available.');
      return true;
    } catch (error: any) {
      logger.error('OpenRouter availability check failed with exception:', error.message);
      return false;
    }
  }

  private async _generate(systemPrompt: string, userPrompt: string, max_tokens: number, isJsonOutput: boolean): Promise<any> {
    if (!this.apiKey) throw new Error('OpenRouter API key not configured.');

    const body: any = {
      model: this.model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.7,
      max_tokens,
    };

    if (isJsonOutput) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://socialgarden.com.au', // Required by OpenRouter
        'X-Title': 'AI Scorecard', // Required by OpenRouter
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`OpenRouter API error: ${response.status}. Details: ${errorData.substring(0, 500)}`);
      throw new Error(`OpenRouter API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (isJsonOutput) {
      try {
        return JSON.parse(content);
      } catch (parseError: any) {
        logger.error('Error parsing OpenRouter JSON response:', parseError);
        throw parseError;
      }
    }

    return content;
  }

  async generateReport(systemPrompt: string, userPrompt: string): Promise<string> {
    logger.info('OpenRouter: Generating report...');
    return this._generate(systemPrompt, userPrompt, 8000, false) as Promise<string>;
  }

  async generateNextQuestion(systemPrompt: string, userPrompt: string): Promise<any> {
    logger.info('OpenRouter: Generating next question...');
    return this._generate(systemPrompt, userPrompt, 4096, true);
  }
}