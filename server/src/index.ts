import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { fincasRouter } from "./routes/fincas.js";
import { bitacoraRouter } from "./routes/bitacora.js";
import { especiesRouter } from "./routes/especies.js";
import { finanzasRouter } from "./routes/finanzas.js";
import { inventarioRouter } from "./routes/inventario.js";
import { microbiologiaRouter } from "./routes/microbiologia.js";
import { veterinariaRouter } from "./routes/veterinaria.js";
import { pagosRouter } from "./routes/pagos.js";
import { feedbackRouter } from "./routes/feedback.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) {
  console.warn("⚠️  CORS_ORIGIN no definido. Usando https://acuacla2112.netlify.app");
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://smvjffbeshxcfltjoolm.supabase.co", "https://acuacal21-production.up.railway.app"],
    },
  },
}));

app.use(cors({ origin: corsOrigin ?? "https://acuacla2112.netlify.app" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intentá de nuevo en un minuto." },
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de autenticación. Intentá de nuevo en un minuto." },
});

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/fincas", fincasRouter);
app.use("/api/bitacora", bitacoraRouter);
app.use("/api/especies", especiesRouter);
app.use("/api/finanzas", finanzasRouter);
app.use("/api/inventario", inventarioRouter);
app.use("/api/microbiologia", microbiologiaRouter);
app.use("/api/veterinaria", veterinariaRouter);
app.use("/api/pagos", pagosRouter);
app.use("/api/feedback", feedbackRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`AcuiCal API corriendo en http://localhost:${PORT}`);
});
