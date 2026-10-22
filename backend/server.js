
import ws from "ws";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = Number(process.env.PORT || 3001);

const necesarias = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "FRONTEND_URL"
];

for (const nombre of necesarias) {
  if (!process.env[nombre]) {
    throw new Error(`Falta ${nombre} en backend/.env`);
  }
}

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: ws
    }
  }
);

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173"
  ]
}));

app.use(express.json({ limit: "40kb" }));

app.use("/api/admin", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

async function soloAdministrador(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Debes iniciar sesión."
      });
    }

    const token = header.slice(7);

    const { data, error } =
      await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Sesión inválida o vencida."
      });
    }

    const resultado = await db.query(
      `SELECT usuario_id
       FROM public.administradores
       WHERE usuario_id = $1`,
      [data.user.id]
    );

    if (!resultado.rowCount) {
      return res.status(403).json({
        error: "No tienes permisos de administrador."
      });
    }

    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: "Error verificando autorización."
    });
  }
}

function validarCurso(c) {
  const maximos = {
    nombre: 200,
    codigo: 40,
    area: 80,
    duracion: 60,
    descripcion: 3000,
    modulo: 3000
  };

  if (!c || typeof c !== "object" || Array.isArray(c)) {
    return "Datos inválidos.";
  }

  for (const [campo, maximo] of Object.entries(maximos)) {
    if (
      typeof c[campo] !== "string" ||
      c[campo].length > maximo
    ) {
      return `Campo inválido: ${campo}`;
    }
  }

  for (const campo of [
    "nombre",
    "area",
    "duracion",
    "descripcion",
    "modulo"
  ]) {
    if (!c[campo].trim()) {
      return `Completa el campo ${campo}.`;
    }
  }

  if (
    !Number.isInteger(c.horas) ||
    c.horas < 1 ||
    c.horas > 10000
  ) {
    return "La carga horaria es inválida.";
  }

  return null;
}

// Comprobar el servidor
app.get("/", (_req, res) => {
  res.json({
    mensaje: "API del Centro San Agustín funcionando"
  });
});

// Página pública: obtener cursos
app.get("/api/cursos", async (_req, res) => {
  try {
    const resultado = await db.query(`
      SELECT id, nombre, codigo, area, duracion,
             horas, descripcion, modulo
      FROM public.cursos
      ORDER BY id
    `);

    res.json(resultado.rows);
  } catch (e) {
    console.error(e);
    res.status(503).json({
      error: "No se pudieron cargar los cursos."
    });
  }
});

// Página pública: número de WhatsApp
app.get("/api/configuracion", async (_req, res) => {
  try {
    const resultado = await db.query(`
      SELECT valor
      FROM public.configuracion
      WHERE clave = 'whatsapp'
    `);

    res.json({
      whatsapp: resultado.rows[0]?.valor || ""
    });
  } catch (e) {
    console.error(e);
    res.status(503).json({
      error: "No se pudo cargar la configuración."
    });
  }
});

// Comprobar administrador
app.get(
  "/api/admin/verificar",
  soloAdministrador,
  (_req, res) => {
    res.json({ autorizado: true });
  }
);

// Administrador: actualizar curso
app.put(
  "/api/admin/cursos/:id",
  soloAdministrador,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "Identificador inválido."
        });
      }

      const errorDatos = validarCurso(req.body);

      if (errorDatos) {
        return res.status(400).json({
          error: errorDatos
        });
      }

      const c = req.body;

      const resultado = await db.query(`
        UPDATE public.cursos
        SET nombre = $1,
            codigo = $2,
            area = $3,
            duracion = $4,
            horas = $5,
            descripcion = $6,
            modulo = $7,
            actualizado_en = now()
        WHERE id = $8
        RETURNING id, nombre, codigo, area,
                  duracion, horas, descripcion, modulo
      `, [
        c.nombre.trim(),
        c.codigo.trim(),
        c.area.trim(),
        c.duracion.trim(),
        c.horas,
        c.descripcion.trim(),
        c.modulo.trim(),
        id
      ]);

      if (!resultado.rowCount) {
        return res.status(404).json({
          error: "Curso no encontrado."
        });
      }

      res.json({
        mensaje: "Curso actualizado.",
        curso: resultado.rows[0]
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        error: "No se pudo actualizar el curso."
      });
    }
  }
);

// Administrador: cambiar WhatsApp
app.put(
  "/api/admin/whatsapp",
  soloAdministrador,
  async (req, res) => {
    try {
      const numero = req.body?.whatsapp;

      if (
        typeof numero !== "string" ||
        !/^[1-9][0-9]{7,14}$/.test(numero)
      ) {
        return res.status(400).json({
          error: "Número internacional inválido."
        });
      }

      await db.query(`
        INSERT INTO public.configuracion (clave, valor)
        VALUES ('whatsapp', $1)
        ON CONFLICT (clave)
        DO UPDATE SET valor = EXCLUDED.valor
      `, [numero]);

      res.json({
        mensaje: "WhatsApp actualizado.",
        whatsapp: numero
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        error: "No se pudo actualizar WhatsApp."
      });
    }
  }
);

// Ruta para direcciones inexistentes
app.use((_req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor San Agustín: puerto ${PORT}`);
});
