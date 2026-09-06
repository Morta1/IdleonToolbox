import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Stack, Typography } from '@mui/material';
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
  const matchedCharacter = useRef(false);
  // Guards the account-companion default so it is applied at most once: either inline during
  // hydration (currentCompanion already loaded) or by the late effect below (profile loads after).
  const companionDefaulted = useRef(false);
  // Whether the URL named a companion at hydration time, for the late effect - "loadout has no
  // companion" alone can't tell an unnamed URL apart from one the user cleared in the picker.
  const urlHadNoCompanion = useRef(false);
  // Hydration is tracked via React state (not a ref, see pages/tools/builds.jsx for the same
  // pattern): with a ref, the mirror-to-URL effect below would see `hydrated.current === true`
  // in the same commit where the hydration effect synchronously set it, but `loadout`/`poseChoice`
  // would still hold their pre-hydration values - clobbering the incoming URL with stale state.
  const [hydrated, setHydrated] = useState(false);

  // URL -> state once the router has the query (static export: query is empty on first render).
  // A URL with no companion still gets the account's own pet, same as picking a character does.
  useEffect(() => {
    if (!router.isReady || hydrated) return;
    const fromUrl = decodeLoadout(router.query, items, companions);
    urlHadNoCompanion.current = !router.query.companion;
    if (!fromUrl.companion && currentCompanion?.rawName) {
      const defaultCompanion = companionByRawName(currentCompanion.rawName);
      if (defaultCompanion) {
        fromUrl.companion = defaultCompanion;
        companionDefaulted.current = true;
      }
    }
    setLoadout(fromUrl);
    setPoseChoice(fromUrl.pose);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query, hydrated]);

  // The account's companion can arrive after hydration (profile loads late): apply the same default
  // once it shows up, but only if the loadout still has no companion and the URL never named one -
  // otherwise this would clobber a companion the user explicitly cleared in the picker.
  useEffect(() => {
    if (!hydrated || companionDefaulted.current || !currentCompanion?.rawName) return;
    companionDefaulted.current = true;
    if (!urlHadNoCompanion.current) return;
    const defaultCompanion = companionByRawName(currentCompanion.rawName);
    if (!defaultCompanion) return;
    setLoadout((l) => (l.companion ? l : { ...l, companion: defaultCompanion }));
  }, [hydrated, currentCompanion?.rawName]);

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
  // One shot, guarded by a ref: a later explicit "Blank mannequin" pick must not be undone.
  useEffect(() => {
    if (!hydrated || matchedCharacter.current || !characters.length) return;
    matchedCharacter.current = true;
    if (characterName) return;
    const match = characters.find((character) => sanitiseName(character.name) === loadout.name);
    if (match) setCharacterName(match.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, characters.length]);

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
    <Typography variant={'body2'} sx={{ maxWidth: 600 }} mb={3}>
      Dress a character in any hat, weapon, cape, costume, trophy, nametag or companion and watch it move the way the game draws it.
    </Typography>
    <Stack direction={'row'} gap={3} flexWrap={'wrap'} alignItems={'flex-start'}>
      <Card sx={{ flex: '0 1 auto', minWidth: 0 }}>
        <CardContent>
          <Stack gap={2} alignItems={'center'}>
            <PaperDollCanvas manifest={manifest} state={dollState} playing={playing} canvasRef={canvasRef}
                             onUnsupported={setUnsupported}/>
            <PoseBar poses={OUTFIT_POSES} pose={poseChoice} playing={playing} onPose={setPoseChoice}
                     onTogglePlay={() => setPlaying((p) => !p)} onDownload={download}/>
          </Stack>
        </CardContent>
      </Card>
      <Card sx={{ flex: '1 1 420px', minWidth: 0 }}>
        <CardContent>
          <Stack gap={2}>
            <CharacterSelect characters={characters} characterName={characterName}
                             onPickCharacter={pickCharacter}/>
            <SlotGrid loadout={loadout} unsupported={unsupported} onSlotClick={setPickerSlot}/>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
    <ItemPickerDialog open={!!pickerSlot} slot={pickerSlot} value={pickerSlot ? loadout[pickerSlot] : null}
                      onPick={(item) => setLoadout((l) => ({ ...l, [pickerSlot]: item }))}
                      onClose={() => setPickerSlot(null)}/>
  </>;
};

export default Wardrobe;
