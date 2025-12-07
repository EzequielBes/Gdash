import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AIInsightsService {
  private readonly logger = new Logger(AIInsightsService.name);
  private readonly geminiApiKey: string;
  private readonly geminiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor(private configService: ConfigService) {
    this.geminiApiKey =
      this.configService.get<string>('GEMINI_API_KEY') || 'demo-key';
  }

  async generateInsight(context: { current: any; history: any[] }): Promise<string> {
    if (this.geminiApiKey === 'demo-key') {
      return this.generateDemoInsight(context.current);
    }

    try {
      const historySummary = context.history
        .slice(0, 5) // Limit to last 5 entries to save tokens
        .map(
          (h) =>
            `- ${new Date(h.timestamp).toLocaleTimeString()}: ${h.temperature}°C, ${h.humidity}%`,
        )
        .join('\n');

      const prompt = `Você é um especialista em meteorologia. Analise os dados climáticos atuais e o histórico recente para gerar um insight útil e contextualizado em português (máximo 3 linhas).

Dados Atuais:
- Temperatura: ${context.current.temperature}°C
- Umidade: ${context.current.humidity}%
- Vento: ${context.current.windSpeed} km/h
- Condição: ${context.current.description}
- Cidade: ${context.current.city}

Histórico Recente:
${historySummary}

Gere um resumo que destaque tendências (ex: temperatura subindo/caindo) e dê uma recomendação prática.`;

      const response = await axios.post(
        `${this.geminiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        { timeout: 5000 },
      );

      return (
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Não foi possível gerar o insight'
      );
    } catch (error) {
      this.logger.warn('Erro ao chamar Gemini API, usando fallback', error);
      return this.generateDemoInsight(context.current);
    }
  }

  private generateDemoInsight(weatherData: any): string {
    const { temperature, humidity, windSpeed, city } = weatherData;
    let insight = `Condições em ${city}: `;

    if (temperature > 30) {
      insight += `🔥 Dia muito quente (${temperature}°C). `;
    } else if (temperature > 20) {
      insight += `☀️ Dia agradável (${temperature}°C). `;
    } else if (temperature > 10) {
      insight += `🌤️ Dia fresco (${temperature}°C). `;
    } else {
      insight += `❄️ Dia frio (${temperature}°C). `;
    }

    if (humidity > 70) {
      insight += `Umidade alta (${humidity}%). `;
    } else {
      insight += `Umidade normal (${humidity}%). `;
    }

    if (windSpeed > 20) {
      insight += `⛈️ Vento forte (${windSpeed} km/h).`;
    }

    return insight;
  }
}
