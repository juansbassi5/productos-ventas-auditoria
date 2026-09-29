import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function explainFindings(findings, summary) {
  if (!process.env.OPENAI_API_KEY) {
    return 'No se configuró OPENAI_API_KEY; se muestra la auditoría determinística sin explicación del LLM.';
  }

  const model = openai(process.env.OPENAI_MODEL || 'gpt-5-mini');
  const { text } = await generateText({
    model,
    system: [
      'Sos un auditor de calidad de datos de un catálogo de e-commerce.',
      'Explicá exclusivamente los hallazgos proporcionados; no inventes datos ni correcciones.',
      'Diferenciá las normalizaciones seguras de los valores que requieren una decisión humana.',
      'Respondé en español, de manera breve y accionable.',
    ].join(' '),
    prompt: JSON.stringify({ summary, findings }, null, 2),
  });

  return text;
}
