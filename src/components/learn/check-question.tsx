"use client";

import { useId, useState } from "react";
import { QUESTIONS, type QuestionId } from "@/lib/learn/questions";
import { useLearn } from "./learn-state";

export function CheckQuestion({ id }: { readonly id: QuestionId }) {
  const question = QUESTIONS[id];
  const { recordAnswer } = useLearn();
  const groupName = useId();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState<number | null>(null);
  const right = checked === question.answer;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (choice === null) return;
        setChecked(choice);
        recordAnswer(id, choice === question.answer);
      }}
      className="rounded-2xl border border-line bg-panel/70 p-4 sm:p-5"
    >
      <fieldset>
        <legend className="font-medium">
          <span className="text-sm text-accent">Comprueba lo aprendido</span>
          <span className="mt-1 block">{question.prompt}</span>
        </legend>
        <div className="mt-3 space-y-2">
          {question.options.map((option, index) => (
            <label key={option} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-night/60">
              <input
                type="radio"
                name={groupName}
                value={index}
                checked={choice === index}
                onChange={() => setChoice(index)}
                className="mt-1 size-4 accent-accent"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={choice === null}
        className="mt-4 rounded-lg bg-accent px-4 py-2 font-medium text-night disabled:opacity-50"
      >
        Comprobar
      </button>
      <p role="status" className="mt-3 leading-relaxed">
        {checked !== null && (
          <>
            <strong className={right ? "text-accent" : "text-ink"}>{right ? "¡Correcto!" : "No es eso."}</strong>{" "}
            {right ? question.explanation : `La respuesta es: ${question.options[question.answer].toLowerCase()}. ${question.explanation}`}
          </>
        )}
      </p>
    </form>
  );
}
