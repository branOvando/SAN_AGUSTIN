
export type Curso = {
  id: number;
  nombre: string;
  codigo: string;
  area: string;
  duracion: string;
  horas: number;
  descripcion: string;
  modulo: string;
};

export const API =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

export const MAPA =
  "https://maps.app.goo.gl/H9eiPSWaie7krNtz7";

export function enlaceWhatsApp(
  numero: string,
  curso?: string
): string {
  const mensaje = curso
    ? `Hola, quisiera recibir información sobre el curso de ${curso} del Centro de Capacitación San Agustín.`
    : "Hola, quisiera recibir información sobre los cursos del Centro de Capacitación San Agustín.";

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
