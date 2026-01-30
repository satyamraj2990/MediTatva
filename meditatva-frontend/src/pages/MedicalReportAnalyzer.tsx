import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  FileText,
  Brain,
  Sparkles,
  Activity,
  Heart,
  Thermometer,
  Wind,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Info,
  Target,
  Zap,
  Shield,
  Droplet,
  Stethoscope,
  Pill,
  Apple,
  Dumbbell,
  Moon,
  Coffee,
  Waves,
  Upload,
  Loader2,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Use Vite proxy - works in development and production
const API_BASE_URL = '/api';

// Mock Data
const mockReportData = {
  patientInfo: {
    name: "Rahul Kumar",
    age: 32,
    gender: "Male",
    bloodGroup: "O+",
    reportDate: "2026-01-29",
    reportType: "Comprehensive Health Panel",
    healthScore: 91
  },
  vitalSigns: {
    bloodPressure: { value: "120/80", status: "normal", trend: "+2.3%", icon: Heart },
    heartRate: { value: "72 bpm", status: "normal", trend: "-1.5%", icon: Activity },
    temperature: { value: "98.6°F", status: "normal", trend: "0%", icon: Thermometer },
    oxygenLevel: { value: "98%", status: "normal", trend: "+0.5%", icon: Wind }
  },
  reportComparisons: [
    {
      name: "Hemoglobin",
      result: 14.5,
      unit: "g/dL",
      range: "13.5-17.5",
      status: "normal",
      cause: "Optimal oxygen-carrying capacity in blood",
      context: "Hemoglobin is essential for transporting oxygen throughout your body. Your level is perfect for maintaining energy and organ function.",
      tips: "Maintain iron-rich diet including spinach, lentils, and lean meats"
    },
    {
      name: "Blood Glucose (Fasting)",
      result: 95,
      unit: "mg/dL",
      range: "70-100",
      status: "normal",
      cause: "Excellent glucose metabolism and insulin sensitivity",
      context: "Your fasting glucose indicates healthy insulin function and low diabetes risk. This is within the ideal range for metabolic health.",
      tips: "Continue balanced diet with complex carbs and regular exercise"
    },
    {
      name: "Total Cholesterol",
      result: 185,
      unit: "mg/dL",
      range: "< 200",
      status: "normal",
      cause: "Good cardiovascular health with balanced lipid profile",
      context: "Your cholesterol level suggests healthy heart function with minimal plaque buildup risk.",
      tips: "Maintain with omega-3 fatty acids, avoid trans fats"
    },
    {
      name: "HDL Cholesterol",
      result: 55,
      unit: "mg/dL",
      range: "> 40",
      status: "normal",
      cause: "Protective 'good' cholesterol at healthy levels",
      context: "HDL helps remove bad cholesterol from arteries. Your level provides good cardiovascular protection.",
      tips: "Boost with exercise, olive oil, and nuts"
    },
    {
      name: "LDL Cholesterol",
      result: 110,
      unit: "mg/dL",
      range: "< 100",
      status: "attention",
      cause: "Slightly elevated 'bad' cholesterol - monitor closely",
      context: "LDL can contribute to arterial plaque. Yours is slightly above optimal but not in dangerous range.",
      tips: "Reduce saturated fats, increase fiber intake, consider statin if needed"
    },
    {
      name: "Triglycerides",
      result: 140,
      unit: "mg/dL",
      range: "< 150",
      status: "normal",
      cause: "Well-controlled fat levels in blood",
      context: "Triglycerides store unused calories. Your level indicates good fat metabolism.",
      tips: "Limit sugar and refined carbs, maintain healthy weight"
    },
    {
      name: "Creatinine",
      result: 1.0,
      unit: "mg/dL",
      range: "0.7-1.3",
      status: "normal",
      cause: "Kidneys filtering waste efficiently",
      context: "Creatinine measures kidney function. Your level shows healthy kidney filtration.",
      tips: "Stay hydrated, avoid excessive protein supplements"
    },
    {
      name: "Thyroid (TSH)",
      result: 2.5,
      unit: "mIU/L",
      range: "0.4-4.0",
      status: "normal",
      cause: "Optimal thyroid hormone regulation",
      context: "TSH controls metabolism and energy. Your level indicates well-functioning thyroid.",
      tips: "Ensure adequate iodine intake through iodized salt or seafood"
    },
    {
      name: "Vitamin D",
      result: 32,
      unit: "ng/mL",
      range: "30-100",
      status: "normal",
      cause: "Adequate vitamin D for bone and immune health",
      context: "Vitamin D supports bone strength and immunity. You're just above the minimum threshold.",
      tips: "Get 15 minutes daily sunlight, consider supplementation"
    }
  ],
  healthScore: {
    overall: 91,
    cardiovascular: 88,
    metabolic: 92,
    respiratory: 95,
    immunity: 89
  },
  aiSummary: "Your health report shows excellent overall wellness with all major parameters within normal ranges. Your metabolic and respiratory systems are particularly strong. There's a minor attention point with LDL cholesterol that should be monitored. Continue your healthy lifestyle with focus on heart health.",
  recommendations: [
    { icon: Heart, text: "Monitor LDL cholesterol with monthly checks", priority: "high" },
    { icon: Apple, text: "Increase omega-3 rich foods (fish, walnuts, flaxseeds)", priority: "high" },
    { icon: Dumbbell, text: "Maintain 150 minutes weekly cardiovascular exercise", priority: "medium" },
    { icon: Droplet, text: "Stay hydrated with 8-10 glasses water daily", priority: "medium" }
  ],
  lifestyleTips: [
    { emoji: "🥗", text: "Mediterranean diet for heart health" },
    { emoji: "🏃", text: "30 minutes daily walking or jogging" },
    { emoji: "😴", text: "7-8 hours quality sleep each night" },
    { emoji: "🧘", text: "Practice stress management techniques" }
  ]
};

const MedicalReportAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [reportData, setReportData] = useState<typeof mockReportData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUploadArea, setShowUploadArea] = useState(true);

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image (JPEG, PNG) or PDF file');
      return;
    }

    setUploadedFile(file);
    // Only create preview URL for images, not PDFs
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    toast.success('File selected! Click "Analyze Report" to proceed.');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a report first');
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('report', uploadedFile);

    try {
      toast.info('Extracting text from report...');
      
      const response = await fetch(`${API_BASE_URL}/report-analyzer/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setReportData(result.analysis);
        setShowUploadArea(false);
        toast.success('Report analyzed successfully!');
      } else {
        throw new Error(result.message || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      const errorMessage = error.message || 'Failed to analyze report. Please try again.';
      toast.error(errorMessage);
      
      // Show more detailed error if available
      if (error.response?.data?.message) {
        console.error('Server error:', error.response.data.message);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setReportData(null);
    setUploadedFile(null);
    setPreviewUrl(null);
    setShowUploadArea(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  const toggleExpand = (testName: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testName)) {
      newExpanded.delete(testName);
    } else {
      newExpanded.add(testName);
    }
    setExpandedTests(newExpanded);
  };

  const downloadReport = () => {
    const data = reportData || mockReportData;
    const reportText = `
MediTatva Health Report
========================
Patient: ${data.patientInfo.name}
Age: ${data.patientInfo.age} | Gender: ${data.patientInfo.gender}
Blood Group: ${data.patientInfo.bloodGroup}
Date: ${data.patientInfo.reportDate}
Health Score: ${data.patientInfo.healthScore}/100

VITAL SIGNS
-----------
Blood Pressure: ${data.vitalSigns.bloodPressure.value}
Heart Rate: ${data.vitalSigns.heartRate.value}
Temperature: ${data.vitalSigns.temperature.value}
Oxygen Level: ${data.vitalSigns.oxygenLevel.value}

TEST RESULTS
------------
${data.reportComparisons.map(test => 
  `${test.name}: ${test.result} ${test.unit} (Range: ${test.range}) - ${test.status.toUpperCase()}`
).join('\n')}

AI SUMMARY
----------
${data.aiSummary}

RECOMMENDATIONS
---------------
${data.recommendations.map((rec, i) => `${i + 1}. ${rec.text}`).join('\n')}

Generated by MediTatva AI - ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediTatva_Report_${data.patientInfo.name.replace(' ', '_')}_${data.patientInfo.reportDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Human figure body parts for hologram
  const bodyParts = [
    { id: 'head', cy: 100, rx: 25, ry: 30, label: 'HEAD' },
    { id: 'neck', cy: 145, rx: 15, ry: 15, label: 'NECK' },
    { id: 'shoulders', cy: 175, rx: 45, ry: 20, label: 'SHOULDERS' },
    { id: 'upperTorso', cy: 230, rx: 35, ry: 40, label: 'UPPER TORSO' },
    { id: 'heart', cy: 230, rx: 15, ry: 15, label: 'HEART', pulse: true },
    { id: 'lowerTorso', cy: 310, rx: 35, ry: 40, label: 'LOWER TORSO' },
    { id: 'leftArm', cx: -40, cy: 220, rx: 12, ry: 60, label: 'LEFT ARM' },
    { id: 'rightArm', cx: 40, cy: 220, rx: 12, ry: 60, label: 'RIGHT ARM' },
    { id: 'leftLeg', cx: -20, cy: 400, rx: 15, ry: 70, label: 'LEFT LEG' },
    { id: 'rightLeg', cx: 20, cy: 400, rx: 15, ry: 70, label: 'RIGHT LEG' }
  ];

  const displayData = reportData || mockReportData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [-100, 100, -100],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex gap-3">
            {reportData && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all hover:scale-105"
              >
                <Upload className="w-5 h-5" />
                <span>New Report</span>
              </button>
            )}
            {reportData && (
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-5 h-5" />
                <span>Download Report</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Upload Area */}
        {showUploadArea && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-dashed border-white/20 rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5" />
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block mb-4"
                  >
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Upload Medical Report
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Upload an image or PDF of your medical report for AI-powered analysis
                  </p>
                </div>

                {/* File Input Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-2xl p-12 transition-all cursor-pointer bg-white/5 hover:bg-white/10"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  
                  {!uploadedFile ? (
                    <div className="text-center">
                      <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-semibold text-gray-300 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        JPEG, PNG, PDF (MAX. 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {uploadedFile.type.startsWith('image/') && previewUrl ? (
                        <div className="relative max-w-2xl mx-auto">
                          <img
                            src={previewUrl}
                            alt="Report preview"
                            className="w-full h-auto max-h-96 object-contain rounded-xl border border-white/10"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReset();
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-all"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      ) : uploadedFile.type === 'application/pdf' ? (
                        <div className="relative max-w-2xl mx-auto p-12 bg-red-500/10 border border-red-500/30 rounded-xl">
                          <div className="text-center">
                            <FileText className="w-24 h-24 mx-auto mb-4 text-red-400" />
                            <p className="text-lg font-semibold text-gray-300">PDF Document</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReset();
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-all"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      ) : null}
                      <div className="text-center">
                        <p className="text-lg font-semibold text-emerald-400 mb-2">
                          ✓ {uploadedFile.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analyze Button */}
                {uploadedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                  >
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-lg shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Analyzing Report...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="w-6 h-6" />
                          <span>Analyze Report with AI</span>
                        </>
                      )}
                    </button>
                    {analyzing && (
                      <p className="mt-4 text-sm text-gray-400 animate-pulse">
                        This may take 30-60 seconds. Please wait...
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                    <Brain className="w-8 h-8 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-sm">AI-Powered</div>
                      <div className="text-xs text-gray-400">Gemini AI Analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                    <Zap className="w-8 h-8 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-sm">OCR Technology</div>
                      <div className="text-xs text-gray-400">Text Extraction</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                    <Shield className="w-8 h-8 text-purple-400" />
                    <div>
                      <div className="font-semibold text-sm">Secure</div>
                      <div className="text-xs text-gray-400">Your data is safe</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Report Content - Only show if data exists */}
        {reportData && (
          <>
        {/* Patient Information Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5" />
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {displayData.patientInfo.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-300 mb-4">
                <span>{displayData.patientInfo.age} years</span>
                <span>•</span>
                <span>{displayData.patientInfo.gender}</span>
                <span>•</span>
                <span className="text-red-400">{displayData.patientInfo.bloodGroup}</span>
                <span>•</span>
                <span>{new Date(displayData.patientInfo.reportDate).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-3">
                <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm font-medium">
                  Health Score: {displayData.patientInfo.healthScore}/100
                </span>
                <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-sm font-medium">
                  {displayData.patientInfo.reportType}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="hidden md:block"
            >
              <div className="h-36 w-36 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                <FileText className="w-16 h-16 text-white" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Vital Signs Section */}
        {displayData.vitalSigns && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" />
              Vital Signs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(displayData.vitalSigns).map(([key, vital], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <vital.icon className="w-8 h-8 text-emerald-400" />
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      vital.status === 'normal' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {vital.status}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{vital.value}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {vital.trend.startsWith('+') ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : vital.trend.startsWith('-') ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : null}
                    <span>{vital.trend}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Body System Analysis - Hologram */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            Body System Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hologram Visualization */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5" />
              
              {/* Hologram Container */}
              <div className="relative h-[600px] flex items-center justify-center">
                {/* Scanning Lines */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent"
                  animate={{ y: [-600, 600] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Orbit Rings */}
                <motion.div
                  className="absolute w-[400px] h-[400px] border border-emerald-500/20 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute w-[500px] h-[500px] border border-cyan-500/20 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                />

                {/* Human Figure SVG */}
                <svg
                  viewBox="0 0 200 550"
                  className="relative w-full h-full"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.3))' }}
                >
                  {bodyParts.map((part, index) => (
                    <motion.ellipse
                      key={part.id}
                      cx={part.cx || 100}
                      cy={part.cy}
                      rx={part.rx}
                      ry={part.ry}
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="2"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: part.pulse ? [1, 1.1, 1] : 1
                      }}
                      transition={{
                        duration: part.pulse ? 1.5 : 3,
                        repeat: Infinity,
                        delay: index * 0.1
                      }}
                    />
                  ))}

                  {/* Connection Lines */}
                  <motion.line
                    x1="100" y1="130" x2="100" y2="160"
                    stroke="#22C55E" strokeWidth="1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.line
                    x1="100" y1="195" x2="100" y2="200"
                    stroke="#22C55E" strokeWidth="1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </svg>

                {/* Floating Particles */}
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [-20, 20],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}

                {/* Status Indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-full border border-emerald-500/30">
                  <motion.div
                    className="w-2 h-2 bg-emerald-400 rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm text-emerald-400 font-medium">Live Holo Scan</span>
                </div>
              </div>
            </div>

            {/* System Health Sidebar */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">System Health</h3>
              {displayData.reportComparisons.slice(0, 8).map((test, index) => (
                <motion.button
                  key={test.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTest(selectedTest === test.name ? null : test.name)}
                  className={`w-full p-3 bg-slate-800/50 backdrop-blur-xl border rounded-xl text-left transition-all hover:scale-[1.02] ${
                    selectedTest === test.name
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-2 h-2 rounded-full ${
                        test.status === 'normal' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                      <span className="text-sm font-medium">{test.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      test.status === 'normal'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {test.result} {test.unit}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* AI Context Box */}
          <AnimatePresence>
            {selectedTest && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-gradient-to-br from-cyan-900/20 to-emerald-900/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 overflow-hidden"
              >
                {(() => {
                  const test = displayData.reportComparisons.find(t => t.name === selectedTest);
                  if (!test) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        <h4 className="text-xl font-bold">{test.name} Analysis</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-800/50 rounded-xl p-4">
                          <div className="text-sm text-gray-400 mb-1">Your Value</div>
                          <div className="text-2xl font-bold text-emerald-400">{test.result} {test.unit}</div>
                          <div className="text-sm text-gray-400 mt-1">Normal Range: {test.range}</div>
                        </div>
                        <div className="bg-cyan-500/10 rounded-xl p-4">
                          <div className="text-sm text-cyan-400 font-medium mb-2">Health Context</div>
                          <div className="text-sm text-gray-300">{test.context}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Report Overview Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5" />
            
            <h2 className="text-2xl font-bold text-center mb-8 relative">
              Report • Overview
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
              {/* Left Column Tests */}
              <div className="space-y-2">
                {displayData.reportComparisons.slice(0, 5).map((test, index) => (
                  <motion.div
                    key={test.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      test.status === 'normal' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                    <span className="text-gray-300">{test.name}</span>
                  </motion.div>
                ))}
              </div>

              {/* Center Hologram - Smaller */}
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-60">
                  <svg viewBox="0 0 200 300" className="w-full h-full">
                    {bodyParts.slice(0, 6).map((part, index) => (
                      <motion.ellipse
                        key={part.id}
                        cx={part.cx || 100}
                        cy={part.cy * 0.5}
                        rx={part.rx * 0.7}
                        ry={part.ry * 0.5}
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="1.5"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: index * 0.1 }}
                      />
                    ))}
                  </svg>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full">
                    <motion.div
                      className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-emerald-400">Active</span>
                  </div>
                </div>
              </div>

              {/* Right Column Tests */}
              <div className="space-y-2">
                {displayData.reportComparisons.slice(5).map((test, index) => (
                  <motion.div
                    key={test.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 text-sm justify-end"
                  >
                    <span className="text-gray-300">{test.name}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      test.status === 'normal' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-8 relative">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                <span className="text-sm text-gray-400">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full" />
                <span className="text-sm text-gray-400">Attention</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Test Results Analysis Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" />
            Detailed Test Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayData.reportComparisons.map((test, index) => (
              <motion.div
                key={test.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg">{test.name}</h3>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    test.status === 'normal'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {test.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Ideal Range</div>
                    <div className="text-sm font-medium">{test.range}</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-3">
                    <div className="text-xs text-emerald-400 mb-1">Your Value</div>
                    <div className="text-sm font-bold">{test.result} {test.unit}</div>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        test.status === 'normal' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: test.status === 'normal' ? '100%' : '70%' }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.05 }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {test.cause}
                </div>

                <button
                  onClick={() => toggleExpand(test.name)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  {expandedTests.has(test.name) ? 'Hide' : 'View'} Details
                  <motion.div
                    animate={{ rotate: expandedTests.has(test.name) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Info className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedTests.has(test.name) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-3 overflow-hidden"
                    >
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="text-xs text-emerald-400 font-medium mb-2">Root Cause</div>
                        <div className="text-sm text-gray-300">{test.cause}</div>
                      </div>
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                        <div className="text-xs text-cyan-400 font-medium mb-2">Health Context</div>
                        <div className="text-sm text-gray-300">{test.context}</div>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <div className="text-xs text-amber-400 font-medium mb-2">Recommendations</div>
                        <div className="text-sm text-gray-300">{test.tips}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Wellness Plan Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-cyan-400" />
              AI Recommendations
            </h3>
            <div className="space-y-4">
              {displayData.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all"
                >
                  <div className={`p-2 rounded-lg ${
                    rec.priority === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <rec.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{rec.text}</span>
                      {rec.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Lifestyle Tips */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              Lifestyle Tips
            </h3>
            <div className="space-y-4">
              {displayData.lifestyleTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/10 hover:border-emerald-500/50 transition-all"
                >
                  <div className="text-3xl">{tip.emoji}</div>
                  <div className="text-sm text-gray-300">{tip.text}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Health Assessment Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Health Assessment Summary
          </h2>
          
          <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-2xl p-6 mb-6 border border-cyan-500/20">
            <div className="flex items-start gap-3">
              <Brain className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
              <p className="text-gray-300 leading-relaxed">{displayData.aiSummary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(displayData.healthScore).filter(([key]) => key !== 'overall').map(([key, score], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-slate-800/50 rounded-xl p-4"
              >
                <div className="text-sm text-gray-400 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                <div className="text-2xl font-bold text-emerald-400 mb-3">{score}/100</div>
                <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Your health data is encrypted and secure. This report is generated by AI for informational purposes only. Consult your doctor for medical advice.</span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-gray-500 text-sm"
        >
          <p>Powered by MediTatva AI • Generated on {new Date().toLocaleString()}</p>
        </motion.div>
        </>
        )}
      </div>
    </div>
  );
};

export default MedicalReportAnalyzer;
