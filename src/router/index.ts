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
      component: () => import('../views/PlannerStepLayout.vue'),
      children: [
        { path: '', redirect: '/planner/destination' },
        { path: 'destination', name: 'planner-destination', component: () => import('../components/PlannerSteps/DestinationStep.vue') },
        { path: 'duration', name: 'planner-duration', component: () => import('../components/PlannerSteps/DurationStep.vue') },
        { path: 'budget', name: 'planner-budget', component: () => import('../components/PlannerSteps/BudgetStep.vue') },
        { path: 'preferences', name: 'planner-preferences', component: () => import('../components/PlannerSteps/PreferencesStep.vue') },
        { path: 'confirm', name: 'planner-confirm', component: () => import('../components/PlannerSteps/ConfirmStep.vue') },
      ]
    },
    {
      path: '/seeker',
      name: 'seeker',
      component: () => import('../views/SeekerView.vue'),
    },
    {
      path: '/inspiration',
      name: 'inspiration',
      component: () => import('../views/InspirationView.vue'),
    },
    {
      path: '/inspiration/catalog',
      name: 'inspiration-catalog',
      component: () => import('../views/InspirationCatalogView.vue'),
    },
    {
      path: '/journey/templates',
      name: 'journey-templates',
      component: () => import('../views/JourneyTemplateCatalogView.vue'),
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
      path: '/journey/templates/:id',
      name: 'journey-template',
      component: () => import('../views/JourneyTemplateView.vue'),
    },
  ],
})

export default router
