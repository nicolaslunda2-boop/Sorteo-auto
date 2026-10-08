// ─────────────────────────────────────────────────────────────
//  DATOS DEL SORTEO — podés editar estos textos y valores.
// ─────────────────────────────────────────────────────────────

export const SORTEO = {
  titulo: "Gran Sorteo",
  subtitulo: "Ganate un Fiat Cronos 2023",
  auto: "Fiat Cronos 2023",
  // Fecha y lugar del sorteo (texto libre).
  fecha: "al venderse todos los cartones o el 20 de diciembre, lo que ocurra primero",
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

// Premios extra: se sortean números de cartón (sin importar los números del bingo).
export const PREMIOS_CARTON = {
  cantidad: 10,
  premio: "$100.000",
  detalle: "Se sortean 10 números de cartón entre todos los vendidos",
};

// Sorteo entre quienes invitan amigos con su link de referido.
// Cada amigo distinto que compra con tu link = 1 chance más.
export const PREMIO_REFERIDOS = "$1.000.000";

// Fotos del auto (archivos dentro de la carpeta public/fotos). La primera es la principal.
export const FOTOS = [
  { src: "/fotos/01-frente.jpg", alt: "Fiat Cronos 2023 rojo, vista de frente" },
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

// Cuántas horas quedan apartados los cartones de una compra por transferencia
// mientras esperás el pago. Si no confirmás antes, se liberan solos.
export const TRANSFERENCIA_HORAS = 24;
