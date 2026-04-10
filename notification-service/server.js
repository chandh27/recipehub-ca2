const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "notification-service"
  });
});

app.post("/notify", (req, res) => {
  const { message } = req.body;

  console.log("Notification received:", message);

  res.json({
    success: true,
    message: "Notification processed"
  });
});

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});