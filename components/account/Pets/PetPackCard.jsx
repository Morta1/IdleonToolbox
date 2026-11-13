import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { monsterSprite } from '@utility/spriteImages';
import { companions as companionsData } from '@website-data';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { effectText, petCrystalIcon } from '@components/account/Pets/PetCollection';

const amountWith = (icon, value) => <Stack direction={'row'} gap={0.5} alignItems={'center'} component={'span'}>
  {icon}{formatNum(value ?? 0, 'whole')}
</Stack>;

// A pet pack as the Pet Mart's first slot draws it: its name and $ price, the pet crystals and gems it gives, and its pet.
// The pack has no art of its own, so the pet's sprite stands for it.
const PetPackCard = ({ pack, status, statusLabel, meta, dimmed }) => {
  const companion = companionsData?.[pack.companionIndex];
  const petName = companion?.name ? cleanUnderscore(companion.name) : null;
  return <ItemCard icon={companion?.name ? monsterSprite(companion.name) : undefined}
                   title={titleCaseName(cleanUnderscore(pack.displayName))}
                   status={status} statusLabel={statusLabel} meta={meta} dimmed={dimmed} keepMeta
                   footer={pack.price != null ? formatNum(pack.price, 'price') : null}>
    <ItemCard.Facts rows={[
      ['Pet crystals', amountWith(petCrystalIcon(16), pack.petCrystals)],
      ['Gems', amountWith(<GameIcon src={'data/PremiumGem.png'} size={16} alt={'Gems'}/>, pack.gems)],
      petName ? ['Pet', petName] : null
    ].filter(Boolean)}/>
    {companion?.effect ? <ItemCard.Desc text={effectText(companion.effect)}/> : null}
  </ItemCard>;
};

export default PetPackCard;
