import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, Sparkles } from "lucide-react";
import {
  RESPONSE_OPTIONS,
  ScreeningKind,
  getQuestionsByKind,
  getScreeningResult,
  getScreeningTitle,
} from "@/lib/mentalHealth";

interface MentalHealthScreeningSectionProps {
  onOpenJournal: () => void;
  onOpenAISupport: () => void;
  onOpenCounselor: () => void;
  onOpenBreathing: () => void;
}

export const MentalHealthScreeningSection = ({
  onOpenJournal,
  onOpenAISupport,
  onOpenCounselor,
  onOpenBreathing,
}: MentalHealthScreeningSectionProps) => {
  const [kind, setKind] = useState<ScreeningKind>("phq9");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);

  const questions = useMemo(() => getQuestionsByKind(kind), [kind]);
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const score = useMemo(() => answers.reduce((sum, value) => sum + value, 0), [answers]);
  const result = useMemo(() => getScreeningResult(kind, score), [kind, score]);

  const resetFlow = (nextKind: ScreeningKind = kind) => {
    setKind(nextKind);
    setCurrentIndex(0);
    setAnswers([]);
    setCompleted(false);
  };

  const handleAnswer = (value: number) => {
    const nextAnswers = [...answers, value];
    setAnswers(nextAnswers);

    if (currentIndex >= questions.length - 1) {
      setCompleted(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Card className="border-teal-200 dark:border-teal-900/40 bg-gradient-to-r from-teal-50 via-white to-sky-50 dark:from-teal-950/30 dark:via-slate-900 dark:to-sky-950/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Brain className="h-6 w-6 text-teal-600" />
                Mental Health Screening
              </CardTitle>
              <CardDescription className="mt-2 text-slate-700 dark:text-slate-300">
                A supportive self-check for mood, anxiety, and stress. One question at a time.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white/80 dark:bg-slate-800">Private • Local session</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Supportive screening only</AlertTitle>
            <AlertDescription>
              This tool is for self-reflection and support. It is not a medical diagnosis.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={kind === "phq9" ? "default" : "outline"}
              onClick={() => resetFlow("phq9")}
            >
              PHQ-9
            </Button>
            <Button
              variant={kind === "gad7" ? "default" : "outline"}
              onClick={() => resetFlow("gad7")}
            >
              GAD-7
            </Button>
            <Button
              variant={kind === "pss4" ? "default" : "outline"}
              onClick={() => resetFlow("pss4")}
            >
              PSS-4 (Optional)
            </Button>
          </div>
        </CardContent>
      </Card>

      {!completed ? (
        <Card>
          <CardHeader>
            <CardTitle>{getScreeningTitle(kind)}</CardTitle>
            <CardDescription>
              Question {currentIndex + 1} of {questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400">Progress: {Math.round(progress)}%</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/30">
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{questions[currentIndex].text}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RESPONSE_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  className="h-auto py-3 justify-start text-left"
                  onClick={() => handleAnswer(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-teal-300 dark:border-teal-900/40">
          <CardHeader>
            <CardTitle className="text-2xl">Your Screening Result</CardTitle>
            <CardDescription>{getScreeningTitle(kind)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 p-4 border border-teal-200 dark:border-teal-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Score</p>
              <p className="text-4xl font-bold text-teal-700 dark:text-teal-300">{score}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{result.severity}</p>
              <p className="text-slate-700 dark:text-slate-300">{result.description}</p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-3">Recommended next steps</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={onOpenJournal} variant="outline">Write a journal entry</Button>
                <Button onClick={onOpenBreathing} variant="outline">Start breathing exercise</Button>
                <Button onClick={onOpenAISupport} variant="outline">Talk to AI support</Button>
                <Button onClick={onOpenCounselor} variant="outline">Book counselor support</Button>
                <Button onClick={() => resetFlow()} variant="secondary">Retake screening</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
