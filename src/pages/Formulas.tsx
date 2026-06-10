import { useTranslation } from "@/store/language";
import { REF_SECTIONS } from "@/data/referencias";

export default function Formulas() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("formulasTitle")}</h2>
          <p className="page-subtitle">{t("formulasSub")}</p>
        </div>
      </div>
      {REF_SECTIONS.map((sec) => (
        <div key={sec.id} style={{ marginBottom: 32 }}>
          <h3 className="card-subtitle" style={{ marginBottom: 12, fontSize: 16 }}>
            {sec.emoji} {sec.title}
          </h3>
          <div className="species-list" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {sec.items.map((item, i) => (
              <div key={i} className="card">
                <div className="card-title">{item.titulo}</div>
                <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginBottom: 10 }}>
                  {item.cuerpo}
                </p>
                <p style={{ fontSize: 10, color: "var(--text3)", fontStyle: "italic", borderTop: "1px solid var(--border)", paddingTop: 8, opacity: 0.75 }}>
                  📖 {item.fuente}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}