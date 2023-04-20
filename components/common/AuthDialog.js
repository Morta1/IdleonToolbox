import React from 'react';
import { CircularProgress, Dialog, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import Link from "@mui/material/Link";

const AuthDialog = ({ dialog, onClose, loginError }) => {

  const getContent = () => {
    if (dialog?.type === 'google') {
      return <>
        <div style={{ wordBreak: "break-all" }}>
          Please go to{" "}
          <Link mr={1} target="_blank" href="https://www.google.com/device" rel="noreferrer">
            https://www.google.com/device
          </Link>
          and enter the following code:
        </div>
        <Typography p={1} border={"1px solid white"} justifySelf={"center"} margin={"0 auto"} width={"fit-content"}>
          {dialog?.userCode}
        </Typography>
      </>
    } else if (dialog?.type === 'apple') {
      return <>
        <Typography>Please login through the popup</Typography>
        <Typography variant={'caption'}>* make sure popups are allowed in your browser</Typography>
      </>
    }
  }

  return <Dialog open={dialog?.open} onClose={onClose}>
    <DialogTitle>{dialog?.title}</DialogTitle>
    <DialogContent>
      <Stack gap={dialog?.type === 'google' ? 3 : 1}>
        {getContent()}
        {dialog?.error ? (
          <Typography variant={"body1"}>Failed to auth, please refresh and try again.</Typography>
        ) : (
          <Stack flexWrap={"wrap"} gap={3} direction={"row"} alignItems={"center"}>
            <Typography variant={"body1"}>Waiting for your authentication:</Typography> <CircularProgress/>
          </Stack>
        )}
        {loginError ? <Typography color={'error'} variant={"body1"}>{loginError}</Typography> : null}
      </Stack>
    </DialogContent>
  </Dialog>
};

export default AuthDialog;
