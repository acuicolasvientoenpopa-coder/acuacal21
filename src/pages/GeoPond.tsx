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

function calcDimensions(bounds: [[number, number], [number, number]]) {
  const [[swLat, swLng], [neLat, neLng]] = bounds;
  const sw = latLngToMeters(swLat, swLng);
  const ne = latLngToMeters(neLat, neLng);
  return { largoM: Math.abs(ne.y - sw.y), anchoM: Math.abs(ne.x - sw.x) };
}

function calcAreaFromCoords(bounds: [[number, number], [number, number]]): number {
  const { largoM, anchoM } = calcDimensions(bounds);
  return largoM * anchoM;
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
  const [drawing, setDrawing] = useState(false);
  const [corner1, setCorner1] = useState<[number, number] | null>(null);
  const [previewBounds, setPreviewBounds] = useState<[[number, number], [number, number]] | null>(null);

  const { largoM, anchoM } = bounds ? calcDimensions(bounds) : { largoM: 0, anchoM: 0 };
  const areaM2 = bounds ? calcAreaFromCoords(bounds) : 0;
  const prof = parseFloat(profundidad) || 0;
  const vol = prof > 0 && largoM > 0 && anchoM > 0 ? calcVolumenRectangular(largoM, anchoM, prof) : null;

  const handleMapClick = useCallback((e: LeafletMouseEvent) => {
    if (!drawing) return;
    if (!corner1) {
      setCorner1([e.latlng.lat, e.latlng.lng]);
    } else {
      const b: [[number, number], [number, number]] = [corner1, [e.latlng.lat, e.latlng.lng]];
      setBounds(b);
      setCorner1(null);
      setDrawing(false);
      setPreviewBounds(null);
    }
  }, [drawing, corner1]);

  const handleMouseMove = useCallback((e: LeafletMouseEvent) => {
    if (!drawing || !corner1) return;
    setPreviewBounds([corner1, [e.latlng.lat, e.latlng.lng]]);
  }, [drawing, corner1]);

  const startDrawing = () => {
    setDrawing(true);
    setBounds(null);
    setCorner1(null);
    setPreviewBounds(null);
    setProfundidad("");
  };

  const clearDrawing = () => {
    setBounds(null);
    setProfundidad("");
    setCorner1(null);
    setDrawing(false);
    setPreviewBounds(null);
  };

  const usarEnCalc = () => {
    if (vol && vol.volumenM3 > 0) {
      const dims = {
        forma: "rectangular" as const,
        largo: largoM,
        ancho: anchoM,
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
          <h2 className="page-title">{t("geoTitle")}</h2>
          <p className="page-subtitle">{t("geoSub")}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          className={drawing ? "btn-primary" : "btn-secondary"}
          onClick={startDrawing}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          {drawing ? "▭ Dibujando..." : "▭ Medir estanque"}
        </button>
        {bounds && (
          <button
            className="btn-secondary"
            onClick={clearDrawing}
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            Limpiar
          </button>
        )}
        {drawing && (
          <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
            {corner1 ? t("geoClickEsquina2") || "Click para segunda esquina" : t("geoClickEsquina1") || "Click para primera esquina"}
          </span>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", gap: 12, minHeight: 0, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300, position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", cursor: drawing ? "crosshair" : "" }}>
          <MapContainer center={[9.9, -84.3]} zoom={15} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onClick={handleMapClick} onMouseMove={handleMouseMove} />
            <FitBounds bounds={bounds} />
            {bounds && <Rectangle bounds={bounds} pathOptions={{ color: "var(--accent)", weight: 2 }} />}
            {previewBounds && (
              <Rectangle bounds={previewBounds} pathOptions={{ color: "var(--accent)", weight: 1, dashArray: "5 5", fillOpacity: 0.1 }} />
            )}
          </MapContainer>
        </div>

        <div className="card" style={{ width: "min(280px, 100%)", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("geoResultados")}</h3>

          {!bounds ? (
            <p style={{ fontSize: 12, color: "var(--text3)" }}>{t("geoInstrucciones")}</p>
          ) : (
            <>
              <div className="log-field">
                <div className="log-field-label">Largo</div>
                <div className="log-field-value" style={{ fontWeight: 700 }}>{largoM.toFixed(1)} m</div>
              </div>
              <div className="log-field">
                <div className="log-field-label">Ancho</div>
                <div className="log-field-value" style={{ fontWeight: 700 }}>{anchoM.toFixed(1)} m</div>
              </div>
              <div className="log-field">
                <div className="log-field-label">{t("geoArea")}</div>
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
                {t("geoUsarCalc")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MapEvents({ onClick, onMouseMove }: { onClick: (e: LeafletMouseEvent) => void; onMouseMove: (e: LeafletMouseEvent) => void }) {
  useMapEvents({ click: onClick, mousemove: onMouseMove });
  return null;
}
