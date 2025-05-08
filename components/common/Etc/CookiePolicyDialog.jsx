import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';

export default function CookiePolicyDialog({ open, onClose }) {
  const handleRevokeConsent = () => {
    document.cookie = 'idleon-consent=; Max-Age=0; path=/';
    location.reload();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>Cookie Policy</DialogTitle>
      <DialogContent dividers>
        <Typography>
          This Cookie Policy explains how <strong>Idleon Toolbox</strong> uses cookies, localStorage, and similar
          technologies to enhance your experience when you visit our website.
        </Typography>

        <Typography variant="h6" gutterBottom mt={3}>
          What Are Cookies and LocalStorage?
        </Typography>
        <Typography>
          Cookies are small data files placed on your device to help websites function and gather usage data.
          LocalStorage stores data in your browser to remember your preferences, even after closing the browser.
        </Typography>

        <Typography variant="h6" gutterBottom mt={3}>
          How We Use Cookies and LocalStorage
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText
              primary="Local Storage"
              secondary="We use localStorage to store your preferences, such as login state and settings, to provide a more seamless experience. This data does not contain personally identifiable information and is stored locally on your device."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Analytics Storage"
              secondary="These cookies allow us to measure traffic and usage trends using tools like Google Analytics. Requires user consent."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Ad Storage"
              secondary="Used by Google Ads to store ad-related data such as frequency capping and ad delivery. Requires user consent."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Ad User Data"
              secondary="Allows Google to use personal data for ads, such as demographic targeting and reporting. Requires user consent."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Ad Personalisation"
              secondary="Enables personalized ad experiences based on your browsing history and preferences. Requires user consent."
            />
          </ListItem>
        </List>

        <Typography variant="h6" gutterBottom>
          Managing Preferences
        </Typography>
        <Typography>
          You can revoke your consent by clicking the button below, which will remove both cookie and localStorage
          preferences.
        </Typography>

        <Button sx={{ mt: 1 }} variant="contained" size="small" onClick={handleRevokeConsent}>
          Revoke Consent
        </Button>

        <Typography mt={3}>
          For more details, please see our{' '}
          <MuiLink href="https://idleontoolbox.com/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </MuiLink>.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
