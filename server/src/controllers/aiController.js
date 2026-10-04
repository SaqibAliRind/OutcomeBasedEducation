import { GoogleGenerativeAI } from '@google/generative-ai';

const getGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('GEMINI_API_KEY is not configured. Please add your key to server/.env');
    }
    return new GoogleGenerativeAI(apiKey);
};

const callGemini = async (prompt) => {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Strip markdown code fences if present
    return text.replace(/^```json\s*/m, '').replace(/\s*```\s*$/m, '').trim();
};

// ── 1. AI Question Generator ─────────────────────────────────────────────────
// POST /api/ai/generate-question
export const generateQuestion = async (req, res) => {
    try {
        const { topic, btLevel, course, questionType = 'Short Question', marks = 5 } = req.body;
        const prompt = `
You are an academic question generator for university-level OBE (Outcome Based Education).

Generate a single exam question with the following requirements:
- Course: ${course || 'Computer Science'}
- Topic: ${topic}
- Bloom's Taxonomy Level: ${btLevel}
- Question Type: ${questionType}
- Marks: ${marks}

Return ONLY a raw JSON object (no markdown, no code fences) with this exact structure:
{
  "statement": "The complete question text here",
  "actionVerb": "the Bloom's action verb used (e.g. Analyze, Design, Evaluate)",
  "difficulty": "Easy|Medium|Hard",
  "suggestedMarks": ${marks},
  "modelAnswer": "A brief model answer or key points"
}`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 2. AI CLO Suggestion ──────────────────────────────────────────────────────
// POST /api/ai/suggest-clo
export const suggestCLOs = async (req, res) => {
    try {
        const { courseTitle, courseDescription, count = 5 } = req.body;
        const prompt = `
You are an OBE curriculum expert. Suggest ${count} Course Learning Outcomes (CLOs) for:
- Course Title: ${courseTitle}
- Description: ${courseDescription || 'N/A'}

CLOs must follow Bloom's Taxonomy with proper action verbs. Return ONLY a raw JSON array (no markdown) like:
[
  { "code": "CLO1", "description": "Full CLO text with action verb and measurable outcome", "bloomsLevel": "Apply" },
  ...
]`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 3. AI PLO Suggestion ──────────────────────────────────────────────────────
// POST /api/ai/suggest-plo
export const suggestPLOs = async (req, res) => {
    try {
        const { programName, accreditation = 'NCEAC' } = req.body;
        const prompt = `
You are an OBE curriculum expert. Suggest 12 Program Learning Outcomes (PLOs) for:
- Program: ${programName}
- Accreditation Body: ${accreditation}

PLOs should align with ${accreditation} standards. Return ONLY a raw JSON array:
[
  { "code": "PLO1", "description": "Full PLO statement" },
  ...
]`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 4. AI BT Level Detection ──────────────────────────────────────────────────
// POST /api/ai/detect-bt-level
export const detectBTLevel = async (req, res) => {
    try {
        const { questionText } = req.body;
        const prompt = `
Analyze the following exam question and determine its Bloom's Taxonomy level and action verb.

Question: "${questionText}"

Return ONLY a raw JSON object:
{
  "btLevel": "Remember|Understand|Apply|Analyze|Evaluate|Create",
  "actionVerb": "the primary action verb in the question",
  "confidence": "High|Medium|Low",
  "reasoning": "brief one-sentence explanation"
}`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 5. AI Action Verb Suggestion ──────────────────────────────────────────────
// POST /api/ai/suggest-action-verbs
export const suggestActionVerbs = async (req, res) => {
    try {
        const { btLevel } = req.body;
        const prompt = `
List 10 academic action verbs commonly used in exam questions for the Bloom's Taxonomy level: "${btLevel}".

Return ONLY a raw JSON array of strings:
["verb1", "verb2", "verb3", "verb4", "verb5", "verb6", "verb7", "verb8", "verb9", "verb10"]`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 6. AI Blueprint Generator ─────────────────────────────────────────────────
// POST /api/ai/generate-blueprint
export const generateBlueprint = async (req, res) => {
    try {
        const { courseTitle, topics, totalMarks = 100, assessmentType = 'Final Exam' } = req.body;
        const topicList = Array.isArray(topics) ? topics.join(', ') : topics;
        const prompt = `
You are an academic assessment designer. Generate a Table of Specifications (Blueprint) for:
- Course: ${courseTitle}
- Assessment: ${assessmentType}
- Topics covered: ${topicList}
- Total Marks: ${totalMarks}

Distribute marks across topics with varying Bloom's Taxonomy levels. Return ONLY a raw JSON array of rows:
[
  { "topic": "Topic Name", "bloomsLevel": "Apply", "questionCount": 2, "marks": 20 },
  ...
]
IMPORTANT: The sum of all marks must equal exactly ${totalMarks}.`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 7. AI Rubric Generator ────────────────────────────────────────────────────
// POST /api/ai/generate-rubric
export const generateRubric = async (req, res) => {
    try {
        const { rubricType, criteriaNames, assessmentContext = '' } = req.body;
        const prompt = `
You are an academic rubric designer for ${rubricType}.
${assessmentContext ? `Context: ${assessmentContext}` : ''}

Generate performance level descriptors for the following criteria: ${criteriaNames.join(', ')}.

Return ONLY a raw JSON array:
[
  {
    "name": "Criterion Name",
    "descriptions": {
      "excellent": "Clear 1-2 sentence description for Excellent (4) performance",
      "good": "Clear 1-2 sentence description for Good (3) performance",
      "satisfactory": "Clear 1-2 sentence description for Satisfactory (2) performance",
      "poor": "Clear 1-2 sentence description for Poor (1) performance"
    }
  }
]`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 8. AI Question Difficulty Analysis ───────────────────────────────────────
// POST /api/ai/analyze-difficulty
export const analyzeDifficulty = async (req, res) => {
    try {
        const { questionText, marks, questionType } = req.body;
        const prompt = `
Analyze the academic difficulty of this exam question:

"${questionText}"

Marks: ${marks}, Type: ${questionType || 'General'}

Return ONLY a raw JSON object:
{
  "difficulty": "Easy|Medium|Hard",
  "suggestedDifficulty": "Easy|Medium|Hard",
  "reasoning": "1-2 sentence explanation",
  "suggestions": ["up to 2 short improvement suggestions"]
}`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 9. AI Duplicate Question Detection ──────────────────────────────────────
// POST /api/ai/detect-duplicate
export const detectDuplicate = async (req, res) => {
    try {
        const { newQuestion, existingQuestions } = req.body;
        if (!existingQuestions || existingQuestions.length === 0) {
            return res.status(200).json({ isDuplicate: false, similarity: 0, message: 'No existing questions to compare against.' });
        }
        const prompt = `
Compare the new question against the list of existing questions to check for semantic duplicates or very similar questions.

New Question: "${newQuestion}"

Existing Questions:
${existingQuestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Return ONLY a raw JSON object:
{
  "isDuplicate": true|false,
  "similarity": 0-100,
  "mostSimilarIndex": null or the index (0-based) of the most similar existing question,
  "reasoning": "brief explanation"
}`;
        const text = await callGemini(prompt);
        const result = JSON.parse(text);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 10. AI Attendance Prediction ──────────────────────────────────────────────
// POST /api/ai/predict-attendance
export const predictAttendance = async (req, res) => {
    try {
        const { studentName, currentAttendance, missedClasses, totalClasses, pattern, courseTitle } = req.body;
        const prompt = `
You are an AI academic advisor. Predict attendance risk for the following student.

Student: ${studentName || 'Unknown'}
Course: ${courseTitle || 'General'}
Current Attendance: ${currentAttendance}%
Missed Classes: ${missedClasses} out of ${totalClasses} total
Pattern Notes: ${pattern || 'No pattern provided'}

Analyze and return ONLY a raw JSON object (no markdown):
{
  "predictedFinalAttendance": "predicted % at semester end (e.g. 72%)",
  "riskLevel": "Low|Medium|High|Critical",
  "shortfallRisk": true/false,
  "requiredConsecutivePresent": number,
  "reasoning": "Brief reasoning",
  "recommendations": ["rec1", "rec2", "rec3"]
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 11. AI At-Risk Student Detection ─────────────────────────────────────────
// POST /api/ai/detect-at-risk
export const detectAtRisk = async (req, res) => {
    try {
        const { studentName, cgpa, attendanceRate, failedCourses, semesterNumber, extraInfo } = req.body;
        const prompt = `
You are an academic risk analyst. Assess whether a student is at academic risk.

Student: ${studentName || 'Unknown'}
CGPA: ${cgpa}
Attendance Rate: ${attendanceRate}%
Failed Courses This Semester: ${failedCourses}
Semester Number: ${semesterNumber}
Additional Context: ${extraInfo || 'None'}

Return ONLY a raw JSON object (no markdown):
{
  "riskStatus": "Safe|At Risk|High Risk|Critical",
  "riskScore": 0-100,
  "primaryRiskFactors": ["factor1", "factor2"],
  "earlyWarningSignals": ["signal1", "signal2"],
  "interventionRequired": true/false,
  "urgencyLevel": "Low|Medium|High|Immediate",
  "suggestedInterventions": ["intervention1", "intervention2", "intervention3"],
  "prognosis": "brief outlook statement"
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 12. AI Grade Prediction ───────────────────────────────────────────────────
// POST /api/ai/predict-grade
export const predictGrade = async (req, res) => {
    try {
        const { studentName, quizAvg, assignmentAvg, midMarks, labAvg, attendanceRate, courseTitle } = req.body;
        const prompt = `
You are an AI grade predictor for university courses.

Student: ${studentName || 'Unknown'}
Course: ${courseTitle || 'Unknown'}
Quiz Average: ${quizAvg}%
Assignment Average: ${assignmentAvg}%
Mid-Term Marks: ${midMarks}%
Lab Average: ${labAvg || 'N/A'}%
Attendance Rate: ${attendanceRate}%

Predict the final grade. Return ONLY a raw JSON object (no markdown):
{
  "predictedGrade": "A+|A|A-|B+|B|B-|C+|C|D|F",
  "predictedPercentage": number,
  "gradePoints": number,
  "confidence": "Low|Medium|High",
  "finalExamRequiredFor": {"A": number, "B": number, "C": number},
  "strengths": ["strength1", "strength2"],
  "weakAreas": ["area1", "area2"],
  "suggestion": "brief improvement tip"
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 13. AI GPA Prediction ─────────────────────────────────────────────────────
// POST /api/ai/predict-gpa
export const predictGPA = async (req, res) => {
    try {
        const { studentName, currentCGPA, semesterGrades, creditHours, semesterNumber } = req.body;
        const prompt = `
You are a university GPA predictor AI.

Student: ${studentName || 'Unknown'}
Current CGPA: ${currentCGPA}
Semester Number: ${semesterNumber}
This Semester Grades (JSON): ${JSON.stringify(semesterGrades || [])}
Credit Hours this semester: ${creditHours}

Compute and predict. Return ONLY raw JSON (no markdown):
{
  "predictedSemesterGPA": number,
  "predictedNewCGPA": number,
  "cgpaTrend": "Improving|Stable|Declining",
  "cgpaChange": "+0.12 or -0.05 etc",
  "semesterRank": "rough rank estimate like Top 10% etc",
  "onTrackForDeansList": true/false,
  "projectedGraduationCGPA": number,
  "insight": "one sentence insight"
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 14. AI Performance Analysis ───────────────────────────────────────────────
// POST /api/ai/analyze-performance
export const analyzePerformance = async (req, res) => {
    try {
        const { studentName, program, semesterData, overallCGPA, attendanceRate } = req.body;
        const prompt = `
You are an academic performance analyst AI for a university system.

Student: ${studentName || 'Unknown'}
Program: ${program || 'Unknown'}
Overall CGPA: ${overallCGPA}
Attendance Rate: ${attendanceRate}%
Semester-wise Performance: ${JSON.stringify(semesterData || [])}

Provide a comprehensive analysis. Return ONLY raw JSON (no markdown):
{
  "overallRating": "Excellent|Good|Average|Below Average|Poor",
  "performanceScore": 0-100,
  "strongSemesters": ["S1", "S3"],
  "weakSemesters": ["S2"],
  "consistencyIndex": "High|Medium|Low",
  "peakPerformance": "Semester X with GPA Y",
  "academicStrengths": ["strength1", "strength2"],
  "academicWeaknesses": ["weakness1", "weakness2"],
  "performanceTrend": "Improving|Stable|Declining|Fluctuating",
  "detailedInsights": ["insight1", "insight2", "insight3"],
  "actionPlan": ["step1", "step2", "step3"]
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 15. AI Student Recommendations ───────────────────────────────────────────
// POST /api/ai/student-recommendations
export const studentRecommendations = async (req, res) => {
    try {
        const { studentName, cgpa, strongSubjects, weakSubjects, interests, careerGoal, semesterNumber } = req.body;
        const prompt = `
You are a university academic advisor AI providing personalized student recommendations.

Student: ${studentName || 'Unknown'}
CGPA: ${cgpa}
Semester: ${semesterNumber}
Strong Subjects: ${strongSubjects || 'Not specified'}
Weak Subjects: ${weakSubjects || 'Not specified'}
Interests: ${interests || 'Not specified'}
Career Goal: ${careerGoal || 'Not specified'}

Provide personalized recommendations. Return ONLY raw JSON (no markdown):
{
  "academicRecommendations": ["rec1", "rec2", "rec3"],
  "courseSelectionTips": ["tip1", "tip2"],
  "studyStrategyAdvice": ["advice1", "advice2", "advice3"],
  "careerPathSuggestions": ["path1", "path2"],
  "skillDevelopmentAreas": ["skill1", "skill2", "skill3"],
  "resourceSuggestions": ["resource1", "resource2"],
  "shortTermGoals": ["goal1", "goal2"],
  "longTermGoals": ["goal1", "goal2"],
  "motivationalMessage": "A personalized motivational message"
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Management AI Tools ───────────────────────────────────────────────

const buildManagementPrompt = (reqType, data) => {
    return `You are an AI assistant for a University ERP system.
Task: ${reqType}
Context Data: ${JSON.stringify(data)}
Return ONLY a raw JSON object without markdown wrappers.`;
};

export const surveyAnalysis = async (req, res) => {
    try {
        const text = await callGemini(buildManagementPrompt('Survey Analysis', req.body));
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const sentimentAnalysis = async (req, res) => {
    try {
        const text = await callGemini(buildManagementPrompt('Student Feedback Sentiment Analysis', req.body));
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const notificationSuggestions = async (req, res) => {
    try {
        const text = await callGemini(buildManagementPrompt('Notification Generation/Suggestions', req.body));
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const workflowDelay = async (req, res) => {
    try {
        const text = await callGemini(buildManagementPrompt('Workflow Delay Detection', req.body));
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const autoReminder = async (req, res) => {
    try {
        const text = await callGemini(buildManagementPrompt('Auto Reminder Generator', req.body));
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const qualityScore = async (req, res) => {
    try {
        const text = await callGemini(buildManagementPrompt('QEC Quality Score Calculation', req.body));
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const qecRecommendations = async (req, res) => {
    try {
        const text = await callGemini(buildManagementPrompt('QEC Recommendations', req.body));
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const accreditationChecklist = async (req, res) => {
    try {
        const text = await callGemini(buildManagementPrompt('Accreditation Readiness Checklist Generation', req.body));
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Teaching AI ────────────────────────────────────────────────────────────────

const buildTeachingPrompt = (task, body) => `
You are an expert academic teaching assistant for university-level courses.
Task: ${task}
Input Data: ${JSON.stringify(body)}
Return ONLY a raw JSON object (no markdown, no code fences) with appropriate structured content.
For content-heavy tasks, include a "content" field with the main text, and metadata fields.
`;

export const generateLectureNotes = async (req, res) => {
    try {
        const { topic, course, week, clos, btLevel } = req.body;
        const prompt = `
You are a university professor creating detailed lecture notes.
Course: ${course || 'General'}
Week: ${week || 1}
Topic: ${topic}
CLOs being addressed: ${clos || 'N/A'}
Bloom's Taxonomy Level: ${btLevel || 'Apply'}

Return ONLY a raw JSON object (no markdown, no code fences):
{
  "title": "Lecture title",
  "week": ${week || 1},
  "objectives": ["learning objective 1", "objective 2"],
  "outline": [
    { "section": "Introduction", "content": "...", "duration": "5 min" },
    { "section": "Main Concept", "content": "...", "duration": "20 min" },
    { "section": "Examples", "content": "...", "duration": "15 min" },
    { "section": "Summary", "content": "...", "duration": "5 min" }
  ],
  "keyTerms": ["term1: definition", "term2: definition"],
  "practiceQuestions": ["Q1", "Q2"],
  "references": ["Textbook Chapter X", "Reference 2"]
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const generatePPTOutline = async (req, res) => {
    try {
        const { topic, course, slides = 10, audience } = req.body;
        const prompt = `
You are creating a PowerPoint presentation outline for a university lecture.
Course: ${course || 'General'}
Topic: ${topic}
Number of slides: ${slides}
Audience: ${audience || 'undergraduate students'}

Return ONLY a raw JSON object (no markdown, no code fences):
{
  "title": "Presentation title",
  "totalSlides": ${slides},
  "slides": [
    { "slideNumber": 1, "title": "Title Slide", "points": ["Course Name", "Topic", "Teacher Name"] },
    { "slideNumber": 2, "title": "Agenda", "points": ["point1", "point2"] }
  ],
  "designTips": ["Use high contrast colors", "Limit text per slide"],
  "estimatedDuration": "45 minutes"
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const generateQuiz = async (req, res) => {
    try {
        const { topic, course, count = 5, questionType = 'MCQ', marks = 1, btLevel } = req.body;
        const prompt = `
You are a university exam question setter.
Generate ${count} quiz questions for:
Course: ${course || 'General'}
Topic: ${topic}
Question Type: ${questionType}
Marks per question: ${marks}
Bloom's Level: ${btLevel || 'Understand'}

Return ONLY a raw JSON object (no markdown, no code fences):
{
  "quizTitle": "Quiz on ${topic}",
  "totalMarks": ${count * marks},
  "questions": [
    {
      "number": 1,
      "statement": "Question text",
      "type": "${questionType}",
      "marks": ${marks},
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answer": "A",
      "btLevel": "${btLevel || 'Understand'}"
    }
  ]
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const generateAssignment = async (req, res) => {
    try {
        const { topic, course, deadline, totalMarks = 20, clos } = req.body;
        const prompt = `
You are creating a university assignment.
Course: ${course || 'General'}
Topic: ${topic}
Total Marks: ${totalMarks}
CLOs: ${clos || 'N/A'}
Deadline: ${deadline || 'One week'}

Return ONLY a raw JSON object (no markdown, no code fences):
{
  "title": "Assignment title",
  "course": "${course || 'General'}",
  "totalMarks": ${totalMarks},
  "deadline": "${deadline || 'One week from issue'}",
  "objectives": ["objective 1", "objective 2"],
  "tasks": [
    { "taskNumber": 1, "description": "Task description", "marks": 5, "clo": "CLO1" }
  ],
  "submissionGuidelines": ["Format: PDF", "Font: Times New Roman 12pt"],
  "plagiarismPolicy": "Zero tolerance. Any copied work will receive zero marks.",
  "rubric": [
    { "criterion": "Accuracy", "excellent": "...", "good": "...", "average": "..." }
  ]
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const generateProgrammingQuestion = async (req, res) => {
    try {
        const { topic, language, difficulty, marks = 10, btLevel } = req.body;
        const prompt = `
You are creating a programming question for a university course.
Topic: ${topic}
Programming Language: ${language || 'Python'}
Difficulty: ${difficulty || 'Medium'}
Marks: ${marks}
Bloom's Level: ${btLevel || 'Apply'}

Return ONLY a raw JSON object (no markdown, no code fences):
{
  "title": "Question title",
  "language": "${language || 'Python'}",
  "difficulty": "${difficulty || 'Medium'}",
  "marks": ${marks},
  "problemStatement": "Detailed problem statement here",
  "sampleInput": "Sample input",
  "sampleOutput": "Expected output",
  "constraints": ["Constraint 1", "Time limit: 1s"],
  "hints": ["Hint 1", "Hint 2"],
  "solutionApproach": "Brief approach/algorithm description",
  "testCases": [
    { "input": "test input 1", "output": "expected output 1" }
  ]
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const generateLabManual = async (req, res) => {
    try {
        const { labTitle, course, week, objectives } = req.body;
        const prompt = `
You are creating a university lab manual.
Course: ${course || 'General'}
Lab Title: ${labTitle}
Week/Lab Number: ${week || 1}
Objectives: ${objectives || 'To practice concepts'}

Return ONLY a raw JSON object (no markdown, no code fences):
{
  "labTitle": "${labTitle}",
  "labNumber": ${week || 1},
  "duration": "3 hours",
  "objectives": ["objective 1", "objective 2"],
  "theory": "Brief theoretical background (2-3 paragraphs)",
  "tools": ["Tool/Software 1", "Tool 2"],
  "procedure": [
    { "step": 1, "instruction": "Step instruction", "note": "Optional note" }
  ],
  "exercises": [
    { "number": 1, "task": "Exercise description", "marks": 5 }
  ],
  "observations": "What students should record/observe",
  "conclusion": "What students should conclude",
  "preLabQuestions": ["Q1", "Q2"],
  "postLabQuestions": ["Q1", "Q2"]
}`;
        const text = await callGemini(prompt);
        res.status(200).json(JSON.parse(text));
    } catch (e) { res.status(500).json({ message: e.message }); }
};

