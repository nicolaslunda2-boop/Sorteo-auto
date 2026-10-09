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
// "vertical: true" para fotos sacadas con el celular parado (se muestran enteras).
export const FOTOS: { src: string; alt: string; vertical?: boolean }[] = [
  { src: "/fotos/01-frente.jpg", alt: "Fiat Cronos 2023 rojo, vista de frente" },
  { src: "/fotos/02-frente-recto.jpg", alt: "Frente del Fiat Cronos", vertical: true },
  { src: "/fotos/03-frente-lateral.jpg", alt: "Frente y lateral izquierdo" },
  { src: "/fotos/04-lateral-trasero.jpg", alt: "Lateral derecho y parte trasera" },
  { src: "/fotos/05-trasera-lateral.jpg", alt: "Parte trasera y lateral izquierdo" },
  { src: "/fotos/06-trasera.jpg", alt: "Parte trasera del Fiat Cronos", vertical: true },
  { src: "/fotos/07-tablero.jpg", alt: "Tablero, pantalla táctil y caja automática" },
  { src: "/fotos/08-asientos.jpg", alt: "Asientos delanteros" },
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
