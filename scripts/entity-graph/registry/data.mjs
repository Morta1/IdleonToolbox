import fs from 'fs';
import path from 'path';

// Every website-data section by its own key: the small ones ride in shared-data.json, the large
// ones have a file each named after the key. Rows name a section, never a file.
export const loadWebsiteData = (dir) => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'shared-data.json'), 'utf-8'));
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json') || file === 'shared-data.json') continue;
    data[file.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  }
  return data;
};
