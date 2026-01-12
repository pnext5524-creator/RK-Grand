
import { GoogleGenAI, Type } from "@google/genai";
import { Contractor, AIPrediction, Task, TaskAIAnalysis, ContractDocument, AIDocumentAnalysis, ChatMessage, ChatAttachment } from "../types";

const SYSTEM_INSTRUCTION = `
  Вы — RK-GrandGPT, продвинутый искусственный интеллект, созданный специально для сотрудников целлюлозного завода ООО «РК-ГРАНД».
  Ваша задача: помогать сотрудникам в решении рабочих вопросов.
  
  Ваши компетенции:
  1. Технология варки целлюлозы и работа выпарных станций.
  2. Промышленная безопасность и охрана труда на химическом производстве.
  3. Инженерные расчеты и управление проектами модернизации.
  4. Помощь в составлении официальных документов, актов и отчетов.
  5. Ответы на общие вопросы сотрудников (HR, график, внутренние правила).
  6. Анализ предоставленных изображений, схем, графиков и документов.

  Стиль общения: профессиональный, точный, вежливый, но лаконичный. 
  Язык общения: Русский.
  Если вам прислали изображение или документ, внимательно проанализируйте его содержимое и ответьте на вопросы пользователя по нему.
  Если вопрос касается специфических данных завода, которых у вас нет, подскажите, к какому отделу (Технический, HR, ИТ) лучше обратиться.
`;

export const getAIChatResponse = async (
  history: ChatMessage[], 
  userPrompt: string, 
  currentAttachments?: { data: string, mimeType: string }[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format history for Gemini
  // Note: For simplicity in this demo, history only includes text to stay within context limits easily
  const contents: any[] = history.map(m => ({
    role: m.senderId === 'ai-bot' ? 'model' : 'user',
    parts: [{ text: m.text || (m.type === 'file' ? '[Файл]' : '') }]
  }));

  // Build current message parts
  const currentParts: any[] = [{ text: userPrompt || "Проанализируй прикрепленные файлы" }];
  
  if (currentAttachments && currentAttachments.length > 0) {
    currentAttachments.forEach(att => {
      currentParts.push({
        inlineData: {
          data: att.data,
          mimeType: att.mimeType
        }
      });
    });
  }

  // Add current message
  contents.push({ role: 'user', parts: currentParts });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Извините, я не смог сформировать ответ. Попробуйте перефразировать вопрос.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Произошла техническая ошибка при анализе данных. Проверьте размер файлов и тип (поддерживаются изображения и PDF).";
  }
};

export const getProjectPrediction = async (contractor: Contractor): Promise<AIPrediction> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Act as an AI analyst for the "RK-GRAND" pulp mill.
    Analyze this contractor performance data:
    Contractor: ${contractor.name}
    Project: ${contractor.object}
    Progress: ${contractor.progress}%
    Advance Paid: ${contractor.advance.paid ? 'Yes' : 'No'}
    Advance Amount: ${contractor.advance.amount || 0}
    Number of Documents: ${contractor.documents.length}
    Number of Workers: ${contractor.workers.length}
    Number of Vehicles: ${contractor.transport.length}
    
    Task:
    Predict if they will complete the project on time. 
    Consider typical delays in industrial construction.
    Provide a potential fine amount and reason if a delay is likely.
    
    IMPORTANT: The output must be valid JSON. 
    ALL TEXT FIELDS (predictionText, fineRecommendation, fineReason) MUST BE IN RUSSIAN LANGUAGE.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: 'ON_TIME, DELAYED, or RISK' },
            predictionText: { type: Type.STRING, description: "Detailed prediction in Russian" },
            delayDays: { type: Type.NUMBER },
            fineRecommendation: { type: Type.STRING, description: "Fine amount in RUB or 'Нет' (in Russian)" },
            fineReason: { type: Type.STRING, description: "Reason for fine in Russian" }
          },
          required: ["status", "predictionText", "delayDays", "fineRecommendation", "fineReason"]
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return result as AIPrediction;
  } catch (error) {
    console.error("AI Prediction Error:", error);
    return {
      status: 'RISK',
      predictionText: "Не удалось получить прогноз от ИИ. Проверьте подключение.",
      delayDays: 0,
      fineRecommendation: "Н/Д",
      fineReason: "Ошибка соединения с сервисом анализа."
    };
  }
};

export const getPassSecurityAnalysis = async (contractor: Contractor): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const workersData = contractor.workers.map(w => `${w.fullName} (Pass: ${w.passNumber}, Exp: ${w.expiryDate})`).join("; ");
  const transportData = contractor.transport.map(t => `${t.model} ${t.plate} (Exp: ${t.passExpiry})`).join("; ");

  const prompt = `
    You are a security auditor at the "RK-GRAND" pulp mill. 
    Today's date is ${new Date().toISOString().split('T')[0]}.
    
    Analyze the access passes for contractor "${contractor.name}":
    Workers: [${workersData}]
    Transport: [${transportData}]
    
    Task:
    1. Identify all expired passes (EXP) and passes expiring within the next 7 days (SOON).
    2. Assess the risk to project continuity if these people/vehicles are denied entry.
    3. Suggest immediate security actions (e.g., "Deny entry to [Name] from [Date]", "Urgent renewal for [Plate]").
    
    Format the output as a professional, concise report IN RUSSIAN language. Highlight critical names/plates.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("AI Pass Analysis Error:", error);
    return "Ошибка при анализе пропусков.";
  }
};

export const getDocumentAnalysis = async (doc: ContractDocument, contractor: Contractor): Promise<AIDocumentAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    As an AI auditor for RK-GRAND pulp mill, analyze the metadata of the following document and project context.
    Document: ${doc.name} (Type: ${doc.type}, Date: ${doc.date})
    Contractor: ${contractor.name}
    Project: ${contractor.object}
    Progress: ${contractor.progress}%
    Advance Paid: ${contractor.advance.paid}
    
    Simulate a deep scan of the document.
    1. Extract (hypothetically) a key date and total amount if applicable.
    2. Determine a processing status (e.g., "Проверен", "Требует подписи", "Отклонен").
    3. Identify 1-2 potential discrepancies with the project state.
    4. Provide a 1-sentence summary of findings.
    
    IMPORTANT: All string fields (status, discrepancies, summary) MUST BE IN RUSSIAN.
    Return the response strictly as a JSON object matching the requested schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedDate: { type: Type.STRING },
            extractedAmount: { type: Type.STRING },
            status: { type: Type.STRING },
            discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["extractedDate", "extractedAmount", "status", "discrepancies", "summary"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as AIDocumentAnalysis;
  } catch (error) {
    console.error("AI Doc Analysis Error:", error);
    throw error;
  }
};

export const getWritingSuggestion = async (type: 'description' | 'comment', context: string, currentText: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a professional assistant for the "RK-GRAND" pulp mill management system. 
    Help the user ${type === 'description' ? 'write a clear task description' : 'write a professional comment'}.
    
    Context: "${context}"
    Current draft: "${currentText}"
    
    Instructions:
    - Suggest a professional starting point or improvement.
    - Keep it concise, formal, and relevant to a pulp mill industrial environment.
    - RESPOND IN RUSSIAN LANGUAGE ONLY.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("AI Writing Suggestion Error:", error);
    return "Не удалось получить подсказку.";
  }
};

export const getTaskAnalysis = async (currentTask: Task, otherTasks: Task[]): Promise<TaskAIAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const otherTaskTitles = otherTasks
    .filter(t => t.id !== currentTask.id)
    .map(t => t.title)
    .join(", ");

  const prompt = `
    As an expert industrial project manager for the "RK-GRAND" pulp mill, analyze the following task:
    Title: "${currentTask.title}"
    Description: "${currentTask.description}"
    
    Existing tasks: [${otherTaskTitles}]
    
    Analyze the task to:
    1. Suggest 2-3 specific improvements to the description (IN RUSSIAN).
    2. Check for duplicate tasks.
    3. Estimate hours.
    4. Categorize complexity (LOW, MEDIUM, HIGH).
    
    IMPORTANT: 'improvements' and 'duplicates' arrays must be in RUSSIAN language.
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            improvements: { type: Type.STRING, description: "Suggestions in Russian" },
            duplicates: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of similar task titles found"
            },
            estimatedHours: { type: Type.NUMBER },
            complexity: { type: Type.STRING }
          },
          required: ["improvements", "duplicates", "estimatedHours", "complexity"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as TaskAIAnalysis;
  } catch (error) {
    console.error("AI Task Analysis Error:", error);
    throw error;
  }
};
