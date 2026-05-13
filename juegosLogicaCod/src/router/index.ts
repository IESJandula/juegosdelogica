import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/PuzzleSelector.vue'),
  },
  {
    path: '/aparcar',
    name: 'Aparcar',
    component: () => import('../components/Aparcar.vue'),
  },
  {
    path: '/lobos',
    name: 'LobosPuzzle',
    component: () => import('../components/LobosPuzzle.vue'),
  },
  {
    path: '/rojo-azul',
    name: 'RojoAzulPuzzle',
    component: () => import('../components/RojoAzulPuzzle.vue'),
  },
  {
    path: '/ships',
    name: 'Ships',
    component: () => import('../components/Ships.vue'),
  },
  {
    path: '/tortitas',
    name: 'TortitasPuzzle',
    component: () => import('../components/TortitasPuzzle.vue'),
  },
  // fallback
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
