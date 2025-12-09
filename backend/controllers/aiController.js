import {
  conceptExplainPrompt,
  questionAnswerPrompt,
} from "../utils/prompts.js";

// Generate interview questions and answers using Groq
const generateInterviewQuestions = async (req, res) => {
  try {
    console.log("API Key chargée:", process.env.GROQ_API_KEY ? "OUI" : "NON");
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions
    );

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt.replace(/\n/g, " ").trim(),
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API error");
    }

    let rawText = data.choices[0].message.content;

    // Clean the text: Remove ```json and ``` from beginning and end
    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    const parsedData = JSON.parse(cleanedText);

    res.status(200).json(parsedData);
  } catch (error) {
    console.log("=== ERREUR GROQ ===");
    console.log("Message:", error.message);
    res
      .status(500)
      .json({ message: "Failed to generate questions", error: error.message });
  }
};

// Generate explanations for an interview question
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const prompt = conceptExplainPrompt(question);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt.replace(/\n/g, " ").trim(),
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API error");
    }

    let rawText = data.choices[0].message.content;

    // Clean the text: Remove ```json and ``` from beginning and end
    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    const parsedData = JSON.parse(cleanedText);

    res.status(200).json(parsedData);
  } catch (error) {
    console.log("=== ERREUR GROQ ===");
    console.log("Message:", error.message);
    res
      .status(500)
      .json({ message: "Failed to generate questions", error: error.message });
  }
};

export { generateInterviewQuestions, generateConceptExplanation };
