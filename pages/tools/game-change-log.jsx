import { useEffect, useState, lazy, Suspense } from 'react';
import {
  Box,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography
} from '@mui/material';

// Dynamically import Monaco to avoid SSR issues
const DiffEditor = lazy(() => import('@monaco-editor/react').then(module => ({ default: module.DiffEditor })));

const VERSION_PAIRS = [
  { label: '2.3.43 to 2.3.44', oldVersion: '2.3.43', newVersion: '2.3.44' },
  { label: '2.3.44 to 2.3.45', oldVersion: '2.3.44', newVersion: '2.3.45' },
  { label: '2.3.45 to 2.3.46', oldVersion: '2.3.45', newVersion: '2.3.46' },
  { label: '2.3.46 to 2.3.47', oldVersion: '2.3.46', newVersion: '2.3.47' },
  { label: '2.3.47 to 2.3.48', oldVersion: '2.3.47', newVersion: '2.3.48' },
  { label: '2.3.48 to 2.3.49', oldVersion: '2.3.48', newVersion: '2.3.49' },
];

const GameChangeLog = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPairIndex, setSelectedPairIndex] = useState(VERSION_PAIRS.length - 1);
  const [oldJson, setOldJson] = useState('');
  const [newJson, setNewJson] = useState('');

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      try {
        const pair = VERSION_PAIRS[selectedPairIndex];
        
        // Load old version
        const oldData = await import(`../../data/versioned-data/website-data-${pair.oldVersion}.json`);
        setOldJson(JSON.stringify(oldData.default || oldData, null, 2));
        
        // Load new version
        const newData = await import(`../../data/versioned-data/website-data-${pair.newVersion}.json`);
        setNewJson(JSON.stringify(newData.default || newData, null, 2));
      } catch (err) {
        console.error('Failed to load version data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [selectedPairIndex]);


  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress/>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Game Change Log</Typography>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel id="version-select-label">Select Versions to Compare</InputLabel>
            <Select 
              labelId="version-select-label" 
              value={selectedPairIndex} 
              label="Select Versions to Compare"
              onChange={(e) => setSelectedPairIndex(e.target.value)}
            >
              {VERSION_PAIRS.map((pair, idx) => (
                <MenuItem key={idx} value={idx}>{pair.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {VERSION_PAIRS[selectedPairIndex].label}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Full JSON comparison - changes are highlighted in the editor
          </Typography>
          <Box sx={{ height: 'calc(100vh - 280px)', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            }>
              <DiffEditor
                original={oldJson}
                modified={newJson}
                language="json"
                theme="vs-dark"
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  wordWrap: 'off',
                  automaticLayout: true,
                  // Collapse unchanged regions to show only diffs
                  hideUnchangedRegions: {
                    enabled: true
                  },
                  // Show some context lines around changes
                  diffAlgorithm: 'advanced',
                  ignoreTrimWhitespace: false
                }}
              />
            </Suspense>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default GameChangeLog;
