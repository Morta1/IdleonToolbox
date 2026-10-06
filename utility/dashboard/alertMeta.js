// Alert data keys that differ from the option controlling them. resolveSettingsTarget reads the
// key off the alert, so without this the settings link lands on the tracker, not the option.
export const alertAliases = {
  'account.World 3.construction': { saltDeficit: 'saltBalance', saltRankUpRoom: 'saltBalance' },
  'account.World 3.printer': { atoms: 'includeResource' },
  'account.World 3.traps': { overdue: 'trapsOverdue' },
  'account.World 3.hatRack': { missingHats: 'hatsMissing' },
  'account.World 5.hole': {
    motherlodeMaxed: 'motherlode',
    hiveMaxed: 'theHive',
    evertreeMaxed: 'evertree',
    bottomlessTrenchMaxed: 'bottomlessTrench'
  },
  'account.World 6.etc': { emperorAttempts: 'emperor' },
  'account.World 7.gallery': { missingTrophies: 'trophiesMissing', missingNametags: 'nametagsMissing' },
  'account.World 7.legendTalents': { legendPointsLeftToSpend: 'pointsLeftToSpend' }
};
