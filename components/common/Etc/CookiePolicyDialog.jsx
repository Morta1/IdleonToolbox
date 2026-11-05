import {
  Button,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import AppDialog from '@components/common/Overlays/AppDialog';

export default function CookiePolicyDialog({ open, onClose }) {
  const handleRevokeConsent = () => {
    document.cookie = 'idleon-consent=; Max-Age=0; path=/';
    location.reload();
  };

  return (
    <AppDialog open={open} onClose={onClose} size="l" title="Cookie policy">
      <Typography variant="body2">
        This policy explains how <strong>Idleon Toolbox</strong> uses cookies, local storage and similar
        technologies to enhance your experience when you visit this site.
      </Typography>

      <Typography variant="cardTitle" component="h3" gutterBottom mt={3}>
        What cookies and local storage are
      </Typography>
      <Typography variant="body2">
        Cookies are small data files placed on your device to help websites function and gather usage data.
        Local storage keeps data in your browser to remember your preferences, even after closing the browser.
      </Typography>

      <Typography variant="cardTitle" component="h3" gutterBottom mt={3}>
        How I use cookies and local storage
      </Typography>
      <List dense>
        <ListItem>
          <ListItemText
            primary="Local storage"
            secondary="I use local storage to keep your preferences, such as your sign-in state and settings, to provide a more seamless experience. This data does not contain personally identifiable information and is stored locally on your device."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Analytics storage"
            secondary="These cookies let me measure traffic and usage trends with tools like Google Analytics. They need your consent."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Ad storage"
            secondary="Used by Google Ads to store ad-related data such as frequency capping and ad delivery. It needs your consent."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Ad user data"
            secondary="Allows Google to use personal data for ads, such as demographic targeting and reporting. It needs your consent."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Ad personalisation"
            secondary="Enables personalized ad experiences based on your browsing history and preferences. It needs your consent."
          />
        </ListItem>
      </List>

      <Typography variant="cardTitle" component="h3" gutterBottom>
        Managing your choices
      </Typography>
      <Typography variant="body2">
        You can revoke your consent with the button below, which removes both the cookie and the local storage
        preferences.
      </Typography>

      <Button sx={{ mt: 1 }} variant="contained" size="small" onClick={handleRevokeConsent}>
        Revoke Consent
      </Button>

      <Typography variant="body2" mt={3}>
        More detail is in the{' '}
        <MuiLink href={`${process.env.NEXT_PUBLIC_IT_URL}/privacy-policy.html`} target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </MuiLink>.
      </Typography>
    </AppDialog>
  );
}
