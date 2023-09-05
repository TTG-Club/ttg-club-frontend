import ChangePasswordView from '@/components/account/ChangePasswordView.vue';
import PageLayout from '@/components/content/PageLayout.vue';
import RawContent from '@/components/content/RawContent.vue';
import SocialLinks from '@/components/content/SocialLinks.vue';
import DetailTooltip from '@/components/UI/DetailTooltip.vue';
import DiceRoller from '@/components/UI/DiceRoller.vue';
import SiteLogo from '@/components/UI/icons/SiteLogo.vue';
import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
import NavBar from '@/components/UI/menu/NavBar.vue';
import MenuThemeSwitcher from '@/components/UI/MenuThemeSwitcher.vue';

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
}
/* eslint-enable vue/match-component-file-name */
