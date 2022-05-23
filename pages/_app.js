import React from "react";
import { CacheProvider, ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import '../polyfills';
import createEmotionCache from "../utility/createEmotionCache";
import darkTheme from "../styles/theme/darkTheme";
import "../styles/globals.css";
import Head from "next/head";
import Script from 'next/script'
import AppProvider from "../components/common/context/AppProvider";
import WaitForRouter from "../components/common/WaitForRouter";
import NavBar from "../components/common/NavBar";

const clientSideEmotionCache = createEmotionCache();
// remove overlay of error in dev mode.
const noOverlayWorkaroundScript = `
  window.addEventListener('error', event => {
    event.stopImmediatePropagation()
  })

  window.addEventListener('unhandledrejection', event => {
    event.stopImmediatePropagation()
  })
`;


const MyApp = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <>
      <Head>
        <title>Idleon Toolbox</title>
        <meta
          name="description"
          content="Follow your Legends of Idleon progression with ease with the help of account and characters' overview, craft calculator and more!"
        />
        <meta name="keywords" content="Legends of Idleon, account, characters, craft calculator, refinery, anvil"/>
      </Head>
      {process.env.NODE_ENV !== 'production' &&
      <Script id={'remove-error-layout'} dangerouslySetInnerHTML={{ __html: noOverlayWorkaroundScript }}/>}
      {/*Global site tag (gtag.js) - Google Analytics */}
      <Script strategy='afterInteractive'
              src="https://www.googletagmanager.com/gtag/js?id=G-YER8JY07QK"/>
      <Script id='ga-analytics'>
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-YER8JY07QK');          
          `}
      </Script>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={darkTheme}>
          <EmotionThemeProvider theme={darkTheme}>
            <CssBaseline/>
            <WaitForRouter>
              <AppProvider>
                <NavBar>
                  <Component {...pageProps} />
                </NavBar>
              </AppProvider>
            </WaitForRouter>
          </EmotionThemeProvider>
        </ThemeProvider>
      </CacheProvider>
    </>
  );
};

export default MyApp;
