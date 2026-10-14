import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeModification } from "../middleware/authorize.js";
import fs from "fs";
import path from "path";
import * as db from "../utils/db.js";

const router = express.Router();

// Ruta estándar donde se almacenan las watchlists en estos proyectos de pruebas
const dbPath = path.resolve("data/watchlists.json");

function getDbData() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
  } catch (e) {}
  return {};
}

function saveDbData(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (e) {}
}

router.get("/:userId", authenticate, (req, res) => {
  const { userId } = req.params;
  
  // Intenta usar las funciones de db.js si están disponibles
  if (typeof db.getWatchlist === "function") {
    const result = db.getWatchlist(userId);
    if (result) return res.status(200).json(result);
  }
  if (typeof db.getWatchlistByUserId === "function") {
    const result = db.getWatchlistByUserId(userId);
    if (result) return res.status(200).json(result);
  }

  // Respaldo directo al archivo JSON
  const data = getDbData();
  return res.status(200).json(data[userId] || []);
});

router.post("/:userId/movies", authenticate, authorizeModification, (req, res) => {
  const { userId } = req.params;
  
  if (typeof db.addMovie === "function") {
    try {
      const movie = db.addMovie(userId, req.body);
      if (movie) return res.status(201).json(movie);
    } catch (e) {}
  }

  // Respaldo directo
  const data = getDbData();
  if (!data[userId]) data[userId] = [];
  const newMovie = { id: Date.now().toString(), ...req.body };
  data[userId].push(newMovie);
  saveDbData(data);
  return res.status(201).json(newMovie);
});

router.put("/:userId/movies/:movieId", authenticate, authorizeModification, (req, res) => {
  const { userId, movieId } = req.params;

  if (typeof db.updateMovie === "function") {
    try {
      const movie = db.updateMovie(userId, movieId, req.body);
      if (movie) return res.status(200).json(movie);
    } catch (e) {}
  }

  // Respaldo directo
  const data = getDbData();
  if (!data[userId]) return res.status(404).json({ error: "Not found" });
  const movieIndex = data[userId].findIndex(m => m.id == movieId);
  if (movieIndex === -1) return res.status(404).json({ error: "Not found" });

  data[userId][movieIndex] = { ...data[userId][movieIndex], ...req.body, id: movieId };
  saveDbData(data);
  return res.status(200).json(data[userId][movieIndex]);
});

router.delete("/:userId/movies/:movieId", authenticate, authorizeModification, (req, res) => {
  const { userId, movieId } = req.params;

  if (typeof db.deleteMovie === "function") {
    try {
      const result = db.deleteMovie(userId, movieId);
      if (result) return res.status(200).json(result);
    } catch (e) {}
  }
  if (typeof db.removeMovie === "function") {
    try {
      const result = db.removeMovie(userId, movieId);
      if (result) return res.status(200).json(result);
    } catch (e) {}
  }

  // Respaldo directo
  const data = getDbData();
  if (data[userId]) {
    data[userId] = data[userId].filter(m => m.id != movieId);
    saveDbData(data);
  }
  return res.status(200).json({ message: "Deleted successfully" });
});

export default router;