import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMap, Marker, Polygon, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useTranslation } from "@/store/language";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGeolocation } from "@/hooks/useGeolocation";
import { saveEstanque, getSyncCount, getPendientes, markSynced, type EstanqueGeo, type PuntoGeo } from "@/services/geo";
import { useAuth } from "@/store/auth";
import { calcAreaPoligono } from "@/core";
import "leaflet/dist/leaflet.css";

const EARTH_RADIUS = 6378137;

function latLngToMeters(lat: number, lng: number) {
  const x = lng * (Math.PI / 180) * EARTH_RADIUS;
  const y = Math.log(Math.tan(Math.PI / 4 + lat * (Math.PI / 180) / 2)) * EARTH_RADIUS;
  return { x, y };
}

function calcPolygonArea(puntos: PuntoGeo[]): number {
  if (puntos.length < 3) return 0;
  const pts = puntos.map((p) => latLngToMeters(p.lat, p.lng));
  return calcAreaPoligono(pts);
}

function numeroIcono(n: number): L.DivIcon {
  return L.divIcon({
    className: "gps-marker-icon",
    html: `<div style="background:var(--accent,#00c896);color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function MapaFit({ puntos }: { puntos: PuntoGeo[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (puntos.length > 0 && !fitted.current) {
      const bounds = puntos.map((p) => [p.lat, p.lng] as [number, number]);
      if (bounds.length >= 2) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView(bounds[0], 17);
      }
      fitted.current = true;
    }
  }, [puntos, map]);
  return null;
}

function LocalizacionActual({ pos }: { pos: { latitude: number; longitude: number } | null }) {
  const map = useMap();
  const centered = useRef(false);
  useEffect(() => {
    if (pos && !centered.current) {
      map.setView([pos.latitude, pos.longitude], 17);
      centered.current = true;
    }
  }, [pos, map]);
  if (!pos) return null;
  return (
    <Marker position={[pos.latitude, pos.longitude]}>
      <div style={{ display: "none" }} />
    </Marker>
  );
}

export default function GeoPond() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fincaId = searchParams.get("fincaId") || undefined;
  const returnTo = searchParams.get("returnTo") || undefined;
  const { token, apiUrl } = useAuth();

  const { position, error: gpsError, watching, accuracyWarn, startWatching, stopWatching } = useGeolocation();

  const [puntos, setPuntos] = useState<PuntoGeo[]>([]);
  const [nombre, setNombre] = useState("");
  const [profundidad, setProfundidad] = useState("");
  const [saved, setSaved] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [syncCount, setSyncCount] = useState(0);

  const areaM2 = calcPolygonArea(puntos);
  const prof = parseFloat(profundidad) || 0;
  const volumenM3 = areaM2 > 0 && prof > 0 ? areaM2 * prof : null;

  useEffect(() => {
    startWatching();
    checkSyncCount();
    window.addEventListener("online", handleOnline);
    return () => {
      stopWatching();
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  async function checkSyncCount() {
    try {
      const n = await getSyncCount();
      setSyncCount(n);
    } catch {}
  }

  async function handleOnline() {
    await sincronizar();
    await checkSyncCount();
  }

  async function sincronizar() {
    if (!token) return;
    const pendientes = await getPendientes();
    for (const e of pendientes) {
      const body: any = {
        nombre: e.nombre,
        fechaCaptura: e.fechaCaptura,
        coordenadas: e.coordenadas,
        profundidad: e.profundidad,
        volumenM3: e.volumenM3,
        areaM2: e.areaM2,
      };
      if (e.fincaId) {
        try {
          const r = await fetch(`${apiUrl}/geo/estanques`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
          });
          if (r.ok) await markSynced(e.id);
        } catch {}
      }
    }
  }

  const capturarPunto = useCallback(() => {
    if (!position) return;
    if (accuracyWarn) {
      setMensaje(t("gpsAccuracyWarn"));
      return;
    }
    setPuntos((prev) => [...prev, { lat: position.latitude, lng: position.longitude }]);
    setMensaje("");
  }, [position, accuracyWarn, t]);

  const undoPunto = useCallback(() => {
    setPuntos((prev) => prev.slice(0, -1));
  }, []);

  async function guardarEstanque() {
    if (puntos.length < 3) return;
    const id = `geo_${Date.now()}`;
    const e: EstanqueGeo = {
      id,
      nombre: nombre.trim() || `Estanque ${new Date().toLocaleDateString()}`,
      fincaId,
      coordenadas: puntos,
      profundidad: prof || undefined,
      volumenM3: volumenM3 ?? undefined,
      areaM2: areaM2 || undefined,
      fechaCaptura: new Date().toISOString(),
      sincronizado: false,
      createdAt: new Date().toISOString(),
    };
    try {
      await saveEstanque(e);
      setSaved(true);
      setMensaje(t("gpsSaved"));
      await checkSyncCount();
      if (fincaId) await sincronizar();
    } catch {
      setMensaje("Error al guardar");
    }
  }

  const usarEnCalc = useCallback(() => {
    if (volumenM3 && volumenM3 > 0) {
      const data = {
        forma: "poligono",
        coordenadas: puntos,
        profundidad: prof,
        areaM2,
        volumenM3,
        litros: volumenM3 * 1000,
      };
      localStorage.setItem("acuical_geo_dimensions", JSON.stringify(data));
      navigate("/calc");
    }
  }, [volumenM3, prof, areaM2, puntos, navigate]);

  function volverAFincas() {
    if (returnTo) navigate(returnTo);
    else navigate("/fincas");
  }

  function nuevoEstanque() {
    setPuntos([]);
    setNombre("");
    setProfundidad("");
    setSaved(false);
    setMensaje("");
  }

  const coordsMap = puntos.map((p) => [p.lat, p.lng] as [number, number]);
  const poligonoCerrado = [...coordsMap, coordsMap[0] || [0, 0]];
  const puedeCapturar = watching && position !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", gap: 8 }}>
      <div className="page-header" style={{ margin: 0 }}>
        <div>
          <h2 className="page-title">🗺️ {t("geoTitle")}</h2>
          <p className="page-subtitle">{saved ? t("gpsSaved") : t("geoSub")}</p>
        </div>
        {!saved && syncCount > 0 && (
          <span className="badge badge-warning" style={{ fontSize: 11 }}>
            {t("gpsPendientes")}: {syncCount}
          </span>
        )}
      </div>

      {mensaje && (
        <div style={{
          padding: "8px 14px", borderRadius: 8, fontSize: 12,
          background: mensaje === t("gpsSaved") ? "rgba(0,200,150,0.12)" : "rgba(255,77,109,0.1)",
          color: mensaje === t("gpsSaved") ? "var(--accent)" : "var(--danger)",
          border: `1px solid ${mensaje === t("gpsSaved") ? "var(--accent)" : "var(--danger)"}`,
        }}>
          {mensaje}
          <button onClick={() => setMensaje("")} style={{ float: "right", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {!saved ? (
        <div style={{ flex: 1, display: "flex", gap: 10, minHeight: 0, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
            <MapContainer center={[9.9, -84.3]} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocalizacionActual pos={position} />
              <MapaFit puntos={puntos} />
              {coordsMap.length >= 3 && (
                <Polygon positions={poligonoCerrado} pathOptions={{ color: "var(--accent)", weight: 2, fillOpacity: 0.15 }} />
              )}
              {coordsMap.map((c, i) => (
                <Marker key={c[0] + '-' + c[1]} position={c} icon={numeroIcono(i + 1)}>
                  <Tooltip permanent direction="top" offset={[0, -16]}>
                    <span style={{ fontSize: 10 }}>P{i + 1}</span>
                  </Tooltip>
                </Marker>
              ))}
              {position && (
                <Marker position={[position.latitude, position.longitude]} icon={L.divIcon({
                  className: "gps-current-icon",
                  html: `<div style="width:14px;height:14px;background:var(--accent2,#0099ff);border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(0,153,255,0.3)"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7],
                })} />
              )}
            </MapContainer>
          </div>

          <div className="card" style={{ width: "min(280px, 100%)", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, padding: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              {t("gpsNombre") || "Nombre del estanque"}
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("gpsNombrePlaceholder") || "Ej: Estanque 1"} style={{ marginTop: 4 }} />
            </label>

            {position && (
              <div style={{ fontSize: 11, color: "var(--text2)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>{t("gpsAccuracy")}: {position.accuracy.toFixed(0)}m</span>
                {accuracyWarn && <span style={{ color: "var(--accent3)" }}>⚠️</span>}
              </div>
            )}

            {gpsError && <div style={{ fontSize: 11, color: "var(--danger)", padding: "6px 8px", background: "rgba(255,77,109,0.08)", borderRadius: 6 }}>{gpsError}</div>}

            {!watching && !gpsError && <div style={{ fontSize: 12, color: "var(--text3)", padding: 8 }}>{t("gpsTimeout")}</div>}

            <button
              className="btn-primary"
              onClick={capturarPunto}
              disabled={!puedeCapturar || accuracyWarn}
              style={{ fontSize: 15, padding: "14px 0", fontWeight: 700, minHeight: 56 }}
            >
              📍 {puntos.length === 0 ? t("gpsCapturar") : `${t("gpsCapturar")} #${puntos.length + 1}`}
            </button>

            {puntos.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-secondary" onClick={undoPunto} style={{ flex: 1, fontSize: 13, minHeight: 44 }}>
                  ↩ {t("gpsUndo")}
                </button>
                <button className="btn-secondary" onClick={nuevoEstanque} style={{ fontSize: 13, minHeight: 44 }}>
                  ✕ {t("cancelar")}
                </button>
              </div>
            )}

            {puntos.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--text2)", display: "flex", gap: 4, flexWrap: "wrap" }}>
                {puntos.map((p, i) => (
                  <span key={p.lat + '-' + p.lng} className="badge badge-green" style={{ fontSize: 10 }}>#{i + 1}</span>
                ))}
              </div>
            )}

            {puntos.length >= 3 && (
              <>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="log-field"><div className="log-field-label">{t("gpsArea2") || "Área"}</div><div className="log-field-value" style={{ fontWeight: 700 }}>{areaM2.toFixed(1)} m²</div></div>

                  <label style={{ fontSize: 12 }}>
                    {t("profundidad")} (m)
                    <input type="number" value={profundidad} onChange={(e) => setProfundidad(e.target.value)} placeholder="0" style={{ marginTop: 2 }} />
                  </label>

                  {volumenM3 && (
                    <div style={{ background: "rgba(0,200,150,0.08)", padding: "8px 10px", borderRadius: 6 }}>
                      <div className="log-field"><div className="log-field-label">{t("gpsVolumen") || "Volumen"}</div><div className="log-field-value" style={{ fontWeight: 700, fontSize: 15 }}>{volumenM3.toFixed(1)} m³</div></div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>{(volumenM3 * 1000).toLocaleString()} L</div>
                    </div>
                  )}

                  <button className="btn-primary" onClick={guardarEstanque} style={{ fontSize: 14, fontWeight: 700, minHeight: 48 }}>
                    💾 {t("gpsCerrar")}
                  </button>
                </div>
              </>
            )}

            {puntos.length > 0 && puntos.length < 3 && (
              <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 4 }}>{t("gpsNoPoints")}</p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h3 style={{ fontSize: 18 }}>{t("gpsSaved")}</h3>
          {volumenM3 && (
            <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 14 }}>
              <div>{areaM2.toFixed(1)} m² — {volumenM3.toFixed(1)} m³</div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>{(volumenM3 * 1000).toLocaleString()} L</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn-primary" onClick={nuevoEstanque} style={{ minHeight: 48 }}>
              🗺️ {t("gpsNuevo")}
            </button>
            {volumenM3 && volumenM3 > 0 && (
              <button className="btn-primary" onClick={usarEnCalc} style={{ minHeight: 48 }}>
                🧮 {t("gpsUsarCalc")}
              </button>
            )}
            {fincaId && (
              <button className="btn-secondary" onClick={volverAFincas} style={{ minHeight: 48 }}>
                🏠 {t("fincas")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
