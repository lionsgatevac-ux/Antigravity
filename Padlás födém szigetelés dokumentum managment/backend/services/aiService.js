const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': 'https://padlas-fodem-szigeteles.hu', // Alkalmazásod URL-je (opcionális az OpenRouter-nek)
        'X-Title': 'Padlás Födém Szigetelés Doc Management',
    },
});

/**
 * AI Service az OpenRouter integrációhoz
 */
class AIService {
    /**
     * Adatok kinyerése képből (OCR + AI elemzés)
     * Például: Személyi igazolvány adatok kinyerése
     */
    async extractDataFromImage(base64Image, prompt = 'Extract person name, birth date, mother name and ID number from this document.') {
        try {
            console.log('[AIService] Extracting data from image using OpenRouter...');
            const response = await openai.chat.completions.create({
                model: 'google/gemini-2.0-flash-001', // Vagy tetszőleges modell az OpenRouter-ről
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                response_format: { type: 'json_object' }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('[AIService] Error in extractDataFromImage:', error);
            throw error;
        }
    }

    /**
     * Okos becslés kalkulációja a projekt adatok alapján
     */
    async calculateSmartEstimation(projectData) {
        try {
            console.log('[AIService] Calculating smart estimation using OpenRouter...');
            const response = await openai.chat.completions.create({
                model: 'openai/gpt-3.5-turbo', // Kisebb modell is elég lehet szöveges adatokhoz
                messages: [
                    {
                        role: 'system',
                        content: 'You are an energy efficiency expert for attic insulation.'
                    },
                    {
                        role: 'user',
                        content: `Based on these house details, suggest the best insulation thickness and material: ${JSON.stringify(projectData)}`
                    }
                ],
                response_format: { type: 'json_object' }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('[AIService] Error in calculateSmartEstimation:', error);
            throw error;
        }
    }
}

module.exports = new AIService();
