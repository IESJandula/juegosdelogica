<script setup lang="ts">
// @ts-nocheck
import { computed, ref, reactive, watch } from 'vue'

const GRID_SIZE = 10
const DIRS = ['up', 'right', 'down', 'left']
const DIR_DELTA = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }
const DIR_DEG = { up: 0, right: 90, down: 180, left: 270 }

const LEVELS = [
  {
    robot: { x: 5, y: 5, dir: 'right' },
    path: (g) => {
      for (let i = 2; i < 8; i++) g[5][i].color = 'blue'
      for (let i = 2; i < 8; i++) g[i][5].color = 'blue'
      g[5][5].color = 'green'
      g[2][5].hasStar = true
    },
    stars: 1,
  },
  {
    robot: { x: 1, y: 8, dir: 'right' },
    path: (g) => {
      for (let i = 1; i < 9; i++) g[8][i].color = 'blue'
      for (let i = 4; i < 9; i++) g[4][i].color = 'blue'
      for (let i = 4; i < 9; i++) g[i][4].color = 'blue'
      g[8][1].color = 'green'
      g[4][8].hasStar = true
    },
    stars: 1,
  },
  {
    robot: { x: 2, y: 2, dir: 'down' },
    path: (g) => {
      for (let i = 2; i < 8; i++) g[2][i].color = 'blue'
      for (let i = 2; i < 8; i++) g[7][i].color = 'blue'
      for (let i = 2; i < 8; i++) g[i][2].color = 'blue'
      g[7][2].color = 'red'
      g[2][2].color = 'green'
      g[7][7].hasStar = true
    },
    stars: 1,
  },
  {
    robot: { x: 1, y: 1, dir: 'right' },
    path: (g) => {
      for (let i = 1; i < 9; i++) g[1][i].color = 'blue'
      for (let i = 1; i < 7; i++) g[i][8].color = 'red'
      for (let i = 2; i < 9; i++) g[6][i].color = 'green'
      for (let i = 2; i < 7; i++) g[i][2].color = 'blue'
      for (let i = 2; i < 8; i++) g[3][i].color = 'red'
      for (let i = 3; i < 6; i++) g[i][7].color = 'green'
      g[1][1].color = 'green'
      g[5][7].hasStar = true
    },
    stars: 1,
  },
  {
    robot: { x: 8, y: 8, dir: 'up' },
    path: (g) => {
      for (let i = 2; i < 9; i++) g[i][8].color = 'blue'
      for (let i = 4; i < 9; i++) g[2][i].color = 'red'
      for (let i = 2; i < 7; i++) g[i][4].color = 'green'
      for (let i = 4; i < 7; i++) g[6][i].color = 'blue'
      g[7][6].color = 'red'
      g[8][8].color = 'green'
      g[7][6].hasStar = true
    },
    stars: 1,
  },
]

const currentLevel = ref(0)
const puzzleSolved = computed(() => message.value.includes('RESUELTO'))
const nameInput = ref('')
const playerName = ref('')
const scoreSaved = ref(false)
const totalScore = ref(0)

type RankingEntry = {
  name: string
  score: number
  date: string
  phaseScores?: number[]
}

const RANKING_KEY = 'ships-top10'

function loadRanking(): RankingEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RANKING_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RankingEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) => typeof entry.name === 'string' && typeof entry.score === 'number',
    )
  } catch {
    return []
  }
}

function saveRanking(entries: RankingEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RANKING_KEY, JSON.stringify(entries))
}

const ranking = ref<RankingEntry[]>(loadRanking())
const rankingTop10 = computed(() => ranking.value)

// Cuenta solo slots que tienen comando (las condiciones solas no puntúan)
const usedSlotsScore = computed(() =>
  ['f0', 'f1', 'f2'].reduce((total, funcName) => {
    return total + programs[funcName].filter((slot) => slot.cmd !== null).length
  }, 0),
)

const phaseScores = ref<number[]>([])

const createGrid = () =>
  Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ color: 'white', hasStar: false })),
  )

const applyLevel = (targetGrid, lvl) => {
  LEVELS[lvl].path(targetGrid)
}

const grid = reactive(createGrid())
const robot = reactive({ ...LEVELS[0].robot })
const isRunning = ref(false)
const message = ref('Diseña tu algoritmo y pulsa Ejecutar')
const starsCollected = ref(0)
const executionLog = reactive([])

// Función activa visible en el log
const activeFunc = ref('f0')

const loadLevel = (lvl, nextMessage = 'Diseña tu algoritmo y pulsa Ejecutar') => {
  currentLevel.value = lvl
  const fresh = createGrid()
  applyLevel(fresh, lvl)

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      Object.assign(grid[y][x], fresh[y][x])
    }
  }

  Object.assign(robot, LEVELS[lvl].robot)
  starsCollected.value = 0
  executionLog.splice(0)
  activeFunc.value = 'f0'
  message.value = nextMessage
}

const restartCurrentLevel = (reason) => {
  loadLevel(currentLevel.value, reason)
}

// Captura el score ANTES de limpiar el programa
const registerPhaseScore = () => {
  const phaseScore = usedSlotsScore.value
  phaseScores.value = [...phaseScores.value, phaseScore]
  totalScore.value = phaseScores.value.reduce((sum, value) => sum + value, 0)
}

loadLevel(0)

const FUNC_SLOTS = 8
const programs = reactive({
  f0: Array.from({ length: FUNC_SLOTS }, () => ({ cmd: null, cond: null })),
  f1: Array.from({ length: FUNC_SLOTS }, () => ({ cmd: null, cond: null })),
  f2: Array.from({ length: FUNC_SLOTS }, () => ({ cmd: null, cond: null })),
})

const activeSlot = reactive({ func: 'f0', index: 0 })
const dragCmd = ref(null)
const dragCond = ref(null)

// ── DRAG & DROP ──────────────────────────────────────────────
const onDragStartCmd = (cmd) => {
  dragCmd.value = cmd
  dragCond.value = null
}
const onDragStartCond = (color) => {
  dragCond.value = color
  dragCmd.value = null
}

const onDropSlot = (fName, i) => {
  if (dragCmd.value) {
    programs[fName][i].cmd = dragCmd.value
  } else if (dragCond.value) {
    programs[fName][i].cond = programs[fName][i].cond === dragCond.value ? null : dragCond.value
  }
  dragCmd.value = null
  dragCond.value = null
}

// ── CLICK en paleta ──────────────────────────────────────────
const selectSlot = (f, i) => {
  activeSlot.func = f
  activeSlot.index = i
}

const setCommand = (cmd) => {
  programs[activeSlot.func][activeSlot.index].cmd = cmd
  const next = activeSlot.index + 1
  if (next < FUNC_SLOTS) activeSlot.index = next
}

const toggleCond = (color) => {
  const slot = programs[activeSlot.func][activeSlot.index]
  slot.cond = slot.cond === color ? null : color
}

const clearSlot = (fName, i) => {
  programs[fName][i].cmd = null
  programs[fName][i].cond = null
}

// ── EJECUCIÓN ────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const SPEED = 350

async function run() {
  if (isRunning.value) return
  isRunning.value = true
  message.value = 'Ejecutando...'
  executionLog.splice(0)
  activeFunc.value = 'f0'

  let steps = 0
  const MAX_STEPS = 1000

  const execute = async (funcName, depth = 0) => {
    if (depth > 20) return
    activeFunc.value = funcName
    const program = programs[funcName]

    for (let i = 0; i < program.length; i++) {
      if (!isRunning.value || steps > MAX_STEPS) return
      const { cmd, cond } = program[i]
      if (!cmd) continue

      const cell = grid[robot.y][robot.x]
      if (cond && cell.color !== cond) continue

      steps++

      // Log con función activa destacada
      const condLabel = cond ? ` (${cond})` : ''
      executionLog.unshift(`${funcName}[${i}]: ${cmd}${condLabel}`)
      if (executionLog.length > 12) executionLog.pop()

      if (cmd === 'move') {
        const [dx, dy] = DIR_DELTA[robot.dir]
        const nx = robot.x + dx
        const ny = robot.y + dy
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
          isRunning.value = false
          restartCurrentLevel('💥 ¡Fuera del mapa! Reiniciando fase...')
          return
        }
        // Mover primero y comprobar si la celda destino forma parte del camino
        const newCell = grid[ny][nx]
        // Consideramos que las casillas sin color (white) están fuera del camino
        if (!newCell.color || newCell.color === 'white') {
          isRunning.value = false
          restartCurrentLevel('💥 ¡Fuera del camino! Reiniciando fase...')
          return
        }
        robot.x = nx
        robot.y = ny
      } else if (cmd === 'left') {
        const idx = DIRS.indexOf(robot.dir)
        robot.dir = DIRS[(idx + 3) % 4]
      } else if (cmd === 'right') {
        const idx = DIRS.indexOf(robot.dir)
        robot.dir = DIRS[(idx + 1) % 4]
      } else if (['f0', 'f1', 'f2'].includes(cmd)) {
        await execute(cmd, depth + 1)
        // Al volver de la subfunción, restauramos el contexto
        activeFunc.value = funcName
        if (!isRunning.value) return
      }

      if (grid[robot.y][robot.x].hasStar) {
        grid[robot.y][robot.x].hasStar = false
        starsCollected.value++
        if (starsCollected.value >= LEVELS[currentLevel.value].stars) {
          // 1. Capturar score ANTES de limpiar
          registerPhaseScore()
          const nextLevel = currentLevel.value + 1
          if (nextLevel < LEVELS.length) {
            isRunning.value = false
            // 2. Limpiar programa para que la siguiente fase puntúe desde 0
            clearAll()
            loadLevel(
              nextLevel,
              `✅ Fase ${currentLevel.value + 1} completada. Fase ${nextLevel + 1} lista.`,
            )
            return
          }

          message.value = '⭐ ¡PUZZLE RESUELTO! ⭐'
          isRunning.value = false
          return
        }
      }

      await sleep(SPEED)
    }
  }

  await execute('f0')
  if (!isRunning.value) return

  if (starsCollected.value < LEVELS[currentLevel.value].stars) {
    isRunning.value = false
    restartCurrentLevel('No llegaste a la estrella. Reiniciando fase...')
    return
  }

  message.value = steps > MAX_STEPS ? '⚠ Demasiados pasos (bucle infinito)' : 'Programa terminado'
  isRunning.value = false
}

const stopExecution = () => {
  isRunning.value = false
  message.value = 'Detenido'
}

const clearAll = () => {
  ;['f0', 'f1', 'f2'].forEach((f) =>
    programs[f].forEach((s) => {
      s.cmd = null
      s.cond = null
    }),
  )
}

function startGame() {
  const cleaned = nameInput.value.trim()
  if (!cleaned) return
  playerName.value = cleaned.slice(0, 24)
  nameInput.value = ''
  message.value = 'Diseña tu algoritmo y pulsa Ejecutar'
}

function saveScoreIfNeeded() {
  if (!puzzleSolved.value || scoreSaved.value || !playerName.value.trim()) return

  const next = [
    ...ranking.value,
    {
      name: playerName.value,
      score: totalScore.value,
      date: new Date().toISOString(),
      phaseScores: [...phaseScores.value],
    },
  ]
    .sort((a, b) => a.score - b.score || a.date.localeCompare(b.date))
    .slice(0, 10)

  ranking.value = next
  saveRanking(next)
  scoreSaved.value = true
}

watch(
  () => puzzleSolved.value,
  (isWon) => {
    if (isWon) saveScoreIfNeeded()
  },
)

// ── HELPERS DISPLAY ──────────────────────────────────────────
const CMD_ICON = {
  left: '↩',
  move: '↑',
  right: '↪',
  f0: 'f0',
  f1: 'f1',
  f2: 'f2',
}

const COND_BG = { red: '#e74c3c', green: '#2ecc71', blue: '#3498db' }

const FUNC_COLOR = { f0: '#ffffff', f1: '#ffffff', f2: '#ffffff' }

const slotBg = (slot) => {
  if (!slot.cmd) return '#2a2f3e'
  if (slot.cond) return COND_BG[slot.cond]
  return '#3d4560'
}

const robotStyle = () => ({
  transform: `rotate(${DIR_DEG[robot.dir]}deg)`,
})

// Color del log según función
const logColor = (line) => {
  if (line.startsWith('f0')) return '#7eb8ff'
  if (line.startsWith('f1')) return '#ffb347'
  if (line.startsWith('f2')) return '#b47eff'
  return '#8af'
}
</script>

<template>
  <div class="puzzle-panel">
    <div class="player-name" v-if="playerName">
      Jugador: <b>{{ playerName }}</b>
    </div>

    <div class="puz-header">
      <div>
        <div class="puz-num">PUZZLE N 005</div>
        <h2 class="puz-title">SHIPS</h2>
      </div>
      <div class="puz-meta">
        <span class="meta-pill">Fase {{ currentLevel + 1 }} / {{ LEVELS.length }}</span>
        <span class="meta-pill accent">⭐ {{ starsCollected }} / {{ LEVELS[currentLevel].stars }}</span>
        <span class="meta-pill score">Σ {{ totalScore }} pts</span>
      </div>
    </div>

    <div class="puz-desc">
      <h3 class="puz-desc-title">Enunciado</h3>
      <p class="lead">
        Una nave espacial recorre un mapa de casillas de colores y necesita recoger una estrella al final de cada
        fase. Pero aquí no hay control directo: tú eres el programador, no el piloto. Debes construir el algoritmo
        que guíe a la nave hasta su destino.
      </p>
      <p>
        Tienes tres funciones —f0, f1 y f2— con hasta 8 instrucciones cada una. Los comandos disponibles son
        avanzar, girar a la izquierda y girar a la derecha. También puedes llamar a una función desde otra, lo que
        te permite crear bucles y estructuras recursivas.
      </p>
      <p>
        El truco está en las condiciones de color: puedes hacer que un comando solo se ejecute cuando la nave esté
        sobre una casilla roja, verde o azul, lo que te permite construir comportamientos distintos con muy pocas
        instrucciones.
      </p>
      <p>
        La nave debe mantenerse siempre dentro del camino marcado. Si sale, la fase se reinicia. El juego tiene
        cinco fases con mapas cada vez más complejos, y la puntuación final es la suma de comandos usados en todas
        ellas: cuantos menos, mejor. El verdadero reto no es terminar, sino hacerlo con elegancia.
      </p>
    </div>

    <div v-if="!puzzleSolved" class="game-area" :class="{ 'is-shaking': message.includes('💥') }">
      <div class="ships-scene">

        <!-- PALETA -->
        <aside class="panel-card palette-panel">
          <div class="section-title">Comandos</div>
          <div class="cmd-group">
            <button
              v-for="cmd in ['left', 'move', 'right']"
              :key="cmd"
              class="btn-cmd"
              draggable="true"
              @dragstart="onDragStartCmd(cmd)"
              @click="setCommand(cmd)"
            >{{ CMD_ICON[cmd] }}</button>
          </div>
          <div class="cmd-group" style="margin-top: 6px">
            <button
              v-for="fn in ['f0', 'f1', 'f2']"
              :key="fn"
              class="btn-fn"
              :style="{ borderColor: FUNC_COLOR[fn] + '88', color: FUNC_COLOR[fn] }"
              draggable="true"
              @dragstart="onDragStartCmd(fn)"
              @click="setCommand(fn)"
            >{{ fn }}</button>
          </div>

          <div class="section-title" style="margin-top: 14px">Condición</div>
          <div class="cond-group">
            <button
              v-for="c in ['red', 'green', 'blue']"
              :key="c"
              class="btn-cond"
              :style="{ background: COND_BG[c] }"
              draggable="true"
              @dragstart="onDragStartCond(c)"
              @click="toggleCond(c)"
            ></button>
          </div>

          <button class="btn-clear" style="margin-top: 14px" @click="clearAll">🗑 Limpiar</button>
        </aside>

        <!-- TABLERO -->
        <section class="panel-card board-panel">
          <div
            class="board-message"
            :class="{ solved: message.includes('RESUELTO'), error: message.includes('💥') }"
          >{{ message }}</div>

          <div class="grid">
            <div v-for="(row, y) in grid" :key="y" class="row">
              <div v-for="(cell, x) in row" :key="x" class="cell" :class="[cell.color]">
                <img
                  v-if="robot.x === x && robot.y === y"
                  class="ship-image"
                  src="/images/nave.webp"
                  alt="Nave"
                  :style="robotStyle()"
                />
                <span v-else-if="cell.hasStar" class="star">⭐</span>
              </div>
            </div>
          </div>

          <div class="controls">
            <button class="btn-run" @click="run" :disabled="isRunning">▶ Ejecutar</button>
            <button class="btn-stop" @click="stopExecution" :disabled="!isRunning">⏹ Parar</button>
          </div>

          <!-- LOG con colores por función -->
          <div class="log" v-if="executionLog.length">
            <div
              v-for="(line, i) in executionLog"
              :key="i"
              class="log-line"
              :style="{ opacity: 1 - i * 0.07, color: logColor(line) }"
            >{{ line }}</div>
          </div>
        </section>

        <!-- EDITOR -->
        <aside class="panel-card editor-panel">
          <div class="section-title">Funciones</div>
          <div
            v-for="fName in ['f0', 'f1', 'f2']"
            :key="fName"
            class="func-row"
            :class="{ 'func-active': isRunning && activeFunc === fName }"
          >
            <span class="func-label" :style="{ color: FUNC_COLOR[fName] }">{{ fName }}</span>
            <div class="slots">
              <div
                v-for="(slot, i) in programs[fName]"
                :key="i"
                class="slot"
                :class="{ active: activeSlot.func === fName && activeSlot.index === i }"
                :style="{ background: slotBg(slot) }"
                @click="selectSlot(fName, i)"
                @dblclick="clearSlot(fName, i)"
                @dragover.prevent
                @drop="onDropSlot(fName, i)"
              >
                <span
                  v-if="slot.cmd"
                  class="slot-icon"
                  :style="{ color: ['f0','f1','f2'].includes(slot.cmd) ? FUNC_COLOR[slot.cmd] : '#eee' }"
                >{{ CMD_ICON[slot.cmd] }}</span>
              </div>
            </div>
          </div>

          <div class="section-title note" style="margin-top: 16px">
            Click = seleccionar · Doble click = borrar slot · Drag & drop disponible
          </div>

          <!-- Indicador función activa -->
          <div class="section-title" style="margin-top: 16px">
            Ejecutando:
            <span
              v-if="isRunning"
              class="active-fn-badge"
              :style="{ background: FUNC_COLOR[activeFunc] + '33', color: FUNC_COLOR[activeFunc], borderColor: FUNC_COLOR[activeFunc] + '88' }"
            >{{ activeFunc }}</span>
            <span v-else class="active-fn-badge muted">—</span>
          </div>

          <div class="section-title" style="margin-top: 10px">Vista f0</div>
          <div class="exec-bar">
            <div
              v-for="(slot, i) in programs.f0"
              :key="i"
              class="exec-slot"
              :style="{
                background: slot.cmd ? (slot.cond ? COND_BG[slot.cond] : '#3d4560') : '#1e2230',
              }"
            >
              <span
                v-if="slot.cmd"
                class="exec-icon"
                :style="{ color: ['f0','f1','f2'].includes(slot.cmd) ? FUNC_COLOR[slot.cmd] : '#eee' }"
              >{{ CMD_ICON[slot.cmd] }}</span>
            </div>
          </div>

          <!-- Puntuación por fase -->
          <div class="section-title" style="margin-top: 16px">Puntuación por fase</div>
          <div class="phase-scores">
            <div
              v-for="(ps, i) in phaseScores"
              :key="i"
              class="phase-score-item"
            >
              <span class="phase-label">Fase {{ i + 1 }}</span>
              <span class="phase-val">{{ ps }} cmds</span>
            </div>
            <div v-if="phaseScores.length" class="phase-score-item total-row">
              <span class="phase-label">Total</span>
              <span class="phase-val accent">{{ totalScore }}</span>
            </div>
            <div v-else class="phase-empty">Sin fases completadas</div>
          </div>
        </aside>

      </div>
    </div>

    <!-- PANTALLA DE VICTORIA -->
    <div v-else class="win-modal-overlay">
      <div class="success-msg">
        <h3>⭐ Puzzle resuelto</h3>
        <p>Has completado las {{ LEVELS.length }} fases usando <b>{{ totalScore }} comandos</b> en total.</p>

        <div class="phase-breakdown">
          <div v-for="(ps, i) in phaseScores" :key="i" class="breakdown-row">
            <span>Fase {{ i + 1 }}</span><b>{{ ps }} cmds</b>
          </div>
        </div>

        

        <div class="ranking-card">
          <div class="ranking-title">🏆 Top 10</div>
          <ol v-if="rankingTop10.length > 0" class="ranking-list">
            <li
              v-for="(entry, idx) in rankingTop10"
              :key="`${entry.name}-${entry.date}-${idx}`"
              class="ranking-item"
            >
              <span>{{ entry.name }}</span>
              <b>{{ entry.score }} pts</b>
            </li>
          </ol>
          <div v-else class="ranking-empty">Sin partidas registradas.</div>
        </div>
      </div>
    </div>

    <!-- MODAL NOMBRE -->
    <div class="name-modal-overlay" v-if="!playerName">
      <div class="name-modal">
        <h3>Antes de empezar</h3>
        <p>Introduce tu nombre para guardar tu ranking.</p>
        <div class="name-modal-row">
          <input
            v-model="nameInput"
            type="text"
            maxlength="24"
            placeholder="Tu nombre"
            @keyup.enter="startGame"
            class="player-input"
          />
          <button class="btn-primary btn-sm" @click="startGame">Entrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.puzzle-panel {
  position: relative;
  width: min(1180px, 98vw);
  margin: 0 auto;
  padding: clamp(1.1rem, 2vw, 2rem);
  font-family: var(--font-body);
  color: var(--text-primary);
}

.puzzle-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  background: linear-gradient(160deg, var(--bg-card) 0%, var(--bg-card-strong) 100%);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-elevated), inset 0 1px 0 rgba(255, 255, 255, 0.11);
  z-index: -1;
}

.puz-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.puz-num {
  font-size: 0.78rem;
  color: var(--accent-primary);
  letter-spacing: 0.2em;
  font-family: var(--font-mono);
}

.puz-title {
  font-size: clamp(1.45rem, 2.1vw, 1.85rem);
  color: var(--text-primary);
  font-weight: 800;
  margin: 0.2rem 0 0;
  font-family: var(--font-display);
}

.puz-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.meta-pill {
  padding: 0.35rem 0.72rem;
  border-radius: 999px;
  background: rgba(85, 204, 255, 0.14);
  border: 1px solid rgba(85, 204, 255, 0.25);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.meta-pill.accent { color: var(--accent-primary); }
.meta-pill.score { color: #ffb347; border-color: rgba(255, 179, 71, 0.35); background: rgba(255, 179, 71, 0.1); }

.puz-desc {
  position: relative;
  z-index: 1;
  margin: 0.95rem 1rem;
  max-width: 760px;
  margin-inline: auto;
  padding: 1rem 1.1rem 1.05rem;
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(8, 21, 40, 0.58), rgba(8, 21, 40, 0.28));
  border: 1px solid rgba(151, 193, 238, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 24px rgba(2, 10, 22, 0.18);
  color: var(--text-secondary);
  text-align: left;
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

.game-area { position: relative; }

.ships-scene {
  display: grid;
  grid-template-columns: minmax(112px, 128px) minmax(0, 1fr) minmax(230px, 280px);
  gap: 0.9rem;
  align-items: start;
}

.panel-card {
  background: linear-gradient(160deg, rgba(21, 37, 61, 0.72), rgba(12, 24, 42, 0.9));
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.palette-panel, .editor-panel { padding: 0.9rem 0.85rem; }

.board-panel {
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.82rem;
}

.board-message {
  min-height: 1.4rem;
  text-align: center;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--ranking-title);
}

.board-message.solved { color: var(--state-success); }
.board-message.error { color: var(--state-error); }

.section-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #7d9ab9;
  margin-bottom: 6px;
}

.section-title.note { font-size: 10px; color: #7f94aa; line-height: 1.35; }

.cmd-group { display: flex; gap: 4px; }

.btn-cmd, .btn-fn, .btn-cond, .btn-clear,
.btn-run, .btn-stop, .btn-reset, .btn-primary {
  border-radius: 10px;
  transition: transform 0.15s ease, filter 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.btn-cmd {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(147, 181, 211, 0.28);
  background: rgba(30, 46, 70, 0.82);
  color: #dde8f7;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cmd:hover, .btn-fn:hover, .btn-cond:hover,
.btn-run:not(:disabled):hover, .btn-stop:not(:disabled):hover,
.btn-reset:hover, .btn-clear:hover, .btn-primary:hover {
  transform: translateY(-1px);
}

.btn-fn {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(147, 181, 211, 0.28);
  background: rgba(42, 56, 86, 0.82);
  color: #b9cfff;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}

.cond-group { display: flex; flex-direction: column; gap: 5px; }

.btn-cond { width: 36px; height: 22px; border: none; cursor: pointer; }

.btn-clear {
  width: 100%;
  font-size: 11px;
  background: rgba(107, 35, 35, 0.85);
  border: 1px solid rgba(255, 131, 131, 0.32);
  color: #ffb1b1;
  padding: 0.45rem 0.55rem;
  cursor: pointer;
}

.grid {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(154, 189, 225, 0.16);
  box-shadow: 0 0 0 1px rgba(8, 16, 29, 0.2);
}

.row { display: flex; }

.cell {
  width: 36px;
  height: 36px;
  border: 1px solid #1e2230;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #12151f;
  transition: background 0.2s;
}

.cell.blue { background: #1a3a5c; border-color: #1e4a72; }
.cell.green { background: #1a5c2a; border-color: #2ecc71; }
.cell.red { background: #5c1a1a; border-color: #e74c3c; }

.star { font-size: 16px; animation: pulse 1.5s infinite; }

.ship-image {
  width: 52px;
  height: 52px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  transform-origin: center center;
  transition: transform 0.2s ease;
  position: relative;
  z-index: 2;
}

.board-panel .controls {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-run {
  padding: 0.55rem 1rem;
  background: rgba(31, 112, 49, 0.88);
  border: 1px solid rgba(46, 204, 113, 0.55);
  color: #d8ffe8;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
}

.btn-stop {
  padding: 0.55rem 0.95rem;
  background: rgba(111, 33, 33, 0.88);
  border: 1px solid rgba(231, 76, 60, 0.55);
  color: #ffd0d0;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-reset {
  padding: 0.55rem 0.95rem;
  background: rgba(41, 52, 73, 0.88);
  border: 1px solid rgba(154, 189, 225, 0.22);
  color: #d4e3f3;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-run:disabled, .btn-stop:disabled { opacity: 0.45; cursor: not-allowed; }

.log {
  background: rgba(9, 15, 27, 0.72);
  border: 1px solid rgba(147, 181, 211, 0.2);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  width: 100%;
}

.log-line {
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 1px 0;
}

/* Fila de función activa durante ejecución */
.func-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 3px 4px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: border-color 0.2s, background 0.2s;
}

.func-row.func-active {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

.func-label {
  font-size: 12px;
  font-weight: 700;
  width: 22px;
}

.slots { display: flex; gap: 3px; flex-wrap: wrap; }

.slot {
  width: 26px;
  height: 26px;
  border: 1px solid #344;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.slot:hover { border-color: #88aaff; }

.slot.active {
  border: 2px solid #3498db;
  box-shadow: 0 0 6px #3498db66;
}

.slot-icon, .exec-icon { font-size: 13px; line-height: 1; }

/* Badge función activa */
.active-fn-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  border: 1px solid transparent;
  margin-left: 4px;
  transition: all 0.2s;
}

.active-fn-badge.muted {
  background: rgba(255,255,255,0.05);
  color: #556;
  border-color: #334;
}

.exec-bar { display: flex; gap: 3px; flex-wrap: wrap; }

.exec-slot {
  width: 24px;
  height: 24px;
  border: 1px solid #2a2f40;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

/* Puntuación por fase */
.phase-scores {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.phase-score-item {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  padding: 2px 4px;
  border-radius: 4px;
}

.phase-score-item.total-row {
  border-top: 1px solid rgba(255,255,255,0.1);
  margin-top: 2px;
  padding-top: 4px;
  font-weight: 700;
}

.phase-val.accent { color: #ffb347; }
.phase-empty { font-size: 10px; color: #556; font-family: var(--font-mono); }

/* Victoria */
.win-modal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 24, 40, 0.34);
  backdrop-filter: blur(7px);
  z-index: 40;
  border-radius: var(--radius-lg);
}

.success-msg {
  width: min(92vw, 460px);
  padding: 1.3rem 1.1rem;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: linear-gradient(135deg, rgba(16, 39, 64, 0.9), rgba(10, 23, 42, 0.96));
  border: 1px solid rgba(135, 211, 255, 0.45);
  box-shadow: var(--shadow-soft);
  text-align: center;
}

.success-msg h3 { margin: 0; color: #8be6b7; }
.success-msg p { margin: 0.4rem 0 0.6rem; color: var(--text-secondary); }

.phase-breakdown {
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.breakdown-row b { color: #7eb8ff; }

.ranking-card {
  margin-top: 0.85rem;
  background: var(--ranking-bg);
  border-radius: var(--radius-sm);
  padding: 0.55rem;
  border: 1px solid var(--ranking-border);
  text-align: left;
}

.ranking-title { font-size: 0.86rem; font-weight: 700; color: var(--ranking-title); }

.ranking-list {
  margin: 0.35rem 0 0;
  padding-left: 1.1rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.ranking-item {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--ranking-text);
  padding: 0.1rem 0.2rem;
  border-radius: 6px;
}

.ranking-item:nth-child(odd) { background: rgba(255, 255, 255, 0.05); }
.ranking-item b { color: var(--ranking-score); }
.ranking-empty { margin-top: 0.35rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); }

/* Modal nombre */
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

.name-modal h3 { margin: 0; font-size: 1rem; }
.name-modal p { margin: 0.3rem 0 0.8rem; color: var(--text-secondary); font-size: 0.86rem; }

.name-modal-row { display: flex; gap: 0.5rem; justify-content: center; }

.player-input {
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(121, 174, 215, 0.48);
  font-size: 0.85rem;
  min-width: 180px;
  background: rgba(7, 20, 35, 0.65);
  color: var(--text-primary);
}

.btn-sm { font-size: 0.8rem; }

.btn-primary {
  padding: 0.6rem 1rem;
  background: rgba(85, 204, 255, 0.16);
  border: 1px solid rgba(85, 204, 255, 0.42);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 700;
}

.is-shaking { animation: shake 0.42s linear; }

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(7px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
  100% { transform: translateX(0); }
}

@media (max-width: 980px) {
  .ships-scene { grid-template-columns: 1fr; }
  .palette-panel, .editor-panel, .board-panel { width: 100%; }
}

@media (max-width: 700px) {
  .puz-header { flex-direction: column; align-items: flex-start; }
  .puz-meta { justify-content: flex-start; }
  .board-panel .controls { width: 100%; }
  .board-panel .controls .btn-run,
  .board-panel .controls .btn-stop,
  .board-panel .controls .btn-reset { flex: 1 1 100%; }
  .name-modal-row { flex-direction: column; align-items: center; }
  .name-modal-row .player-input { width: min(90%, 290px); }
}
</style>