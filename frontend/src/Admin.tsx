
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  LogOut,
  Save,
  ShieldCheck
} from "lucide-react";
import { supabase } from "./supabase";
import { API, type Curso } from "./types";

type Props = {
  cursos: Curso[];
  whatsapp: string;
  recargarCursos: () => Promise<void>;
  recargarWhatsApp: () => Promise<void>;
  volver: () => void;
};

async function solicitudAdmin(
  ruta: string,
  metodo = "GET",
  datos?: object
) {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    throw new Error("Debes iniciar sesión.");
  }

  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json"
    },
    body: datos ? JSON.stringify(datos) : undefined
  });

  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      resultado.error || "No se pudo completar la solicitud."
    );
  }

  return resultado;
}

export default function Admin({
  cursos,
  whatsapp,
  recargarCursos,
  recargarWhatsApp,
  volver
}: Props) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [comprobando, setComprobando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [numero, setNumero] = useState(whatsapp);
  const [editando, setEditando] = useState<Curso | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (activo) {
        setSesion(data.session);
        setComprobando(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_evento, nuevaSesion) => {
        if (activo) {
          setSesion(nuevaSesion);
        }
      }
    );

    return () => {
      activo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let activo = true;

    if (!sesion) {
      setAutorizado(false);
      return;
    }

    setComprobando(true);

    solicitudAdmin("/api/admin/verificar")
      .then(() => {
        if (activo) {
          setAutorizado(true);
          setMensaje("");
        }
      })
      .catch(e => {
        if (activo) {
          setAutorizado(false);
          setMensaje((e as Error).message);
        }
      })
      .finally(() => {
        if (activo) {
          setComprobando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [sesion?.access_token]);

  useEffect(() => {
    setNumero(whatsapp);
  }, [whatsapp]);

  async function ingresar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password
      });

      if (error) {
        setMensaje(error.message);
      }
    } catch (e) {
      setMensaje((e as Error).message);
    } finally {
      setPassword("");
      setGuardando(false);
    }
  }

  async function salir() {
    await supabase.auth.signOut();
    setAutorizado(false);
    setEditando(null);
    setMensaje("");
  }

  function cambiar(
    campo: keyof Curso,
    valor: string | number
  ) {
    setEditando(actual =>
      actual ? { ...actual, [campo]: valor } : null
    );
  }

  async function guardarCurso(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editando) return;

    setGuardando(true);
    setMensaje("");

    try {
      const resultado = await solicitudAdmin(
        `/api/admin/cursos/${editando.id}`,
        "PUT",
        editando
      );

      await recargarCursos();
      setEditando(resultado.curso);
      setMensaje("Curso actualizado correctamente.");
    } catch (e) {
      setMensaje((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarWhatsApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");

    try {
      await solicitudAdmin(
        "/api/admin/whatsapp",
        "PUT",
        { whatsapp: numero.trim() }
      );

      await recargarWhatsApp();
      setMensaje("WhatsApp actualizado correctamente.");
    } catch (e) {
      setMensaje((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  if (comprobando) {
    return (
      <main className="admin-center">
        Comprobando permisos...
      </main>
    );
  }

  if (!sesion) {
    return (
      <main className="admin-center">
        <form className="login-card" onSubmit={ingresar}>
          <ShieldCheck size={43} />

          <h1>Administración San Agustín</h1>
          <p>Acceso exclusivo con correo y contraseña.</p>

          <label>
            Correo electrónico
            <input
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {mensaje && <p className="notice">{mensaje}</p>}

          <button
            type="submit"
            className="btn btn-wine"
            disabled={guardando}
          >
            {guardando ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <button
            type="button"
            className="text-action"
            onClick={volver}
          >
            <ArrowLeft size={17} />
            Volver al inicio
          </button>
        </form>
      </main>
    );
  }

  if (!autorizado) {
    return (
      <main className="admin-center">
        <div className="login-card">
          <h1>Acceso no autorizado</h1>

          <p>
            Esta cuenta no está registrada como
            administradora del centro.
          </p>

          {mensaje && <p className="notice">{mensaje}</p>}

          <button
            className="btn btn-wine"
            onClick={salir}
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <span className="eyebrow">PANEL PRIVADO</span>
            <h1>Administración San Agustín</h1>
            <p>{sesion.user.email}</p>
          </div>

          <div className="button-group">
            <button
              className="btn btn-outline"
              onClick={volver}
            >
              Ver página
            </button>

            <button
              className="btn btn-wine"
              onClick={salir}
            >
              <LogOut size={17} />
              Cerrar sesión
            </button>
          </div>
        </div>

        {mensaje && <p className="notice">{mensaje}</p>}

        <section className="admin-section">
          <h2>1. Editar el número de WhatsApp</h2>

          <p>
            Los botones de todas las páginas utilizarán
            el número que guardes aquí.
          </p>

          <form
            className="whatsapp-form"
            onSubmit={guardarWhatsApp}
          >
            <label>
              Número internacional sin + ni espacios
              <input
                type="tel"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                pattern="[1-9][0-9]{7,14}"
                required
              />
            </label>

            <button
              type="submit"
              className="btn btn-wine"
              disabled={guardando}
            >
              <Save size={17} />
              Guardar WhatsApp
            </button>
          </form>
        </section>

        <section className="admin-section">
          <h2>2. Selecciona un curso</h2>

          <p>
            Haz clic en el nombre del curso para modificar
            su información.
          </p>

          <div className="admin-course-list">
            {cursos.map(curso => (
              <button
                type="button"
                className={
                  editando?.id === curso.id
                    ? "admin-course selected"
                    : "admin-course"
                }
                key={curso.id}
                onClick={() => {
                  setEditando({ ...curso });
                  setMensaje("");
                }}
              >
                <strong>
                  {String(curso.id).padStart(2, "0")}
                </strong>

                <span>{curso.nombre}</span>
                <span>Editar →</span>
              </button>
            ))}
          </div>
        </section>

        {editando && (
          <section className="admin-section">
            <h2>3. Modificar curso</h2>

            <form
              className="edit-form"
              onSubmit={guardarCurso}
            >
              <label className="full">
                Nombre del curso
                <input
                  value={editando.nombre}
                  maxLength={200}
                  onChange={e =>
                    cambiar("nombre", e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Código
                <input
                  value={editando.codigo}
                  maxLength={40}
                  onChange={e =>
                    cambiar("codigo", e.target.value)
                  }
                />
              </label>

              <label>
                Área
                <input
                  value={editando.area}
                  maxLength={80}
                  onChange={e =>
                    cambiar("area", e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Duración
                <input
                  value={editando.duracion}
                  maxLength={60}
                  onChange={e =>
                    cambiar("duracion", e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Horas
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={editando.horas}
                  onChange={e =>
                    cambiar("horas", Number(e.target.value))
                  }
                  required
                />
              </label>

              <label className="full">
                Descripción
                <textarea
                  rows={5}
                  maxLength={3000}
                  value={editando.descripcion}
                  onChange={e =>
                    cambiar("descripcion", e.target.value)
                  }
                  required
                />
              </label>

              <label className="full">
                Contenido o módulos
                <textarea
                  rows={6}
                  maxLength={3000}
                  value={editando.modulo}
                  onChange={e =>
                    cambiar("modulo", e.target.value)
                  }
                  required
                />
              </label>

              <button
                type="submit"
                className="btn btn-wine"
                disabled={guardando}
              >
                <Save size={18} />
                {guardando
                  ? "Guardando..."
                  : "Guardar cambios del curso"}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
