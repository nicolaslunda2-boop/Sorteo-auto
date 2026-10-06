// ─────────────────────────────────────────────────────────────
//  DATOS DEL SORTEO — podés editar estos textos y valores.
// ─────────────────────────────────────────────────────────────

export const SORTEO = {
  titulo: "Gran Sorteo",
  subtitulo: "Ganate un Fiat Cronos 2023",
  auto: "Fiat Cronos 2023",
  // Fecha y lugar del sorteo (texto libre).
  fecha: "Fecha a confirmar",
  lugar: "Transmisión en vivo por redes sociales",
  organizador: "Organización del Sorteo",
  contacto: "Consultas por WhatsApp",
  serie: "A",
};

export const PREMIOS = [
  { nombre: "1ra línea", premio: "$1.000.000", detalle: "Primera fila completa" },
  { nombre: "2da línea", premio: "$2.000.000", detalle: "Segunda línea completada" },
  { nombre: "Cartón lleno", premio: "Fiat Cronos", detalle: "Modelo 2023 · los 15 números del cartón" },
];

export const PRECIOS = {
  individual: 6500,
  comboCantidad: 3,
  comboPrecio: 15000,
};

export const TOTAL_TICKETS = 6000;
export const RESERVA_MINUTOS = 15;
export const MAX_TICKETS_POR_PERSONA = 30;
export const SEMILLA_CARTONES = 20261006;
