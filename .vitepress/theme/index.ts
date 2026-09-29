import type { Theme } from 'vitepress'
import TeekTheme from 'vitepress-theme-teek'
import ChartComponent from './components/ChartComponent.vue'
import { setupCodeFoldPersist } from './code-fold-persist'
import { setupHomePageFlag } from './home-page-flag'
import { setupReadmeAlias } from './readme-alias'
import { setupStripNativeTitles } from './strip-native-titles'
import 'vitepress-theme-teek/index.css'
import './custom.css'

export default {
  extends: TeekTheme,
  enhanceApp({ app, router }) {
    app.component('Chart', ChartComponent)
    setupReadmeAlias(router)
    setupCodeFoldPersist(router)
    setupStripNativeTitles(router)
  },
  setup() {
    setupHomePageFlag()
  }
} satisfies Theme
