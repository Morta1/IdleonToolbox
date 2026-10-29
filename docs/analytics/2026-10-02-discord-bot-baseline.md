# Discord bot launch: GA baseline

Bot launched globally on 2026-10-02. Baseline window: **4 Sep - 1 Oct 2026** (28 days before launch).
GA4 property `idleon-toolbox` (a205838631 p284087386), all users (consented data only, as GA shows).
Taken 2026-10-02 from Reports > Engagement > Pages and screens (path filter) and Reports > Acquisition > Traffic acquisition.

## Site totals

| Metric | Value |
|---|---|
| Sessions | 354,327 |
| Active users | 192,090 |
| Views | 1,755,266 |

Channels: Direct 51.4%, Organic Search 37.8%, Unassigned 4.4%, Organic Social 3.1%, Referral 1.2%, AI Assistant 0.2%.

## New users (reach)

From Reports > Games reporting > Acquisition > View user acquisition (first-user channel).

| Metric | 28 days | Per week |
|---|---|---|
| Total users | 38,647 | |
| New users | 11,747 | ~2,940 |
| Returning users | 30,832 | |

New users by first channel: Organic Search 5,990 (51%), Direct 5,366 (46%), Organic Social 180, Referral 117, Organic Video 60, AI Assistant 30. A bot effect shows up as new users with first source `discord_bot` (switch the dimension to First user source / medium), plus any rise in Direct, where untagged Discord links land.

## Profile uploads (conversion)

`profile_uploaded` is the property's only key event, so "Key events" = profile uploads.

| Metric | 28 days |
|---|---|
| profile_uploaded events | 5,573 (~1,390 per week) |
| Session key event rate | 1.33% |
| User key event rate | 3.44% |

By channel: Direct 2,586, Organic Search 2,370, Unassigned 276, Organic Social 197, Referral 113.

The count includes failed uploads (`upload_status` = failure, value 0). For a success-only number, use an Exploration with the event-scoped custom dimension `upload_status`. The comparison only needs the same definition on both sides, so the total is fine as a baseline. After launch, check Traffic acquisition with dimension Session source / medium and the key event picker set to `profile_uploaded`: uploads from `discord_bot / *` sessions are bot-driven conversions.

## Pages the bot could take traffic from (the "loss" side)

| Path filter | Views | Active users | Share of views |
|---|---|---|---|
| `/leaderboards` | 20,546 | 2,946 | 1.17% |
| `/guilds` (all) | 8,006 | 3,741 | 0.46% |
| of which `/guilds` list | 7,090 | 3,709 | |
| of which `/guilds/detail` | 879 | 547 | |
| `/wiki` (all, 3,932 paths) | 41,161 | 10,792 | 2.35% |
| `/tools/builds` (all, 156 paths) | 72,777 | 8,112 | 4.15% |

Together these public pages are about 8% of views; the account pages (dashboard, world pages, characters) are the other ~92% and the bot does not touch them.

## Discord traffic before launch (the "gain" side)

- `discord_bot / *` sessions: 2 (`discord_bot / profile_card`, from the 2026-10-01 mockup tests). Effectively zero.
- No `discord.com` referral sessions: Discord strips the referrer, so plain links pasted in Discord land in Direct. Only UTM-tagged bot links are attributable.
- `/leaderboards?player=` did not exist before 2026-10-02, so its baseline is 0.

## How to compare (after 3-4 weeks)

1. Traffic acquisition, dimension **Session source / medium**, search `discord_bot`: sessions per command (`discord_bot / wiki|build|profile|guild`); add secondary dimension **Session manual ad content** for the button.
2. Pages and screens, same path filters as above, date range 3-6 Oct to 30 Oct vs this baseline. Adjust for site-wide trend: compare each path's share of views, not raw views.
3. Loss check: same page filters with a comparison excluding session source `discord_bot`.
