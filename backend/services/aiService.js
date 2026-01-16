const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

if (!process.env.GROQ_API_KEY) {
    console.error("CRITICAL: GROQ_API_KEY is missing in .env file");
} else {
    console.log("AI Service: Groq API Key found");
}

const generateCompletion = async (prompt, systemMessage = "You are a helpful AI career coach.", jsonMode = true) => {
    try {
        const params = {
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            model: process.env.GROQ_MODEL || "llama3-8b-8192",
            temperature: 0.5,
            max_tokens: 4096,
        };

        if (jsonMode) {
            params.response_format = { type: "json_object" };
        }

        const chatCompletion = await groq.chat.completions.create(params);
        const content = chatCompletion.choices[0]?.message?.content || "{}";

        if (jsonMode) {
            try {
                return JSON.parse(content);
            } catch (e) {
                console.error("AI JSON Parse Error:", e, content);
                // Fallback or regex extraction could happen here
                return { error: "Failed to parse AI response" };
            }
        }

        return content;
    } catch (error) {
        console.error("Groq API Error:", error);
        throw new Error('AI Service Failed');
    }
};

module.exports = {
    generateCompletion
};
