const OpenAI = require('openai');
const aiConfig = require('../config/aiConfig');
const VectorStore = require('../retrieval/vectorStore');
const MessageModel = require('../models/messageModel');
const ChatModel = require('../models/chatModel');
const logger = require('../utils/logger');
const {
  RAG_SYSTEM_PROMPT,
  buildRagUserPrompt,
  SUMMARIZATION_PROMPT,
  QUIZ_GENERATION_PROMPT,
  FLASHCARDS_PROMPT,
  KEY_CONTRIBUTIONS_PROMPT,
  FUTURE_WORK_PROMPT,
} = require('../prompts/ragPrompts');

class AIService {
  constructor() {
    this.openai = new OpenAI(aiConfig.getOpenAiClientConfig());
    this.model = aiConfig.completions.model;
  }

  /**
   * Execute RAG Chat Question-Answering Pipeline with retrieval statistics
   */
  static async askQuestion({ userId, chatId, query, documentIds = [] }) {
    const ai = new AIService();
    const startTime = Date.now();

    // 1. Verify chat session ownership
    let chat = await ChatModel.findById(chatId, userId);
    if (!chat) {
      const error = new Error('Chat session not found.');
      error.statusCode = 404;
      throw error;
    }

    // Determine document IDs scope from chat if not explicitly provided
    let scopeDocIds = documentIds;
    if ((!scopeDocIds || scopeDocIds.length === 0) && chat.documents) {
      scopeDocIds = chat.documents.map(d => d.id).filter(Boolean);
    }

    // 2. Perform Semantic Vector Search against PostgreSQL pgvector with latency tracking
    const { results: retrievedChunks, embeddingTimeMs, searchTimeMs } =
      await VectorStore.searchWithStats(query, scopeDocIds, aiConfig.rag.topK);

    // 3. Save User Message to database
    await MessageModel.createWithCitations({
      chatId,
      sender: 'user',
      content: query,
    });

    let answerText = '';
    let citations = [];
    const aiGenStart = Date.now();

    if (retrievedChunks.length === 0) {
      answerText = "I cannot find any relevant context in the uploaded document(s) to answer this question.";
    } else {
      // 4. Generate AI Completion using OpenAI API with context grounding
      answerText = await ai._generateCompletion(query, retrievedChunks);

      // Map citations for DB persistence and response payload
      citations = retrievedChunks.map(c => ({
        chunkId: c.id,
        similarityScore: c.similarity_score,
        pageNumber: c.page_number,
        filename: c.original_filename,
        content: c.content,
      }));
    }

    const aiGenerationTimeMs = Date.now() - aiGenStart;

    // 5. Save Assistant Message and attached citations to database
    const assistantMessage = await MessageModel.createWithCitations({
      chatId,
      sender: 'assistant',
      content: answerText,
      citations,
    });

    // Auto update chat title if default
    if (chat.title === 'New Research Chat' || chat.title === 'New Document Chat') {
      const newTitle = query.slice(0, 40) + (query.length > 40 ? '...' : '');
      await ChatModel.updateTitle(chatId, userId, newTitle);
    }

    // Calculate retrieval statistics
    const stats = {
      retrievedChunkCount: retrievedChunks.length,
      searchTimeMs,
      embeddingTimeMs,
      aiGenerationTimeMs,
      totalResponseTimeMs: Date.now() - startTime,
      avgSimilarity: retrievedChunks.length > 0
        ? parseFloat((retrievedChunks.reduce((acc, c) => acc + (parseFloat(c.similarity_score) || 0), 0) / retrievedChunks.length).toFixed(4))
        : 0,
      contextSize: retrievedChunks.reduce((acc, c) => acc + (c.content ? c.content.length : 0), 0),
    };

    logger.info({ chatId, query, stats }, 'RAG Question-Answering completed successfully');

    return {
      message: assistantMessage,
      retrievedChunks,
      stats,
    };
  }

  /**
   * Execute SSE Stream RAG Question-Answering Pipeline (Token-by-Token)
   */
  static async askQuestionStream({ userId, chatId, query, documentIds = [], res }) {
    const ai = new AIService();
    const startTime = Date.now();

    // Setup SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      let chat = await ChatModel.findById(chatId, userId);
      if (!chat) {
        sendEvent('error', { message: 'Chat session not found.' });
        return res.end();
      }

      let scopeDocIds = documentIds;
      if ((!scopeDocIds || scopeDocIds.length === 0) && chat.documents) {
        scopeDocIds = chat.documents.map(d => d.id).filter(Boolean);
      }

      // 1. Vector Search
      const { results: retrievedChunks, embeddingTimeMs, searchTimeMs } =
        await VectorStore.searchWithStats(query, scopeDocIds, aiConfig.rag.topK);

      const citations = retrievedChunks.map(c => ({
        chunkId: c.id,
        similarityScore: c.similarity_score,
        pageNumber: c.page_number,
        filename: c.original_filename,
        content: c.content,
      }));

      // Send Citations and Stats event immediately
      const initialStats = {
        retrievedChunkCount: retrievedChunks.length,
        searchTimeMs,
        embeddingTimeMs,
        avgSimilarity: retrievedChunks.length > 0
          ? parseFloat((retrievedChunks.reduce((acc, c) => acc + (parseFloat(c.similarity_score) || 0), 0) / retrievedChunks.length).toFixed(4))
          : 0,
        contextSize: retrievedChunks.reduce((acc, c) => acc + (c.content ? c.content.length : 0), 0),
      };

      sendEvent('citations', { citations, stats: initialStats });

      // Save user message to DB
      await MessageModel.createWithCitations({
        chatId,
        sender: 'user',
        content: query,
      });

      let fullAnswerText = '';
      const aiGenStart = Date.now();

      if (retrievedChunks.length === 0) {
        fullAnswerText = "I cannot find any relevant context in the uploaded document(s) to answer this question.";
        sendEvent('token', { token: fullAnswerText });
      } else {
        // Stream tokens from OpenAI or Fallback
        const userPrompt = buildRagUserPrompt(query, retrievedChunks);

        if (aiConfig.hasValidKey()) {
          try {
            const stream = await ai.openai.chat.completions.create({
              model: ai.model,
              messages: [
                { role: 'system', content: RAG_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
              ],
              temperature: aiConfig.completions.temperature,
              max_tokens: aiConfig.completions.maxTokens,
              stream: true,
            });

            for await (const chunk of stream) {
              const token = chunk.choices[0]?.delta?.content || '';
              if (token) {
                fullAnswerText += token;
                sendEvent('token', { token });
              }
            }
          } catch (err) {
            logger.warn({ err: err.message }, 'OpenAI streaming failed, fallback to local stream');
            const fallbackText = ai._getMockResponse(userPrompt, retrievedChunks);
            fullAnswerText = fallbackText;
            for (let i = 0; i < fallbackText.length; i += 12) {
              const slice = fallbackText.slice(i, i + 12);
              sendEvent('token', { token: slice });
              await new Promise(r => setTimeout(r, 20));
            }
          }
        } else {
          const fallbackText = ai._getMockResponse(userPrompt, retrievedChunks);
          fullAnswerText = fallbackText;
          for (let i = 0; i < fallbackText.length; i += 12) {
            const slice = fallbackText.slice(i, i + 12);
            sendEvent('token', { token: slice });
            await new Promise(r => setTimeout(r, 20));
          }
        }
      }

      const aiGenerationTimeMs = Date.now() - aiGenStart;

      // Save Assistant Message & citations to DB
      const assistantMessage = await MessageModel.createWithCitations({
        chatId,
        sender: 'assistant',
        content: fullAnswerText,
        citations,
      });

      if (chat.title === 'New Research Chat' || chat.title === 'New Document Chat') {
        const newTitle = query.slice(0, 40) + (query.length > 40 ? '...' : '');
        await ChatModel.updateTitle(chatId, userId, newTitle);
      }

      const finalStats = {
        ...initialStats,
        aiGenerationTimeMs,
        totalResponseTimeMs: Date.now() - startTime,
      };

      sendEvent('done', {
        message: assistantMessage,
        stats: finalStats,
      });

      res.end();
    } catch (err) {
      logger.error({ err }, 'Error during askQuestionStream SSE pipeline');
      sendEvent('error', { message: err.message || 'Stream processing failed' });
      res.end();
    }
  }

  /**
   * Generate Specialized AI Insights (Summarize, Quiz, Flashcards, Contributions, Future Work)
   */
  static async generateFeature({ userId, documentId, featureType }) {
    const ai = new AIService();

    // Retrieve top chunks from document for context
    const chunks = await VectorStore.search(
      'main research objectives methodologies findings conclusions overview key points',
      [documentId],
      8
    );

    if (!chunks || chunks.length === 0) {
      throw new Error('Document content is empty or not yet indexed.');
    }

    const contextText = chunks.map(c => `[Page ${c.page_number}]: ${c.content}`).join('\n\n');

    let promptSystem = RAG_SYSTEM_PROMPT;
    let promptUser = '';

    switch (featureType) {
      case 'summary':
        promptUser = `${SUMMARIZATION_PROMPT}\n\nCONTEXT:\n${contextText}`;
        break;
      case 'quiz':
        promptUser = `${QUIZ_GENERATION_PROMPT}\n\nCONTEXT:\n${contextText}`;
        break;
      case 'flashcards':
        promptUser = `${FLASHCARDS_PROMPT}\n\nCONTEXT:\n${contextText}`;
        break;
      case 'contributions':
        promptUser = `${KEY_CONTRIBUTIONS_PROMPT}\n\nCONTEXT:\n${contextText}`;
        break;
      case 'future_work':
        promptUser = `${FUTURE_WORK_PROMPT}\n\nCONTEXT:\n${contextText}`;
        break;
      default:
        throw new Error(`Unsupported AI feature type: ${featureType}`);
    }

    const resultText = await ai._callOpenAI(promptSystem, promptUser, chunks);

    if (featureType === 'quiz' || featureType === 'flashcards') {
      try {
        const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        return { rawText: resultText };
      }
    }

    return { result: resultText };
  }

  async _generateCompletion(query, retrievedChunks) {
    const userPrompt = buildRagUserPrompt(query, retrievedChunks);
    return await this._callOpenAI(RAG_SYSTEM_PROMPT, userPrompt, retrievedChunks);
  }

  async _callOpenAI(systemPrompt, userPrompt, retrievedChunks = []) {
    try {
      if (!aiConfig.hasValidKey()) {
        return this._getMockResponse(userPrompt, retrievedChunks);
      }

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: aiConfig.completions.temperature,
        max_tokens: aiConfig.completions.maxTokens,
      });

      return response.choices[0].message.content;
    } catch (err) {
      if (err.status === 429 || (err.message && err.message.includes('quota'))) {
        aiConfig.markQuotaExceeded();
        logger.warn('OpenAI Quota Exceeded (429). Using local context-driven response.');
      } else {
        logger.warn({ err: err.message }, 'OpenAI API Error, using local context-driven response.');
      }
      return this._getMockResponse(userPrompt, retrievedChunks);
    }
  }

  _getMockResponse(prompt, retrievedChunks = []) {
    const cleanText = (str) => {
      if (!str) return '';
      return str
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    if (!retrievedChunks || retrievedChunks.length === 0) {
      return `I cannot find any relevant context in the uploaded document(s) to answer this question.`;
    }

    const docName = retrievedChunks[0].original_filename || 'Uploaded Document';

    // 1. Dynamic Quiz Generation
    if (prompt.includes('QUIZ_GENERATION_PROMPT') || prompt.includes('quiz')) {
      return JSON.stringify(
        retrievedChunks.slice(0, 5).map((chunk) => {
          const passage = cleanText(chunk.content);
          return {
            question: `According to Page ${chunk.page_number} of "${chunk.original_filename}", what is described regarding "${passage.slice(0, 60)}..."?`,
            options: [
              passage.slice(0, 50) + '...',
              "General system architecture overview",
              "Standard evaluation dataset specification",
              "Baseline performance threshold"
            ],
            correctIndex: 0,
            explanation: `According to Page ${chunk.page_number} of ${chunk.original_filename}: "${passage.slice(0, 120)}..."`
          };
        })
      );
    }

    // 2. Dynamic Flashcard Generation
    if (prompt.includes('FLASHCARDS_PROMPT') || prompt.includes('flashcards')) {
      return JSON.stringify(
        retrievedChunks.slice(0, 5).map((chunk) => {
          const passage = cleanText(chunk.content);
          return {
            front: `Core Concept from Page/Section ${chunk.page_number}`,
            back: passage.slice(0, 180) + (passage.length > 180 ? '...' : ''),
            page: chunk.page_number
          };
        })
      );
    }

    // 3. GPT-Style Structured Executive Summary & Q&A Response
    const formattedPassages = retrievedChunks.map(c => {
      const text = cleanText(c.content);
      return `### 📌 Key Passage (Page ${c.page_number})\n` +
             `* ${text.slice(0, 320)}${text.length > 320 ? '...' : ''} [Page ${c.page_number}]\n`;
    }).join('\n');

    const firstPassageClean = cleanText(retrievedChunks[0].content);
    const keyTakeaways = retrievedChunks.slice(0, 3).map((c, i) => {
      const text = cleanText(c.content);
      return `${i + 1}. **Section Highlight (Page ${c.page_number})**: ${text.slice(0, 150)}... [Page ${c.page_number}]`;
    }).join('\n');

    return `# Executive Summary & Analysis

**Document**: \`${docName}\`

### 📝 Overview & Core Findings
Based on the retrieved context passages from **"${docName}"**, the document outlines key concepts, methodologies, and technical specifications:

> "${firstPassageClean.slice(0, 280)}..." [Page ${retrievedChunks[0].page_number}]

---

### 🔍 Key Document Sections & Details

${formattedPassages}

---

### 💡 Core Takeaways & Summary
${keyTakeaways}

*For line-by-line context, review the source citations attached below.*`;
  }
}

module.exports = AIService;
