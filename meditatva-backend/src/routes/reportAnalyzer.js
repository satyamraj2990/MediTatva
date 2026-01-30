const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const { PDFParse } = require('pdf-parse');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

// Initialize Gemini API - using dedicated key for report analyzer
const geminiApiKey = process.env.GEMINI_REPORT_ANALYZER_KEY || process.env.GEMINI_API_KEY;

// Analyze medical report using OCR and Gemini AI
router.post('/analyze', upload.single('report'), async (req, res) => {
  console.log('📨 Report analyzer - Analyze request received');
  
  try {
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    console.log('📄 Processing medical report:', req.file.originalname);
    console.log('📎 File type:', req.file.mimetype);
    console.log('📏 File size:', (req.file.size / 1024).toFixed(2), 'KB');

    // Step 1: Extract text based on file type
    const filePath = req.file.path;
    let text = '';

    if (req.file.mimetype === 'application/pdf') {
      // Extract text from PDF
      console.log('📑 Extracting text from PDF...');
      const dataBuffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      text = result.text;
      console.log('✅ PDF text extracted, length:', text.length);
    } else {
      // Extract text from image using Tesseract OCR
      console.log('🔍 Extracting text using OCR...');
      const { data: { text: extractedText } } = await Tesseract.recognize(filePath, 'eng', {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      });
      text = extractedText;
      console.log('✅ Text extracted, length:', text.length);
    }

    if (!text || text.trim().length < 10) {
      throw new Error('No text could be extracted from the file. Please upload a clearer image or PDF.');
    }

    // Step 2: Analyze with Gemini AI (using dedicated key)
    if (!geminiApiKey) {
      throw new Error('GEMINI_REPORT_ANALYZER_KEY or GEMINI_API_KEY not configured');
    }

    console.log('🤖 Analyzing report with Gemini AI...');

    const prompt = `You are a medical report analyzer. Analyze this medical report text and extract structured data in JSON format.

Medical Report Text:
${text}

Extract and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "patientInfo": {
    "name": "Patient name from report or 'Patient' if not found",
    "age": number or null,
    "gender": "Male/Female/Other" or null,
    "bloodGroup": "Blood group" or null,
    "reportDate": "YYYY-MM-DD" or today's date,
    "reportType": "Type of report" or "Health Panel",
    "healthScore": number 0-100 based on overall health
  },
  "vitalSigns": {
    "bloodPressure": {"value": "120/80", "status": "normal/attention", "trend": "+2.3%"},
    "heartRate": {"value": "72 bpm", "status": "normal/attention", "trend": "-1.5%"},
    "temperature": {"value": "98.6°F", "status": "normal/attention", "trend": "0%"},
    "oxygenLevel": {"value": "98%", "status": "normal/attention", "trend": "+0.5%"}
  },
  "testResults": [
    {
      "name": "Test name",
      "result": number,
      "unit": "unit",
      "range": "normal range",
      "status": "normal/attention/critical",
      "cause": "Brief explanation",
      "context": "Health context",
      "tips": "Recommendations"
    }
  ],
  "healthScore": {
    "overall": number 0-100,
    "cardiovascular": number 0-100,
    "metabolic": number 0-100,
    "respiratory": number 0-100,
    "immunity": number 0-100
  },
  "aiSummary": "Overall health summary paragraph",
  "recommendations": [
    {"text": "Recommendation text", "priority": "high/medium"}
  ],
  "lifestyleTips": [
    {"emoji": "emoji", "text": "Lifestyle tip"}
  ]
}

If test data is not found in the report, make reasonable medical estimates based on standard health metrics. Ensure all numbers are realistic medical values.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    console.log('✅ AI Analysis complete');

    // Parse JSON from response (remove markdown code blocks if present)
    let analysisData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        analysisData = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('AI response was not valid JSON');
    }

    // Add icons to recommendations and lifestyle tips
    const iconMap = {
      'heart': '❤️', 'exercise': '🏃', 'food': '🥗', 'water': '💧',
      'sleep': '😴', 'stress': '🧘', 'medicine': '💊', 'doctor': '👨‍⚕️'
    };

    analysisData.recommendations = analysisData.recommendations.map(rec => ({
      ...rec,
      icon: 'Heart' // Will be converted to React icon on frontend
    }));

    // Clean up uploaded file
    await fs.unlink(filePath);
    console.log('🗑️ Temporary file cleaned up');

    console.log('✅ Analysis complete, sending response');
    res.json({
      success: true,
      extractedText: text.substring(0, 500), // First 500 chars for preview
      analysis: analysisData
    });

  } catch (error) {
    console.error('❌ Report analysis error:', error.message);
    console.error('Stack:', error.stack);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file:', unlinkError);
      }
    }

    // Check for quota exceeded error
    if (error.response?.data?.error?.code === 429) {
      return res.status(429).json({ 
        success: false,
        error: 'API quota exceeded',
        details: 'Gemini API quota has been exceeded. Please wait or upgrade your API plan.',
        message: error.response.data.error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze report',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Report Analyzer API is running' });
});

module.exports = router;
