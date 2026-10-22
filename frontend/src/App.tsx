
import { useEffect, useState } from "react";
import {
  ArrowRight, BookOpen, Building2,
  CalendarDays, Clock3, GraduationCap,
  MapPin, MessageCircle, Menu, X,
  Award, Users, Mail, Phone
} from "lucide-react";

import Admin from "./Admin.tsx";
import {
  API, MAPA, enlaceWhatsApp, type Curso
} from "./types";

type Vista =
  | "inicio"
  | "cursos"
  | "nosotros"
  | "instalaciones"
  | "contacto"
  | "admin";

const opciones: { nombre: string; vista: Vista }[] = [
  { nombre: "Inicio", vista: "inicio" },
  { nombre: "Cursos", vista: "cursos" },
  { nombre: "Nosotros", vista: "nosotros" },
  { nombre: "Instalaciones", vista: "instalaciones" },
  { nombre: "Contacto", vista: "contacto" }
];

function vistaDesdeUrl(): Vista {
  const ruta = window.location.pathname
    .replace(/^\/+|\/+$/g, "");

  if (ruta === "admin") return "admin";
  if (ruta === "cursos") return "cursos";
  if (ruta === "nosotros") return "nosotros";
  if (ruta === "instalaciones") return "instalaciones";
  if (ruta === "contacto") return "contacto";
  return "inicio";
}

function WhatsApp({
  numero, curso, texto = "Consultar por WhatsApp"
}: {
  numero: string;
  curso?: string;
  texto?: string;
}) {
  return (
    <a
      className="btn btn-whatsapp"
      href={enlaceWhatsApp(numero, curso)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle size={18} />
      {texto}
    </a>
  );
}

export default function App() {
  const [vista, setVista] = useState<Vista>(vistaDesdeUrl);
  const [menu, setMenu] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoDetalle, setCursoDetalle] =
    useState<Curso | null>(null);
  const [whatsapp, setWhatsapp] = useState("59172235222");
  const [error, setError] = useState("");

  async function obtenerCursos() {
    try {
      const respuesta = await fetch(`${API}/api/cursos`);
      if (!respuesta.ok) throw new Error();
      const datos: Curso[] = await respuesta.json();
      setCursos(datos);
      setError("");
    } catch {
      setError("No se pudieron cargar los cursos. Revisa el servidor.");
    }
  }

  async function obtenerWhatsApp() {
    try {
      const respuesta =
        await fetch(`${API}/api/configuracion`);
      if (!respuesta.ok) throw new Error();
      const datos: { whatsapp: string } =
        await respuesta.json();

      if (datos.whatsapp) setWhatsapp(datos.whatsapp);
    } catch {
      console.info("No se pudo obtener la configuración.");
    }
  }

  useEffect(() => {
    void obtenerCursos();
    void obtenerWhatsApp();

    const volver = () => {
      setVista(vistaDesdeUrl());
      setCursoDetalle(null);
    };

    window.addEventListener("popstate", volver);
    return () => window.removeEventListener("popstate", volver);
  }, []);

  function navegar(nueva: Vista) {
    const ruta = nueva === "inicio" ? "/" : `/${nueva}`;
    window.history.pushState({}, "", ruta);
    setVista(nueva);
    setCursoDetalle(null);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function abrirDetalle(curso: Curso) {
    setVista("cursos");
    setCursoDetalle(curso);
    window.history.pushState({}, "", "/cursos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function catalogo(lista: Curso[]) {
    return (
      <div className="courses-grid">
        {lista.map(curso => (
          <article className="course-card" key={curso.id}>
            <div className="course-top">
              <strong>{String(curso.id).padStart(2, "0")}</strong>
              <span>{curso.area}</span>
            </div>
            <div className="course-content">
              <span className="eyebrow">
                CURSO DE CAPACITACIÓN
              </span>
              <h3>{curso.nombre}</h3>
              <p>{curso.descripcion}</p>
              <div className="course-meta">
                <span>
                  <Clock3 size={16} /> {curso.horas} horas
                </span>
                <span>
                  <CalendarDays size={16} />
                  {curso.duracion}
                </span>
              </div>
              <button
                className="text-action"
                onClick={() => abrirDetalle(curso)}
              >
                Ver detalles <ArrowRight size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (vista === "admin") {
    return (
      <Admin
        cursos={cursos}
        whatsapp={whatsapp}
        recargarCursos={obtenerCursos}
        recargarWhatsApp={obtenerWhatsApp}
        volver={() => navegar("inicio")}
      />
    );
  }

  return (
    <>
      <header className="header">
        <div className="container navbar">
          <button
            className="brand"
            onClick={() => navegar("inicio")}
          >
            <img
              src="/images/logo.png"
              alt="Centro San Agustín"
            />
          </button>

          <button
            className="menu-button"
            onClick={() => setMenu(!menu)}
            aria-label="Abrir menú"
          >
            {menu ? <X /> : <Menu />}
          </button>

          <nav className={menu ? "navigation open" : "navigation"}>
            {opciones.map(opcion => (
              <button
                key={opcion.vista}
                className={
                  vista === opcion.vista
                    ? "nav-link active"
                    : "nav-link"
                }
                onClick={() => navegar(opcion.vista)}
              >
                {opcion.nombre}
              </button>
            ))}
            <WhatsApp numero={whatsapp} texto="Consultar" />
          </nav>
        </div>
      </header>

      {vista === "inicio" && (
        <main>
          <section className="hero">
            <div className="hero-overlay" />
            <div className="container hero-content">
              <span className="eyebrow light">
                FORMA TU FUTURO
              </span>
              <h1>
                Capacitación que te impulsa
                a llegar <em>más lejos.</em>
              </h1>
              <p>
                Descubre nuevas oportunidades con
                los cursos del Centro de Capacitación
                Técnica Privado San Agustín S.R.L.
              </p>
              <div className="button-group">
                <button
                  className="btn btn-gold"
                  onClick={() => navegar("cursos")}
                >
                  Ver nuestros cursos <ArrowRight size={18} />
                </button>
                <WhatsApp numero={whatsapp} />
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container intro-grid">
              <img
                className="institution-photo"
                src="/images/instalacion1.jpg"
                alt="Instalaciones del centro"
              />
              <div>
                <span className="eyebrow">SOBRE NOSOTROS</span>
                <h2 className="display-heading">
                  Comprometidos con tu desarrollo
                </h2>
                <p>
                  Somos un centro privado de capacitación
                  técnica ubicado en Quillacollo,
                  Cochabamba, Bolivia.
                </p>
                <p>
                  Nuestra formación está dirigida a jóvenes
                  y personas adultas que buscan actualizar
                  sus conocimientos y habilidades.
                </p>
                <button
                  className="btn btn-wine"
                  onClick={() => navegar("nosotros")}
                >
                  Conocer más <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </section>

          <section className="section soft-section">
            <div className="container">
              <div className="section-heading">
                <span className="eyebrow">OFERTA ACADÉMICA</span>
                <h2>Nuestros programas de capacitación</h2>
                <p>
                  Conoce las oportunidades de formación
                  del Centro San Agustín.
                </p>
              </div>

              {error && <p className="notice">{error}</p>}
              {catalogo(cursos.slice(0, 6))}

              <div className="center">
                <button
                  className="btn btn-wine"
                  onClick={() => navegar("cursos")}
                >
                  Ver todos los cursos <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container">
              <div className="section-heading">
                <span className="eyebrow">NUESTRA FORMACIÓN</span>
                <h2>¿Por qué elegir San Agustín?</h2>
              </div>
              <div className="benefits">
                <div>
                  <GraduationCap />
                  <h3>Formación técnica</h3>
                  <p>Programas para desarrollar competencias.</p>
                </div>
                <div>
                  <BookOpen />
                  <h3>Aprendizaje práctico</h3>
                  <p>Integración de conocimientos y práctica.</p>
                </div>
                <div>
                  <Users />
                  <h3>Crecimiento personal</h3>
                  <p>Desarrollo de habilidades y capacidades.</p>
                </div>
                <div>
                  <Award />
                  <h3>Oportunidades</h3>
                  <p>Preparación orientada al ámbito laboral.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="cta">
            <div className="container cta-inner">
              <div>
                <span className="eyebrow light">
                  TU FUTURO COMIENZA HOY
                </span>
                <h2>¿Listo para dar el siguiente paso?</h2>
              </div>
              <div>
                <p>
                  Conoce nuestros cursos y consulta
                  directamente por WhatsApp.
                </p>
                <WhatsApp
                  numero={whatsapp}
                  texto="Quiero más información"
                />
              </div>
            </div>
          </section>
        </main>
      )}

      {vista === "cursos" && !cursoDetalle && (
        <main>
          <section className="page-banner">
            <div className="container">
              <span className="eyebrow">OFERTA ACADÉMICA</span>
              <h1>Todos nuestros cursos</h1>
              <p>
                Nueve programas de capacitación
                técnica para tu desarrollo.
              </p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              {error && <p className="notice">{error}</p>}
              {catalogo(cursos)}
            </div>
          </section>
        </main>
      )}

      {vista === "cursos" && cursoDetalle && (
        <main>
          <section className="detail-banner">
            <div className="container">
              <button
                className="text-action"
                onClick={() => setCursoDetalle(null)}
              >
                ← Volver a todos los cursos
              </button>
              <span className="eyebrow">
                CURSO DE CAPACITACIÓN
              </span>
              <h1>{cursoDetalle.nombre}</h1>
              <p>{cursoDetalle.descripcion}</p>
              <WhatsApp
                numero={whatsapp}
                curso={cursoDetalle.nombre}
                texto="Consultar este curso"
              />
            </div>
          </section>
          <section className="section">
            <div className="container details-grid">
              <article>
                <h2 className="display-heading">
                  Información del programa
                </h2>
                <p>{cursoDetalle.descripcion}</p>
                <h3>Contenido y módulos</h3>
                <p className="multiline">{cursoDetalle.modulo}</p>
                <h3>Solicita información</h3>
                <p>
                  Consulta horarios, costos, requisitos
                  y próximas fechas por WhatsApp.
                </p>
                <WhatsApp
                  numero={whatsapp}
                  curso={cursoDetalle.nombre}
                />
              </article>
              <aside className="information-card">
                <h3>Datos del curso</h3>
                <p><b>Área:</b> {cursoDetalle.area}</p>
                <p><b>Duración:</b> {cursoDetalle.duracion}</p>
                <p><b>Carga horaria:</b> {cursoDetalle.horas} horas</p>
                <p><b>Régimen:</b> Modular</p>
                {cursoDetalle.codigo && (
                  <p><b>Código:</b> {cursoDetalle.codigo}</p>
                )}
              </aside>
            </div>
          </section>
        </main>
      )}

      {vista === "nosotros" && (
        <main>
          <section className="page-banner">
            <div className="container">
              <span className="eyebrow">NUESTRA INSTITUCIÓN</span>
              <h1>Conoce San Agustín</h1>
              <p>Comprometidos con la formación técnica.</p>
            </div>
          </section>
          <section className="section">
            <div className="container intro-grid">
              <img
                className="institution-photo"
                src="/images/instalacion2.jpg"
                alt="Centro San Agustín"
              />
              <div>
                <span className="eyebrow">QUIÉNES SOMOS</span>
                <h2 className="display-heading">
                  Formación para nuevas oportunidades
                </h2>
                <p>
                  El Centro de Capacitación Técnica
                  Privado San Agustín S.R.L. se encuentra
                  en Quillacollo, Cochabamba.
                </p>
                <p>
                  Ofrecemos capacitación orientada al
                  fortalecimiento de conocimientos,
                  habilidades y competencias laborales.
                </p>
              </div>
            </div>
          </section>
          <section className="section soft-section">
            <div className="container mission-grid">
              <article className="mission">
                <span className="eyebrow">01 — MISIÓN</span>
                <h2>Misión</h2>
                <p>
                  Ofrecer capacitación técnica de calidad
                  con pertinencia sociocultural para
                  jóvenes y adultos, mediante métodos
                  pedagógicos que fortalezcan conocimientos,
                  capacidades y habilidades.
                </p>
              </article>
              <article className="mission">
                <span className="eyebrow">02 — VISIÓN</span>
                <h2>Visión</h2>
                <p>
                  Constituirnos en un centro de capacitación
                  técnica de prestigio, comprometido
                  con la calidad académica, la igualdad
                  de oportunidades y el desarrollo
                  de competencias técnicas.
                </p>
              </article>
            </div>
          </section>
        </main>
      )}

      {vista === "instalaciones" && (
        <main>
          <section className="page-banner">
            <div className="container">
              <span className="eyebrow">INFRAESTRUCTURA</span>
              <h1>Nuestras instalaciones</h1>
              <p>Espacios destinados a la formación.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="stats">
                <div><strong>2.550 m²</strong><span>Terreno</span></div>
                <div><strong>4.080 m²</strong><span>Construcción</span></div>
                <div><strong>4</strong><span>Plantas</span></div>
                <div><strong>28</strong><span>Aulas de 6 × 10 m</span></div>
              </div>
              <div className="section-heading">
                <span className="eyebrow">GALERÍA</span>
                <h2>Conoce nuestro centro</h2>
              </div>
              <div className="gallery">
                {[1, 2, 3, 4].map(n => (
                  <img
                    key={n}
                    src={`/images/instalacion${n}.jpg`}
                    alt={`Fotografía de instalaciones ${n}`}
                  />
                ))}
              </div>
            </div>
          </section>
          <section className="section soft-section">
            <div className="container">
              <div className="section-heading">
                <span className="eyebrow">AMBIENTES</span>
                <h2>Nuestra infraestructura</h2>
              </div>
              <div className="facilities">
                {[
                  "28 aulas",
                  "Gabinete de computación",
                  "Gabinete de gastronomía",
                  "Laboratorios de Química y Física",
                  "Administración",
                  "Sala de padres de familia",
                  "Cancha deportiva multifuncional"
                ].map(nombre => (
                  <div key={nombre}>
                    <Building2 size={21} />
                    <span>{nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {vista === "contacto" && (
        <main>
          <section className="page-banner">
            <div className="container">
              <span className="eyebrow">CONTACTO</span>
              <h1>Estamos para orientarte</h1>
              <p>
                Toda consulta se realiza directamente
                por WhatsApp.
              </p>
            </div>
          </section>
          <section className="section">
            <div className="container contact-grid">
              <div>
                <span className="eyebrow">CONTÁCTANOS</span>
                <h2 className="display-heading">
                  Hablemos de tu próximo curso
                </h2>
                <div className="contact-items">
                  <p>
                    <MapPin />
                    Calle Rafael Pavón S/N entre
                    Av. Suárez Miranda y 23 de Marzo,
                    Zona Central, Quillacollo.
                  </p>
                  <p><Phone /> WhatsApp: +{whatsapp}</p>
                  <p><Mail /> itecft2022@gmail.com</p>
                </div>
                <WhatsApp numero={whatsapp} />
              </div>
              <div className="contact-card">
                <MapPin size={43} />
                <h3>Visítanos en Quillacollo</h3>
                <p>
                  Encuentra nuestra ubicación
                  mediante Google Maps.
                </p>
                <a
                  className="btn btn-wine"
                  href={MAPA}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver ubicación <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <img
              src="/images/logo.png"
              alt="San Agustín"
              className="footer-logo"
            />
            <p>
              Centro de Capacitación Técnica
              Privado San Agustín S.R.L.
            </p>
          </div>
          <div>
            <h3>Explora</h3>
            {opciones.map(opcion => (
              <button
                key={opcion.vista}
                onClick={() => navegar(opcion.vista)}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>
          <div>
            <h3>Ubicación</h3>
            <p>Quillacollo, Cochabamba, Bolivia</p>
            <p>itecft2022@gmail.com</p>
          </div>
          <div>
            <h3>¿Necesitas información?</h3>
            <p>Comunícate directamente con el centro.</p>
            <WhatsApp numero={whatsapp} />
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Centro San Agustín S.R.L.
        </div>
      </footer>

      <a
        className="whatsapp-floating"
        href={enlaceWhatsApp(whatsapp, cursoDetalle?.nombre)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar por WhatsApp"
      >
        <MessageCircle size={28} />
        <span>¿Te ayudamos?</span>
      </a>
    </>
  );
}
