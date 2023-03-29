import React from 'react';
import styled from "@emotion/styled";
import HtmlTooltip from "./Tooltip";

const DiscordInvite = () => {
  return <Style>
    <HtmlTooltip title={'Idleon Toolbox discord channel'}>
      <a href="https://discord.gg/8Devcj7FzV">
        <img src={`https://discordapp.com/api/guilds/1090610727334719558/widget.png?style=shield`}
             alt="Idleon Toolbox discord channel"/>
      </a>
    </HtmlTooltip>
  </Style>
};

const Style = styled.div`
  display: flex;
  justify-content: center;

  & img {
    width: fit-content;
    height: fit-content;
  }
`;

export default DiscordInvite;
