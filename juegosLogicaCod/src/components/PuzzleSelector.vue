<template>
  <div class="menu">
    <p class="menu-intro">- Selecciona tu desafio -</p>

    <div class="card-grid">
      <button
        v-for="puzzle in puzzles"
        :key="puzzle.id"
        :class="[
          'puzzle-card',
          `card-${puzzle.id}`,
          { 'is-selected': selectedId === puzzle.id, 'is-flashing': flashingId === puzzle.id }
        ]"
        @click="selectWithFlash(puzzle.id)"
      >
        <!-- Decoración y Estado -->
        <span class="status-dot" aria-hidden="true"></span>
        
        <div class="card-visual">
          <img
            v-if="puzzle.image"
            :src="puzzle.image"
            :alt="puzzle.title"
            class="card-icon-img"
          />
          <div v-else class="card-icon">{{ puzzle.iconLabel }}</div>
        </div>

        <div class="card-content">
          <div class="card-header">
            <span class="card-num">{{ puzzle.number }}</span>
            <h3 class="card-title">{{ puzzle.title }}</h3>
          </div>
          <p class="card-desc">{{ puzzle.description }}</p>
        </div>
        
        <!-- Efecto de brillo al seleccionar -->
        <div class="selection-overlay"></div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

type PuzzleId = 'lobos' | 'tortitas' | 'rojoyazul' | 'aparcar' | 'ships'

interface Puzzle {
  id: PuzzleId
  number: string
  title: string
  description: string
  image?: string
  iconLabel?: string
}

const puzzles: Puzzle[] = [
  { id: 'lobos', number: 'N 001', title: 'Lobos y Pollitos', description: 'Lleva a todos los animales al otro lado del rio sin que los lobos superen en numero.', image: '/images/lobos.png' },
  { id: 'tortitas', number: 'N 002', title: 'Torres de Hanoi', description: 'Mueve bloques entre pilas y deja todas en una sola pila ordenada. Solo puedes mover el bloque de arriba de cada pila, sin poner uno grande sobre uno pequeño.', image: '/images/tortitas.png' },
  { id: 'rojoyazul', number: 'N 003', title: 'Rojo y Azul', description: 'Intercambia la posicion de todas las fichas rojas y azules deslizandolas por el tablero.', image: '/images/rojoyazul.png' },
  { id: 'aparcar', number: 'N 004', title: 'Aparcamiento', description: 'Desliza el coche rojo hasta la salida de la derecha y libera el camino.', image: '/images/aparcar.png' },
  { id: 'ships', number: 'N 005', title: 'Ships', description: 'Programa al robot para recorrer el tablero y resolver el reto paso a paso.', image: '/images/ships.png' }
]

const emit = defineEmits<{ (e: 'select', id: PuzzleId): void }>()
const selectedId = ref<PuzzleId | null>(null)
const flashingId = ref<PuzzleId | null>(null)
let clickTimer: number | null = null

function selectWithFlash(id: PuzzleId) {
  selectedId.value = id
  flashingId.value = id
  if (clickTimer !== null) window.clearTimeout(clickTimer)

  clickTimer = window.setTimeout(() => {
    flashingId.value = null
    emit('select', id)
    clickTimer = null
  }, 180)
}

onBeforeUnmount(() => {
  if (clickTimer !== null) window.clearTimeout(clickTimer)
})
</script>

<style scoped>
/* Contenedor Principal: Ahora centrado y con ancho máximo */
.menu {
  position: relative;
  padding: 1.1rem;
  border-radius: var(--radius-lg);
  background: linear-gradient(160deg, rgba(19, 33, 55, 0.78), rgba(10, 22, 39, 0.92));
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-elevated), inset 0 1px 0 rgba(255, 255, 255, 0.09);
  overflow: hidden;
  
  /* NUEVO: Centrar el menú en la pantalla y limitar su ancho */
  max-width: 800px;
  margin: 1em auto;
}

.menu::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    to bottom,
    rgba(138, 212, 255, 0.09) 0,
    rgba(138, 212, 255, 0.09) 1px,
    transparent 1px,
    transparent 4px
  );
  opacity: 0.28;
}

.menu-intro {
  position: relative;
  z-index: 1;
  margin: 0 0 0.95rem;
  text-align: center;
  font-family: var(--font-mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.card-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.card-grid > .puzzle-card:not(:last-child) {
  border-bottom: 1px solid rgba(85, 204, 255, 0.15);
  margin-bottom: 20px;
  padding-bottom: 20px;
}

/* Tarjeta Puzzle: Ajustes para que no se vea alargada */
.puzzle-card {
  position: relative;
  display: grid;
  /* Mantenemos el diseño interno, pero limitamos el tamaño total */
  grid-template-columns: 56px 1fr;
  align-items: center;
  gap: 0.8rem;
  text-align: left;
  
  width: min(100%, 600px);
  max-width: 600px;
  /* NUEVO: Centrar las tarjetas dentro de la rejilla si la rejilla es más ancha */
  margin-left: auto;
  margin-right: auto;
  
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  padding: 0.85rem 0.85rem 0.85rem 0.7rem;
  background: linear-gradient(145deg, rgba(33, 52, 79, 0.58), rgba(18, 31, 50, 0.42));
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  overflow: hidden;
}

.puzzle-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(85, 204, 255, 0.58), rgba(85, 204, 255, 0));
  opacity: 0;
  pointer-events: none;
}

.puzzle-card:hover {
  transform: scale(1.05);
  border-color: color-mix(in srgb, var(--accent-primary) 72%, white 28%);
  box-shadow: 0 14px 28px rgba(7, 20, 38, 0.42), 0 0 16px rgba(85, 204, 255, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.puzzle-card.is-selected {
  border-color: color-mix(in srgb, var(--accent-primary) 80%, white 20%);
  box-shadow: 0 0 0 1px rgba(85, 204, 255, 0.42), 0 0 20px rgba(85, 204, 255, 0.32),
    0 14px 26px rgba(5, 18, 37, 0.45);
}

.puzzle-card.is-flashing::after {
  animation: flash-select 180ms ease-out;
}

.status-dot {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--state-success);
  box-shadow: 0 0 0 4px rgba(33, 208, 138, 0.16), 0 0 10px rgba(33, 208, 138, 0.68);
  animation: status-pulse 1.8s ease-in-out infinite;
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow: inset 0 10px 16px rgba(255, 255, 255, 0.12), inset 0 -10px 16px rgba(0, 0, 0, 0.24);
}

.card-icon-img {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  object-fit: contain;
  display: block;
}

.card-content {
  position: relative;
  min-height: 74px;
}

.card-num {
  position: absolute;
  top: -2px;
  right: 0;
  font-family: var(--font-mono);
  font-size: 0.67rem;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  background: rgba(8, 21, 40, 0.7);
  border: 1px solid rgba(188, 224, 255, 0.3);
  border-radius: 999px;
  padding: 0.15rem 0.44rem;
}

.card-title {
  margin-top: 1.08rem;
  font-family: var(--font-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-primary);
}

.card-desc {
  margin-top: 0.35rem;
  font-size: 0.82rem;
  line-height: 1.35;
  color: var(--text-secondary);
}

.card-lobos .card-icon {
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent-lobos) 82%, white 18%), #7e1326);
}

.card-tortitas .card-icon {
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent-tortitas) 85%, white 15%), #7a3f09);
}

.card-rojoyazul .card-icon {
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent-rojoyazul) 86%, white 14%), #4a2f8f);
}

.card-aparcar .card-icon {
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent-parking) 84%, white 16%), #7a4b12);
}

.card-ships .card-icon {
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent-primary) 86%, white 14%), #1b5f86);
}

@keyframes status-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes flash-select {
  0% { opacity: 0; }
  40% { opacity: 0.4; }
  100% { opacity: 0; }
}

/* Responsividad: En móvil volvemos a ocupar casi todo el ancho */
@media (max-width: 640px) {
  .menu {
    padding: 0.85rem;
    margin: 10px; /* Un poco de margen en los bordes de la pantalla */
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .puzzle-card {
    grid-template-columns: 54px 1fr;
    gap: 0.65rem;
    padding: 0.75rem 0.7rem;
    
    /* MODIFICADO: En móvil, ocupar todo el ancho disponible del contenedor */
    width: 100%;
    max-width: 100%;
  }

  .card-icon {
    width: 54px;
    height: 54px;
    border-radius: 10px;
  }

  .card-title {
    font-size: 0.95rem;
  }
}
</style>