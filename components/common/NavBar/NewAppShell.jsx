import {
  ActionIcon,
  AppShell,
  Burger,
  Button,
  Group,
  Text,
  UnstyledButton,
  useMantineColorScheme
} from '@mantine/core';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import LoginButton from '@components/common/NavBar/LoginButton';
import { IconLogin2, IconMoon, IconSun } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import classes from './MobileNavbar.module.css';
import { prefix } from '@utility/helpers';
import { navItems } from '@components/constants';
import { useRouter } from 'next/router';
import { NextLinkComposed } from '@components/common/NextLinkComposed';


const drawerPages = ['account', 'characters', 'tools'];

export function MobileNavbar({ children }) {
  const { state, logout } = useContext(AppContext);
  console.log(state?.signedIn)
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, setColorScheme } = useMantineColorScheme({ keepTransitions: true });
  const router = useRouter();
  const showDrawer = drawerPages.some((page) => router.pathname.includes(page));
  const { t, nt, ...updateQuery } = router?.query || {};
  const items = navItems.map((navItem) => {
    const pageName = navItem === 'account' ? 'account/misc/general' : navItem === 'tools'
      ? 'tools/card-search'
      : navItem;

    return <UnstyledButton
      component={NextLinkComposed}
      key={pageName}
      to={{ pathname: `/${pageName}`, query: updateQuery }}
      className={classes.link}
      data-active={router?.pathname.includes(navItem) || undefined}
    >
      {navItem.capitalize()}
    </UnstyledButton>
  });


  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'md', collapsed: { desktop: !showDrawer, mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm"/>
          <Group>
            <img src={`${prefix}data/Coins5.png`}/>
            <Text>Idleon Toolbox</Text>
          </Group>
          <Group ml="md" gap={8} visibleFrom="md">
            {items}
          </Group>
          <Group gap={8}>
            <ActionIcon variant="default" size={'lg'}
                        onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}>
              {colorScheme === 'dark' ? <IconSun stroke={1.5}/> : <IconMoon stroke={1.5}/>}
            </ActionIcon>
            <LoginButton />
            {/* <Button leftSection={<IconLogin2 size={18}/>} variant="default">Login</Button> */}
          </Group>
        </Group>
      </AppShell.Header>

      {showDrawer ? <AppShell.Navbar className={classes.content} py="md" px={4}>
        {items}
      </AppShell.Navbar> : null}

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}