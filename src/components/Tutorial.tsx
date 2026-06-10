import { useState, useEffect } from "react";
import { useTranslation } from "@/store/language";
import { NAV_LINKS } from "@/data/navLinks";

const STORAGE_KEY = "aquacalc_tutorial_done";

export function isTutorialDone(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function markTutorialDone() {
  localStorage.setItem(STORAGE_KEY, "true");
}

export function resetTutorial() {
  localStorage.removeItem(STORAGE_KEY);
}

interface Step {
  icon: string;
  title: string;
  desc: string;
}

function buildSteps(t: (k: string) => string): Step[] {
  const intro: Step = { icon: "👋", title: t("tutorialWelcome"), desc: t("tutorialWelcomeDesc") };
  const pageSteps: Step[] = NAV_LINKS.map((l) => ({
    icon: l.emoji,
    title: t(l.key),
    desc: t(l.tutorialDesc),
  }));
  const outro: Step = { icon: "✅", title: t("tutorialDone"), desc: t("tutorialDoneDesc") };
  return [intro, ...pageSteps, outro];
}

interface Props {
  lang: string;
  onClose?: () => void;
}

export default function Tutorial({ lang: _lang, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isTutorialDone()) setOpen(true);
  }, []);

  const steps = buildSteps((k: string) => t(k as any));
  const current = steps[step] ?? steps[0];

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => { if (step > 0) setStep(step - 1); };
  const close = () => { setOpen(false); markTutorialDone(); onClose?.(); };

  if (!open) return null;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <button className="tutorial-skip" onClick={close}>✕ {t("skip")}</button>
        <div className="tutorial-icon">{current.icon}</div>
        <h3 className="tutorial-title">{current.title}</h3>
        <p className="tutorial-desc">{current.desc}</p>
        <div className="tutorial-dots">
          {steps.map((_, i) => (
            <span key={i} className={`tutorial-dot${i === step ? " active" : ""}`} />
          ))}
        </div>
        <div className="tutorial-actions">
          {step > 0 && <button className="btn" onClick={prev}>{t("back")}</button>}
          <button className="btn-primary" onClick={next}>
            {step < steps.length - 1 ? t("next") : t("finish")}
          </button>
        </div>
      </div>
    </div>
  );
}