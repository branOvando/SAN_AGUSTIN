
CREATE TABLE IF NOT EXISTS public.cursos (
  id INTEGER PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  codigo VARCHAR(40) NOT NULL DEFAULT '',
  area VARCHAR(80) NOT NULL,
  duracion VARCHAR(60) NOT NULL,
  horas INTEGER NOT NULL CHECK(horas > 0),
  descripcion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.administradores (
  usuario_id UUID PRIMARY KEY
  REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cursos FROM anon, authenticated;
REVOKE ALL ON public.configuracion FROM anon, authenticated;
REVOKE ALL ON public.administradores FROM anon, authenticated;

INSERT INTO public.configuracion(clave,valor)
VALUES('whatsapp','59172235222')
ON CONFLICT(clave) DO NOTHING;

INSERT INTO public.cursos
(id,nombre,codigo,area,duracion,horas,descripcion,modulo)
VALUES
(1,'Tributación y Aranceles Aduaneros','COM8-TAA','Comercial','1 mes',80,
'Capacitación en tributación, procedimientos aduaneros, importaciones y exportaciones.',
'Negocios Internacionales de Importación y Exportación de Mercaderías'),

(2,'Elaboración y Presentación de Estados Financieros','','Comercial','1 mes',80,
'Formación para elaborar, presentar, clasificar y analizar estados financieros.',
'Conformación, Clasificación e Interpretación de los Estados Financieros'),

(3,'Compras y Ventas Online','COM5-CVOL','Comercial','1 mes',80,
'Formación en comercio electrónico, compras, ventas y marketing digital.',
'Marketing Comercial Digital'),

(4,'Servicio de Atención al Cliente','COM2-SAC','Comercial','1 mes',80,
'Capacitación en comunicación, atención al cliente y relaciones interpersonales.',
'Relaciones Interpersonales y Gestión de Oficina'),

(5,'Ciberseguridad','','Servicios','1 mes',80,
'Conocimientos de seguridad digital, identificación de riesgos y protección de información.',
'Seguridad Digital'),

(6,'Estilismo y Peluquería','SER55-EP','Servicios','3 meses',300,
'Capacitación práctica en cortes, peinados y tratamientos capilares.',
'Fundamentación al Estilismo en Peluquería Masculino; Peinados y Recogidos de Cabello en Damas; Estructura Capilar y Procesos Químicos de Transformación del Cabello'),

(7,'Oratoria en Liderazgo','','Servicios','1 mes',80,
'Desarrollo de habilidades de expresión oral, comunicación y liderazgo.',
'Oratoria y Liderazgo'),

(8,'Diseño y Programación de Sitios Web','SER12-DPSW','Servicios','1 mes',80,
'Aprendizaje de diseño y desarrollo de sitios web.',
'Diseño y Programación de Sitios Web'),

(9,'Promoción y Publicidad Digital','SER4-PPD','Servicios','1 mes',80,
'Capacitación en estrategias de publicidad y promoción mediante herramientas digitales.',
'Promoción y Publicidad Digital')
ON CONFLICT(id) DO NOTHING;
