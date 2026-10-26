
import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

// Test route to check whether the backend is running.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VYBE backend is running!",
    service: "VYBE API",
  });
});

// Handle API routes that do not exist.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Start the backend server.
app.listen(PORT, () => {
  console.log(`VYBE backend running at http://localhost:${PORT}`);
});