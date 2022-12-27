import { Link, Stack, Typography } from "@mui/material";

const Instructions = () => {
  return (<>
      <Stack rowGap={.5} style={{ margin: '10px 0' }}>
        <Typography color={'primary'} variant={'h5'}>Google Login</Typography>
        <div>1. Click the google login icon.</div>
        <div>2. Open the link and paste the provided code.</div>
        <div>3. Select your idleon google account.</div>
        <div>4. Done!</div>
        <div>(Don&apos;t worry, I&apos;m not saving anything about your google account, you can see for yourself in
          my&nbsp;<Link target={'_blank'} href="https://github.com/Morta1/IdleonToolbox"
                        rel="noreferrer">sourcecode</Link>)
        </div>
      </Stack>
      <Stack rowGap={.5} style={{ margin: '10px 0' }}>
        <Typography color={'primary'} variant={'h5'}>Steam Data Extractor</Typography>
        <div>1. Download my steam data extractor <Link
          href="https://drive.google.com/file/d/1Q03J-kadz5iob45J1wnZWjnHhS0j0GgV/view?usp=sharing"
          rel={'noreferrer'}
          target={'_blank'}>idleon-steam-data-extractor</Link>
        </div>
        <div>
          <div> 2. Open the extractor and click Run (you can also change the destination if you&apos;d like)</div>
          <img style={{ width: '100%' }} src={`/etc/extractor-image.png`} alt=""/>
        </div>
        <div> 3. Copy the result json and click the icon on the top right of the website and select &apos;from
          extractor&apos;</div>
      </Stack>
    </>
  );
};

export default Instructions;
