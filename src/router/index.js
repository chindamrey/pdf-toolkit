import { createRouter, createWebHistory } from 'vue-router'
import MergeView from '@/MergeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path:'/',
      name:'Merge PDF',
      component: MergeView,
      meta:{
        title:'Merge PDFs'
      }
    }
  ],
})

export default router
