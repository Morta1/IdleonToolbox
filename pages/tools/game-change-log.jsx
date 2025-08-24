import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { cleanUnderscore } from '@utility/helpers';
import { CLASSES } from '@parsers/talents';

const CHANGELOG_FILES = [
  { label: '2.3.31 to 2.3.32', value: 'changes-2.3.31-to-2.3.32.json' },
  { label: '2.3.32 to 2.3.34', value: 'changes-2.3.32-to-2.3.34.json' },
  { label: '2.3.34 to 2.3.34-a', value: 'changes-2.3.34-to-2.3.34-a.json' },
  { label: '2.3.34-a to 2.3.35', value: 'changes-2.3.34-a-to-2.3.35.json' },
  { label: '2.3.35 to 2.3.36', value: 'changes-2.3.35-to-2.3.36.json' },
  { label: '2.3.36 to 2.3.37', value: 'changes-2.3.36-to-2.3.37.json' },
];

function getDeepDifferences(oldObj, newObj, prefix = '') {
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {})
  ]);

  let diffs = [];

  for (const key of allKeys) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];

    const bothObjects = typeof oldVal === 'object' && oldVal !== null &&
      typeof newVal === 'object' && newVal !== null;

    if (bothObjects) {
      diffs = diffs.concat(getDeepDifferences(oldVal, newVal, fullPath));
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push(fullPath);
    }
  }

  return diffs;
}

const formatChange = (change) => {
  if (typeof change === 'string') return change;

  if (change.old && change.new) {
    if (typeof change.old === 'object' && typeof change.new === 'object') {
      const allKeys = Array.from(new Set([...Object.keys(change.old), ...Object.keys(change.new)]));

      if (change.key === CLASSES.Wind_Walker) {
      }
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {allKeys.map((key) => {
            const oldVal = change.old[key];
            const newVal = change.new[key];
            const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
            const diffKeys = getDeepDifferences(change.old, change.new);

            return (
              <Box key={key} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography variant="body2" sx={{
                  fontWeight: changed ? 'bold' : 'normal',
                  color: changed ? 'info.main' : 'text.secondary',
                  minWidth: 100
                }}>{key}</Typography>
                <Typography component="pre" variant="body2" sx={{
                  flex: 1,
                  whiteSpace: 'pre-wrap',
                  m: 0,
                  wordWrap: 'break-word',
                  maxWidth: 300,
                  color: 'error.main'
                }}>{oldVal !== undefined ? JSON.stringify(oldVal, null, 2) : '—'}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>→</Typography>
                <Typography component="pre" variant="body2" sx={{
                  flex: 1,
                  whiteSpace: 'pre-wrap',
                  m: 0,
                  wordWrap: 'break-word',
                  maxWidth: 300,
                  color: 'success.main'
                }}>{newVal !== undefined ? JSON.stringify(newVal, null, 2) : '—'}</Typography>
              </Box>
            );
          })}
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Typography component="pre" variant="body2" color="error.main" sx={{
          m: 0,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-all',
          maxWidth: 300
        }}>{JSON.stringify(change.old, null, 2)}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>→</Typography>
        <Typography component="pre" variant="body2" color="success.main" sx={{
          m: 0,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-all',
          maxWidth: 300
        }}>{JSON.stringify(change.new, null, 2)}</Typography>
      </Box>
    );
  }

  return <Typography component="pre" variant="body2" sx={{
    flex: 1,
    whiteSpace: 'pre-wrap',
    m: 0,
    wordWrap: 'break-word',
    maxWidth: 300
  }}>{JSON.stringify(change, null, 2)}</Typography>;
};

const ChangeListSection = ({ title, color, items }) => (
  <Box sx={{ mb: 1 }}>
    <Typography variant="subtitle2" color={color}>{title}</Typography>
    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
      {items.map(([key, value], idx) => (
        <li key={idx}><Typography variant="body2">{formatChange(value)}</Typography></li>
      ))}
    </ul>
  </Box>
);

const SubcategoryBlock = ({ subcategory, categoryKey, handleToggle }) => {
  const isCollapsed = subcategory.collapsed;
  const key = `${categoryKey}/${subcategory.name}`;

  return (
    <Box sx={{ mb: 2, pl: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
           onClick={() => handleToggle(categoryKey, subcategory.name)}>
        <IconButton size="small">{isCollapsed ? <ChevronRightIcon/> : <ExpandMoreIcon/>}</IconButton>
        <Typography variant="subtitle1"
                    sx={{ textTransform: 'capitalize' }}>{cleanUnderscore(subcategory.name)}</Typography>
      </Box>
      {!isCollapsed && (
        <>
          {subcategory.subcategories ? subcategory.subcategories.map((nested, i) => (
            <Box key={i} sx={{ mb: 2, pl: 2 }}>
              <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>{nested.name}</Typography>
              {nested.added?.length > 0 &&
                <ChangeListSection title="Added:" color="success.main" items={nested.added}/>}
              {nested.removed?.length > 0 &&
                <ChangeListSection title="Removed:" color="error.main" items={nested.removed}/>}
              {nested.modified?.length > 0 &&
                <ChangeListSection title="Modified:" color="warning.main" items={nested.modified}/>}
            </Box>
          )) : (
            <>
              {subcategory.added?.length > 0 &&
                <ChangeListSection title="Added:" color="success.main" items={subcategory.added}/>}
              {subcategory.removed?.length > 0 &&
                <ChangeListSection title="Removed:" color="error.main" items={subcategory.removed}/>}
              {subcategory.modified?.length > 0 &&
                <ChangeListSection title="Modified:" color="warning.main" items={subcategory.modified}/>}
            </>
          )}
        </>
      )}
    </Box>
  );
};

const GameChangeLog = () => {
  const [changelogEntries, setChangelogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(CHANGELOG_FILES.at(-1).value);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [collapsedSubcategories, setCollapsedSubcategories] = useState({});

  useEffect(() => {
    const loadChangelogData = async () => {
      setLoading(true);
      try {
        const data = await import(`../../data/changelog/${selectedVersion}`);
        const structuredEntry = {
          version: `${data.metadata.oldVersion} to ${data.metadata.newVersion}`,
          date: new Date(data.metadata.timestamp).toLocaleDateString(),
          changes: Object.entries(data.changes || {}).map(([category, categoryChanges]) => ({
            type: category,
            subcategories: Object.entries(categoryChanges || {}).map(([subcategory, subcategoryChanges]) => {
              const hasNestedChanges = Object.values(subcategoryChanges || {}).some(val => typeof val === 'object' && !Array.isArray(val));
              if (hasNestedChanges) {
                return {
                  name: subcategory,
                  subcategories: Object.entries(subcategoryChanges || {}).map(([nestedCategory, changes]) => ({
                    name: nestedCategory,
                    added: Object.entries(changes?.added || {}),
                    removed: Object.entries(changes?.removed || {}),
                    modified: Object.entries(changes?.modified || {})
                  }))
                };
              }
              return {
                name: subcategory,
                added: Object.entries(subcategoryChanges?.added || {}),
                removed: Object.entries(subcategoryChanges?.removed || {}),
                modified: Object.entries(subcategoryChanges?.modified || {})
              };
            })
          }))
        };
        setChangelogEntries([structuredEntry]);
      } catch (err) {
        console.error('Failed to load changelog:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChangelogData();
  }, [selectedVersion]);

  const handleToggleCategory = (type) => setCollapsedCategories(prev => ({ ...prev, [type]: !prev[type] }));
  const handleToggleSubcategory = (type, name) => {
    const key = `${type}/${name}`;
    setCollapsedSubcategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Game Change Log</Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="version-select-label">Select Version</InputLabel>
            <Select labelId="version-select-label" value={selectedVersion} label="Select Version"
                    onChange={(e) => setSelectedVersion(e.target.value)}>
              {CHANGELOG_FILES.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {changelogEntries.length === 0 ? (
          <Typography>No changelog entries available.</Typography>
        ) : (
          changelogEntries.map((entry, i) => (
            <Paper key={i} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Version {entry.version} - {entry.date}
              </Typography>
              {entry.changes.map((category, ci) => {
                const isCollapsed = collapsedCategories[category.type];
                return (
                  <Box key={ci} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                         onClick={() => handleToggleCategory(category.type)}>
                      <IconButton size="small">{isCollapsed ? <ChevronRightIcon/> : <ExpandMoreIcon/>}</IconButton>
                      <Typography variant="h6" color="primary"
                                  sx={{ textTransform: 'capitalize' }}>{category.type.replace(/-/g, ' ')}</Typography>
                    </Box>
                    {!isCollapsed && category.subcategories.map((sub, si) => (
                      <SubcategoryBlock
                        key={si}
                        subcategory={{ ...sub, collapsed: collapsedSubcategories[`${category.type}/${sub.name}`] }}
                        categoryKey={category.type}
                        handleToggle={handleToggleSubcategory}
                      />
                    ))}
                  </Box>
                );
              })}
            </Paper>
          ))
        )}
      </Box>
    </Container>
  );
};

export default GameChangeLog;

// const GameChangeLog = () => {}
// export default GameChangeLog;