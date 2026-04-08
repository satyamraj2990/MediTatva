import React from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScreeningResult, generateRecommendations, getSeverityColor, getSeverityLabel } from "@/lib/screeningHelpers";
import type { MentalWellnessReport } from "@/lib/emotionClassifierClient";

interface SurveyResponseRow {
  questionId: string;
  questionText: string;
  answerLabel: string;
  score: number;
}

interface MentalHealthReportCardProps {
  result: ScreeningResult;
  respondentName?: string;
  completedAt?: string;
  responseRows?: SurveyResponseRow[];
}

export const MentalHealthReportCard: React.FC<MentalHealthReportCardProps> = ({
  result,
  respondentName,
  completedAt,
  responseRows = [],
}) => {
  const recommendations = generateRecommendations(result);
  const detailedReport: MentalWellnessReport | undefined = result.detailedReport;

  const keywordInsights = Object.entries(result.concernsDetailed || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([concern]) => concern);

  const fallbackMicroActions = [
    'Try a 4-7-8 breathing cycle for 3 rounds to reduce stress quickly.',
    'Take a 10-minute brisk walk or light stretch to release physical tension.',
    'Write down one immediate feeling and one practical next step for today.'
  ];
  const rawMicroActions = (detailedReport?.micro_actions || []) as Array<string | { action?: string }>;
  const topMicroActionTexts = rawMicroActions
    .map((actionItem) => (typeof actionItem === 'string' ? actionItem : actionItem.action || ''))
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .slice(0, 3);
  const microActionsToDisplay = topMicroActionTexts.length > 0 ? topMicroActionTexts : fallbackMicroActions;
  const topEmotions = (detailedReport?.emotional_breakdown?.detected_emotions || []).slice(0, 3);

  const concernChartData = Object.entries(result.concernsDetailed || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([concern, score]) => ({
      concern: concern.replace(/_/g, " "),
      score: Number((score * 100).toFixed(1))
    }));

  const topConcernPercent = concernChartData.length > 0 ? concernChartData[0].score : 0;
  const wellnessStabilityIndex = Math.max(0, Number((((result.maxScore - result.totalScore) / Math.max(result.maxScore, 1)) * 100).toFixed(1)));
  const concernLoadIndex = concernChartData.length > 0
    ? Number((concernChartData.reduce((sum, item) => sum + item.score, 0) / concernChartData.length).toFixed(1))
    : 0;

  const wellnessRadarData = [
    { metric: "Stability", value: wellnessStabilityIndex },
    { metric: "Risk Control", value: Math.max(0, 100 - topConcernPercent) },
    { metric: "Focus", value: Math.max(0, 100 - (result.concernsDetailed?.focus_issues || 0) * 100) },
    { metric: "Energy", value: Math.max(0, 100 - (result.concernsDetailed?.fatigue || 0) * 100) },
    { metric: "Calm", value: Math.max(0, 100 - (result.concernsDetailed?.anxiety || 0) * 100) },
  ];

  const executiveSummaryPoints = [
    `Mental wellness stability index: ${wellnessStabilityIndex}% (higher is better).`,
    `Current concern load index: ${concernLoadIndex}% based on weighted symptom signals.`,
    `Top concern pressure: ${topConcernPercent.toFixed(1)}% in ${concernChartData[0]?.concern || "N/A"}.`,
    `Dominant emotional signal: ${topEmotions[0]?.emotion?.replace(/_/g, ' ') || "N/A"} at ${(topEmotions[0]?.score ? topEmotions[0].score * 100 : 0).toFixed(1)}%.`
  ];

  const priorityActionQueue = concernChartData.slice(0, 3).map((item, idx) => {
    let action = "Continue monitoring and maintain your current self-care routine.";
    if (item.concern.toLowerCase().includes("anxiety")) {
      action = "Run 2 short grounding sessions (2-3 mins) today and reduce overstimulation triggers.";
    } else if (item.concern.toLowerCase().includes("sleep")) {
      action = "Use a fixed sleep cut-off for screens and start a 30-minute wind-down routine tonight.";
    } else if (item.concern.toLowerCase().includes("fatigue") || item.concern.toLowerCase().includes("burnout")) {
      action = "Protect one low-pressure recovery block today (20-30 mins), then reassess energy level.";
    } else if (item.concern.toLowerCase().includes("focus")) {
      action = "Use a 25-minute deep-focus block with notifications off, followed by a 5-minute reset break.";
    }

    return {
      rank: idx + 1,
      concern: item.concern,
      intensity: item.score,
      action
    };
  });

  const compactText = (value: string | undefined, maxChars = 220) => {
    if (!value) return '';
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > maxChars ? `${normalized.slice(0, maxChars)}...` : normalized;
  };

  const buildPrecisePsychologicalInsight = () => {
    const primary = detailedReport?.psychological_insight?.primary_insight;
    const dynamic = detailedReport?.psychological_insight?.dynamic_explanation;
    const merged = [primary, dynamic].filter(Boolean).join(' ');
    if (!merged) return '';

    const normalized = merged.replace(/\s+/g, ' ').trim();
    return compactText(normalized, 320);
  };

  const precisePsychologicalInsight = buildPrecisePsychologicalInsight();

  const conciseHomeRemedies = [
    "Hydrate well through the day and avoid long dehydration gaps.",
    "Use 10 minutes of sunlight exposure in the morning when possible.",
    "Maintain a fixed sleep time and reduce screen brightness 45 minutes before bed.",
  ];

  const conciseExercisePlan = [
    "15-20 minutes brisk walking for mood regulation.",
    "5 minutes box breathing (4-4-4-4) after stressful moments.",
    "2 rounds of light stretching (neck, shoulders, back) to reduce physical stress load.",
  ];

  const handleDownloadPdfReport = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    const title = "Mental Wellness Report";
    const generatedAt = new Date().toLocaleString();
    const completedAtText = completedAt ? new Date(completedAt).toLocaleString() : "Not available";
    const candidateName = respondentName?.trim();
    const patientName = candidateName && candidateName.length > 0 ? candidateName : "Anonymous";
    const scoreText = `Screening Score: ${result.totalScore}/${result.maxScore}`;
    const severityText = `Severity: ${getSeverityLabel(result.severity)}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, 40, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Patient: ${patientName}`, 40, 70);
    doc.text(`Survey Completed: ${completedAtText}`, 40, 86);
    doc.text(`PDF Generated: ${generatedAt}`, 40, 102);
    doc.text(scoreText, 40, 118);
    doc.text(severityText, 40, 134);

    const responseRowsForPdf = (responseRows.length > 0
      ? responseRows
      : []
    ).map((row) => [
      row.questionText,
      row.answerLabel,
      String(row.score),
    ]);

    autoTable(doc, {
      startY: 152,
      head: [["Survey Question", "Selected Answer", "Score"]],
      body:
        responseRowsForPdf.length > 0
          ? responseRowsForPdf
          : [["Survey responses were unavailable at export time", "-", "-"]],
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 280 },
        1: { cellWidth: 140 },
        2: { cellWidth: 50 },
      },
      headStyles: { fillColor: [15, 118, 110] },
    });

    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
        ? ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 152) + 14
        : 360,
      head: [["Overview Analysis", "Insight"]],
      body: [
        ["Emotional Pattern", detailedReport?.overall_mental_state?.pattern_summary || "Not available"],
        ["Risk Classification", detailedReport?.severity_risk?.risk_classification || "Not available"],
        ["Support Level", detailedReport?.support_recommendation?.support_level || "Not available"]
      ],
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [28, 132, 207] }
    });

    const keywordRows = (keywordInsights.length > 0 ? keywordInsights : ["No keywords available"]).map((keyword) => [
      keyword.replace(/_/g, " ").toUpperCase()
    ]);

    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
        ? ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 140) + 14
        : 220,
      head: [["Emoji Survey Keywords"]],
      body: keywordRows,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [50, 194, 184] }
    });

    const emotionRows =
      topEmotions.length > 0
        ? topEmotions.map((emotion) => [emotion.emotion, emotion.intensity, (emotion.score * 100).toFixed(1) + "%"])
        : [["Not available", "-", "-"]];

    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
        ? ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 280) + 14
        : 320,
      head: [["Top Emotional Signals", "Intensity", "Score"]],
      body: emotionRows,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [88, 100, 242] }
    });

    const actionRows = microActionsToDisplay.map((actionText) => [actionText]);
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
        ? ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 380) + 14
        : 420,
      head: [["Top 3 Micro-Actions"]],
      body: actionRows,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [44, 179, 113] }
    });

    const finalConclusionForPdf =
      detailedReport?.overall_mental_state?.pattern_summary ||
      detailedReport?.support_recommendation?.message ||
      result.emotionalPattern;

    if (finalConclusionForPdf) {
      const postActionY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 520;
      const wrappedConclusion = doc.splitTextToSize(finalConclusionForPdf, pageWidth - 80);
      doc.setFont("helvetica", "bold");
      doc.text("Final Conclusion", 40, postActionY + 24);
      doc.setFont("helvetica", "normal");
      doc.text(wrappedConclusion, 40, postActionY + 42);
    }

    const overviewNarrative =
      detailedReport?.overall_mental_state?.narrative ||
      result.emotionalPattern ||
      "Overview is currently unavailable.";
    const wrappedOverview = doc.splitTextToSize(overviewNarrative, pageWidth - 80);
    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 580;
    doc.setFont("helvetica", "bold");
    doc.text("Overview Narrative", 40, finalY + 24);
    doc.setFont("helvetica", "normal");
    doc.text(wrappedOverview, 40, finalY + 42);

    doc.save(`mental-wellness-report-${Date.now()}.pdf`);
  };
  
  // Get main recommendation based on level
  const getMainRecommendation = () => {
    if (result.recommendationLevel === 'professional') {
      return recommendations.professional;
    } else if (result.recommendationLevel === 'counselor') {
      return recommendations.counselor;
    }
    return recommendations.selfCare;
  };

  const mainRec = getMainRecommendation();

  const finalConclusion =
    detailedReport?.overall_mental_state?.pattern_summary ||
    detailedReport?.support_recommendation?.message ||
    result.emotionalPattern;

  const shortOTCRecommendations: Array<{ name: string; use: string; note: string }> = [];

  if ((result.concernsDetailed?.sleep_issues || 0) >= 0.5) {
    shortOTCRecommendations.push({
      name: 'Melatonin (low dose supplement)',
      use: 'For short-term sleep schedule support',
      note: 'Use for a few days only. Avoid if daytime drowsiness occurs.'
    });
  }

  if ((result.concernsDetailed?.anxiety || 0) >= 0.5 || (result.concernsDetailed?.overwhelm || 0) >= 0.5) {
    shortOTCRecommendations.push({
      name: 'ORS / Electrolyte solution',
      use: 'Hydration support during stress and fatigue days',
      note: 'Use as per label; not a treatment for persistent anxiety symptoms.'
    });
  }

  if ((result.concernsDetailed?.fatigue || 0) >= 0.5 || (result.concernsDetailed?.burnout || 0) >= 0.5) {
    shortOTCRecommendations.push({
      name: 'Basic multivitamin (OTC)',
      use: 'General nutritional support during low-energy periods',
      note: 'Do not exceed label dose; consult doctor if fatigue continues.'
    });
  }

  if (shortOTCRecommendations.length === 0) {
    shortOTCRecommendations.push(
      {
        name: 'Paracetamol',
        use: 'Occasional mild headache or body ache',
        note: 'Keep total daily dose within package limit; avoid duplicate combinations.'
      },
      {
        name: 'ORS / Electrolyte solution',
        use: 'Hydration support',
        note: 'Helpful on low-energy days with poor intake.'
      }
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6"
    >
      {/* Main Report Card */}
      <Card className="border-sky-200 dark:border-sky-900/40 bg-gradient-to-b from-sky-50 to-white dark:from-sky-950/20 dark:to-slate-900 lg:col-span-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="h-6 w-6 text-sky-600" />
                Your Mental Wellness Report
              </CardTitle>
              <CardDescription>
                AI-calibrated final assessment with precision metrics and actionable priorities
              </CardDescription>
            </div>
            <Button onClick={handleDownloadPdfReport} variant="outline" size="sm" className="shrink-0">
              Download PDF Report
            </Button>
          </div>
          {completedAt && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Survey completed: {new Date(completedAt).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6 max-h-[76vh] overflow-y-auto pr-1 sm:pr-2">
          {/* Score Section */}
          <div className="rounded-lg bg-white dark:bg-slate-800/50 p-4 border border-sky-100 dark:border-sky-900/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900 dark:text-white">Screening Score</h4>
              <Badge className={getSeverityColor(result.severity)}>
                {getSeverityLabel(result.severity)}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-sky-600 dark:text-sky-400 mb-1">
              {result.totalScore}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Total score: {result.totalScore}/{result.maxScore} points
            </p>
            {/* Score bar */}
            <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  result.severity === 'low_concern'
                    ? 'bg-green-500 w-1/4'
                    : result.severity === 'mild_concern'
                    ? 'bg-blue-500 w-1/2'
                    : result.severity === 'moderate_concern'
                    ? 'bg-amber-500 w-3/4'
                    : 'bg-red-500 w-full'
                }`}
              />
            </div>
          </div>

          {/* Executive Precision Summary */}
          <div className="rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 p-4 border border-slate-700">
            <h4 className="font-semibold text-white mb-3">Precision Executive Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-md bg-slate-800 p-3 border border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-400">Stability Index</p>
                <p className="text-2xl font-bold text-emerald-400">{wellnessStabilityIndex}%</p>
              </div>
              <div className="rounded-md bg-slate-800 p-3 border border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-400">Concern Load</p>
                <p className="text-2xl font-bold text-amber-400">{concernLoadIndex}%</p>
              </div>
            </div>
            <ul className="space-y-2">
              {executiveSummaryPoints.map((point, idx) => (
                <li key={`summary-${idx}`} className="text-sm text-slate-200 flex items-start gap-2">
                  <span className="text-sky-400 font-bold mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {priorityActionQueue.length > 0 && (
            <div className="rounded-lg bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 p-4 border border-rose-200 dark:border-rose-900/30">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Top Priority Action Queue</h4>
              <div className="space-y-3">
                {priorityActionQueue.map((item) => (
                  <div key={`priority-${item.rank}`} className="rounded-md bg-white/80 dark:bg-slate-800/70 p-3 border border-rose-100 dark:border-rose-900/30">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      #{item.rank} {item.concern} ({item.intensity.toFixed(1)}%)
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{item.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emoji Survey Keywords (always visible) */}
          {keywordInsights.length > 0 && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Emoji Survey Keywords We Analyzed:
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywordInsights.map((concern) => (
                  <Badge key={concern} variant="secondary">
                    {concern.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Visual Analytics */}
          {concernChartData.length > 0 && (
            <div className="rounded-lg bg-white dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Visual Analysis</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                <div className="h-72 rounded-md border border-slate-200 dark:border-slate-700 p-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Concern Intensity (Emoji Survey)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={concernChartData.length > 0 ? concernChartData : [{ concern: "No data", score: 0 }]}
                      margin={{ top: 10, right: 8, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="concern" angle={-20} textAnchor="end" interval={0} height={52} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-72 rounded-md border border-slate-200 dark:border-slate-700 p-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Mental Readiness Radar</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={wellnessRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Index" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.35} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Legacy concerns fallback */}
          {!detailedReport && result.concerns.length > 0 && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Areas We Noticed:
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.concerns.map((concern) => (
                  <Badge key={concern} variant="secondary">
                    {concern.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Detailed model-driven report */}
          {detailedReport && (
            <div className="space-y-4">
              {topEmotions.length > 0 && (
                <div className="rounded-lg bg-white dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Top Emotional Signals</h4>
                  <div className="flex flex-wrap gap-2">
                    {topEmotions.map((item, idx: number) => (
                      <Badge key={`${item.emotion}-${idx}`} variant="secondary">
                        {item.emotion} • {item.intensity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {detailedReport.overall_mental_state?.narrative && (
                <div className="rounded-lg bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 p-4 border border-sky-200 dark:border-sky-900/30">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Overall Mental State</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {compactText(detailedReport.overall_mental_state.narrative, 260)}
                  </p>
                </div>
              )}

              {Array.isArray(detailedReport.emotional_breakdown?.detected_emotions) && detailedReport.emotional_breakdown.detected_emotions.length > 0 && (
                <div className="rounded-lg bg-white dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Detected Emotional Signals</h4>
                  <div className="space-y-2">
                    {detailedReport.emotional_breakdown.detected_emotions.slice(0, 5).map((item, idx: number) => (
                      <div key={`${item.emotion}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white capitalize">{item.emotion}</p>
                          {item.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">{item.intensity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(detailedReport.behavioral_patterns?.identified_patterns) && detailedReport.behavioral_patterns.identified_patterns.length > 0 && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Behavioral Patterns</h4>
                  <div className="space-y-3">
                    {detailedReport.behavioral_patterns.identified_patterns.slice(0, 3).map((pattern, idx: number) => (
                      <div key={`${pattern.name}-${idx}`} className="text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">{pattern.name}</p>
                        <p className="text-slate-700 dark:text-slate-300">{pattern.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {precisePsychologicalInsight && (
                <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 p-4 border border-violet-200 dark:border-violet-900/30">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Psychological Insight</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {precisePsychologicalInsight}
                  </p>
                </div>
              )}

              {detailedReport.severity_risk?.reasoning && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-900/30">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Severity and Risk Explanation</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {compactText(detailedReport.severity_risk.reasoning, 220)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-900/30">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Home Remedy Suggestions</h4>
                  <ul className="space-y-2">
                    {conciseHomeRemedies.map((tip, idx) => (
                      <li key={`home-${idx}`} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-900/30">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Exercise and Breathwork Plan</h4>
                  <ul className="space-y-2">
                    {conciseExercisePlan.map((tip, idx) => (
                      <li key={`exercise-${idx}`} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {detailedReport && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-900/30">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Top 3 Micro-Actions</h4>
                  <ul className="space-y-2">
                    {microActionsToDisplay.map((actionText, idx: number) => (
                      <li key={`action-${idx}`} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">•</span>
                        <span>{actionText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {/* Support Seeking */}
          {result.supportSeeking >= 2 && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-900/30">
              <p className="text-sm text-emerald-900 dark:text-emerald-300">
                💚 Good instinct! You're recognizing that support could help. That's a strength.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Conclusion Section */}
      <Card className="border-sky-200 dark:border-sky-900/40 lg:col-span-4 lg:self-start lg:sticky lg:top-4">
        <CardHeader>
          <CardTitle className="text-lg">Final Conclusion</CardTitle>
          <CardDescription>
            Short, precise outcome with practical non-prescription guidance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Your Mental Wellness Report</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {finalConclusion}
            </p>
          </div>

          <div className="rounded-md bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">Short next steps</p>
            <ul className="space-y-2">
              {microActionsToDisplay.slice(0, 2).map((action, idx) => (
                <li key={`short-action-${idx}`} className="text-sm flex items-start gap-2">
                  <span className="text-sky-600 dark:text-sky-400 font-bold mt-0.5">•</span>
                  <span className="text-slate-700 dark:text-slate-300">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-3 border border-emerald-200 dark:border-emerald-900/30">
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
              Normal Non-Prescription Options (short)
            </p>
            <ul className="space-y-2">
              {shortOTCRecommendations.slice(0, 3).map((med, idx) => (
                <li key={`otc-${idx}`} className="text-sm">
                  <p className="font-medium text-slate-900 dark:text-white">{med.name}</p>
                  <p className="text-slate-700 dark:text-slate-300">Use: {med.use}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Note: {med.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

    </motion.div>
  );
};
