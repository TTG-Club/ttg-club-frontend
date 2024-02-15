import DetailTooltip from '@/shared/ui/DetailTooltip.vue';
import DiceRoller from '@/shared/ui/DiceRoller.vue';
import SiteLogo from '@/shared/ui/icons/SiteLogo.vue';
import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
import RawContent from '@/shared/ui/RawContent.vue';
import RollTable from '@/shared/ui/RollTable.vue';
import SocialLinks from '@/shared/ui/SocialLinks.vue';

import ChangePasswordView from '@/features/account/ChangePasswordView.vue';
import NavBar from '@/features/menu/NavBar.vue';
import MenuThemeSwitcher from '@/features/MenuThemeSwitcher.vue';

import PageLayout from '@/layouts/PageLayout.vue';

import type { App } from 'vue';

/* eslint-disable vue/match-component-file-name */
export default function registerComponents(app: App) {
  // Components
  app.component('MenuThemeSwitcher', MenuThemeSwitcher);
  app.component('SiteLogo', SiteLogo);
  app.component('SvgIcon', SvgIcon);
  app.component('DiceRoller', DiceRoller);
  app.component('NavBar', NavBar);
  app.component('RawContent', RawContent);
  app.component('DetailTooltip', DetailTooltip);
  app.component('ChangePasswordView', ChangePasswordView);
  app.component('PageLayout', PageLayout);
  app.component('SocialLinks', SocialLinks);
  app.component('RollTable', RollTable);
}
/* eslint-enable vue/match-component-file-name */
