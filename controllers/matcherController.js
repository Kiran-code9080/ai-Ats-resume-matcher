// matcherController.js
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { computeSimilarity } from '../utils/similarity.js';
import { analyzeAndHighlight } from '../utils/feedback.js';
import Match from '../models/match.js';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Extract text from a PDF file
async function extractPdfText(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    return (pdfData.text || '').trim();
  } catch (err) {
    console.error('❌ PDF extraction failed:', err.message);
    return '';
  }
}

// Render home page
export const renderHome = (req, res) => {
  res.render('index', {
    score: null,
    feedback: [],
    highlightedJD: null,
    presentSkills: [],
    missingSkills: []
  });
};

// Handle resume-job description matching
export const handleMatch = async (req, res) => {
  if (!req.file || !req.body.job_desc) {
    return res.status(400).send('Resume (PDF) and job description are required.');
  }

  const jobText = (req.body.job_desc || '').trim();
  let resumeText = '';

  try {
    // 1. Extract text from uploaded resume
    resumeText = await extractPdfText(req.file.path);

    // 2. Compute semantic similarity
    let score = 0;
    try {
      const rawSimilarity = await computeSimilarity(resumeText, jobText);

      // Debug logs
      console.log("📄 Resume text length:", resumeText.length);
      console.log("📑 Job description length:", jobText.length);
      console.log("📊 Raw similarity score:", rawSimilarity);

      score = !isNaN(rawSimilarity) ? Math.round(rawSimilarity * 100) : 0;
      console.log(`🟢 Final similarity score: ${score}%`);
    } catch (simErr) {
      console.error('❌ computeSimilarity error:', simErr.message);
    }

    // 3. Extract skills + TF-IDF highlight JD
    const { feedback, highlightedJD, presentSkills, missingSkills } =
      analyzeAndHighlight(resumeText, jobText);

    // 4. Save match to MongoDB
    try {
      await Match.create({
        userId: req.session?.user?._id,
        score,
        jobText,
        resumeTextSnippet: resumeText.slice(0, 600),
        presentSkills,
        missingSkills,
      });
    } catch (dbErr) {
      console.error('❌ Saving match failed:', dbErr.message);
    }

    // 5. Render results page
    res.render('result', {
      score,
      feedback,
      highlightedJD,
      presentSkills,
      missingSkills,
    });

  } catch (err) {
    console.error('❌ handleMatch error:', err.message);
    res.status(500).send('Server error while matching.');
  } finally {
    // Clean up uploaded resume
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.warn('⚠️ Could not delete uploaded file:', unlinkErr.message);
      }
    }
  }
};

// View match history
export const historyPage = async (req, res) => {
  try {
    const items = await Match.find({ userId: req.session?.user?._id })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    res.render('history', { items });
  } catch (err) {
    console.error('❌ historyPage error:', err.message);
    res.status(500).send('Could not load history.');
  }
};
