import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { fincasRouter } from "./routes/fincas.js";
import { bitacoraRouter } from "./routes/bitacora.js";
import { especiesRouter } from "./routes/especies.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.use("/api/auth", authRouter);
app.use("/api/fincas", fincasRouter);
app.use("/api/bitacora", bitacoraRouter);
app.use("/api/especies", especiesRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`AcuiCal API corriendo en http://localhost:${PORT}`);
});
