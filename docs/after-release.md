# After the redesign's release

Everything still open from the redesign, in one place. It's safe to work through this on `main` once the redesign is merged.

**Check each row against the code first.** These were written while the redesign was being built, and the redesign itself fixed many of them. Close what no longer applies.

## Decisions and small fixes

**Live bugs (first):** golden food's 0% note, Charge Syphon NaN, and the 10 open rows from the close.

**Worth fixing:**
- Numbers: Killroy Schedule and Weekly Bosses seed from the save's clock (move to the wall clock); Jars requirement floor vs ceil; Grotto pair (commas); `2.5e23` literal vs the game's `2.49e23`; Ashen Urn bonus
- Layout: Stamps drawer covers part of Page settings at 1366; 14-letter name cut at 1200 to 1215; Trophies' filter on a 1027 phone; phone build form card pinned; footer shift under the loader; lone Pin on `/tools/builds`; header buttons hidden until load; builds `titleAttr` and overlap; builds Warrior pill and badge
- Keyboard and screen readers: focus under a pinned bar; no jump to the start after a filter change; Goals Undo under `aria-hidden`
- Colours and art: `identity.stats` and Observations grey purple (lift); Autocomplete dark look; `BribeW` faint; pale sprite gate; hero shadow in dark; Search and Pinned untinted Pets and Bundles; Champion names in Past rotations; star tiles; Boss6HP's heart; bundle `bon_q` with no art; raw `~` in font 109
- Deploy: warn when the export passes about 900 MB, since the wiki grows with each game update and only 124 MB of room is left
- Checks left open: `/dashboard` kit lead (dot over Mega Grumblo); `--pins` not re-measured; Menagerie and Jelly with a refreshed `data/raw.json`; Found 4's 36 calls

**Clean-up:** delete `Timer/Normal.jsx` and `components/tools/builds/ItemPicker.jsx`; `exhaustive-deps` directives; 3 `set-state-in-effect` disables; proposed `CLAUDE.md` lines from H, L core, L10 and L11; board sync.

**I'd leave as they are, no work:** odd game forms; Shrine hours (`gameHours`); Cape Vine bonus row; `DancingCoralCOST` (Big); HP and MP form; exact-threshold prints; costs 1M to 1e9 (commas); Toolbars under failure; dark fever; Spelunking upgrade 30's garbled name (the game's own).

## Live bugs on `main`

Audited on 2026-11-06, by reading the code rather than running each page: of the 133 rows on the old list, 120 were closed, 10 are open, 1 wasn't read and 2 no longer say what they did.

**The 10 open rows:**
- Sushi XP past its requirement
- Sushi fuel above its cap (the old row's stated cause is wrong: the game clamps at draw)
- Farming Land Plots 30 / 20
- Hole 105 schematics (the game caps at 105 too, so this row can probably go)
- Maxed tasks' "Next rank pays"
- Guild detail's `null` title
- Wiki `~r` in titles
- `bon_q`
- Sailing's "artiacts"
- Consent Decline not reaching Nitro: look at this one first, because it's about a player's consent

**Not read in the audit:** the alert window on a phone.

**From the release gates:** when the Hole's section fails to load, its Explore tab prints base values (Fill rate 10/hr, Full in 10h) beside dashes. A failed number should read `-`. Check the other tabs too: only this one was looked at.

**Found since:**
- For `main`'s list, last: golden food's note says "Increases Mining Efficiency by 0%" (Storage tiles, same default in `ItemDisplay`); the Charge Syphon NaN is on `main` too.

## From the board sync (2026-11-06)

Seen while redrawing the boards from the code, on the preview. Read in the code by that session only, so check each first.

- Raw toggle groups are grey where `ViewSwitch` is blue: `pages/settings.jsx:297`, `components/goals/parts/AppliesTo.jsx:35`, `MetricChips.jsx`
- Refinery at 384 wide, Sort: Rank, scrolls sideways 4 px inside its card: `pages/account/world-3/refinery.jsx:284`, `components/common/DataTable/index.jsx:187`
- `New week` and `Empty` past a timer's end are plain, while the dashboard's are in the ready tone: `vote-ballot.jsx:93`, `forge.jsx:93`, `refinery.jsx:147`
- A plain-string Stats value with a breakdown sits 2 px right of the others: `Panel.jsx:37` against `Breakdown.tsx`
- Column chart ticks: "10,000" hangs about 10 px past the chart's left edge: `ColumnChart.jsx:75`
- Exact digits with no dotted underline on Buildings and Meals, from a bare `NoteTrigger`: `pages/account/world-3/buildings.jsx:91`, `World4/Meals.jsx`
- A stat's "Capped" is a plain coloured word, not `StatusText`: `components/characters/Stats.jsx:88`
- `GameIcon` at 28 on clickers' next bonus looks like a slip: `components/account/clickers/NextBonus.jsx:10`
- Dark `identity.builds.main` words are 4.2:1 (joins `identity.stats` above); the phone sheet keeps MUI's shadow instead of the floating one
- Small: the search field's Esc chip inherits bold (`QuickSearch.jsx:402,433`); tile row gap 16 against 8 on the Hole (`Hole/Explore.jsx:29`); Forge's `mb: 2` (`forge.jsx:122`); the phone select's edge is `action.disabled`, not `outline` (`SectionTabs.jsx:136`); a plain table heading sits 1 px above a sortable one (`DataTable/index.jsx:166`); a stuck head's corner rounding (`DataTable/index.jsx:207`); the checkbox focus ring overlaps its label about 4 px (`theme.js:249`); `orientation` on `Tabber` never reaches MUI's Tabs (`Tabber.jsx:44,180`); `GameIcon.jsx:46` says inventory and equipment use `fit="canvas"`, but they use `IconTile`'s drawn fit; `IconTile` still takes `buttonProps` (`stamps.jsx:341`)
- Open: `valueTicks`' 2.5 step; Total levels doesn't print its 18,000+ end label at 390 or 1300 wide; `StatTile size="hero"` has no users

## Older list, not re-checked (2026-11-01)

**Update 2026-11-02:** the five items below and the Traps icon are FIXED on `origin/main` (side sessions, pushed 2026-11-01); `feat/redesign` does not have them until `origin/main` is merged in (an owner decision). Still open on main: the raw `@`/`$` placeholders below, the guild page title race (3h), the sign-in bugs 3e found (GA login method, Google unmount, email Enter and autocomplete), and `usePin.jsx` lines 24 to 29 (a parenthesis bug: unpinning one page drops every pin with a different deep tab; found by the phase 4 draft).

2d Decision 6 and 3b sent these to `main` "on the user's call"; `main` has no commit after `37f854fce2`, so all are live (fix notes in 2d's "Not in this plan"):

- Dungeon RNG item costs: `components/account/Misc/Dungeons/RngItems.js:22` computes `rarity.indexOf(rarity)`, always 0 (the destructured `rarity` shadows the module list), so 28 of 48 items show the Common cost.
- Summoning prints the game's `|` placeholder as text (the Familiar's reset time).
- Spelunking prints `$` placeholders as text (`parsers/spelunking.ts` TODOs at 1184-1219).
- Equinox Dreams shows "Lvl : 30/5".
- The dashboard's Etc timers drop `demo` / `profile` from the URL, so a reload after one of those clicks loses the session (3b "Not in this plan").

- Raw `@` and `$` placeholders printed as text (3f walk, 2026-11-01): Hole Collectibles ("@ Current Rupie Value:$"), Hole Bonuses ("@ Total Bonus"), Royal Armory ("outposts! @ Also"). Same family as the Spelunking and Summoning ones fixed on main; check main first.
- Traps shows a broken image, `/data/undefined.png`, for a character with no trap set (demo's Morojoze, Trapping lv. 1): `pages/account/world-3/traps.jsx:112` renders `${trap?.rawName}.png` unguarded. Confirmed on live 2026-11-01.

- Highscores' Minigame note prints a raw placeholder: "All Vault upgrades are }x Cheaper!" (3g walk; same family as the `@`/`$` ones).
- Worship requests `etc/MSA_9.png` and `etc/MSA_10.png` and gets 404s (`MsaTotalizer.jsx`; 3g found it, older).
- One guild (nal_problems) comes back from the API with `total_gp` -1.61e308 (the guild-history worker; 3g found it).

Totems' `sx={{ md: { minWidth: 500 } }}` (MUI ignores it) is not a `main` fix: 2d gives it to the Totems page's CardGrid move (phase 5 item 4).

## Parser and data work (2026-11-03)

These are in the plans' Leftovers tables with owners:
- The Button's sentences against their progress show different values ("124,683" against "/ 124,684").
- The parser's empty-save defaults that the pages now hide: the Hole's god link, its first collectible doubled, its first study Active, Gambit's "(TAP ME)".
- Missing number-format keys (Minehead, the reef, the Hole), and the Minehead currency sprite.
- The Slab catalog lacks 11 items the save holds (StonePremAGI/WIS/LUK/STR, Ht, GemP37, EquipmentPendant6, EquipmentHats40, Quest112, GfoodcouponS, EquipmentRingsChat12), so the Slab's list reads 1,577 where the game counts 1,588.
