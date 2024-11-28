const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Configuración de la base de datos SQLite
const db = new sqlite3.Database(":memory:", (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err.message);
    return;
  }
  console.log("Conectado a la base de datos SQLite en memoria.");
});

// Crear la tabla "tasks"
db.run(`
  CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
  )
`);

// **RUTAS**

// Listar todas las tareas
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Obtener una tarea por su ID
app.get("/tasks/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: "Tarea no encontrada" });
    } else {
      res.json(row);
    }
  });
});

// Crear una nueva tarea
app.post("/tasks", (req, res) => {
  const { name, description, status } = req.body;
  const query = `
    INSERT INTO tasks (name, description, status)
    VALUES (?, ?, ?)
  `;
  const values = [name, description || "", status || "pending"];

  db.run(query, values, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: this.lastID });
    }
  });
});

// Actualizar una tarea existente
app.put("/tasks/:id", (req, res) => {
  const id = req.params.id;
  const { name, description, status } = req.body;
  const query = `
    UPDATE tasks
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const values = [name, description, status, id];

  db.run(query, values, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Tarea no encontrada" });
    } else {
      res.json({ message: "Tarea actualizada exitosamente" });
    }
  });
});

// Eliminar una tarea
app.delete("/tasks/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Tarea no encontrada" });
    } else {
      res.json({ message: "Tarea eliminada exitosamente" });
    }
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
