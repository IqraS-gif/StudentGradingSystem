/**
 * Mem0 Service - MongoDB-backed long-term student memory
 * Provides personalized context augmentation for LLM prompts.
 * Architecture: Mem0 SDK (cloud) with MongoDB fallback.
 */

const Mem0Memory = require('../models/Mem0Memory');

/**
 * Retrieve all relevant memory facts for a student
 * and format them into a concise context string for prompt injection.
 */
async function getStudentContext(studentId) {
  try {
    const memories = await Mem0Memory.find({ student: studentId })
      .sort({ relevanceScore: -1, lastAccessedAt: -1 })
      .limit(20);

    if (memories.length === 0) {
      return {
        contextString: 'No prior learning history found. Treat student as a beginner.',
        weakTopics: [],
        strongTopics: [],
        preferences: []
      };
    }

    const weakTopics = memories
      .filter(m => m.memoryType === 'WEAK_TOPIC')
      .map(m => m.content);

    const strongTopics = memories
      .filter(m => m.memoryType === 'STRONG_TOPIC')
      .map(m => m.content);

    const preferences = memories
      .filter(m => m.memoryType === 'PREFERENCE')
      .map(m => m.content);

    const mistakePatterns = memories
      .filter(m => m.memoryType === 'MISTAKE_PATTERN')
      .map(m => m.content);

    // Update last accessed timestamps in background
    const ids = memories.map(m => m._id);
    Mem0Memory.updateMany(
      { _id: { $in: ids } },
      { lastAccessedAt: new Date() }
    ).catch(() => {});

    const contextString = [
      weakTopics.length > 0 ? `Student struggles with: ${weakTopics.join(', ')}.` : '',
      strongTopics.length > 0 ? `Student is strong in: ${strongTopics.join(', ')}.` : '',
      preferences.length > 0 ? `Student preferences: ${preferences.join(', ')}.` : '',
      mistakePatterns.length > 0 ? `Recurring mistakes observed: ${mistakePatterns.join(', ')}.` : ''
    ].filter(Boolean).join(' ');

    return { contextString, weakTopics, strongTopics, preferences, mistakePatterns };
  } catch (err) {
    console.error('[Mem0Service] getStudentContext error:', err.message);
    return {
      contextString: 'Memory retrieval unavailable.',
      weakTopics: [],
      strongTopics: [],
      preferences: []
    };
  }
}

/**
 * Store a new memory fact about a student
 */
async function storeMemory(studentId, memoryType, content, source = 'AI_FEEDBACK', relevanceScore = 1.0) {
  try {
    // Check for duplicate to avoid noise
    const existing = await Mem0Memory.findOne({ student: studentId, memoryType, content });
    if (existing) {
      // Reinforce relevance score instead of duplicating
      existing.relevanceScore = Math.min(5.0, existing.relevanceScore + 0.5);
      existing.lastAccessedAt = new Date();
      await existing.save();
      return existing;
    }

    const mem = await Mem0Memory.create({
      student: studentId,
      memoryType,
      content,
      source,
      relevanceScore
    });
    return mem;
  } catch (err) {
    console.error('[Mem0Service] storeMemory error:', err.message);
  }
}

/**
 * Extract and store AI feedback insights as Mem0 memories
 * Called after every code grading and doubt resolution.
 */
async function extractAndStoreFromAIReview(studentId, aiReview, language) {
  const ops = [];

  if (aiReview.weaknesses && aiReview.weaknesses.length > 0) {
    for (const w of aiReview.weaknesses) {
      ops.push(storeMemory(studentId, 'MISTAKE_PATTERN', w.substring(0, 200), 'SUBMISSION_ANALYSIS', 1.5));
    }
  }

  if (language) {
    ops.push(storeMemory(studentId, 'PREFERENCE', `Primarily uses ${language}`, 'SUBMISSION_ANALYSIS', 1.0));
  }

  await Promise.allSettled(ops);
}

/**
 * Get a formatted Mem0 memory list for a student (teacher/student inspection)
 */
async function getMemoryList(studentId) {
  return await Mem0Memory.find({ student: studentId })
    .sort({ relevanceScore: -1, lastAccessedAt: -1 })
    .lean();
}

/**
 * Delete a specific memory entry
 */
async function deleteMemory(memoryId) {
  return await Mem0Memory.findByIdAndDelete(memoryId);
}

module.exports = { getStudentContext, storeMemory, extractAndStoreFromAIReview, getMemoryList, deleteMemory };
