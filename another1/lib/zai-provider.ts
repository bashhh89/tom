import { logger } from './logger';
import { AIProvider } from './ai-providers';

export class ZAIProvider implements AIProvider {
  name = 'ZAI';
  apiKey: string;
  model: string;
  baseUrl = 'https://api.z.ai/api/paas/v4';

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
    logger.debug(`Initializing ZAI provider with model: ${this.model}. API Key present: ${!!this.apiKey}`);
    if (!this.apiKey) {
      logger.warn('ZAI provider initialized without API key. It will not be available.');
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      logger.error('ZAI availability check failed: No API key provided.');
      return false;
    }
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      });

      if (response.status === 401) {
        logger.error(`ZAI provider availability check failed. Status: 401 Unauthorized. Check API Key.`);
        return false;
      }

      if (!response.ok) {
        const errorData = await response.text();
        logger.error(`ZAI provider availability check failed. Status: ${response.status}. Response: ${errorData.substring(0, 300)}`);
        return false;
      }

      logger.provider('ZAI provider is available.');
      return true;
    } catch (error: any) {
      logger.error('ZAI availability check failed with exception:', error.message);
      return false;
    }
  }

  private async _generate(systemPrompt: string, userPrompt: string, max_tokens: number, isJsonOutput: boolean): Promise<any> {
    if (!this.apiKey) throw new Error('ZAI API key not configured.');

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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`ZAI API error: ${response.status}. Details: ${errorData.substring(0, 500)}`);
      throw new Error(`ZAI API error: ${response.status} ${errorData}`);
    }

    return response.json();
  }

  async generateReport(systemPrompt: string, userPrompt: string): Promise<string> {
    logger.info('ZAI: Generating report...');
    const data = await this._generate(systemPrompt, userPrompt, 8000, false);
    return data.choices[0].message.content;
  }

  async generateNextQuestion(systemPrompt: string, userPrompt: string): Promise<any> {
    logger.info('ZAI: Generating next question...');
    const data = await this._generate(systemPrompt, userPrompt, 4096, true);
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  }
}