import http from "http";

const req = http.get("http://localhost:3001/api/health", (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => console.log("Health:", data));
});
req.on("error", (e) => console.log("Error:", e.message));
req.end();
