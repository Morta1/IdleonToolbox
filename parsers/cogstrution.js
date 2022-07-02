export const createCogstructionData = (cogMap, cogsOrder) => {
  let dataCsv = 'cog type,name,build_rate,flaggy_rate,exp_mult,exp_rate,build_rate_boost,flaggy_rate_boost,flaggy_speed,exp_rate_boost';
  const board = cogMap;
  const cogs = cogsOrder;
  const cogData = board?.reduce((res, cog, index) => {
    const cogType = getCogstructionCogType(cogs[index]);
    if (!cogType) return res;
    const { a = '', c = '', d = '', b = '', e = '', g = '', k = '', f = '' } = cog || {};
    const cogsValues = [a, c, d, b, e, g, k, f].map((cog, index) => index < 7 ? `${getCogstructionValue(cog) || ''},` : getCogstructionValue(cog));
    const characterName = cogs[index].includes('Player_') ? cogs[index].split('_')[1] : '';
    return `${res}
${cogType},${characterName},${cogsValues.join('')}`
  }, dataCsv);
  let empties = `empties_x,empties_y`;
  const cogsForEmpties = cogsOrder?.slice(0, 96);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 12; x++) {
      const index = (7 - y) * 12 + x;
      if (cogsForEmpties[index] === 'Blank') {
        empties = `${empties}
${x},${y}`
      }
    }
  }
  return {
    cogData,
    empties
  }
}


const getCogstructionCogType = (name) => {
  const cogType = {
    "ad": "Plus",
    "di": "X",
    "up": "Up",
    "do": "Down",
    "ri": "Right",
    "le": "Left",
    "ro": "Row",
    "co": "Col",
  }
  if (name === 'Blank') return null;
  else if (name.includes('Player_')) return 'Character';
  else if (name === 'CogY') return 'Yang_Cog';
  else if (name === 'CogZ') return 'Omni_Cog';

  const directionalType = Object.entries(cogType).find(([key]) => name.endsWith(key));
  if (directionalType) return `${directionalType[1]}_Cog`;

  return 'Cog';
}

const getCogstructionValue = (cog) => {
  if (cog?.name?.includes('%')) {
    return cog?.value > 0 && !isNaN(cog?.value / 100) ? cog?.value / 100 : '';
  }
  return cog?.value || '';
}