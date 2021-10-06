import styled from 'styled-components'
import { cleanUnderscore, prefix } from "../Utilities";

const shopMapping = {
  0: 'Blunder_Hills',
  1: 'Encroaching_Forest_Villas',
  2: 'YumYum_Grotto',
  3: 'Faraway_Piers',
  4: 'Frostbite_Towndra'
};

const ShopStock = ({ stock }) => {
  return (
    <ShopStockStyle>
      {stock?.map((shop, shopIndex) => {
        return <div key={`${shopMapping[shopIndex]}${shopIndex}`}>
          <span className={'shop-name'}>{cleanUnderscore(shopMapping?.[shopIndex])}</span>
          {shop?.map(({ name, rawName, amount }, itemIndex) => {
            return <div className={'shop-items-container'} key={`${name}${itemIndex}`}>
              <img src={`${prefix}data/${rawName}.png`} alt=""/>
              <div className="content">
                <div className={'item-name'}>{cleanUnderscore(name)}</div>
                <div className={'amount'}>Quantity: {amount}</div>
              </div>
            </div>;
          })}
        </div>
      })}
    </ShopStockStyle>
  );
};

const ShopStockStyle = styled.div`
  padding: 10px;
  margin-top: 15px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 360px));
  justify-content: center;

  .shop-name {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
    display: block;
    padding-bottom: 5px;
    border-bottom: 1px solid white;
    width: max-content;
  }

  .shop-items-container {
    display: flex;
    align-items: center;

    > img {
      height: 72px;
    }

    .content {
      .item-name {
        font-weight: bold;
      }
    }
  }
`;

export default ShopStock;
