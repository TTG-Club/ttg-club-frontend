import MenuThemeSwitcher from '@/components/UI/MenuThemeSwitcher';
import SiteLogo from '@/components/UI/icons/SiteLogo';
import SvgIcon from '@/components/UI/icons/SvgIcon';
import DiceRoller from '@/components/UI/DiceRoller';
import NavBar from '@/components/UI/menu/NavBar';
import RawContent from '@/components/content/RawContent';
import DetailTooltip from '@/components/UI/DetailTooltip';
import ChangePasswordView from '@/components/account/ChangePasswordView';
import PageLayout from '@/components/content/PageLayout';
import SocialLinks from '@/components/content/SocialLinks';

/* eslint-disable vue/match-component-file-name */
export default function registerComponents(app) {
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
