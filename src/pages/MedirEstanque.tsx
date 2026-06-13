import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, Rectangle, Circle, Polygon as LeafPolygon, useMap } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import { calcVolumenRectangular, calcVolumenCircular, calcVolumenTrapezoidal, calcVolumenTanqueCilindrico, calcVolumenTriangular, calcAreaPoligono, type FormaEstanque } from "@/core";
import { useTranslation } from "@/store/language";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const EARTH_RADIUS = 6378137;

function latLngToMeters(lat: number, lng: number) {
  const x = lng * (Math.PI / 180) * EARTH_RADIUS;
  const y = Math.log(Math.tan(Math.PI / 4 + lat * (Math.PI / 180) / 2)) * EARTH_RADIUS;
  return { x, y };
}

function distanceMeters(p1: [number, number], p2: [number, number]): number {
  const a = latLngToMeters(p1[0], p1[1]);
  const b = latLngToMeters(p2[0], p2[1]);
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const FORMAS_MANUAL: FormaEstanque[] = ["rectangular", "circular", "trapezoidal", "tanque", "triangular"];
const FORMAS_GEO: FormaEstanque[] = ["rectangular", "circular", "trapezoidal", "tanque", "triangular", "poligono"];

const FORMA_ICONO: Record<string, string> = {
  rectangular: "▭", circular: "⭕", trapezoidal: "⬠", tanque: "🛢️", triangular: "🔺", poligono: "⬡", manual: "📝",
};

function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] | null }) {
  const map = useMap();
  useEffect(() => { if (bounds) map.fitBounds(bounds, { padding: [50, 50] }); }, [bounds, map]);
  return null;
}

export default function MedirEstanque() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"manual" | "geo">("manual");
  const [forma, setForma] = useState<FormaEstanque>("rectangular");
  const [profundidad, setProfundidad] = useState("");

  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");
  const [diametro, setDiametro] = useState("");
  const [altura, setAltura] = useState("");
  const [largoSup, setLargoSup] = useState("");
  const [anchoSup, setAnchoSup] = useState("");
  const [largoInf, setLargoInf] = useState("");
  const [anchoInf, setAnchoInf] = useState("");
  const [base, setBase] = useState("");
  const [alturaTri, setAlturaTri] = useState("");

  const [geoPuntos, setGeoPuntos] = useState<[number, number][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [geoDone, setGeoDone] = useState(false);

  const geoBounds = geoPuntos.length >= 2 && (forma === "rectangular" || forma === "trapezoidal")
    ? [geoPuntos[0], geoPuntos[geoPuntos.length - 1]] as [[number, number], [number, number]]
    : null;

  const manualVol = (() => {
    const p = parseFloat(profundidad) || 0;
    if (mode === "manual") {
      switch (forma) {
        case "rectangular": return calcVolumenRectangular(parseFloat(largo) || 0, parseFloat(ancho) || 0, p);
        case "circular": return calcVolumenCircular(parseFloat(diametro) || 0, p);
        case "trapezoidal": return calcVolumenTrapezoidal(parseFloat(largoSup) || 0, parseFloat(anchoSup) || 0, parseFloat(largoInf) || 0, parseFloat(anchoInf) || 0, p);
        case "tanque": return calcVolumenTanqueCilindrico(parseFloat(diametro) || 0, parseFloat(altura) || 0);
        case "triangular": return calcVolumenTriangular(parseFloat(base) || 0, parseFloat(alturaTri) || 0, p);
      }
    }
    return null;
  })();

  const geoVol = (() => {
    if (mode !== "geo" || !geoDone || !drawing === false) return null;
    const p = parseFloat(profundidad) || 0;
    switch (forma) {
      case "rectangular":
      case "trapezoidal": {
        if (geoPuntos.length < 2) return null;
        const sw = latLngToMeters(geoPuntos[0][0], geoPuntos[0][1]);
        const ne = latLngToMeters(geoPuntos[1][0], geoPuntos[1][1]);
        const lM = Math.abs(ne.y - sw.y);
        const aM = Math.abs(ne.x - sw.x);
        if (forma === "trapezoidal") {
          const li = parseFloat(largoInf) || 0;
          const ai = parseFloat(anchoInf) || 0;
          return calcVolumenTrapezoidal(lM, aM, li, ai, p);
        }
        return calcVolumenRectangular(lM, aM, p);
      }
      case "circular":
      case "tanque": {
        if (geoPuntos.length < 2) return null;
        const r = distanceMeters(geoPuntos[0], geoPuntos[1]);
        const d = r * 2;
        if (forma === "tanque") return calcVolumenTanqueCilindrico(d, parseFloat(altura) || 0);
        return calcVolumenCircular(d, p);
      }
      case "triangular": {
        if (geoPuntos.length < 3) return null;
        const pts = geoPuntos.map((p) => { const m = latLngToMeters(p[0], p[1]); return { x: m.x, y: m.y }; });
        const area = calcAreaPoligono(pts);
        const vol = area * p;
        return { volumenM3: vol, litros: vol * 1000 };
      }
      case "poligono": {
        if (geoPuntos.length < 3) return null;
        const pts = geoPuntos.map((p) => { const m = latLngToMeters(p[0], p[1]); return { x: m.x, y: m.y }; });
        const area = calcAreaPoligono(pts);
        const vol = area * p;
        return { volumenM3: vol, litros: vol * 1000 };
      }
    }
    return null;
  })();

  const vol = mode === "manual" ? manualVol : geoVol;

  const geoArea = (() => {
    if (mode !== "geo" || geoPuntos.length < 2) return 0;
    if (forma === "rectangular" || forma === "trapezoidal") {
      const sw = latLngToMeters(geoPuntos[0][0], geoPuntos[0][1]);
      const ne = latLngToMeters(geoPuntos[1][0], geoPuntos[1][1]);
      return Math.abs(ne.x - sw.x) * Math.abs(ne.y - sw.y);
    }
    if (forma === "circular" || forma === "tanque") {
      const r = distanceMeters(geoPuntos[0], geoPuntos[1]);
      return Math.PI * r * r;
    }
    if (geoPuntos.length >= 3) {
      const pts = geoPuntos.map((p) => { const m = latLngToMeters(p[0], p[1]); return { x: m.x, y: m.y }; });
      return calcAreaPoligono(pts);
    }
    return 0;
  })();

  const handleMapClick = useCallback((e: LeafletMouseEvent) => {
    if (!drawing || geoDone) return;
    if (forma === "rectangular" || forma === "trapezoidal") {
      if (geoPuntos.length === 0) { setGeoPuntos([[e.latlng.lat, e.latlng.lng]]); }
      else if (geoPuntos.length === 1) { setGeoPuntos((p) => [...p, [e.latlng.lat, e.latlng.lng]]); setDrawing(false); setGeoDone(true); }
    } else if (forma === "circular" || forma === "tanque") {
      if (geoPuntos.length === 0) { setGeoPuntos([[e.latlng.lat, e.latlng.lng]]); }
      else if (geoPuntos.length === 1) { setGeoPuntos((p) => [...p, [e.latlng.lat, e.latlng.lng]]); setDrawing(false); setGeoDone(true); }
    } else if (forma === "triangular") {
      if (geoPuntos.length < 3) { setGeoPuntos((p) => [...p, [e.latlng.lat, e.latlng.lng]]); }
      if (geoPuntos.length === 2) { setDrawing(false); setGeoDone(true); }
    } else if (forma === "poligono") {
      setGeoPuntos((p) => [...p, [e.latlng.lat, e.latlng.lng]]);
    }
  }, [drawing, geoDone, forma, geoPuntos.length]);

  const closePoligono = () => { setGeoDone(true); setDrawing(false); };

  const startDrawing = () => {
    setGeoPuntos([]);
    setGeoDone(false);
    setDrawing(true);
    setProfundidad("");
    setLargoInf("");
    setAnchoInf("");
    setAltura("");
  };

  const limpiar = () => {
    setGeoPuntos([]);
    setGeoDone(false);
    setDrawing(false);
    setProfundidad("");
  };

  const usarEnCalc = () => {
    if (!vol || vol.volumenM3 <= 0) return;
    const baseDims: Record<string, number> = {};
    if (mode === "manual") {
      switch (forma) {
        case "rectangular": baseDims.largo = parseFloat(largo); baseDims.ancho = parseFloat(ancho); baseDims.profundidad = parseFloat(profundidad); break;
        case "circular": baseDims.diametro = parseFloat(diametro); baseDims.profundidad = parseFloat(profundidad); break;
        case "trapezoidal": baseDims.largoSup = parseFloat(largoSup); baseDims.anchoSup = parseFloat(anchoSup); baseDims.largoInf = parseFloat(largoInf); baseDims.anchoInf = parseFloat(anchoInf); baseDims.profundidad = parseFloat(profundidad); break;
        case "tanque": baseDims.diametro = parseFloat(diametro); baseDims.altura = parseFloat(altura); break;
        case "triangular": baseDims.base = parseFloat(base); baseDims.alturaTri = parseFloat(alturaTri); baseDims.profundidad = parseFloat(profundidad); break;
      }
    } else {
      const p = parseFloat(profundidad) || 0;
      if (forma === "rectangular" || forma === "trapezoidal") {
        const sw = latLngToMeters(geoPuntos[0][0], geoPuntos[0][1]);
        const ne = latLngToMeters(geoPuntos[1][0], geoPuntos[1][1]);
        baseDims.largo = Math.abs(ne.y - sw.y);
        baseDims.ancho = Math.abs(ne.x - sw.x);
        baseDims.profundidad = p;
        if (forma === "trapezoidal") { baseDims.largoInf = parseFloat(largoInf) || 0; baseDims.anchoInf = parseFloat(anchoInf) || 0; }
      } else if (forma === "circular") {
        baseDims.diametro = distanceMeters(geoPuntos[0], geoPuntos[1]) * 2;
        baseDims.profundidad = p;
      } else if (forma === "tanque") {
        baseDims.diametro = distanceMeters(geoPuntos[0], geoPuntos[1]) * 2;
        baseDims.altura = parseFloat(altura) || 0;
      } else {
        baseDims.profundidad = p;
      }
    }
    localStorage.setItem("acuical_geo_dimensions", JSON.stringify({ forma, ...baseDims, volumenM3: vol.volumenM3, litros: vol.litros }));
    navigate("/calc");
  };

  const changeForma = (f: FormaEstanque) => {
    setForma(f);
    limpiar();
  };

  const cambiarModo = (m: "manual" | "geo") => {
    setMode(m);
    limpiar();
    if (m === "geo" && forma === "manual") setForma("rectangular");
    if (m === "manual" && (forma === "poligono")) setForma("rectangular");
  };

  const geoStatusText = !drawing && !geoDone ? t("geoInstrucciones") : drawing && !geoDone
    ? (forma === "poligono" ? `Click para agregar puntos (${geoPuntos.length})` : `Click en el mapa (punto ${geoPuntos.length + 1} de ${forma === "rectangular" || forma === "trapezoidal" || forma === "circular" || forma === "tanque" ? 2 : 3})`)
    : geoDone ? "Medición lista" : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="page-header"><div><h2 className="page-title">🗺️ {t("medirEstanque")}</h2><p className="page-subtitle">{t("geoSub")}</p></div></div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className={mode === "manual" ? "btn-primary" : "btn-secondary"} onClick={() => cambiarModo("manual")} style={{ fontSize: 12, padding: "6px 14px" }}>📝 {t("modoManual")}</button>
        <button className={mode === "geo" ? "btn-primary" : "btn-secondary"} onClick={() => cambiarModo("geo")} style={{ fontSize: 12, padding: "6px 14px" }}>🗺️ {t("modoGeo")}</button>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 12, minHeight: 0, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {(mode === "manual" ? FORMAS_MANUAL : FORMAS_GEO).map((f) => (
              <button key={f} className={forma === f ? "btn-primary" : "btn-secondary"}
                onClick={() => changeForma(f)} style={{ fontSize: 11, padding: "4px 10px" }}>
                {FORMA_ICONO[f]} {f === "rectangular" ? t("formaRectangular") : f === "circular" ? t("formaCircular") : f === "trapezoidal" ? t("formaTrapezoidal") : f === "tanque" ? t("formaTanque") : f === "triangular" ? t("formaTriangular") : t("formaPoligono")}
              </button>
            ))}
          </div>

          {mode === "manual" ? (
            <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {forma === "rectangular" && (<><label style={{ fontSize: 12 }}>Largo (m)<input value={largo} onChange={(e) => setLargo(e.target.value)} type="number" placeholder="0" /></label><label style={{ fontSize: 12 }}>Ancho (m)<input value={ancho} onChange={(e) => setAncho(e.target.value)} type="number" placeholder="0" /></label></>)}
              {forma === "circular" && (<><label style={{ fontSize: 12 }}>Diámetro (m)<input value={diametro} onChange={(e) => setDiametro(e.target.value)} type="number" placeholder="0" /></label></>)}
              {forma === "trapezoidal" && (<><label style={{ fontSize: 12 }}>Largo superior (m)<input value={largoSup} onChange={(e) => setLargoSup(e.target.value)} type="number" placeholder="0" /></label><label style={{ fontSize: 12 }}>Ancho superior (m)<input value={anchoSup} onChange={(e) => setAnchoSup(e.target.value)} type="number" placeholder="0" /></label><label style={{ fontSize: 12 }}>Largo inferior (m)<input value={largoInf} onChange={(e) => setLargoInf(e.target.value)} type="number" placeholder="0" /></label><label style={{ fontSize: 12 }}>Ancho inferior (m)<input value={anchoInf} onChange={(e) => setAnchoInf(e.target.value)} type="number" placeholder="0" /></label></>)}
              {forma === "tanque" && (<><label style={{ fontSize: 12 }}>Diámetro (m)<input value={diametro} onChange={(e) => setDiametro(e.target.value)} type="number" placeholder="0" /></label><label style={{ fontSize: 12 }}>Altura (m)<input value={altura} onChange={(e) => setAltura(e.target.value)} type="number" placeholder="0" /></label></>)}
              {forma === "triangular" && (<><label style={{ fontSize: 12 }}>{t("formaBase")} (m)<input value={base} onChange={(e) => setBase(e.target.value)} type="number" placeholder="0" /></label><label style={{ fontSize: 12 }}>{t("formaAltura")} (m)<input value={alturaTri} onChange={(e) => setAlturaTri(e.target.value)} type="number" placeholder="0" /></label></>)}
              {(forma !== "tanque") && (<label style={{ fontSize: 12 }}>Profundidad (m)<input value={profundidad} onChange={(e) => setProfundidad(e.target.value)} type="number" placeholder="0" /></label>)}
            </div>
          ) : (
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", cursor: drawing ? "crosshair" : "" }}>
              <MapContainer center={[9.9, -84.3]} zoom={15} style={{ height: 400, width: "100%" }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapEvents onClick={handleMapClick} />
                <FitBounds bounds={geoBounds} />
                {geoBounds && <Rectangle bounds={geoBounds} pathOptions={{ color: "var(--accent)", weight: 2 }} />}
                {(forma === "circular" || forma === "tanque") && geoPuntos.length === 2 && (
                  <Circle center={geoPuntos[0]} radius={distanceMeters(geoPuntos[0], geoPuntos[1])} pathOptions={{ color: "var(--accent)", weight: 2 }} />
                )}
                {forma === "triangular" && geoPuntos.length === 3 && (
                  <LeafPolygon positions={geoPuntos} pathOptions={{ color: "var(--accent)", weight: 2 }} />
                )}
                {forma === "poligono" && geoPuntos.length >= 3 && (
                  <LeafPolygon positions={geoPuntos} pathOptions={{ color: "var(--accent)", weight: 2 }} />
                )}
              </MapContainer>
              <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, display: "flex", gap: 6 }}>
                <button className={drawing ? "btn-primary" : "btn-secondary"} onClick={startDrawing} style={{ fontSize: 12, padding: "6px 12px" }}>{drawing ? "✕ Cancelar" : "▭ Medir"}</button>
                {geoPuntos.length > 0 && <button className="btn-secondary" onClick={limpiar} style={{ fontSize: 12, padding: "6px 12px" }}>Limpiar</button>}
                {forma === "poligono" && geoPuntos.length >= 3 && drawing && <button className="btn-primary" onClick={closePoligono} style={{ fontSize: 12, padding: "6px 12px" }}>✅ Cerrar</button>}
              </div>
              <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 1000, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 12 }}>{geoStatusText}</div>
              {mode === "geo" && (forma === "trapezoidal" || forma === "tanque") && (
                <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 1000, background: "var(--card)", padding: 10, borderRadius: 8, display: "flex", flexDirection: "column", gap: 6, width: 160 }}>
                  {forma === "trapezoidal" && (<><label style={{ fontSize: 11 }}>Largo inf. (m)<input value={largoInf} onChange={(e) => setLargoInf(e.target.value)} type="number" placeholder="0" style={{ fontSize: 11, padding: "2px 6px" }} /></label><label style={{ fontSize: 11 }}>Ancho inf. (m)<input value={anchoInf} onChange={(e) => setAnchoInf(e.target.value)} type="number" placeholder="0" style={{ fontSize: 11, padding: "2px 6px" }} /></label></>)}
                  {forma === "tanque" && (<label style={{ fontSize: 11 }}>Altura (m)<input value={altura} onChange={(e) => setAltura(e.target.value)} type="number" placeholder="0" style={{ fontSize: 11, padding: "2px 6px" }} /></label>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ width: "min(280px, 100%)", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("geoResultados")}</h3>

          {mode === "geo" && geoPuntos.length > 0 && (
            <div className="log-field"><div className="log-field-label">{t("geoArea")}</div><div className="log-field-value" style={{ fontWeight: 700 }}>{geoArea.toFixed(1)} m²</div></div>
          )}

          {(mode === "manual" || (mode === "geo" && geoDone)) && (
            <>
              {mode === "manual" && (forma !== "tanque") && (
                <label style={{ fontSize: 12 }}>Profundidad (m)<input value={profundidad} onChange={(e) => setProfundidad(e.target.value)} type="number" placeholder="0" /></label>
              )}
              {vol && vol.volumenM3 > 0 && (
                <div style={{ background: "rgba(0,200,150,0.08)", padding: "10px 12px", borderRadius: 8 }}>
                  <div className="log-field"><div className="log-field-label">{t("volumenCalculado") || "Volumen"}</div><div className="log-field-value" style={{ fontWeight: 700, fontSize: 16 }}>{vol.volumenM3.toFixed(1)} m³</div></div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{vol.litros.toLocaleString()} {t("litros") || "L"}</div>
                </div>
              )}
              <button className="btn-primary" style={{ marginTop: "auto" }} onClick={usarEnCalc} disabled={!vol || vol.volumenM3 <= 0}>{t("geoUsarCalc")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MapEvents({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({ click: onClick });
  return null;
}
