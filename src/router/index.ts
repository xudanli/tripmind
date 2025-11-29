import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/planner',
      name: 'planner',
      component: () => import('../views/PlannerView.vue'),
    },
    {
      path: '/api-test',
      name: 'api-test',
      component: () => import('../views/ApiTestView.vue'),
    },
    {
      path: '/travel-list',
      name: 'travel-list',
      component: () => import('../views/TravelListView.vue'),
    },
    {
      path: '/travel/:id',
      name: 'travel-detail',
      component: () => import('../views/TravelDetailView.vue'),
    },
    {
      path: '/invite/:invitationId',
      name: 'accept-invitation',
      component: () => import('../views/AcceptInvitationView.vue'),
    },
  ],
})

export default router
