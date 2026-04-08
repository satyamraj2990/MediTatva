const express = require('express');
const router = express.Router();
const { compareMedicinesWithAI, getBasicComparison } = require('../services/geminiMedicineCompare');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// In-memory medicine database (loaded from CSV)
let medicines = [];
let medicinesLoaded = false;

// Load medicines from CSV
function loadMedicines() {
  if (medicinesLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const csvPath = path.join(__dirname, '..', '..', '..', 'A_Z_medicines_dataset_of_India.csv');
    
    medicines = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        medicines.push({
          id: row.id || row.srno,
          name: row.name,
          manufacturer: row.manufacturer || row.Manufacturer,
          price: parseFloat(row.price) || 0,
          discontinued: row.Is_discontinued === '1' || row.discontinued === 'true',
          type: row.type,
          packSize: row.pack_size_label || row.packSize,
          composition1: row.short_composition1 || row.composition1,
          composition2: row.short_composition2 || row.composition2
        });
      })
      .on('end', () => {
        medicinesLoaded = true;
        console.log(`✅ Loaded ${medicines.length} medicines for AI comparison`);
        resolve();
      })
      .on('error', reject);
  });
}

// Load medicines on server start
loadMedicines().catch(console.error);

/**
 * POST /api/medicines/compare-ai
 * AI-powered medicine comparison using Gemini
 * 
 * Body: {
 *   medicine1: "Dolo 650 Tablet",
 *   medicine2: "Crocin Advance Tablet"
 * }
 */
router.post('/compare-ai', async (req, res) => {
  try {
    const medicine1Name = (req.body.medicine1Name || req.body.medicine1 || '').trim();
    const medicine2Name = (req.body.medicine2Name || req.body.medicine2 || '').trim();

    if (!medicine1Name || !medicine2Name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both medicine1Name and medicine2Name'
      });
    }

    // Ensure medicines are loaded
    if (!medicinesLoaded) {
      await loadMedicines();
    }

    const normalize = (value) =>
      String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const scoreMatch = (candidateName, query) => {
      const c = normalize(candidateName);
      const q = normalize(query);
      if (!c || !q) return 0;
      if (c === q) return 100;
      if (c.startsWith(q)) return 80;
      if (c.includes(q)) return 60;

      const tokens = q.split(' ').filter(Boolean);
      if (tokens.length && tokens.every((t) => c.includes(t))) return 40;
      return 0;
    };

    const findBestMedicine = (query) => {
      let best = null;
      let bestScore = 0;

      for (const med of medicines) {
        const score = scoreMatch(med.name, query);
        if (score > bestScore) {
          best = med;
          bestScore = score;
        }
      }

      return bestScore >= 40 ? best : null;
    };

    // Find medicine details from database (exact/fuzzy)
    const med1 = findBestMedicine(medicine1Name);
    const med2 = findBestMedicine(medicine2Name);

    if (!med1 || !med2) {
      return res.status(404).json({
        success: false,
        error: 'One or both medicines not found in database',
        found: {
          medicine1: !!med1,
          medicine2: !!med2
        },
        suggestions: {
          medicine1: medicines
            .filter(m => normalize(m.name).includes(normalize(medicine1Name).split(' ')[0] || ''))
            .slice(0, 5)
            .map(m => m.name),
          medicine2: medicines
            .filter(m => normalize(m.name).includes(normalize(medicine2Name).split(' ')[0] || ''))
            .slice(0, 5)
            .map(m => m.name)
        }
      });
    }

    // Get AI comparison
    const comparisonResult = await compareMedicinesWithAI(med1, med2);

    if (!comparisonResult.success) {
      // Fall back to basic comparison if AI fails
      console.warn('AI comparison failed, using basic comparison');
      const basicResult = getBasicComparison(med1, med2);
      return res.json(basicResult);
    }

    // Add original medicine data to response
    comparisonResult.data.originalData = {
      medicine1: med1,
      medicine2: med2
    };

    res.json(comparisonResult);

  } catch (error) {
    console.error('Compare AI Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare medicines',
      details: error.message
    });
  }
});

/**
 * GET /api/medicines/compare-ai/test
 * Test endpoint to verify AI comparison works
 */
router.get('/compare-ai/test', async (req, res) => {
  try {
    // Test with two common medicines
    const med1 = medicines.find(m => m.name.toLowerCase().includes('dolo 650'));
    const med2 = medicines.find(m => m.name.toLowerCase().includes('crocin'));

    if (!med1 || !med2) {
      return res.json({
        success: false,
        error: 'Test medicines not found',
        medicinesCount: medicines.length
      });
    }

    const result = await compareMedicinesWithAI(med1, med2);
    
    res.json({
      success: true,
      testResult: result,
      medicine1: med1.name,
      medicine2: med2.name
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
