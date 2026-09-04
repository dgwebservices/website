"use client";

import Link from "next/link";
import { useState } from "react";
import { primaryGoalLabels, projectTypeLabels } from "@/lib/contact-schema";

const typeOptions = ["website", "webapplicatie", "portaal", "koppeling", "nog-niet-zeker"] as const;
const goalOptions = ["meer-aanvragen", "minder-handwerk", "meer-overzicht", "nieuwe-dienst", "anders"] as const;

export function ProjectStarter() {
  const [project, setProject] = useState<(typeof typeOptions)[number]>("nog-niet-zeker");
  const [goal, setGoal] = useState<(typeof goalOptions)[number]>("anders");
  const href = `/contact?project=${encodeURIComponent(project)}&goal=${encodeURIComponent(goal)}`;
  return (
    <div className="starter-grid">
      <fieldset><legend>Waar denk je aan?</legend><div className="choice-row">{typeOptions.map((option) => <button type="button" key={option} aria-pressed={project === option} onClick={() => setProject(option)}>{projectTypeLabels[option]}</button>)}</div></fieldset>
      <fieldset><legend>Wat wil je vooral bereiken?</legend><div className="choice-row">{goalOptions.map((option) => <button type="button" key={option} aria-pressed={goal === option} onClick={() => setGoal(option)}>{primaryGoalLabels[option]}</button>)}</div></fieldset>
      <Link className="button button-light" href={href}>Vertel wat je wilt verbeteren <span aria-hidden="true">→</span></Link>
    </div>
  );
}
