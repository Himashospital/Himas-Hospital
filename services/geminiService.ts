
import { GoogleGenAI } from "@google/genai";
import { Patient } from "../types";

export const generateCounselingStrategy = async (patient: Patient): Promise<string> => {
  try {
    // Obtain API key exclusively from process.env.API_KEY as per guidelines
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is not configured in the environment.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an expert medical sales counselor at Himas Hospital. 
      Create a brief, empathetic, and effective counseling strategy (max 50 words) 
      to help this patient decide on their treatment.
      
      Patient Profile:
      - Name: ${patient.name}
      - Age: ${patient.age}
      - Occupation: ${patient.occupation}
      - Condition: ${patient.condition}
      
      Doctor's Assessment:
      - Recommendation: ${patient.doctorAssessment?.quickCode}
      - Pain Level: ${patient.doctorAssessment?.painSeverity}
      - Affordability: ${patient.doctorAssessment?.affordability}
      - Readiness: ${patient.doctorAssessment?.conversionReadiness}
      
      Provide a specific conversational approach to address their likely concerns based on readiness and affordability.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate strategy.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Strategy unavailable. Please ensure your environment is correctly configured.";
  }
};
