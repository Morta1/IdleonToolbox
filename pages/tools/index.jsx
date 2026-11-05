import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { MENUS } from '@utility/navMenu';
import { sessionQuery } from '@utility/nav-query';
import { PAGE_SEO } from '../../data/page-seo';

const Index = () => {
  const router = useRouter();
  // The export has no query (a static page); after mount the links carry the session's demo or profile
  const query = router.isReady ? sessionQuery(router.query) : {};
  return <>
    <NextSeo
      title="Tools | Idleon Toolbox"
      description="Calculators, planners and browsers for Legends of Idleon - card search, item planner, build planner and more."
    />
    <Stack gap={3}>
      {MENUS.tools.map(({ key, label, pages }) => <Stack key={key} component={'section'} aria-labelledby={`tools-${key}`} gap={1.5}>
        <Typography id={`tools-${key}`} variant={'sectionTitle'} component={'h2'}>{label}</Typography>
        <CardGrid size={'s'}>
          {pages.map(({ url, label: name, icon }) => <ItemCard key={url} href={{ pathname: url, query }} icon={`${icon}.png`}
                                                               title={name} meta={PAGE_SEO[url]?.description}/>)}
        </CardGrid>
      </Stack>)}
    </Stack>
  </>;
};

export default Index;
