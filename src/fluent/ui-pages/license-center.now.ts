import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import licenseCenterPage from '../../client/index.html'

export const license_center_page = UiPage({
  $id: Now.ID['license-center-page'],
  endpoint: 'x_1917927_hello_wo_license_center.do',
  description: 'Modern License Center Dashboard UI',
  category: 'general',
  html: licenseCenterPage,
  direct: true
})