<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import wolfImg from '../source/Cabeza de lobo con ojos azules.png'
import chickImg from '../source/Pollito tierno y vibrante.png'
import wolfDangerImg from '../source/Cabeza de lobo agresiva con detalles azules.png'
import chickDangerImg from '../source/Pollito asustado en primer plano.png'

type AnimalType = 'wolf' | 'chick'
type Side = 'left' | 'right' | 'boat' | null

interface Animal {
  type: AnimalType
  selected: boolean
}

type RankingEntry = {
  name: string
  score: number
  date: string
}

const mkAnimals = (): Animal[] => [
  { type: 'wolf', selected: false },
  { type: 'wolf', selected: false },
  { type: 'wolf', selected: false },
  { type: 'chick', selected: false },
  { type: 'chick', selected: false },
  { type: 'chick', selected: false },
]

const RANKING_KEY = 'puzzle007-top10'

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
  leftBank: mkAnimals(),
  rightBank: [] as Animal[],
  boat: [] as Animal[],
  boatSide: 'left' as 'left' | 'right',
  selectedFrom: null as Side,
  selectedIdx: null as number | null,
  trips: 0,
  error: '',
  playerName: '',
  scoreSaved: false,
})

const nameInput = ref('')
const isShaking = ref(false)
const isRankingShortcut = ref(false)
const ranking = ref<RankingEntry[]>(loadRanking())
const rankingTop10 = computed(() => ranking.value)
const dangerMode = computed(() => !isValidState(state.leftBank, state.rightBank))

function triggerError(message: string) {
  state.error = message
  isShaking.value = false
  requestAnimationFrame(() => {
    isShaking.value = true
  })
  window.setTimeout(() => {
    isShaking.value = false
  }, 420)
}

function animalImage(type: AnimalType) {
  if (dangerMode.value) {
    return type === 'wolf' ? wolfDangerImg : chickDangerImg
  }
  return type === 'wolf' ? wolfImg : chickImg
}

const won = computed(
  () => state.leftBank.length === 0 && state.boat.length === 0 && state.rightBank.length === 6,
)

function isValidState(left: Animal[], right: Animal[]) {
  const lW = left.filter((a) => a.type === 'wolf').length
  const lC = left.filter((a) => a.type === 'chick').length
  const rW = right.filter((a) => a.type === 'wolf').length
  const rC = right.filter((a) => a.type === 'chick').length
  if (lC > 0 && lW > lC) return false
  if (rC > 0 && rW > rC) return false
  return true
}

function selectAnimal(from: Side, idx: number) {
  if (!state.playerName.trim()) {
    triggerError('Introduce tu nombre para jugar.')
    return
  }
  if (from === null) return
  state.error = ''
  ;[...state.leftBank, ...state.rightBank, ...state.boat].forEach((a) => {
    a.selected = false
  })

  const bank = from === 'left' ? state.leftBank : from === 'right' ? state.rightBank : state.boat
  if (!bank[idx]) return
  if (state.selectedFrom === from && state.selectedIdx === idx) {
    state.selectedFrom = null
    state.selectedIdx = null
    return
  }

  bank[idx].selected = true
  state.selectedFrom = from
  state.selectedIdx = idx
}

function moveToBoat() {
  if (!state.playerName.trim()) {
    triggerError('Introduce tu nombre para jugar.')
    return
  }
  if (state.selectedFrom === null || state.selectedIdx === null) return
  if (state.boat.length >= 2) {
    triggerError('La barca ya esta llena.')
    return
  }
  const currentSide = state.boatSide
  if (state.selectedFrom !== currentSide && state.selectedFrom !== 'boat') {
    triggerError('La barca esta en la otra orilla.')
    return
  }
  if (state.selectedFrom === 'boat') return

  const bank = state.selectedFrom === 'left' ? state.leftBank : state.rightBank
  const [animal] = bank.splice(state.selectedIdx, 1)
  if (!animal) return
  animal.selected = false
  state.boat.push(animal)
  state.selectedFrom = null
  state.selectedIdx = null
}

function unloadBoat() {
  if (!state.playerName.trim()) {
    triggerError('Introduce tu nombre para jugar.')
    return
  }
  const bank = state.boatSide === 'left' ? state.leftBank : state.rightBank
  state.boat.forEach((a) => {
    a.selected = false
    bank.push(a)
  })
  state.boat.splice(0)
  state.selectedFrom = null
  state.selectedIdx = null
}

function crossRiver() {
  if (!state.playerName.trim()) {
    triggerError('Introduce tu nombre para jugar.')
    return
  }
  if (state.boat.length === 0) return

  state.boatSide = state.boatSide === 'left' ? 'right' : 'left'
  const bank = state.boatSide === 'right' ? state.rightBank : state.leftBank
  state.boat.forEach((a) => {
    a.selected = false
    bank.push(a)
  })
  state.boat.splice(0)
  state.trips += 1

  if (!isValidState(state.leftBank, state.rightBank)) {
    triggerError('Los lobos se han comido a los pollitos. Reinicia para intentarlo otra vez.')
  }

  state.selectedFrom = null
  state.selectedIdx = null
}

function reset() {
  state.leftBank.splice(0, state.leftBank.length, ...mkAnimals())
  state.rightBank.splice(0)
  state.boat.splice(0)
  state.boatSide = 'left'
  state.selectedFrom = null
  state.selectedIdx = null
  state.trips = 0
  state.error = ''
  state.scoreSaved = false
  isRankingShortcut.value = false
}

function startGame() {
  const cleaned = nameInput.value.trim()
  if (!cleaned) return

  if (cleaned.toLowerCase() === 'winnerx') {
    state.playerName = cleaned.slice(0, 24)
    state.leftBank.splice(0)
    state.boat.splice(0)
    state.rightBank.splice(0, state.rightBank.length, ...mkAnimals())
    state.selectedFrom = null
    state.selectedIdx = null
    state.error = ''
    isRankingShortcut.value = true
    return
  }

  isRankingShortcut.value = false
  state.playerName = cleaned.slice(0, 24)
  state.error = ''
}

watch(
  () => won.value,
  (isWon) => {
    if (!isWon || state.scoreSaved || !state.playerName.trim() || isRankingShortcut.value) return
    const next = [
      ...ranking.value,
      {
        name: state.playerName,
        score: state.trips,
        date: new Date().toISOString(),
      },
    ]
      .sort((a, b) => a.score - b.score || a.date.localeCompare(b.date))
      .slice(0, 10)
    ranking.value = next
    saveRanking(next)
    state.scoreSaved = true
  }
)
</script>

<template>
  <div class="puzzle-panel">
    <div class="puz-header">
      <div class="puz-num">PUZZLE N 001</div>
      <h2 class="puz-title">Lobos y Pollitos</h2>
    </div>
    <div class="puz-desc">
      <p>Hay 3 lobos y 3 pollitos en la orilla izquierda. Usa la barca para llevarlos todos a la
      orilla derecha. </p>
      <p>Reglas: la barca lleva maximo 2 animales y no puede haber mas lobos que
      pollitos en una orilla si hay pollitos.</p>
    </div>
    <div class="player-name" v-if="state.playerName">Jugador: <b>{{ state.playerName }}</b></div>

    <div class="game-area" v-if="!won" :class="{ 'is-shaking': isShaking }">
      <div class="river-scene" :class="{ 'is-shaking': isShaking }">
        <div class="bank">
          <div class="bank-label">ORILLA IZQ</div>
          <div class="bank-animals">
            <div
              v-for="(a, i) in state.leftBank"
              :key="`la${i}`"
              :class="['animal-chip', a.type, { selected: a.selected }]"
              @click="selectAnimal('left', i)"
            >
              <img :src="animalImage(a.type)" :alt="a.type === 'wolf' ? 'Lobo' : 'Pollito'" class="animal-icon" />
            </div>
          </div>
        </div>

        <div class="river">
          <span class="river-label">RIO</span>
          <div class="boat" :class="state.boatSide === 'right' ? 'on-right' : 'on-left'">
            <div class="boat-label">BARCA</div>
            <div class="boat-slots">
              <div
                v-for="(a, i) in state.boat"
                :key="`ba${i}`"
                :class="['animal-chip', a.type, { selected: a.selected }]"
                @click="selectAnimal('boat', i)"
              >
                <img :src="animalImage(a.type)" :alt="a.type === 'wolf' ? 'Lobo' : 'Pollito'" class="animal-icon" />
              </div>
              <div
                v-for="n in 2 - state.boat.length"
                :key="`empty${n}`"
                class="empty-slot"
              ></div>
            </div>
          </div>
        </div>

        <div class="bank">
          <div class="bank-label">ORILLA DER</div>
          <div class="bank-animals">
            <div
              v-for="(a, i) in state.rightBank"
              :key="`ra${i}`"
              :class="['animal-chip', a.type, { selected: a.selected }]"
              @click="selectAnimal('right', i)"
            >
              <img :src="animalImage(a.type)" :alt="a.type === 'wolf' ? 'Lobo' : 'Pollito'" class="animal-icon" />
            </div>
          </div>
        </div>
      </div>

      <div class="river-controls">
        <button
          class="btn btn-secondary"
          @click="moveToBoat"
          :disabled="state.selectedFrom === null || state.boat.length >= 2"
        >
          Subir a barca
        </button>
        <button class="btn btn-primary" @click="crossRiver" :disabled="state.boat.length === 0">
          Cruzar rio
        </button>
        <button class="btn btn-secondary" @click="unloadBoat" :disabled="state.boat.length === 0">
          Bajar de barca
        </button>
      </div>
      <div class="move-count">Viajes realizados: {{ state.trips }}</div>
      <div class="error-msg" v-if="state.error">{{ state.error }}</div>
      <div class="reset-wrap">
        <button class="btn btn-secondary btn-sm" @click="reset">Reiniciar</button>
      </div>
    </div>

    <div class="win-modal-overlay" v-else>
      <div class="success-msg">
        <h3>Puzzle resuelto</h3>
        <p>Todos los animales cruzaron en {{ state.trips }} viajes.</p>
        <button class="btn btn-primary" @click="reset">Jugar de nuevo</button>

        <div class="ranking-card">
          <div class="ranking-title">Top 10</div>
          <ol v-if="rankingTop10.length > 0" class="ranking-list">
            <li v-for="(entry, idx) in rankingTop10" :key="`${entry.name}-${entry.date}-${idx}`" class="ranking-item">
            <span>{{ entry.name }}</span>
            <b>{{ entry.score }} viajes</b>
          </li>
        </ol>
          <div v-else class="ranking-empty">Sin partidas registradas.</div>
        </div>
      </div>
    </div>

    <div class="name-modal-overlay" v-if="!state.playerName">
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

.river-scene {
  position: relative;
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(180px, 1fr) minmax(220px, 280px);
  gap: 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 28px rgba(8, 32, 54, 0.2);
}

.bank {
  background: linear-gradient(160deg, #76b852 0%, #8dc26f 100%);
  padding: 0.75rem 0.55rem;
  box-shadow: inset 0 12px 16px rgba(255, 255, 255, 0.2), inset 0 -12px 18px rgba(0, 0, 0, 0.16);
}

.bank-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: center;
  margin-bottom: 0.4rem;
  color: rgba(14, 54, 23, 0.95);
}

.bank-animals {
  display: grid;
  grid-template-columns: repeat(3, minmax(34px, 1fr));
  gap: 0.38rem;
}

.river {
  position: relative;
  background: linear-gradient(115deg, #4facfe, #00f2fe 52%, #4facfe 100%);
  background-size: 240% 240%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  box-shadow: inset 0 16px 18px rgba(255, 255, 255, 0.24), inset 0 -20px 20px rgba(0, 73, 120, 0.24);
  animation: river-flow 7s linear infinite;
}

.river::before,
.river::after {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  height: 14px;
  pointer-events: none;
}

.river::before {
  top: 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0));
}

.river::after {
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0));
}

.river-label {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: 800;
  color: rgba(5, 57, 86, 0.88);
  letter-spacing: 0.1em;
}

.boat {
  position: relative;
  width: 122px;
  min-height: 72px;
  border-radius: 14px;
  padding: 0.4rem;
  background: linear-gradient(180deg, #8f6742 0%, #6f4324 100%);
  box-shadow: inset 0 7px 10px rgba(255, 255, 255, 0.18), inset 0 -8px 10px rgba(0, 0, 0, 0.28),
    0 8px 18px rgba(16, 49, 73, 0.35);
  transition: transform 0.95s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform: translateX(0);
}

.boat::before {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  pointer-events: none;
}

.boat.on-left {
  transform: translateX(-28px);
}

.boat.on-right {
  transform: translateX(28px);
}

.boat-label {
  text-align: center;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  font-weight: 800;
  color: rgba(255, 236, 214, 0.95);
  margin-bottom: 0.3rem;
}

.boat-slots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
}

.empty-slot {
  width: 30px;
  height: 30px;
  border: 1.5px dashed rgba(245, 230, 200, 0.48);
  border-radius: 50%;
}

.animal-chip {
  overflow: hidden;
  padding: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.26), 0 6px 10px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
}

.animal-chip:hover {
  transform: translateY(-5px);
  box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.25), 0 12px 14px rgba(0, 0, 0, 0.2);
}

.animal-chip.selected {
  transform: translateY(-4px) scale(1.08);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.75), 0 12px 18px rgba(0, 0, 0, 0.22);
}

.animal-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.river-controls {
  display: flex;
  justify-content: center;
  gap: 0.55rem;
  margin-top: 0.9rem;
  flex-wrap: wrap;
}

.move-count {
  margin-top: 0.72rem;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  letter-spacing: 0.03em;
  color: var(--text-muted);
}

.error-msg {
  margin-top: 0.62rem;
  text-align: center;
  font-size: 0.84rem;
  color: var(--state-error);
  font-weight: 700;
}

.reset-wrap {
  text-align: center;
  margin-top: 0.82rem;
}

.is-shaking {
  animation: shake 0.42s linear;
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
  margin-top: 0;
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
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ranking-title);
}

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

.ranking-item:nth-child(odd) {
  background: rgba(255, 255, 255, 0.05);
}

.ranking-item b {
  color: var(--ranking-score);
}

.ranking-empty {
  margin-top: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-muted);
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

@keyframes river-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-7px);
  }
  40% {
    transform: translateX(7px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
  100% {
    transform: translateX(0);
  }
}

@media (max-width: 700px) {
  .river-scene {
    grid-template-columns: 1fr;
  }

  .river {
    min-height: 120px;
    order: 2;
  }

  .bank:first-child {
    order: 1;
  }

  .bank:last-child {
    order: 3;
  }

  .boat.on-left,
  .boat.on-right {
    transform: translateX(0);
  }

  .bank-animals {
    grid-template-columns: repeat(6, minmax(32px, 1fr));
  }

  .name-modal-row {
    flex-direction: column;
    align-items: center;
  }

  .name-modal-row .player-input {
    width: min(90%, 290px);
  }
}
</style>
