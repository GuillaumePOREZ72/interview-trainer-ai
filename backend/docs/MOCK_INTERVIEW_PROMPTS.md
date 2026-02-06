# Mock Interview Prompts - Groq API Integration

## Overview
Optimized prompts for dynamic mock interview generation with Groq API. Designed for cost efficiency and consistent JSON output.

---

## 1. PROMPT TEMPLATES

### 1.1 generateInitialQuestion()
**Purpose:** Generate the first interview question based on user profile

**Parameters:**
- `role`: Target job role
- `experience`: junior/mid/senior/lead
- `interviewType`: technical or behavioral
- `topicsToFocus`: Key topics to assess
- `language`: en or fr

**Token Estimate:** ~150-200 tokens (input)

### 1.2 generateFollowUpQuestion()
**Purpose:** Generate contextual follow-up based on candidate's previous response

**Parameters:**
- `previousResponse`: Candidate's answer to previous question
- `originalQuestion`: The question that was asked
- `questionHistory`: Array of previous questions asked
- `language`: en or fr

**Token Estimate:** ~200-250 tokens (input)

### 1.3 analyzeResponse()
**Purpose:** Score and provide feedback on candidate response

**Parameters:**
- `userResponse`: Full candidate answer
- `question`: The question asked
- `interviewType`: technical or behavioral
- `language`: en or fr

**Token Estimate:** ~250-300 tokens (input)

### 1.4 generateSessionReport()
**Purpose:** Generate comprehensive session summary

**Parameters:**
- `sessionData`: Object containing all session metrics
- `language`: en or fr

**Token Estimate:** ~300-350 tokens (input)

---

## 2. EXPECTED JSON OUTPUT STRUCTURES

### 2.1 Initial Question Output
```json
{
  "question": "Can you explain how you would optimize a React application that has performance issues with large lists?",
  "category": "technical",
  "difficulty": "mid",
  "expectedDuration": "3-5 minutes",
  "keyPointsToAssess": [
    "Understanding of React rendering optimization",
    "Knowledge of virtualization techniques",
    "Experience with performance profiling"
  ]
}
```

### 2.2 Follow-up Question Output
```json
{
  "question": "You mentioned using React.memo. Can you explain when it would be counterproductive to use it?",
  "type": "challenge",
  "rationale": "Testing depth of understanding on optimization trade-offs",
  "difficultyAdjustment": 0
}
```

### 2.3 Response Analysis Output
```json
{
  "scores": {
    "relevance": 85,
    "clarity": 90,
    "depth": 75,
    "examples": 80
  },
  "overallScore": 82,
  "feedback": {
    "strengths": [
      "Clear explanation of virtualization concept",
      "Good mention of React DevTools for profiling"
    ],
    "improvements": [
      "Could have mentioned specific libraries like react-window",
      "Missing mention of useMemo for expensive calculations"
    ],
    "actionableTip": "For technical questions, always mention specific tools or libraries you've used in practice."
  },
  "followUpSuggested": true
}
```

### 2.4 Session Report Output
```json
{
  "summary": "You demonstrated solid technical knowledge with particularly strong communication skills. Your answers were well-structured, though depth in system design concepts could be improved.",
  "overallScore": 78,
  "percentile": "above average",
  "strengths": [
    "Excellent communication clarity",
    "Good use of real-world examples",
    "Strong problem-solving approach"
  ],
  "improvementAreas": [
    "System design depth",
    "Scalability considerations"
  ],
  "actionItems": [
    {
      "priority": "high",
      "action": "Study load balancing strategies and caching patterns",
      "timeframe": "1 week"
    },
    {
      "priority": "medium",
      "action": "Practice explaining trade-offs in architectural decisions",
      "timeframe": "2 weeks"
    }
  ],
  "readiness": {
    "level": "nearly ready",
    "confidence": 0.75,
    "recommendation": "1-2 more practice sessions focusing on system design before real interviews"
  },
  "topResponse": "Your explanation of database indexing trade-offs was particularly clear and demonstrated practical experience.",
  "focusForNext": "Practice high-level system design questions involving distributed systems"
}
```

---

## 3. COST OPTIMIZATION STRATEGIES

### 3.1 Token Reduction Techniques

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| **Truncate inputs** | 20-30% | Limit response text to 800 chars in analysis prompt |
| **Concise prompts** | 15-20% | Use bullet points, avoid prose |
| **Single-word language codes** | 5% | Use "en/fr" not "English/French" |
| **JSON minification** | 10% | Remove whitespace in prompt inputs |

### 3.2 Truncation Guidelines
- **Previous responses**: 500 chars max in follow-up prompts
- **Current responses**: 800 chars max in analysis prompts
- **Question history**: Last 3 questions only
- **Session data**: Top 2 strengths/improvements per response

### 3.3 Response Format Optimization
```typescript
// Use compact JSON in prompts
const compactData = JSON.stringify(data); // No pretty print

// Truncate helper
const truncate = (str: string, max: number) => 
  str.length > max ? str.slice(0, max) + "..." : str;
```

### 3.4 Estimated Costs (per request)
- **Initial Question**: ~$0.001-0.002
- **Follow-up Question**: ~$0.002-0.003
- **Response Analysis**: ~$0.003-0.005
- **Session Report**: ~$0.004-0.006

**Total for 5-question session**: ~$0.015-0.025

---

## 4. ERROR HANDLING STRATEGIES

### 4.1 JSON Parsing Failures

**Strategy:** Use existing `cleanAndParseJSON()` utility with fallback defaults

```typescript
const safeParseMockInterviewResponse = <T>(
  rawText: string,
  defaultValue: T
): T => {
  try {
    return cleanAndParseJSON(rawText) as T;
  } catch (error) {
    logger.error("Failed to parse AI response:", error);
    return defaultValue;
  }
};

// Default values per prompt type
const defaultInitialQuestion = {
  question: "Can you tell me about your background and experience?",
  category: "behavioral",
  difficulty: "junior",
  expectedDuration: "3-5 minutes",
  keyPointsToAssess: ["Communication", "Experience relevance"]
};

const defaultFollowUp = {
  question: "Could you elaborate on that point?",
  type: "clarification",
  rationale: "Need more detail",
  difficultyAdjustment: 0
};

const defaultAnalysis = {
  scores: { relevance: 70, clarity: 70, depth: 70, examples: 70 },
  overallScore: 70,
  feedback: {
    strengths: ["Good attempt"],
    improvements: ["Could provide more detail"],
    actionableTip: "Practice structuring your answers with the STAR method."
  },
  followUpSuggested: true
};
```

### 4.2 Groq API Error Handling

```typescript
interface GroqAPIConfig {
  maxRetries: 3;
  backoffMultiplier: 2;
  initialDelayMs: 1000;
  timeoutMs: 10000;
}

const callGroqWithRetry = async (
  prompt: string,
  config: GroqAPIConfig
): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
      
      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: { /* ... */ },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2, // Low temp for consistent JSON
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries) break;
      
      // Exponential backoff
      const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
      logger.warn(`Groq API attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Groq API failed after ${config.maxRetries} attempts: ${lastError?.message}`);
};
```

### 4.3 Response Validation

```typescript
import { z } from "zod";

// Zod schemas for runtime validation
const InitialQuestionSchema = z.object({
  question: z.string().min(10),
  category: z.enum(["technical", "behavioral"]),
  difficulty: z.enum(["junior", "mid", "senior", "lead"]),
  expectedDuration: z.string(),
  keyPointsToAssess: z.array(z.string()).min(1).max(5),
});

const FollowUpSchema = z.object({
  question: z.string().min(10),
  type: z.enum(["probing", "challenge", "clarification", "extension"]),
  rationale: z.string(),
  difficultyAdjustment: z.number().min(-10).max(10),
});

const AnalysisSchema = z.object({
  scores: z.object({
    relevance: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    depth: z.number().min(0).max(100),
    examples: z.number().min(0).max(100),
  }),
  overallScore: z.number().min(0).max(100),
  feedback: z.object({
    strengths: z.array(z.string()).min(0).max(3),
    improvements: z.array(z.string()).min(0).max(3),
    actionableTip: z.string(),
  }),
  followUpSuggested: z.boolean(),
});

const validateAndParse = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultValue: T
): T => {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  logger.error("Validation failed:", result.error);
  return defaultValue;
};
```

### 4.4 Circuit Breaker Pattern

```typescript
class GroqCircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private readonly threshold = 5;
  private readonly timeoutMs = 60000; // 1 minute
  
  isOpen(): boolean {
    if (this.failures < this.threshold) return false;
    if (!this.lastFailureTime) return false;
    
    const now = Date.now();
    if (now - this.lastFailureTime > this.timeoutMs) {
      // Reset after timeout
      this.failures = 0;
      this.lastFailureTime = null;
      return false;
    }
    
    return true;
  }
  
  recordSuccess(): void {
    this.failures = 0;
    this.lastFailureTime = null;
  }
  
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
```

---

## 5. LANGUAGE SUPPORT

### 5.1 French vs English
All prompts use `getLanguageInstructionMock()` which returns:
- **FR:** "LANGUE: Français. Génère tout le contenu en français."
- **EN:** "LANG: English. Generate all content in English."

### 5.2 Language Detection
```typescript
const detectLanguage = (acceptLanguage: string): "en" | "fr" => {
  const lang = acceptLanguage?.split(",")[0]?.toLowerCase() || "en";
  return lang.startsWith("fr") ? "fr" : "en";
};
```

---

## 6. INTEGRATION EXAMPLE

```typescript
// MockInterviewService.ts
import {
  mockInterviewInitialQuestionPrompt,
  mockInterviewFollowUpPrompt,
  mockInterviewAnalysisPrompt,
  mockInterviewSessionReportPrompt,
} from "../utils/prompts";

class MockInterviewService {
  async generateInitialQuestion(
    userProfile: UserProfile,
    language: string
  ): Promise<InitialQuestion> {
    const prompt = mockInterviewInitialQuestionPrompt(
      userProfile.role,
      userProfile.experience,
      userProfile.interviewType,
      userProfile.topicsToFocus,
      language
    );
    
    const response = await this.callGroq(prompt);
    return safeParseMockInterviewResponse(
      response.choices[0].message.content,
      defaultInitialQuestion
    );
  }
  
  async generateFollowUp(
    previousResponse: string,
    originalQuestion: string,
    history: string[],
    language: string
  ): Promise<FollowUpQuestion> {
    const truncatedResponse = truncate(previousResponse, 500);
    const prompt = mockInterviewFollowUpPrompt(
      truncatedResponse,
      originalQuestion,
      history,
      language
    );
    
    const response = await this.callGroq(prompt);
    return safeParseMockInterviewResponse(
      response.choices[0].message.content,
      defaultFollowUp
    );
  }
  
  // ... similar for analyzeResponse and generateSessionReport
}
```

---

## 7. TESTING STRATEGY

### 7.1 Mock Responses
```typescript
// tests/mocks/mockGroqResponses.ts
export const mockInitialQuestionResponse = {
  question: "Explain the difference between let, const, and var in JavaScript.",
  category: "technical",
  difficulty: "junior",
  expectedDuration: "2-3 minutes",
  keyPointsToAssess: ["Scope understanding", "Hoisting knowledge", "Best practices"]
};

export const mockAnalysisResponse = {
  scores: { relevance: 90, clarity: 85, depth: 80, examples: 75 },
  overallScore: 82,
  feedback: {
    strengths: ["Clear explanation of scope"],
    improvements: ["Could mention temporal dead zone"],
    actionableTip: "Always mention edge cases when discussing language features."
  },
  followUpSuggested: true
};
```

### 7.2 Integration Test
```typescript
it("should generate contextual follow-up question", async () => {
  const previousResponse = "I use useState for all my state management needs.";
  const originalQuestion = "How do you manage state in React?";
  
  const result = await mockInterviewService.generateFollowUp(
    previousResponse,
    originalQuestion,
    [],
    "en"
  );
  
  expect(result.question).toBeTruthy();
  expect(result.type).toMatch(/probing|challenge|clarification|extension/);
  expect(result.rationale).toBeTruthy();
});
```

---

## 8. MODEL RECOMMENDATIONS

### 8.1 Groq Model Selection
| Prompt Type | Recommended Model | Temperature | Reason |
|-------------|-------------------|-------------|----------|
| Initial Question | `llama-3.3-70b-versatile` | 0.5 | Balance creativity and consistency |
| Follow-up | `llama-3.3-70b-versatile` | 0.3 | Needs precision and context awareness |
| Analysis | `llama-3.3-70b-versatile` | 0.2 | Consistent scoring, minimal variance |
| Session Report | `llama-3.3-70b-versatile` | 0.4 | Slightly creative for engaging feedback |

### 8.2 Alternative Models
- **Fast/Cheap:** `gemma2-9b-it` - Good for simple prompts
- **High Quality:** `claude-3-haiku-20240307` via Groq - Best for analysis
- **Balanced:** `mixtral-8x7b-32768` - Good middle ground

---

## 9. MONITORING & ANALYTICS

### 9.1 Track These Metrics
```typescript
interface MockInterviewMetrics {
  avgResponseTime: number;  // Target: < 2s
  successRate: number;      // Target: > 98%
  avgTokensPerRequest: number;
  costPerSession: number;
  parseFailureRate: number; // Target: < 1%
}
```

### 9.2 Logging Pattern
```typescript
logger.info(`🎯 Mock Interview - ${operation}`, {
  userId,
  sessionId,
  operation,
  tokensUsed: estimatedTokens,
  responseTime: duration,
  success: true,
});
```

---

## 10. SECURITY CONSIDERATIONS

1. **Input Sanitization:** Always sanitize user responses before embedding in prompts
2. **Rate Limiting:** Apply per-user rate limits (see existing rateLimiter.ts)
3. **Max Input Size:** Enforce maximum response length (1000 chars)
4. **Content Filtering:** Consider adding content moderation for user inputs

---

## Summary

✅ **Optimized for:** Cost, speed, reliability
✅ **Consistent JSON:** With validation and fallbacks
✅ **Multi-language:** FR/EN support built-in
✅ **Error resilient:** Multiple fallback layers
✅ **Production-ready:** Monitoring, rate limiting, circuit breaker

**Next Steps:**
1. Implement service layer using these prompts
2. Add Zod validation for runtime safety
3. Set up monitoring dashboards
4. A/B test different temperature settings
