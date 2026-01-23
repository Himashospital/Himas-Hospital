

import { GoogleGenAI } from "@google/genai";
import { Patient } from "../types";

export const generateCounselingStrategy = async (patient: Patient): Promise<string> => {
  try {
    // Fixed: Initializing GoogleGenAI strictly according to guidelines using process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
      // FIX: Corrected property name from quickCode to quick_code to match the DoctorAssessment type.
      - Recommendation: ${patient.doctorAssessment?.quick_code}
      // FIX: Corrected property name from painSeverity to pain_severity to match the DoctorAssessment type.
      - Pain Level: ${patient.doctorAssessment?.pain_severity}
      - Affordability: ${patient.doctorAssessment?.affordability}
      // FIX: Corrected property name from conversionReadiness to conversion_readiness to match the DoctorAssessment type.
      - Readiness: ${patient.doctorAssessment?.conversion_readiness}
      
      Provide a specific conversational approach to address their likely concerns based on readiness and affordability.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Fixed: Access .text property directly (not a method) as per current SDK guidelines
    return response.text || "Could not generate strategy.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Strategy unavailable. Please ensure your environment is correctly configured.";
  }
};
