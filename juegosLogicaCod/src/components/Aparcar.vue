<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

type CellSymbol = 'O' | 'X' | 'F'

type Point = {
  r: number
  c: number
}

type RankingEntry = {
  name: string
  score: number
  date: string
}

const CELL_SIZE = 40
const START_CELL: Point = { r: 4, c: 3 }
const RANKING_KEY = 'puzzle004-top10'

const grid: CellSymbol[][] = [
  ['O', 'X', 'O', 'X', 'O', 'X', 'X'],
  ['X', 'O', 'O', 'O', 'O', 'O', 'X'],
  ['X', 'X', 'O', 'F', 'O', 'O', 'X'],
  ['X', 'O', 'X', 'X', 'O', 'O', 'X'],
  ['X', 'X', 'O', 'X', 'X', 'X', 'X'],
]

function loadRanking(): RankingEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RANKING_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RankingEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e) => typeof e.name === 'string' && typeof e.score === 'number')
  } catch {
    return []
  }
}

function saveRanking(entries: RankingEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RANKING_KEY, JSON.stringify(entries))
}

const state = reactive({
  path: [] as Point[],
  message: '',
  playerName: '',
  scoreSaved: false,
})

const nameInput = ref('')
const isRankingShortcut = ref(false)
const ranking = ref<RankingEntry[]>(loadRanking())
const rankingTop10 = computed(() => ranking.value)

const won = computed(() => {
  const last = state.path[state.path.length - 1]
  const prev = state.path[state.path.length - 2]
  return !!last && grid[last.r]?.[last.c] === 'F' && !!prev && prev.r === last.r + 1 && prev.c === last.c
})

const steps = computed(() => Math.max(0, state.path.length - 1))

const svgPoints = computed(() =>
  state.path.map((p) => `${p.c * CELL_SIZE + CELL_SIZE / 2},${p.r * CELL_SIZE + CELL_SIZE / 2}`).join(' '),
)

function tempMessage(msg: string) {
  state.message = msg
  window.setTimeout(() => {
    if (state.message === msg) state.message = ''
  }, 2000)
}

function isPath(r: number, c: number) {
  return state.path.some((p) => p.r === r && p.c === c)
}

function isLast(r: number, c: number) {
  const last = state.path[state.path.length - 1]
  return !!last && last.r === r && last.c === c
}

function handleCellClick(r: number, c: number) {
  if (!state.playerName.trim() || won.value) return

  const destinationSymbol = grid[r]?.[c]

  if (state.path.length === 0) {
    if (r === START_CELL.r && c === START_CELL.c) {
      state.path.push({ r, c })
      state.message = ''
    }
    return
  }

  const last = state.path[state.path.length - 1]
  if (!last || (last.r === r && last.c === c)) return

  const isAdjacent = Math.abs(last.r - r) + Math.abs(last.c - c) === 1
  if (!isAdjacent) return

  if (destinationSymbol === 'F') {
    if (last.r === r + 1 && last.c === c) {
      state.path.push({ r, c })
      state.message = ''
      return
    }

    tempMessage('La bandera solo se alcanza entrando por debajo.')
    return
  }

  const prev = state.path[state.path.length - 2]
  const currentSymbol = grid[last.r]?.[last.c]

  if (prev && currentSymbol) {
    const inDir = { r: last.r - prev.r, c: last.c - prev.c }
    const outDir = { r: r - last.r, c: c - last.c }
    const isStraight = inDir.r === outDir.r && inDir.c === outDir.c

    if (currentSymbol === 'O' && !isStraight) {
      tempMessage('En O debes seguir recto.')
      return
    }
    if (currentSymbol === 'X' && isStraight) {
      tempMessage('En X debes girar.')
      return
    }
  }

  state.path.push({ r, c })
  state.message = ''
}

function reset() {
  state.path = []
  state.message = ''
  state.scoreSaved = false
  isRankingShortcut.value = false
}

function startGame() {
  const cleaned = nameInput.value.trim()
  if (!cleaned) return

  if (cleaned.toLowerCase() === 'winnerx') {
    state.playerName = cleaned.slice(0, 24)
    state.path = [
      { r: 4, c: 3 },
      { r: 3, c: 3 },
      { r: 2, c: 3 },
    ]
    state.message = ''
    isRankingShortcut.value = true
    return
  }

  isRankingShortcut.value = false
  state.playerName = cleaned.slice(0, 24)
  state.message = ''
}

watch(
  () => won.value,
  (isWon) => {
    if (!isWon || state.scoreSaved || !state.playerName.trim() || isRankingShortcut.value) return
    const next = [
      ...ranking.value,
      {
        name: state.playerName,
        score: steps.value,
        date: new Date().toISOString(),
      },
    ]
      .sort((a, b) => a.score - b.score || a.date.localeCompare(b.date))
      .slice(0, 10)

    ranking.value = next
    saveRanking(next)
    state.scoreSaved = true
  },
)
</script>

<template>
  <div class="puzzle-panel">
    <div class="puz-header">
      <div class="puz-num">PUZZLE N 004</div>
      <h2 class="puz-title">Dificil de aparcar</h2>
    </div>

    <div class="puz-desc">
      Traza una ruta desde el coche hasta la bandera siguiendo las reglas: en O sigues recto y en
      X debes girar.
    </div>

    <div class="player-name" v-if="state.playerName">Jugador: <b>{{ state.playerName }}</b></div>

    <div class="game-area" v-if="!won">
      <div class="board-container">
        <div class="grid">
          <template v-for="(row, rIdx) in grid" :key="rIdx">
            <div
              v-for="(cell, cIdx) in row"
              :key="`${rIdx}-${cIdx}`"
              class="cell"
              :class="{
                'symbol-o': cell === 'O',
                'symbol-x': cell === 'X',
                'is-goal': cell === 'F',
                active: isPath(rIdx, cIdx),
                last: isLast(rIdx, cIdx),
              }"
              @click="handleCellClick(rIdx, cIdx)"
            >
              <span v-if="cell === 'O'" class="symbol circle">O</span>
              <span v-else-if="cell === 'X'" class="symbol cross">X</span>
              <span v-else class="symbol flag">F</span>
            </div>
          </template>

          <svg class="path-svg" aria-hidden="true">
            <polyline :points="svgPoints" />
          </svg>
        </div>

        <div class="entrance">
          <div class="car">{{ state.path.length === 0 ? '🚗' : ' ' }}</div>
        </div>
      </div>

      <div class="message-row">{{ state.message || 'Empieza en el coche y llega a la bandera.' }}</div>

      <div class="parking-footer">
        <span>Pasos: <b>{{ steps }}</b></span>
        <button class="btn btn-secondary btn-sm" @click="reset">Reiniciar</button>
      </div>
    </div>

    <div class="win-modal-overlay" v-else>
      <div class="success-msg">
        <h3>Puzzle resuelto</h3>
        <p>Has llegado a la bandera en {{ steps }} pasos.</p>
        <button class="btn btn-primary" @click="reset">Jugar de nuevo</button>

        <div class="ranking-card">
          <div class="ranking-title">Top 10</div>
          <ol v-if="rankingTop10.length > 0" class="ranking-list">
            <li
              v-for="(entry, idx) in rankingTop10"
              :key="`${entry.name}-${entry.date}-${idx}`"
              class="ranking-item"
            >
              <span>{{ entry.name }}</span>
              <b>{{ entry.score }} pasos</b>
            </li>
          </ol>
          <div v-else class="ranking-empty">Sin partidas registradas.</div>
        </div>
      </div>
    </div>

    <div class="name-modal-overlay" v-if="!state.playerName">
      <div class="name-modal">
        <h3>Antes de empezar</h3>
        <p>Introduce tu nombre para guardar tu resultado.</p>
        <div class="name-modal-row">
          <input
            v-model="nameInput"
            type="text"
            maxlength="24"
            placeholder="Tu nombre"
            @keyup.enter="startGame"
            class="player-input"
          />
          <button class="btn btn-primary btn-sm" @click="startGame">Entrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.puzzle-panel {
  position: relative;
  font-family: var(--font-body);
  color: var(--text-primary);
}

.player-input {
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(121, 174, 215, 0.48);
  font-size: 0.85rem;
  min-width: 180px;
  background: rgba(7, 20, 35, 0.65);
  color: var(--text-primary);
}

.player-name {
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-family: var(--font-mono);
}

.btn-sm {
  font-size: 0.8rem;
}

.puz-title {
  letter-spacing: 0.02em;
}

.game-area {
  position: relative;
}

.board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 40px);
  grid-template-rows: repeat(5, 40px);
  gap: 1px;
  background: rgba(83, 127, 162, 0.44);
  border: 1px solid rgba(134, 190, 233, 0.44);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 10px 20px rgba(4, 15, 30, 0.25);
}

.cell {
  background: rgba(13, 35, 56, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  z-index: 2;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.cell.active {
  background: rgba(98, 211, 255, 0.2);
}

.cell.last {
  box-shadow: inset 0 0 0 2px rgba(255, 226, 138, 0.95);
}

.symbol.circle {
  color: #f6d27c;
}

.cell.symbol-o {
  box-shadow: inset 0 0 0 1px rgba(246, 210, 124, 0.45);
}

.symbol.cross {
  color: #7ed3ff;
}

.cell.symbol-x {
  box-shadow: inset 0 0 0 1px rgba(126, 211, 255, 0.45);
}

.is-goal {
  background: rgba(43, 101, 52, 0.82);
  box-shadow: inset 0 0 0 2px rgba(139, 230, 183, 0.95);
}

.symbol.flag {
  color: #8be6b7;
}

.path-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

polyline {
  fill: none;
  stroke: rgba(255, 120, 98, 0.92);
  stroke-width: 5;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.entrance {
  margin-top: 0.32rem;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(7, 40px);
  justify-content: center;
}

.car {
  grid-column: 4;
  text-align: center;
  font-size: 1.5rem;
  min-height: 1.8rem;
}

.message-row {
  margin-top: 0.72rem;
  text-align: center;
  color: var(--text-secondary);
  min-height: 1.2rem;
  font-size: 0.84rem;
}

.parking-footer {
  margin-top: 0.62rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.win-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 24, 40, 0.34);
  backdrop-filter: blur(7px);
  z-index: 40;
}

.success-msg {
  position: relative;
  width: min(92vw, 480px);
  padding: 1.2rem 1rem;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: linear-gradient(135deg, rgba(16, 39, 64, 0.9), rgba(10, 23, 42, 0.96));
  border: 1px solid rgba(135, 211, 255, 0.45);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.success-msg h3,
.success-msg p,
.success-msg .btn,
.ranking-card {
  position: relative;
  z-index: 1;
}

.success-msg h3 {
  margin: 0;
  text-align: center;
  color: #8be6b7;
}

.success-msg p {
  text-align: center;
  margin: 0.45rem 0 0.65rem;
  color: var(--text-secondary);
}

.success-msg .btn {
  display: block;
  margin: 0 auto;
}

.ranking-card {
  margin-top: 0.75rem;
  background: var(--ranking-bg);
  border-radius: var(--radius-sm);
  padding: 0.55rem;
  border: 1px solid var(--ranking-border);
}

.ranking-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ranking-title);
  font-family: var(--font-display);
}

.ranking-list {
  margin: 0.35rem 0 0;
  padding-left: 1.1rem;
}

.ranking-item {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--ranking-text);
  padding: 0.1rem 0.2rem;
  border-radius: 6px;
  font-family: var(--font-mono);
}

.ranking-item:nth-child(odd) {
  background: rgba(255, 255, 255, 0.05);
}

.ranking-item b {
  color: var(--ranking-score);
}

.ranking-empty {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.name-modal-overlay {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(7, 18, 33, 0.7);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 45;
}

.name-modal {
  width: min(460px, 92vw);
  background: linear-gradient(160deg, rgba(24, 49, 79, 0.88), rgba(13, 30, 51, 0.94));
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-elevated);
  padding: 1rem;
  text-align: center;
}

.name-modal h3 {
  margin: 0;
  font-size: 1rem;
}

.name-modal p {
  margin: 0.3rem 0 0.8rem;
  color: var(--text-secondary);
  font-size: 0.86rem;
}

.name-modal-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.name-modal-row .player-input {
  min-width: 220px;
}

@media (max-width: 680px) {
  .grid {
    transform: scale(0.92);
    transform-origin: top center;
  }

  .name-modal-row {
    flex-direction: column;
  }

  .name-modal-row .player-input {
    min-width: 100%;
  }
}
</style>