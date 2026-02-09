/**
 * @swagger
 * tags:
 *   name: Mock Interview
 *   description: Interactive voice interview simulations with AI-powered feedback
 */

/**
 * @swagger
 * /mock-interview/start:
 *   post:
 *     summary: Start a new mock interview session
 *     description: |
 *       Creates a new mock interview session and generates the first question using AI.
 *       The question is tailored to the user's role, experience level, and topics of interest.
 *     tags: [Mock Interview]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - experience
 *               - topicsToFocus
 *             properties:
 *               role:
 *                 type: string
 *                 example: "Frontend Developer"
 *                 description: Job role for the interview
 *               experience:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *                 example: 5
 *                 description: Years of professional experience
 *               topicsToFocus:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 10
 *                 example: ["React", "TypeScript", "CSS"]
 *                 description: Topics to focus on during the interview
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 default: en
 *                 description: Interview language
 *     responses:
 *       201:
 *         description: Interview session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sessionId:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 question:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "What is the difference between let and const in JavaScript?"
 *                     audioUrl:
 *                       type: string
 *                       nullable: true
 *                       example: "/audio/tts/en/abc123.mp3"
 *                     index:
 *                       type: integer
 *                       example: 0
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /mock-interview/{sessionId}/answer:
 *   post:
 *     summary: Submit an answer to the current question
 *     description: |
 *       Submit the user's answer (audio recording + transcript) for analysis.
 *       The answer is added to the session and the status changes to "analyzing".
 *       Analysis runs asynchronously in the background.
 *     tags: [Mock Interview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mock interview session ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               transcript:
 *                 type: string
 *                 example: "I use React hooks for state management..."
 *                 description: Text transcript of the user's answer
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file recording (webm, mp3, wav, ogg, m4a)
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   enum: [analyzing]
 *                   example: "analyzing"
 *                 message:
 *                   type: string
 *                   example: "Answer received. Analysis in progress."
 *       400:
 *         description: Validation error or interview already completed
 *       404:
 *         description: Session not found
 *       413:
 *         description: File too large (max 5MB)
 *       415:
 *         description: Invalid audio format
 *       503:
 *         description: Analysis queue is full
 */

/**
 * @swagger
 * /mock-interview/{sessionId}/stream:
 *   get:
 *     summary: Stream real-time analysis updates (SSE)
 *     description: |
 *       Server-Sent Events endpoint for real-time updates during analysis.
 *       
 *       Events sent:
 *       - `connected`: Initial connection established
 *       - `status`: Current session status update
 *       - `queue`: Position in analysis queue
 *       - `analysis`: Analysis results for a question
 *       - `nextQuestion`: Next question to answer
 *       - `heartbeat`: Keep-alive ping every 30 seconds
 *       - `error`: Error occurred
 *       - `complete`: Interview complete
 *       
 *       **Note:** Connection remains open until interview is complete or client disconnects.
 *     tags: [Mock Interview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mock interview session ID
 *     responses:
 *       200:
 *         description: SSE stream established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 event: connected
 *                 data: {"sessionId":"507f1f77bcf86cd799439011","status":"active"}
 *                 
 *                 event: status
 *                 data: {"status":"analyzing","progress":45}
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /mock-interview/{sessionId}/complete:
 *   post:
 *     summary: Complete the interview and generate final report
 *     description: |
 *       Marks the interview as completed and generates a comprehensive report
 *       with overall score, strengths, and areas for improvement.
 *     tags: [Mock Interview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mock interview session ID
 *     responses:
 *       200:
 *         description: Interview completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 report:
 *                   $ref: '#/components/schemas/SessionReport'
 *       404:
 *         description: Session not found
 *       500:
 *         description: Error generating report
 */

/**
 * @swagger
 * /mock-interview/{sessionId}:
 *   get:
 *     summary: Get session details
 *     description: Retrieve full details of a mock interview session including all questions and responses.
 *     tags: [Mock Interview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mock interview session ID
 *     responses:
 *       200:
 *         description: Session details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 session:
 *                   $ref: '#/components/schemas/MockInterviewSession'
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /mock-interview/history:
 *   get:
 *     summary: Get completed interview history
 *     description: Retrieve a list of completed mock interviews for the authenticated user.
 *     tags: [Mock Interview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of sessions to return
 *     responses:
 *       200:
 *         description: History retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       role:
 *                         type: string
 *                       experience:
 *                         type: integer
 *                       overallScore:
 *                         type: integer
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid limit parameter
 */

export {}; // Make this a module
