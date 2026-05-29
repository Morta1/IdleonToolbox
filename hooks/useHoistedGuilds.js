/**
 * Builds the "Pinned" section above the leaderboard from the user's own guild
 * plus their manual pins. The user's guild always wins and is rendered with
 * yourGuild=true; manual pins not present in the tracked cohort become
 * tombstones so the user can still see/unpin them.
 */
export function useHoistedGuilds({ guilds, pinnedGuilds, myGuildId }) {
  const guildById = guilds
    ? new Map(guilds.map((g) => [g.guild_id, g]))
    : new Map();
  const myGuildRow = myGuildId ? guildById.get(myGuildId) ?? null : null;

  const hoistedRows = [];
  const hoistedIds = new Set();

  if (myGuildRow) {
    hoistedIds.add(myGuildId);
    hoistedRows.push({ guild: myGuildRow, yourGuild: true, tombstone: false });
  }

  for (const { id, name } of pinnedGuilds) {
    if (hoistedIds.has(id)) continue;
    hoistedIds.add(id);
    const liveRow = guildById.get(id);
    if (liveRow) {
      hoistedRows.push({ guild: liveRow, yourGuild: false, tombstone: false });
    } else {
      hoistedRows.push({
        guild: { guild_id: id, guild_name: name },
        yourGuild: false,
        tombstone: true
      });
    }
  }

  return { hoistedRows, showHoistedSection: hoistedRows.length > 0 };
}
