import React from 'react';
import { formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// A note's state in words: Unlocked, or the locked look and word
const PostyNotes = ({ postyNotes }) => <CardGrid size={'s'}>
  {(postyNotes ?? []).map((note) => <ItemCard key={note?.index} icon={`data/ResPosty${note?.index}.png`}
                                              title={`Posty Note ${(note?.index ?? 0) + 1}`}
                                              meta={`Research LV ${formatNum(note?.unlockLevel ?? 0)}`}
                                              status={note?.unlocked ? 'done' : 'locked'}
                                              statusLabel={note?.unlocked ? 'Unlocked' : undefined}>
    {note?.description ? <ItemCard.Desc text={note.description}/> : null}
  </ItemCard>)}
</CardGrid>;

export default PostyNotes;
