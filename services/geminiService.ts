
import { GoogleGenAI, Type } from "@google/genai";
import { AgrawallAnalysis } from "../types";

export const analyzeMedicalReport = async (
  report: string,
  reference: string = '',
  isBase64: boolean = false,
  mimeType: string = 'text/plain'
): Promise<{ analysis: AgrawallAnalysis; text: string }> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const systemInstruction = `Actúa como un radiólogo consultor senior especializado en QA utilizando la Escala Agrawal (2010). 
  Tu misión es analizar informes radiológicos e identificar discrepancias o errores.
  
  DEFINICIÓN DE NIVELES AGRAWAL:
  - Nivel 0: Informe excelente, sin errores.
  - Nivel 1: Error menor (ej. ortografía, lateralidad clara en contexto) SIN impacto clínico.
  - Nivel 2: Error menor con impacto clínico improbable.
  - Nivel 3: Error con impacto clínico potencial, pero no alcanzó al paciente o no causó daño.
  - Nivel 4: Error con impacto clínico real, causó daño menor o retraso en tratamiento.
  - Nivel 5: Error con impacto clínico severo, daño permanente o muerte.

  Identifica addendas embebidos y separa el informe original de la corrección posterior si existe.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      scaleLevel: { type: Type.INTEGER, description: "Nivel del 0 al 5 según escala Agrawal" },
      levelName: { type: Type.STRING, description: "Nombre descriptivo del nivel" },
      category: { type: Type.STRING },
      errorType: { type: Type.STRING, enum: ['Percepción', 'Juicio', 'Ninguno', 'Forma', 'No aplica'] },
      technicalAnalysis: { type: Type.STRING, description: "Análisis detallado de la discrepancia radiológica" },
      safetyRecommendation: { type: Type.STRING, description: "Acción correctiva para prevenir recurrencia" },
      clinicalImpactDetails: { type: Type.STRING, description: "Explicación del impacto en el manejo del paciente" },
      findingsEvaluation: {
        type: Type.OBJECT,
        properties: {
          identification: { type: Type.STRING },
          terminology: { type: Type.STRING },
          correlation: { type: Type.STRING }
        },
        required: ["identification", "terminology", "correlation"]
      },
      metadata: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          examType: { type: Type.STRING },
          reportDate: { type: Type.STRING },
          reportingPhysician: { type: Type.STRING },
          clinicalCenter: { type: Type.STRING }
        },
        required: ["patientName", "examType", "reportDate", "reportingPhysician", "clinicalCenter"]
      }
    },
    required: ["scaleLevel", "levelName", "category", "errorType", "technicalAnalysis", "safetyRecommendation", "clinicalImpactDetails", "findingsEvaluation", "metadata"]
  };

  const promptText = `Analiza este informe médico y asigna el nivel Agrawal correspondiente. Justifica técnicamente tu decisión. ${reference ? 'Referencia previa: ' + reference : ''}`;

  const parts: any[] = [];
  if (isBase64) {
    parts.push({
      inlineData: {
        data: report,
        mimeType: mimeType
      }
    });
  } else {
    parts.push({ text: `CONTENIDO DEL INFORME: ${report}` });
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return { analysis: { ...parsed, id: crypto.randomUUID(), timestamp: Date.now() }, text: response.text || '' };
};

export const analyzeContractDocument = async (text: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      institutionName: { type: Type.STRING },
      bidNumber: { type: Type.STRING },
      startDate: { type: Type.STRING },
      endDate: { type: Type.STRING },
      fines: { type: Type.STRING },
      sla: {
        type: Type.OBJECT,
        properties: {
          emergencies: {
            type: Type.OBJECT,
            properties: { value: { type: Type.NUMBER }, unit: { type: Type.STRING, enum: ['horas', 'días'] } }
          },
          inpatients: {
            type: Type.OBJECT,
            properties: { value: { type: Type.NUMBER }, unit: { type: Type.STRING, enum: ['horas', 'días'] } }
          },
          outpatient: {
            type: Type.OBJECT,
            properties: { value: { type: Type.NUMBER }, unit: { type: Type.STRING, enum: ['horas', 'días'] } }
          },
          oncology: {
            type: Type.OBJECT,
            properties: { value: { type: Type.NUMBER }, unit: { type: Type.STRING, enum: ['horas', 'días'] } }
          }
        }
      }
    },
    required: ["institutionName", "bidNumber", "startDate", "endDate", "sla"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analiza este texto legal médico: ${text}`,
    config: {
      systemInstruction: "Extrae datos estructurados de contratos de salud públicos y privados.",
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeHRProfile = async (profileData: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `Analiza este perfil: ${profileData}`,
    config: {
      systemInstruction: "Evaluación de desempeño clínico y sugerencias de capacitación."
    }
  });
  return response.text || "No se pudo generar el análisis.";
};
