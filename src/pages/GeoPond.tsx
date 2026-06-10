import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, Rectangle, useMap } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import { calcVolumenRectangular } from "@/core";
import { useTranslation } from "@/store/language";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const EARTH_RADIUS = 6378137;

function latLngToMeters(lat: number, lng: number) {
  const x = lng * (Math.PI / 180) * EARTH_RADIUS;
  const y = Math.log(Math.tan(Math.PI / 4 + lat * (Math.PI / 180) / 2)) * EARTH_RADIUS;
  return { x, y };
}

function calcAreaFromCoords(bounds: [[number, number], [number, number]]): number {
  const [[swLat, swLng], [neLat, neLng]] = bounds;
  const sw = latLngToMeters(swLat, swLng);
  const ne = latLngToMeters(neLat, neLng);
  const anchoM = Math.abs(ne.x - sw.x);
  const largoM = Math.abs(ne.y - sw.y);
  return anchoM * largoM;
}

function DrawControl({ onDrawn }: { onDrawn: (bounds: [[number, number], [number, number]]) => void }) {
  const [drawing, setDrawing] = useState(false);
  const [corner1, setCorner1] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (!drawing) return;
      if (!corner1) {
        setCorner1([e.latlng.lat, e.latlng.lng]);
      } else {
        const bounds: [[number, number], [number, number]] = [corner1, [e.latlng.lat, e.latlng.lng]];
        onDrawn(bounds);
        setCorner1(null);
        setDrawing(false);
      }
    },
  });

  return (
    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, display: "flex", gap: 6 }}>
      <button
        className={drawing ? "btn-primary" : "btn-secondary"}
        onClick={() => { setDrawing(!drawing); setCorner1(null); }}
        style={{ fontSize: 12, padding: "6px 12px" }}
      >
        {drawing ? "✕ Cancelar" : "▭ Medir estanque"}
      </button>
    </div>
  );
}

function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function GeoPond() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bounds, setBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [profundidad, setProfundidad] = useState("");

  const areaM2 = bounds ? calcAreaFromCoords(bounds) : 0;
  const prof = parseFloat(profundidad) || 0;
  const vol = prof > 0 && areaM2 > 0 ? calcVolumenRectangular(Math.sqrt(areaM2), Math.sqrt(areaM2), prof) : null;

  const handleDrawn = useCallback((b: [[number, number], [number, number]]) => {
    setBounds(b);
  }, []);

  const usarEnCalc = () => {
    if (vol && vol.volumenM3 > 0) {
      const dims = {
        forma: "rectangular" as const,
        largo: Math.sqrt(areaM2),
        ancho: Math.sqrt(areaM2),
        profundidad: prof,
        volumenM3: vol.volumenM3,
        litros: vol.litros,
      };
      localStorage.setItem("aquacalc_geo_dimensions", JSON.stringify(dims));
      navigate("/calc");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">🗺️ {t("geoTitle") || "Medición georreferenciada"}</h2>
          <p className="page-subtitle">{t("geoSub") || "Dibujá un rectángulo sobre el mapa para medir el estanque"}</p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 12, minHeight: 0 }}>
        <div style={{ flex: 1, position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
          <MapContainer center={[9.9, -84.3]} zoom={15} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DrawControl onDrawn={handleDrawn} />
            <FitBounds bounds={bounds} />
            {bounds && <Rectangle bounds={bounds} pathOptions={{ color: "var(--accent)", weight: 2 }} />}
          </MapContainer>
        </div>

        <div className="card" style={{ width: 280, display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>📐 {t("geoResultados") || "Resultados"}</h3>

          {!bounds ? (
            <p style={{ fontSize: 12, color: "var(--text3)" }}>{t("geoInstrucciones" as any) || "Hacé clic en 'Medir estanque' y luego dos clics en el mapa para definir el rectángulo."}</p>
          ) : (
            <>
              <div className="log-field">
                <div className="log-field-label">{t("geoArea") || "Área"}</div>
                <div className="log-field-value" style={{ fontWeight: 700 }}>{areaM2.toFixed(1)} m²</div>
              </div>

              <label style={{ fontSize: 12 }}>
                {t("profundidad") || "Profundidad (m)"}
                <input type="number" value={profundidad} onChange={(e) => setProfundidad(e.target.value)} placeholder="0" />
              </label>

              {vol && (
                <div style={{ background: "rgba(0,200,150,0.08)", padding: "10px 12px", borderRadius: 8 }}>
                  <div className="log-field">
                    <div className="log-field-label">{t("volumenCalculado") || "Volumen"}</div>
                    <div className="log-field-value" style={{ fontWeight: 700, fontSize: 16 }}>{vol.volumenM3.toFixed(1)} m³</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{vol.litros.toLocaleString()} {t("litros") || "L"}</div>
                </div>
              )}

              <button className="btn-primary" style={{ marginTop: "auto" }} onClick={usarEnCalc} disabled={!vol || vol.volumenM3 <= 0}>
                {t("geoUsarCalc") || "Usar en calculadora"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
