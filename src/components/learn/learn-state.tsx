"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";
import { levelFrom, type Level, type QuestionId } from "@/lib/learn/questions";

export interface LabValues {
  readonly mass1: number;
  readonly mass2: number;
  readonly distance: number;
}

export const LAB_LIMITS = {
  mass: { min: 1, max: 10, step: 1 },
  distance: { min: 1, max: 10, step: 0.5 },
} as const;

export const LAB_START: LabValues = { mass1: 4, mass2: 4, distance: 4 };

// Launch speed as a multiple of the circular one; the slider covers fall, orbit and escape.
export const LAUNCH_LIMITS = { min: 0.2, max: 1.6, step: 0.05 } as const;

const clamp = (value: number, { min, max }: { readonly min: number; readonly max: number }) =>
  Math.min(max, Math.max(min, value));

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
 * questions. Kept above the widgets so that something else (the tutor) can read and set
 * it too. Values from outside are clamped to the same limits as the sliders.
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
      setLab: (change) =>
        setLabValues(({ values }) => ({
          values: {
            mass1: clamp(change.mass1 ?? values.mass1, LAB_LIMITS.mass),
            mass2: clamp(change.mass2 ?? values.mass2, LAB_LIMITS.mass),
            distance: clamp(change.distance ?? values.distance, LAB_LIMITS.distance),
          },
          before: values,
        })),
      launchSpeed,
      setLaunchSpeed: (speed) => setLaunchSpeedValue(clamp(speed, LAUNCH_LIMITS)),
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
