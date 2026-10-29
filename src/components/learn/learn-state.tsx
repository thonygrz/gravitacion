"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";
import { fit, fitLab, LAB_START, LAUNCH_LIMITS, type LabValues } from "@/lib/learn/lab";
import { levelFrom, type Level, type QuestionId } from "@/lib/learn/questions";

interface LearnState {
  readonly lab: LabValues;
  /** The values before the last change, to say how that change moved the force. */
  readonly previousLab: LabValues | null;
  readonly setLab: (change: Partial<LabValues>) => void;
  readonly launchSpeed: number;
  readonly setLaunchSpeed: (speed: number) => void;
  readonly firstAnswers: Readonly<Partial<Record<QuestionId, boolean>>>;
  readonly recordAnswer: (question: QuestionId, right: boolean) => void;
  readonly level: Level;
}

const LearnContext = createContext<LearnState | null>(null);

/**
 * State shared by the lessons: the force lab, the launcher and the answers to the check
 * questions. Kept above the widgets so that the tutor can read and set it too. Every value
 * is fitted to the limits and steps of its slider.
 */
export function LearnProvider({ children }: { readonly children: ReactNode }) {
  const [lab, setLabValues] = useState<{ values: LabValues; before: LabValues | null }>({
    values: LAB_START,
    before: null,
  });
  const [launchSpeed, setLaunchSpeedValue] = useState(1);
  const [firstAnswers, setFirstAnswers] = useState<Partial<Record<QuestionId, boolean>>>({});

  const state = useMemo<LearnState>(
    () => ({
      lab: lab.values,
      previousLab: lab.before,
      setLab: (change) => setLabValues(({ values }) => ({ values: fitLab(values, change), before: values })),
      launchSpeed,
      setLaunchSpeed: (speed) => setLaunchSpeedValue(fit(speed, LAUNCH_LIMITS)),
      firstAnswers,
      // Only the first answer to each question counts towards the level.
      recordAnswer: (question, right) =>
        setFirstAnswers((answers) => (question in answers ? answers : { ...answers, [question]: right })),
      level: levelFrom(firstAnswers),
    }),
    [lab, launchSpeed, firstAnswers],
  );

  return <LearnContext value={state}>{children}</LearnContext>;
}

export function useLearn(): LearnState {
  const state = use(LearnContext);
  if (!state) throw new Error("useLearn needs a LearnProvider above it");
  return state;
}
