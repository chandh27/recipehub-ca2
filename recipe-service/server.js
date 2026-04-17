const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5001";

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

if ((process.env.DB_SSL || "").toLowerCase() === "true") {
  dbConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(dbConfig);

app.use(cors());
app.use(express.json());

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        ingredients TEXT NOT NULL,
        steps TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Recipes table is ready");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    throw error;
  }
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      service: "recipe-service",
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(500).json({
      status: "error",
      service: "recipe-service",
      database: "disconnected",
      details: error.message,
    });
  }
});

app.get("/recipes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recipes ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching recipes:", error.message);
    res.status(500).json({
      error: "Failed to fetch recipes",
    });
  }
});

app.post("/recipes", async (req, res) => {
  try {
    const { title, ingredients, steps } = req.body;

    if (!title || !ingredients || !steps) {
      return res.status(400).json({
        error: "title, ingredients, and steps are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO recipes (title, ingredients, steps)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, ingredients, steps]
    );

    const newRecipe = result.rows[0];

    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
        message: `New recipe created: ${title}`,
      });
    } catch (notificationError) {
      console.error(
        "Notification service call failed:",
        notificationError.message
      );
    }

    res.status(201).json({
      message: "Recipe created successfully",
      recipe: newRecipe,
    });
  } catch (error) {
    console.error("Error creating recipe:", error.message);
    res.status(500).json({
      error: "Failed to create recipe",
    });
  }
});

app.delete("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM recipes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Recipe not found",
      });
    }

    res.json({
      message: "Recipe deleted successfully",
      recipe: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting recipe:", error.message);
    res.status(500).json({
      error: "Failed to delete recipe",
    });
  }
});

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Recipe service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();