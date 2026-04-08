const express = require('express');

const router = express.Router();

const DEFAULT_FACE_MODELS = ['dima806/facial_emotions_image_detection', 'trpakov/vit-face-expression'];
const DEFAULT_VOICE_MODELS = ['superb/wav2vec2-base-superb-er', 'ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition'];
const HF_ENABLE_ROUTER = String(process.env.HF_ENABLE_ROUTER || 'false').toLowerCase() === 'true';
const HF_REQUEST_TIMEOUT_MS = Number(process.env.HF_REQUEST_TIMEOUT_MS || 45000);
const HF_BASE_URLS = [
  'https://api-inference.huggingface.co/models',
  ...(HF_ENABLE_ROUTER ? ['https://router.huggingface.co/hf-inference/models'] : []),
];

function parseModelList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getModelCandidates(singleEnvKey, listEnvKey, defaults) {
  const fromList = parseModelList(process.env[listEnvKey]);
  const fromSingle = parseModelList(process.env[singleEnvKey]);
  const combined = [...fromList, ...fromSingle, ...defaults];
  return Array.from(new Set(combined));
}

const FACE_MODEL_CANDIDATES = getModelCandidates('HF_FACE_MODEL', 'HF_FACE_MODELS', DEFAULT_FACE_MODELS);
const VOICE_MODEL_CANDIDATES = getModelCandidates('HF_VOICE_MODEL', 'HF_VOICE_MODELS', DEFAULT_VOICE_MODELS);

function getHfToken() {
  return (process.env.HUGGINGFACE_API_KEY || process.env.HF_API_TOKEN || '').trim();
}

function decodeDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) {
    throw new Error('Invalid base64 data URL format');
  }
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function decodeRawBase64(base64Payload, mimeType = 'application/octet-stream') {
  if (!base64Payload || typeof base64Payload !== 'string') {
    throw new Error('Invalid base64 payload');
  }
  return {
    mimeType,
    buffer: Buffer.from(base64Payload, 'base64'),
  };
}

function normalizeLabel(label) {
  return String(label || 'unknown')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function toTitleCase(text) {
  return String(text || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractPredictions(payload) {
  let rows = payload;

  if (Array.isArray(rows) && Array.isArray(rows[0])) {
    rows = rows[0];
  }

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((item) => ({
      label: normalizeLabel(item.label),
      score: Number(item.score || 0),
    }))
    .filter((item) => item.label && Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function buildGuidance(dominantEmotion, modality) {
  const emotion = normalizeLabel(dominantEmotion);

  if (/sad|fear|angry|disgust|anxious|stressed|depress/.test(emotion)) {
    return {
      summary: `Your ${modality} analysis indicates a heavier emotional state (${toTitleCase(emotion)}).`,
      recommendations: [
        'Take 2-3 minutes for slow breathing (inhale 4s, exhale 6s).',
        'Drink water and take a brief movement break.',
        'If this feeling continues, consider talking to a trusted person or counselor.',
      ],
    };
  }

  if (/happy|calm|neutral|surprise/.test(emotion)) {
    return {
      summary: `Your ${modality} analysis indicates a stable/positive state (${toTitleCase(emotion)}).`,
      recommendations: [
        'Maintain this state with short breaks and hydration.',
        'Capture one small gratitude note today.',
        'Keep a consistent sleep and wake routine.',
      ],
    };
  }

  return {
    summary: `Your ${modality} analysis detected ${toTitleCase(emotion)} as the dominant emotion.`,
    recommendations: [
      'Track this emotion at different times of day for better context.',
      'Use 5-minute grounding or mindful breathing when needed.',
      'Seek professional support if distress becomes frequent or intense.',
    ],
  };
}

function shouldRetryModel(error) {
  const retryStatuses = [404, 410, 429, 500, 502, 503, 504];
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('does not have sufficient permissions to call inference providers')) {
    return false;
  }
  const networkTransient =
    message.includes('terminated') ||
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('socket hang up') ||
    message.includes('network');

  return retryStatuses.includes(Number(error?.status || 0)) || networkTransient;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(retryAfterHeader) {
  if (!retryAfterHeader) {
    return 0;
  }

  const asNumber = Number(retryAfterHeader);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return Math.ceil(asNumber);
  }

  const asDate = new Date(retryAfterHeader);
  const deltaMs = asDate.getTime() - Date.now();
  if (!Number.isNaN(deltaMs) && deltaMs > 0) {
    return Math.ceil(deltaMs / 1000);
  }

  return 0;
}

async function inferFromUrl(baseUrl, model, contentType, payloadBuffer, token) {
  let lastError = null;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    let timeout = null;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), HF_REQUEST_TIMEOUT_MS);

      const response = await fetch(`${baseUrl}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType,
          'x-wait-for-model': 'true',
          'x-use-cache': 'false',
        },
        body: payloadBuffer,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const rawText = await response.text();
      let json = null;

      try {
        json = JSON.parse(rawText);
      } catch {
        json = null;
      }

      if (!response.ok) {
        const errorMessage =
          (json && (json.error || json.message)) ||
          `Hugging Face request failed with status ${response.status}`;

        const error = new Error(errorMessage);
        error.status = response.status;
        error.retryAfterSeconds = parseRetryAfterSeconds(response.headers.get('retry-after'));
        throw error;
      }

      if (json && json.error) {
        const error = new Error(json.error);
        error.status = 503;
        throw error;
      }

      return json;
    } catch (error) {
      if (timeout) {
        clearTimeout(timeout);
      }
      lastError = error;
      const canRetry = shouldRetryModel(error) && attempt < 5;
      if (!canRetry) {
        throw error;
      }

      await sleep(450 * attempt);
    }
  }

  throw lastError || new Error('Hugging Face request failed unexpectedly.');
}

async function inferWithHuggingFace(model, contentType, payloadBuffer) {
  const token = getHfToken();

  if (!token) {
    const error = new Error('Hugging Face token is missing. Set HUGGINGFACE_API_KEY in backend env.');
    error.status = 503;
    throw error;
  }

  let lastError = null;
  for (const baseUrl of HF_BASE_URLS) {
    try {
      const result = await inferFromUrl(baseUrl, model, contentType, payloadBuffer, token);
      return { result, baseUrl };
    } catch (error) {
      lastError = error;
      if (!shouldRetryModel(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Hugging Face request failed for all endpoints.');
}

async function inferWithModelFallback(models, contentType, payloadBuffer) {
  const failures = [];

  for (const model of models) {
    try {
      const { result, baseUrl } = await inferWithHuggingFace(model, contentType, payloadBuffer);
      return { model, baseUrl, result };
    } catch (error) {
      failures.push(`${model}: ${error.message || 'unknown error'}`);

      if (Number(error?.status || 0) === 429) {
        const rateLimitError = new Error(
          `Rate limited by Hugging Face (429). Please retry shortly.${error?.message ? ` Details: ${error.message}` : ''}`
        );
        rateLimitError.status = 429;
        rateLimitError.retryAfterSeconds = Number(error?.retryAfterSeconds || 12);
        throw rateLimitError;
      }

      if (!shouldRetryModel(error)) {
        throw error;
      }
    }
  }

  const combined = failures.join(' | ');
  const transientFail = /terminated|fetch failed|network|econnreset|socket hang up/i.test(combined);
  const error = new Error(
    transientFail
      ? `Temporary Hugging Face network interruption. Please retry. Details: ${combined || 'no details available'}`
      : `All configured Hugging Face models failed. Details: ${combined || 'no details available'}`
  );
  error.status = 503;
  throw error;
}

function createAnalysisResponse(modality, predictions) {
  if (!predictions.length) {
    return {
      modality,
      dominantEmotion: 'unknown',
      confidence: 0,
      topEmotions: [],
      summary: `No clear ${modality} emotion signal detected.`,
      recommendations: ['Try again in better lighting/audio conditions for more reliable results.'],
    };
  }

  const dominant = predictions[0];
  const guidance = buildGuidance(dominant.label, modality);

  return {
    modality,
    dominantEmotion: toTitleCase(dominant.label),
    confidence: Number(dominant.score.toFixed(4)),
    topEmotions: predictions.map((item) => ({
      emotion: toTitleCase(item.label),
      confidence: Number(item.score.toFixed(4)),
    })),
    summary: guidance.summary,
    recommendations: guidance.recommendations,
  };
}

router.post('/face', async (req, res) => {
  try {
    const { imageDataUrl } = req.body || {};

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'imageDataUrl is required as a base64 data URL',
      });
    }

    const { mimeType, buffer } = decodeDataUrl(imageDataUrl);
    const inference = await inferWithModelFallback(FACE_MODEL_CANDIDATES, mimeType, buffer);
    const predictions = extractPredictions(inference.result);

    return res.json({
      success: true,
      model: inference.model,
      provider: inference.baseUrl,
      analysis: createAnalysisResponse('facial', predictions),
    });
  } catch (error) {
    console.error('Mood analyzer face error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Face analysis failed',
      retryAfterSeconds: Number(error?.retryAfterSeconds || 0),
    });
  }
});

router.post('/voice', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body || {};

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'audioBase64 is required',
      });
    }

    const { mimeType: finalType, buffer } = decodeRawBase64(audioBase64, mimeType || 'audio/webm');
    const inference = await inferWithModelFallback(VOICE_MODEL_CANDIDATES, finalType, buffer);
    const predictions = extractPredictions(inference.result);

    return res.json({
      success: true,
      model: inference.model,
      provider: inference.baseUrl,
      analysis: createAnalysisResponse('voice', predictions),
    });
  } catch (error) {
    console.error('Mood analyzer voice error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Voice analysis failed',
      retryAfterSeconds: Number(error?.retryAfterSeconds || 0),
    });
  }
});

router.get('/health', (req, res) => {
  const hasToken = Boolean(getHfToken());
  res.json({
    status: 'ok',
    hasToken,
    routerEnabled: HF_ENABLE_ROUTER,
    requestTimeoutMs: HF_REQUEST_TIMEOUT_MS,
    endpoints: HF_BASE_URLS,
    faceModels: FACE_MODEL_CANDIDATES,
    voiceModels: VOICE_MODEL_CANDIDATES,
    message: hasToken
      ? 'Mood analyzer is configured.'
      : 'Set HUGGINGFACE_API_KEY in backend env to enable inference.',
  });
});

module.exports = router;
