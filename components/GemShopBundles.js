import styled from 'styled-components'
import { prefix } from "../Utilities";

const GemShopBundles = ({ bundles }) => {
  return (
    <GemShopBundlesStyle>
      {bundles?.length === 0 ? <h1>You&apos;re F2P Player!</h1> : <div>
        <span>Owned bundles:</span>
        {bundles?.map(({ name }, index) => {
          return <img key={`${name}-${index}`} src={`${prefix}data/${name}.png`} alt=""/>
        })}
      </div>}
    </GemShopBundlesStyle>
  );
};

const GemShopBundlesStyle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  text-align: center;

  & > div > span { 
    display: inline-block;
    font-weight: bold;
    font-size: 24px;
    margin-bottom: 20px;
  }

  & img {
    width: 100%;
    height: 100px;
    object-fit: contain;
  }
`;

export default GemShopBundles;
