import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../components/common/context/AppProvider";
import { talentPagesMap } from "../../parsers/talents";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { notateNumber, prefix } from "../../utility/helpers";
import styled from "@emotion/styled";

const Apocalypses = () => {
  const { state } = useContext(AppContext);
  const [manicas, setManiacs] = useState([]);

  useEffect(() => {
    if (state?.characters) {
      const localManiacs = state?.characters?.filter((character) => {
        const isBarbarian = talentPagesMap[character.class].includes('Barbarian');
        const isBloodBerserker = talentPagesMap[character.class].includes('Blood_Berserker');
        return isBarbarian || isBloodBerserker;
      })
      setManiacs(localManiacs);
    }
  }, [state]);

  return (
    <>
      <Typography textAlign={"center"} mt={2} mb={2} variant={"h2"}>Apocalypses</Typography>
      <Stack gap={4}>
        {manicas?.map(({ name, zow, chow }) => {
          return <Stack key={`${name}-zow-chow`} gap={4}>
            <ApocDisplay apocName={'zow'} charName={name} key={`${name}-zow`} monsters={zow}/>
            <ApocDisplay apocName={'chow'} charName={name} key={`${name}-chow`} monsters={chow}/>
          </Stack>
        })}
      </Stack>
    </>
  )
};

const ApocDisplay = ({ apocName, charName, monsters }) => {
  return <Stack gap={2}>
    <Typography variant={'h4'}>{charName} {apocName}ed {monsters?.finished} monsters</Typography>
    <Card>
      <CardContent>
        <Stack gap={3} direction={'row'} flexWrap={'wrap'}>
          {monsters?.finished < monsters?.list?.length ?
            monsters?.list?.map(({
                                   name,
                                   monsterFace,
                                   kills,
                                   threshold
                                 }, index) => {
              return kills < threshold ?
                <Card sx={{ width: 120 }} variant={'outlined'} key={`${charName}-${name}-${index}`}>
                  <CardContent>
                    <Stack alignItems={'center'} gap={1}>
                      <MonsterIcon src={`${prefix}data/Mface${monsterFace}.png`} alt=""/>
                      <Typography>{notateNumber(kills, 'Big')}</Typography>
                    </Stack>
                  </CardContent>
                </Card> : null
            }) : <Typography key={`${charName}-${name}-${index}`} variant={'h5'} color={'error.light'}>You killed them ALL</Typography>}
        </Stack>
      </CardContent>
    </Card>
  </Stack>
}

const MonsterIcon = styled.img`
  width: 35px;
  height: 41px;
`

export default Apocalypses;
