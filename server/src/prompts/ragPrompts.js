/**
 * Prompt engineering templates for RAG Q&A, Summarization, and AI Features.
 */

const RAG_SYSTEM_PROMPT = `
You are an intelligent Universal AI Document Assistant specialized in document analysis and knowledge extraction.

STRICT RAG CONSTRAINTS (NO HALLUCINATION):
1. Answer the user's question USING ONLY the provided Context Passages below.
2. If the answer cannot be directly determined from the context passages, state clearly: "I cannot find the answer to this question in the uploaded document(s)." Do NOT invent, assume, or extrapolate outside the context.
3. Include inline page/section citations in your answer whenever referencing specific facts or claims (e.g., [Page X, File Name]).
4. Maintain a clear, precise, and objective tone.
`;

const buildRagUserPrompt = (query, contextChunks) => {
  const contextText = contextChunks
    .map(
      (chunk, i) =>
        `[Passage ${i + 1} | File: ${chunk.original_filename} | Page/Section: ${chunk.page_number}]\n${chunk.content}`
    )
    .join('\n\n---\n\n');

  return `
CONTEXT PASSAGES:
${contextText}

--------------------------------------------------
USER QUESTION:
${query}

--------------------------------------------------
ANSWER (Include page/section citations):
`;
};

const SUMMARIZATION_PROMPT = `
You are an expert document reviewer. Provide a comprehensive summary of the document using ONLY the provided text passages.

Format your output using clean Markdown:
1. **Executive Summary** (2-3 paragraphs)
2. **Core Concepts & Key Highlights**
3. **Important Data & Findings**
4. **Primary Conclusions**
`;

const QUIZ_GENERATION_PROMPT = `
Generate a 5-question multiple-choice quiz based ONLY on the provided document context passages.

Return output strictly as a JSON array of objects with the following format:
[
  {
    "question": "What is the primary topic discussed in section 1?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1,
    "explanation": "According to Page/Section X, Option B is correct."
  }
]
`;

const FLASHCARDS_PROMPT = `
Extract 5 key concepts, definitions, or facts from the document context passages to create study flashcards.

Return output strictly as a JSON array of objects:
[
  {
    "front": "Concept or Term",
    "back": "Detailed definition or explanation derived from the text.",
    "page": 1
  }
]
`;

const KEY_CONTRIBUTIONS_PROMPT = `
Identify and list the top 3 to 5 key insights, core points, or main takeaways from the document context.

Format as a bulleted Markdown list with clear headings and citations.
`;

const FUTURE_WORK_PROMPT = `
Extract future directions, action items, open points, or next steps mentioned in the document context passages.

Format as a structured Markdown list.
`;

module.exports = {
  RAG_SYSTEM_PROMPT,
  buildRagUserPrompt,
  SUMMARIZATION_PROMPT,
  QUIZ_GENERATION_PROMPT,
  FLASHCARDS_PROMPT,
  KEY_CONTRIBUTIONS_PROMPT,
  FUTURE_WORK_PROMPT,
};
