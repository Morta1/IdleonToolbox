import Tabber from '@components/common/Tabber';
import Explore from '@components/account/Worlds/World5/Hole/Explore';
import Engineer from '@components/account/Worlds/World5/Hole/Engineer';
import Bonuses from '@components/account/Worlds/World5/Hole/Bonuses';
import Measure from '@components/account/Worlds/World5/Hole/Measure';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';

const Hole = () => {
  const { state } = useContext(AppContext);

  return <>
    <Tabber
      tabs={['Explore', 'Engineer', 'Bonuses', 'Measure']}
      icons={['etc/Villager_0','etc/Villager_1', 'etc/Villager_2', 'etc/Villager_3']}
    >
      <Explore hole={state?.account?.hole}/>
      <Engineer hole={state?.account?.hole}/>
      <Bonuses hole={state?.account?.hole}/>
      <Measure hole={state?.account?.hole}/>
    </Tabber>
  </>;
};

export default Hole;
