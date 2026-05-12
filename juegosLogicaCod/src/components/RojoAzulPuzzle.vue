<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

type Piece = 'R' | 'B' | '_'

type Slot = {
  x: number
  y: number
}

type RankingEntry = {
  name: string
  moves: number
  date: string
}

const BOARD_SCALE = 1.3
const CELL_SIZE = 58
const BASE_BOARD_WIDTH = 380
const BASE_BOARD_HEIGHT = 300
const BOARD_WIDTH = Math.round(BASE_BOARD_WIDTH * BOARD_SCALE)
const BOARD_HEIGHT = Math.round(BASE_BOARD_HEIGHT * BOARD_SCALE)

const baseSlots: Slot[] = [
  { x: 55, y: 30 },
  { x: 55, y: 90 },
  { x: 55, y: 150 },
  { x: 55, y: 210 },
  { x: 325, y: 30 },
  { x: 325, y: 90 },
  { x: 325, y: 150 },
  { x: 325, y: 210 },
  { x: 145, y: 150 },
  { x: 200, y: 150 },
  { x: 255, y: 150 },
  { x: 200, y: 90 },
]

const slots: Slot[] = baseSlots.map((s) => ({
  x: Math.round(s.x * BOARD_SCALE),
  y: Math.round(s.y * BOARD_SCALE),
}))

const ADJACENCY: Record<number, number[]> = {
  0: [1],
  1: [0, 2],
  2: [1, 3, 8],
  3: [2],
  4: [5],
  5: [4, 6],
  6: [5, 7, 10],
  7: [6],
  8: [2, 9],
  9: [8, 10, 11],
  10: [9, 6],
  11: [9],
}

const LEFT_COLUMN = [0, 1, 2, 3]
const RIGHT_COLUMN = [4, 5, 6, 7]
const RANKING_KEY = 'puzzle119-top10'

function loadRanking(): RankingEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RANKING_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RankingEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e) => typeof e.name === 'string' && typeof e.moves === 'number')
  } catch {
    return []
  }
}

function saveRanking(entries: RankingEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RANKING_KEY, JSON.stringify(entries))
}

function initBoard(): Piece[] {
  const board: Piece[] = Array<Piece>(slots.length).fill('_')
  LEFT_COLUMN.forEach((i) => {
    board[i] = 'R'
  })
  RIGHT_COLUMN.forEach((i) => {
    board[i] = 'B'
  })
  return board
}

const state = reactive({
  board: initBoard(),
  selected: null as number | null,
  hints: [] as number[],
  moves: 0,
  msg: 'Selecciona una ficha',
  playerName: '',
  scoreSaved: false,
})

const nameInput = ref('')
const isRankingShortcut = ref(false)
const ranking = ref<RankingEntry[]>(loadRanking())

function getMoves(i: number): number[] {
  const neighbors = ADJACENCY[i] ?? []
  return neighbors.filter((neighborIndex) => state.board[neighborIndex] === '_')
}

const won = computed(() => {
  const leftDone = LEFT_COLUMN.every((i) => state.board[i] === 'B')
  const rightDone = RIGHT_COLUMN.every((i) => state.board[i] === 'R')
  return leftDone && rightDone
})

function clickCell(i: number) {
  if (!state.playerName.trim()) {
    state.msg = 'Introduce tu nombre para jugar'
    return
  }

  if (won.value) return

  const piece = state.board[i]

  if (state.selected === null) {
    if (piece === '_') return
    const possibleMoves = getMoves(i)
    if (possibleMoves.length > 0) {
      state.selected = i
      state.hints = possibleMoves
      state.msg = 'Elige un destino'
    } else {
      state.msg = 'Esta ficha esta bloqueada'
    }
    return
  }

  if (state.hints.includes(i)) {
    const from = state.selected
    if (from === null) return
    const moving = state.board[from]
    if (!moving || moving === '_') return

    state.board[i] = moving
    state.board[from] = '_'
    state.moves += 1
    state.selected = null
    state.hints = []
    state.msg = 'Selecciona una ficha'
    return
  }

  if (piece !== '_') {
    const possibleMoves = getMoves(i)
    if (possibleMoves.length > 0) {
      state.selected = i
      state.hints = possibleMoves
      state.msg = 'Elige un destino'
    } else {
      state.selected = null
      state.hints = []
      state.msg = 'Ficha bloqueada'
    }
    return
  }

  state.selected = null
  state.hints = []
  state.msg = 'Selecciona una ficha'
}

function reset() {
  state.board.splice(0, state.board.length, ...initBoard())
  state.selected = null
  state.hints = []
  state.moves = 0
  state.scoreSaved = false
  state.msg = 'Selecciona una ficha'
  isRankingShortcut.value = false
}

function startGame() {
  const cleaned = nameInput.value.trim()
  if (!cleaned) return

  if (cleaned.toLowerCase() === 'winnerx') {
    state.playerName = cleaned.slice(0, 24)
    state.board.splice(0, state.board.length, ...initBoard())
    LEFT_COLUMN.forEach((i) => {
      state.board[i] = 'B'
    })
    RIGHT_COLUMN.forEach((i) => {
      state.board[i] = 'R'
    })
    state.selected = null
    state.hints = []
    state.msg = 'Selecciona una ficha'
    isRankingShortcut.value = true
    return
  }

  isRankingShortcut.value = false
  state.playerName = cleaned.slice(0, 24)
  state.msg = 'Selecciona una ficha'
}

watch(
  () => won.value,
  (isWon) => {
    if (!isWon || state.scoreSaved || !state.playerName.trim() || isRankingShortcut.value) return

    const next = [
      ...ranking.value,
      {
        name: state.playerName,
        moves: state.moves,
        date: new Date().toISOString(),
      },
    ]
      .sort((a, b) => a.moves - b.moves || a.date.localeCompare(b.date))
      .slice(0, 10)

    ranking.value = next
    saveRanking(next)
    state.scoreSaved = true
  }
)

const rankingTop10 = computed(() => ranking.value)

function cellStyle(i: number) {
  const s = slots[i]
  if (!s) {
    return {
      left: '0px',
      top: '0px',
    }
  }

  return {
    left: `${s.x - CELL_SIZE / 2}px`,
    top: `${s.y - CELL_SIZE / 2}px`,
  }
}
</script>

<template>
  <div class="puzzle-panel">
    <div class="puz-header">
      <div class="puz-num">PUZZLE N 003</div>
      <h2 class="puz-title">Rojo y Azul</h2>
    </div>
    <div class="puz-desc">
      <h3 class="puz-desc-title">Enunciado</h3>
      <p class="lead">
        El tablero tiene dos zonas bien diferenciadas: una zona azul a la izquierda con cuatro casillas, y una
        zona roja a la derecha con otras cuatro. Al empezar, las fichas están en el lado equivocado: las rojas
        ocupan la zona azul y las azules la zona roja. Tu misión es devolverlas a su lugar.
      </p>
      <p>
        Las casillas están conectadas entre sí por caminos visibles, y solo puedes mover una ficha a una casilla
        vecina que esté vacía en ese momento. En el centro del tablero hay un pequeño cruce que conecta ambas
        zonas, así que tendrás que pensar bien el orden en que mueves las piezas para no bloquearte a ti mismo.
      </p>
      <p>
        No hay límite de movimientos, pero el ranking premia a quien lo resuelva con menos. Un buen jugador
        encuentra un flujo continuo sin atascos. ¿Puedes encontrar la secuencia perfecta?
      </p>
    </div>
    <div class="player-name" v-if="state.playerName">Jugador: <b>{{ state.playerName }}</b></div>

    <div class="rb-board" :class="{ 'rb-board-locked': !state.playerName }">
      <svg
        class="rb-tracks"
        :width="BOARD_WIDTH"
        :height="BOARD_HEIGHT"
        :viewBox="`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`"
        aria-hidden="true"
      >
        <line :x1="55 * BOARD_SCALE" :y1="30 * BOARD_SCALE" :x2="55 * BOARD_SCALE" :y2="210 * BOARD_SCALE" />
        <line :x1="325 * BOARD_SCALE" :y1="30 * BOARD_SCALE" :x2="325 * BOARD_SCALE" :y2="210 * BOARD_SCALE" />
        <line :x1="55 * BOARD_SCALE" :y1="150 * BOARD_SCALE" :x2="325 * BOARD_SCALE" :y2="150 * BOARD_SCALE" />
        <line :x1="200 * BOARD_SCALE" :y1="90 * BOARD_SCALE" :x2="200 * BOARD_SCALE" :y2="150 * BOARD_SCALE" />
      </svg>

      <div
        v-for="(piece, i) in state.board"
        :key="i"
        :class="[
          'rb-cell',
          piece === 'R' ? 'red-cell' : piece === 'B' ? 'blue-cell' : '',
          LEFT_COLUMN.includes(i) ? 'vertical-left' : '',
          RIGHT_COLUMN.includes(i) ? 'vertical-right' : '',
          state.selected === i ? 'selected' : '',
          state.hints.includes(i) ? 'hint' : '',
        ]"
        :style="cellStyle(i)"
        @click="clickCell(i)"
      >
        <div v-if="piece === 'R'" class="piece-dot red-dot"></div>
        <div v-else-if="piece === 'B'" class="piece-dot blue-dot"></div>
      </div>
    </div>

    <div class="rb-msg" v-if="!won">{{ state.msg }}</div>

    <div class="rb-footer" v-if="!won">
      <span>Movimientos: <b>{{ state.moves }}</b></span>
      <button class="rb-reset" @click="reset">Reiniciar</button>
    </div>

    <div class="win-modal-overlay" v-if="won">
      <div class="success-msg">
        <h3>Puzzle resuelto</h3>
        <p>Has completado el tablero en {{ state.moves }} movimientos.</p>
        <button class="btn btn-primary" @click="reset">Jugar de nuevo</button>

        <div class="ranking-card">
          <div class="ranking-title">Top 10</div>
          <ol v-if="rankingTop10.length > 0" class="ranking-list">
            <li v-for="(entry, idx) in rankingTop10" :key="`${entry.name}-${entry.date}-${idx}`" class="ranking-item">
              <span>{{ entry.name }}</span>
              <b>{{ entry.moves }} mov.</b>
            </li>
          </ol>
          <div v-else class="ranking-empty">Sin partidas registradas.</div>
        </div>
      </div>
    </div>

    <div class="name-modal-overlay" v-if="!state.playerName">
      <div class="name-modal">
        <h3>Antes de empezar</h3>
        <p>Introduce tu nombre para registrar tu resultado.</p>
        <div class="name-modal-row">
          <input
            id="player-name"
            v-model="nameInput"
            type="text"
            maxlength="24"
            placeholder="Escribe tu nombre"
            @keyup.enter="startGame"
          />
          <button class="rb-start" @click="startGame">Entrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.puzzle-panel {
  position: relative;
  padding: 1.1rem;
  border-radius: var(--radius-lg);
  background: linear-gradient(160deg, rgba(19, 33, 55, 0.78), rgba(10, 22, 39, 0.92));
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-elevated), inset 0 1px 0 rgba(255, 255, 255, 0.09);
  overflow: hidden;
  max-width: 800px;
  margin: 1em auto;
}

.puz-header {
  position: relative;
  z-index: 1;
  margin: 0.95rem 1rem;
}

.puz-num {
  font-family: var(--font-mono);
  font-size: 0.67rem;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  background: rgba(8, 21, 40, 0.7);
  border: 1px solid rgba(188, 224, 255, 0.3);
  border-radius: 999px;
  padding: 0.15rem 0.44rem;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.puz-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-primary);
}

.puz-desc {
  position: relative;
  z-index: 1;
  margin: 0.95rem 1rem;
  color: var(--text-secondary);
  text-align: left;
  max-width: 760px;
  margin-inline: auto;
  padding: 1rem 1.1rem 1.05rem 1.6rem;
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(8, 21, 40, 0.58), rgba(8, 21, 40, 0.28));
  border: 1px solid rgba(151, 193, 238, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 24px rgba(2, 10, 22, 0.18);
}

.puz-desc::before {
  content: '';
  position: absolute;
  left: 0.8rem;
  top: 0.8rem;
  bottom: 0.8rem;
  width: 4px;
  border-radius: 2px;
  background: var(--accent-rojoyazul);
  box-shadow: 0 0 14px rgba(85, 204, 255, 0.28);
  pointer-events: none;
}

.puz-desc-title {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.55rem;
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-primary);
}

.puz-desc-title::before {
  content: '';
  width: 1.1rem;
  height: 2px;
  border-radius: 999px;
  background: var(--accent-rojoyazul);
  box-shadow: 0 0 10px rgba(85, 204, 255, 0.55);
}

.puz-desc p {
  margin: 0 0 0.65rem;
  font-size: 0.84rem;
  line-height: 1.55;
}

.puz-desc p:last-child {
  margin-bottom: 0;
}

.puz-desc .lead {
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.65;
}

.player-name {
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-family: var(--font-mono);
}

.rb-board {
  position: relative;
  width: 494px;
  height: 390px;
  margin: 1rem auto;
}

.rb-board-locked {
  opacity: 0.55;
  pointer-events: none;
}

.rb-name-row {
  display: flex;
  gap: 8px;
}

.rb-name-row input {
  flex: 1;
  border: 1px solid rgba(118, 168, 214, 0.5);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.75rem;
  min-height: 44px;
  font-size: 0.82rem;
  background: rgba(7, 20, 35, 0.65);
  color: var(--text-primary);
}

.rb-start {
  border: 1px solid rgba(189, 161, 255, 0.55);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.9rem;
  min-height: 44px;
  font-size: 0.8rem;
  color: #1a0735;
  background: linear-gradient(145deg, #d5bcff, var(--accent-rojoyazul));
  cursor: pointer;
  font-weight: 700;
}



.rb-tracks {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

.rb-tracks line {
  stroke: rgba(158, 198, 238, 0.66);
  stroke-width: 5;
}

.rb-cell {
  position: absolute;
  width: 58px;
  height: 58px;
  border-radius: var(--radius-sm);
  border: 2px solid rgba(119, 159, 206, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  z-index: 2;
  background: rgba(21, 44, 71, 0.7);
  cursor: default;
}

.rb-cell.red-cell {
  background: transparent;
}

.rb-cell.blue-cell {
  background: transparent;
}

.rb-cell.red-cell,
.rb-cell.blue-cell,
.rb-cell.hint {
  cursor: pointer;
}

.rb-cell.vertical-left {
  background: rgba(72, 132, 248, 0.26);
}

.rb-cell.vertical-right {
  background: rgba(255, 94, 116, 0.24);
}

.rb-cell.hint {
  background: rgba(164, 123, 255, 0.38);
  border-color: var(--accent-rojoyazul);
}

.rb-cell.selected {
  outline: 3px solid #f5d16a;
  outline-offset: 1px;
}

.piece-dot {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  pointer-events: none;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.25);
}

.red-dot {
  background: radial-gradient(circle at 35% 32%, #ff8866, #cc2200);
}

.blue-dot {
  background: radial-gradient(circle at 35% 32%, #6688ff, #1133cc);
}

.rb-msg {
  text-align: center;
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.rb-footer {
  text-align: center;
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.rb-reset {
  font-size: 0.78rem;
  padding: 0.45rem 0.95rem;
  min-height: 44px;
  background: rgba(18, 44, 70, 0.7);
  color: var(--text-primary);
  border: 1px solid rgba(134, 190, 233, 0.44);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 700;
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

.name-modal-row input {
  flex: 1;
  max-width: 260px;
  border: 1px solid rgba(118, 168, 214, 0.5);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.75rem;
  min-height: 44px;
  font-size: 0.82rem;
  background: rgba(7, 20, 35, 0.65);
  color: var(--text-primary);
}

@media (max-width: 430px) {
  .rb-card {
    max-width: 98vw;
  }

  .name-modal-row {
    flex-direction: column;
    align-items: center;
  }

  .name-modal-row input {
    width: min(90%, 280px);
    max-width: 100%;
  }

  .rb-board {
    transform: scale(0.72);
    transform-origin: top center;
    margin-bottom: -95px;
  }
}
</style>
