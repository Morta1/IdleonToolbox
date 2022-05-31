import { Link, Stack } from "@mui/material";

const PastebinInstructions = () => {
  return <>
    <Stack rowGap={.5}>
      <div>1. Click on 'COPY RAW BUTTON' button</div>
      <div>2. Go to <Link target={'_blank'} href="https://pastebin.com">pastebin</Link></div>
      <div>3. Paste your json data</div>
      <div>4. Click on 'Create New Paste'</div>
      <div>5. A new paste will be created and your URL will change to something like this <Link
        target={'_blank'}
        href={"https://pastebin.com/mQzgm0MX"}>https://pastebin.com/mQzgm0MX</Link></div>
      <div>6. Now you can share your profile and data like this</div>
      <Link target={'_blank'}
            href={"https://idleontoolbox.com/?pb=mQzgm0MX"}>https://idleontoolbox.com/?pb=mQzgm0MX</Link>
    </Stack>
  </>
};

export default PastebinInstructions;
