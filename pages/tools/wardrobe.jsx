import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { companions, items } from '@website-data';
import manifest from '../../data/player-sprites-manifest.json';
import { attackPoseForType, OUTFIT_POSES } from '@utility/paperDoll';
import { companionOption, decodeLoadout, DEFAULT_NAME, encodeLoadout, LOADOUT_PARAMS, sanitiseName } from '@utility/wardrobeQuery';
import { sessionQuery } from '@utility/nav-query';
import PaperDollCanvas from '@components/tools/wardrobe/PaperDollCanvas';
import SlotGrid from '@components/tools/wardrobe/SlotGrid';
import ItemPickerDialog from '@components/tools/wardrobe/ItemPickerDialog';
import PoseBar from '@components/tools/wardrobe/PoseBar';
import CharacterSelect from '@components/tools/wardrobe/CharacterSelect';
import Panel from '@components/common/cards/Panel';
import { MissingSections } from '@components/common/styles';

const SLOT_INDEX = { hat: 0, premiumHat: 8, weapon: 1, trophy: 10, cape: 12, nametag: 14, costume: 15 };
// EquipOrder slot 8 is the premium (cosmetic) hat, verified in the game code; the game draws it
// instead of slot 0's normal hat whenever it's actually equipped, both using frame ID + 2 on the
// same hat sheet (see components/tools/wardrobe/slots.js).
const BLANK_HAT_NAMES = new Set(['Blank', 'EquipmentHats38']); // EquipmentHats38 = Invisible Hat

// Compares only the loadout's URL-facing params, as strings, so the mirror-to-URL effect can skip
// a no-op router.replace (see pages/tools/builds.jsx's queriesEqual for the same guard).
const queriesEqual = (a, b) => LOADOUT_PARAMS.every((key) => String(a[key] ?? '') === String(b[key] ?? ''));

const slotItem = (equipped) => {
  const item = items[equipped?.rawName];
  return item && Number.isFinite(item.ID) ? item : null;
};

// currentCompanion comes from the account, not the character, and the picker's options are the
// roster's own objects: resolve through the roster so a seeded loadout and a picked one compare
// equal in the Autocomplete.
const companionByRawName = (rawName) => companionOption(companions.find((companion) => companion.rawName === rawName));

const loadoutFromCharacter = (character, currentCompanion) => {
  const premiumHat = character.equipment?.[SLOT_INDEX.premiumHat];
  const premiumHatItem = premiumHat?.rawName && !BLANK_HAT_NAMES.has(premiumHat.rawName)
    ? slotItem(premiumHat)
    : null;
  return {
    pose: '0',
    name: sanitiseName(character.name) || DEFAULT_NAME,
    hat: premiumHatItem ?? slotItem(character.equipment?.[SLOT_INDEX.hat]),
    weapon: slotItem(character.equipment?.[SLOT_INDEX.weapon]),
    cape: slotItem(character.equipment?.[SLOT_INDEX.cape]),
    costume: slotItem(character.equipment?.[SLOT_INDEX.costume]),
    trophy: slotItem(character.equipment?.[SLOT_INDEX.trophy]),
    nametag: slotItem(character.equipment?.[SLOT_INDEX.nametag]),
    companion: companionByRawName(currentCompanion?.rawName)
  };
};

const Wardrobe = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const characters = state?.characters ?? [];
  const currentCompanion = state?.account?.companions?.currentCompanion;
  const [loadout, setLoadout] = useState(() => decodeLoadout({}, items, companions));
  const [characterName, setCharacterName] = useState('');
  const [poseChoice, setPoseChoice] = useState('0');
  const [playing, setPlaying] = useState(true);
  const [pickerSlot, setPickerSlot] = useState(null);
  const [unsupported, setUnsupported] = useState([]);
  const canvasRef = useRef(null);
  // The URL named no companion and the account's pet hasn't been applied yet: "loadout has no
  // companion" alone can't tell an unnamed URL apart from one the user cleared in the picker.
  const [awaitingCompanion, setAwaitingCompanion] = useState(false);
  const [matchedCharacter, setMatchedCharacter] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // URL -> state once the router has the query (static export: query is empty on first render).
  // A URL with no companion still gets the account's own pet, same as picking a character does.
  if (router.isReady && !hydrated) {
    const fromUrl = decodeLoadout(router.query, items, companions);
    let awaiting = !router.query.companion;
    if (!fromUrl.companion && currentCompanion?.rawName) {
      const defaultCompanion = companionByRawName(currentCompanion.rawName);
      if (defaultCompanion) {
        fromUrl.companion = defaultCompanion;
        awaiting = false;
      }
    }
    setLoadout(fromUrl);
    setPoseChoice(fromUrl.pose);
    setAwaitingCompanion(awaiting);
    setHydrated(true);
  }

  // The account's companion can arrive after hydration (profile loads late): apply the same default
  // once it shows up, at most once, and only if the loadout still has no companion.
  if (hydrated && awaitingCompanion && currentCompanion?.rawName) {
    setAwaitingCompanion(false);
    const defaultCompanion = companionByRawName(currentCompanion.rawName);
    if (defaultCompanion && !loadout.companion) setLoadout({ ...loadout, companion: defaultCompanion });
  }

  // state -> URL, shallow so the page does not reload. These params are page-local by design, and
  // the mirror rebuilds the whole query, so the session params (profile/demo) have to be carried
  // across: without them the first replace strips the profile out of every nav link on the page.
  useEffect(() => {
    if (!hydrated) return;
    const query = { ...sessionQuery(router.query), ...encodeLoadout({ ...loadout, pose: poseChoice }) };
    // Skip the replace entirely when the URL already matches: without this, every render of a
    // hydrated page (e.g. while an animation is playing) would issue a router.replace whose query
    // is byte-for-byte what's already there.
    const currentQuery = Object.fromEntries(LOADOUT_PARAMS.map((key) => {
      const value = router.query?.[key];
      return [key, Array.isArray(value) ? value[0] : value];
    }));
    if (queriesEqual(currentQuery, query)) return;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadout, poseChoice, hydrated]);

  // A shared link carries the name it was built with, so the selector names that character instead
  // of Blank mannequin. The gear drawn is still the URL's, not that character's current equipment.
  // One shot: a later explicit "Blank mannequin" pick must not be undone.
  if (hydrated && !matchedCharacter && characters.length) {
    setMatchedCharacter(true);
    const match = characterName ? null : characters.find((character) => sanitiseName(character.name) === loadout.name);
    if (match) setCharacterName(match.name);
  }

  // 'attack' is a virtual pose id: the body sheet for a swing depends on the equipped weapon type,
  // and an empty weapon slot swings the fists.
  const pose = poseChoice === 'attack' ? attackPoseForType(loadout.weapon?.Type) : poseChoice;
  const dollState = { ...loadout, pose };

  // No character means the Blank mannequin row: an empty loadout, but the mannequin still wears
  // the account's own pet.
  const pickCharacter = (character) => {
    if (!character) {
      setCharacterName('');
      setLoadout({ ...decodeLoadout({}, items, companions), companion: companionByRawName(currentCompanion?.rawName) });
      return;
    }
    setCharacterName(character.name);
    setLoadout(loadoutFromCharacter(character, currentCompanion));
  };

  const download = () => {
    const url = canvasRef.current?.toDataURL('image/png');
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${loadout.name}-wardrobe.png`;
    a.click();
  };

  return <>
    <NextSeo
      title="Wardrobe | Idleon Toolbox"
      description="Dress a Legends of Idleon character in any hat, weapon, cape, costume, trophy, nametag or companion and watch it move the way the game draws it"
    />
    {/* Its character picker and the mannequin's pet read the save: a whole-parse failure takes both away */}
    <MissingSections account={state?.account} names={{ companions: 'Companions' }}/>
    <Typography variant={'body2'} color={'text.secondary'} mb={3}>
      Dress a character in any hat, weapon, cape, costume, trophy, nametag or companion and watch it move the way the game draws it.
    </Typography>
    <Stack direction={'row'} gap={3} flexWrap={'wrap'} alignItems={'flex-start'}>
      <Panel title={'Preview'} sx={{ flex: '0 1 auto', minWidth: 0, maxWidth: '100%' }}>
        <Stack gap={2} alignItems={'center'} sx={{ p: 2 }}>
          <PaperDollCanvas manifest={manifest} state={dollState} playing={playing} canvasRef={canvasRef}
                           onUnsupported={setUnsupported}/>
          <PoseBar poses={OUTFIT_POSES} pose={poseChoice} playing={playing} onPose={setPoseChoice}
                   onTogglePlay={() => setPlaying((p) => !p)} onDownload={download}/>
        </Stack>
      </Panel>
      <Panel title={'Wardrobe'} sx={{ flex: '1 1 420px', minWidth: 0 }}>
        <Stack gap={2} sx={{ p: 2 }}>
          <CharacterSelect characters={characters} characterName={characterName}
                           onPickCharacter={pickCharacter}/>
          <SlotGrid loadout={loadout} unsupported={unsupported} onSlotClick={setPickerSlot}/>
        </Stack>
      </Panel>
    </Stack>
    <ItemPickerDialog open={!!pickerSlot} slot={pickerSlot} value={pickerSlot ? loadout[pickerSlot] : null}
                      onPick={(item) => setLoadout((l) => ({ ...l, [pickerSlot]: item }))}
                      onClose={() => setPickerSlot(null)}/>
  </>;
};

export default Wardrobe;
