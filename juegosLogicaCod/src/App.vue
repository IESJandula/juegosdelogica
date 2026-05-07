<script setup lang="ts">
import { computed, ref } from 'vue'
import Aparcar from './components/Aparcar.vue'
import LobosPuzzle from './components/LobosPuzzle.vue'
import PuzzleSelector from './components/PuzzleSelector.vue'
import RojoAzulPuzzle from './components/RojoAzulPuzzle.vue'
import TortitasPuzzle from './components/TortitasPuzzle.vue'

type PuzzleId = 'lobos' | 'tortitas' | 'rojoyazul' | 'aparcar'

const activePuzzle = ref<PuzzleId | null>(null)

const activeComponent = computed(() => {
  if (activePuzzle.value === 'lobos') return LobosPuzzle
  if (activePuzzle.value === 'tortitas') return TortitasPuzzle
  if (activePuzzle.value === 'rojoyazul') return RojoAzulPuzzle
  if (activePuzzle.value === 'aparcar') return Aparcar
  return null
})

function selectPuzzle(id: PuzzleId) {
  activePuzzle.value = id
}

function backToMenu() {
  activePuzzle.value = null
}
</script>

<template>
  <div id="app-shell">
    <header class="app-header">
      <div class="brand-block">
        <img class="brand-logo" src="/logo_jandula.webp" alt="Logo IES Jandula" />
        <div>
          <h1 class="header-title">Pruebas IES Jandula</h1>
          <p class="header-sub">Pruebas de logica y resolucion de problemas</p>
        </div>
      </div>
    </header>

    <PuzzleSelector v-if="!activePuzzle" @select="selectPuzzle" />

    <div class="puzzle-view" v-else>
      <button class="back-btn" @click="backToMenu">Volver al menu</button>
      <component :is="activeComponent" />
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

:root {
  --bg-base: #070d18;
  --bg-surface: #0f1b2e;
  --bg-card: rgba(21, 37, 61, 0.62);
  --bg-card-strong: rgba(12, 24, 42, 0.82);
  --text-primary: #eff7ff;
  --text-secondary: #d5e8fb;
  --text-muted: #96b6d7;
  --accent-primary: #55ccff;
  --accent-lobos: #ff516e;
  --accent-tortitas: #ffb35c;
  --accent-rojoyazul: #a47bff;
  --accent-parking: #f4a64d;
  --state-success: #21d08a;
  --state-error: #ff4d75;
  --ranking-bg: rgba(5, 18, 34, 0.86);
  --ranking-border: rgba(136, 206, 255, 0.5);
  --ranking-title: #9fe6ff;
  --ranking-text: #eaf6ff;
  --ranking-score: #ffe08a;
  --border-soft: rgba(167, 211, 247, 0.28);
  --shadow-soft: 0 14px 30px rgba(3, 10, 21, 0.35);
  --shadow-elevated: 0 20px 42px rgba(2, 7, 17, 0.52);
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --trans-fast: 180ms ease;
  --trans-base: 260ms ease;
  --font-display: 'Montserrat', 'Segoe UI', sans-serif;
  --font-body: 'Montserrat', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg-base);
  min-height: 100vh;
  font-family: var(--font-body);
  color: var(--text-primary);
  background-image:
    radial-gradient(ellipse at 12% 10%, rgba(85, 204, 255, 0.19) 0%, transparent 45%),
    radial-gradient(ellipse at 86% 18%, rgba(164, 123, 255, 0.16) 0%, transparent 42%),
    linear-gradient(165deg, #060c16 0%, #0a1322 52%, #0a1427 100%);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(144, 197, 242, 0.16) 0.75px, transparent 0.75px);
  background-size: 16px 16px;
  opacity: 0.12;
  z-index: -1;
}

#app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: center;
  padding: 1.45rem 1rem 1rem;
  position: relative;
}

.app-header::after {
  content: '';
  display: block;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
  margin-top: 1rem;
  width: min(920px, 95vw);
  position: absolute;
  bottom: 0;
}

.brand-block {
  width: min(920px, 95vw);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
}

.brand-logo {
  width: clamp(58px, 7.4vw, 74px);
  height: clamp(58px, 7.4vw, 74px);
  padding: 0.28rem;
  border-radius: 14px;
  border: 2px solid rgba(154, 215, 255, 0.72);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(230, 244, 255, 0.95));
  box-shadow: 0 0 0 3px rgba(85, 204, 255, 0.22), var(--shadow-soft);
  object-fit: contain;
}

.header-title {
  font-size: clamp(1.32rem, 3.7vw, 2.35rem);
  color: var(--text-primary);
  text-shadow: 0 6px 18px rgba(26, 92, 131, 0.35);
  letter-spacing: 0.06em;
  font-family: var(--font-display);
  font-weight: 800;
}

.header-sub {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
  letter-spacing: 0.04em;
}

.puzzle-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 1.3rem 1.1rem 2.6rem;
}

.back-btn {
  align-self: flex-start;
  background: rgba(14, 33, 55, 0.55);
  border: 1.5px solid rgba(128, 199, 247, 0.42);
  color: var(--text-primary);
  font-size: 0.86rem;
  padding: 0.5rem 1rem 0.5rem 0.86rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 1.1rem;
  letter-spacing: 0.08em;
  transition: border-color var(--trans-fast), background var(--trans-fast), transform var(--trans-fast);
  min-height: 44px;
  backdrop-filter: blur(7px);
}

.back-btn::before {
  content: '←';
  display: inline-block;
  margin-right: 0.45rem;
  color: var(--accent-primary);
  font-weight: 700;
}

.back-btn:hover {
  border-color: rgba(85, 204, 255, 0.82);
  background: rgba(16, 42, 74, 0.68);
  transform: translateY(-1px);
}

.puzzle-panel {
  background: linear-gradient(160deg, var(--bg-card) 0%, var(--bg-card-strong) 100%);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: clamp(1.2rem, 2.2vw, 2.2rem);
  width: min(900px, 98vw);
  box-shadow: var(--shadow-elevated), inset 0 1px 0 rgba(255, 255, 255, 0.11);
  position: relative;
  color: var(--text-primary);
  backdrop-filter: blur(10px);
}

.puzzle-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
}

.puz-header {
  margin-bottom: 1.2rem;
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
  margin: 0.2rem 0 0.6rem;
  font-family: var(--font-display);
}

.puz-desc {
  background: rgba(15, 36, 59, 0.56);
  border-left: 3px solid var(--accent-primary);
  padding: 0.85rem 1.1rem;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-size: 1rem;
  line-height: 1.58;
  color: var(--text-secondary);
  margin-bottom: 1.2rem;
}

.btn {
  font-size: 0.88rem;
  letter-spacing: 0.06em;
  padding: 0.62rem 1.3rem;
  border-radius: var(--radius-sm);
  border: 1.5px solid;
  cursor: pointer;
  transition: all var(--trans-fast);
  min-height: 44px;
  font-family: var(--font-display);
  font-weight: 700;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(80, 198, 255, 0.92), rgba(42, 145, 226, 0.92));
  border-color: rgba(135, 220, 255, 0.85);
  color: #072035;
  box-shadow: 0 8px 18px rgba(54, 164, 232, 0.24);
}

.btn-primary:hover {
  background: linear-gradient(135deg, rgba(98, 211, 255, 1), rgba(56, 163, 248, 1));
  border-color: rgba(184, 237, 255, 0.95);
}

.btn-secondary {
  background: rgba(16, 37, 59, 0.45);
  border-color: rgba(138, 184, 220, 0.45);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: rgba(18, 44, 70, 0.7);
  border-color: rgba(163, 215, 255, 0.65);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.success-msg {
  text-align: center;
  background: linear-gradient(135deg, rgba(16, 39, 64, 0.85), rgba(10, 23, 42, 0.92));
  border: 1px solid rgba(135, 211, 255, 0.45);
  border-radius: var(--radius-md);
  padding: 1.4rem;
  margin-top: 1.2rem;
  box-shadow: var(--shadow-soft);
}

.success-msg h3 {
  color: #8be6b7;
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
}

.success-msg p {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.game-area {
  margin-top: 0.5rem;
}

.move-count {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: 0.5rem;
  font-family: var(--font-mono);
}

.error-msg {
  background: rgba(255, 77, 117, 0.14);
  border: 1px solid rgba(255, 77, 117, 0.5);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.8rem;
  font-size: 0.88rem;
  color: #ffc2d0;
  text-align: center;
  margin-top: 0.6rem;
}

.pancake-scene {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 1.5rem;
  margin: 1rem 0;
  min-height: 220px;
}

.stack-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  flex: 1;
}

.stack-col.selected-col .stack-plate {
  box-shadow: 0 0 0 3px rgba(85, 204, 255, 0.52);
}

.stack-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  letter-spacing: 0.1em;
  margin-top: 0.3rem;
  font-family: var(--font-mono);
}

.pancake-stack {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  min-height: 165px;
  justify-content: flex-start;
}

.pancake {
  height: 18px;
  border-radius: 5px;
  background: linear-gradient(180deg, #e8c878 0%, #c8a040 60%, #a07828 100%);
  border: 1.5px solid #8f5c2b;
  margin-bottom: 2px;
}

.stack-plate {
  background: rgba(231, 177, 100, 0.88);
  border-radius: 3px;
  width: 108px;
  height: 11px;
}

.pancake-instruction {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 0.5rem;
}

.target-display {
  background: rgba(255, 179, 92, 0.11);
  border: 1px dashed rgba(255, 179, 92, 0.52);
  border-radius: var(--radius-sm);
  padding: 0.6rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.8rem;
}

@media (max-width: 860px) {
  .puzzle-panel {
    width: min(640px, 98vw);
    padding: clamp(1rem, 2.8vw, 1.5rem);
  }

  .pancake-scene {
    min-height: 180px;
    gap: 0.7rem;
  }

  .pancake-stack {
    min-height: 140px;
  }

  .stack-plate {
    width: 92px;
  }
}

@media (max-width: 640px) {
  .app-header {
    padding-top: 1rem;
  }

  .brand-block {
    justify-content: flex-start;
  }

  .header-title {
    font-size: 1.2rem;
    letter-spacing: 0.03em;
  }

  .header-sub {
    font-size: 0.82rem;
  }

  .puzzle-view {
    padding: 1rem 0.75rem 1.8rem;
  }
}
</style>
