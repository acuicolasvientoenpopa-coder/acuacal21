import { REFERENCE_FORMULAS } from "@/core";
import { useTranslation } from "@/store/language";

export default function Formulas() {
  const { t } = useTranslation();
  const tt = (key: string, fallback: string) => {
    const translated = t(key as any);
    return translated !== key ? translated : fallback;
  };
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("formulasTitle")}</h2>
          <p className="page-subtitle">{t("formulasSub")}</p>
        </div>
      </div>
      <div className="species-list" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {REFERENCE_FORMULAS.map((f, i) => (
          <div key={i} className="card">
            <div className="card-title">{tt("formulaTitle_" + f.id, f.title)}</div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: "var(--accent)", marginBottom: 8 }}>
              {f.formula}
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{tt("formulaDesc_" + f.id, f.description)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
