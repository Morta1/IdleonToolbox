export const DISCORD_SERVER_URL = 'https://discord.gg/8Devcj7FzV';
export const DISCORD_BOT_INSTALL_URL = 'https://discord.com/oauth2/authorize?client_id=1555351103812673546';

// `placement` says which link was clicked: 'home_section' or 'footer'.
export const trackBotInstallClick = (placement) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'discord_bot_install_click', { placement });
  }
};
