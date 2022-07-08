import { crafts } from "data/website-data";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Badge, Card, CardContent,
  Checkbox,
  createFilterOptions,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppContext } from "components/common/context/AppProvider";
import { cleanUnderscore, numberWithCommas, prefix } from "utility/helpers";
import Button from "@mui/material/Button";
import { flattenCraftObject } from "parsers/items";
import IconButton from "@mui/material/IconButton";
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from "@mui/icons-material/Add";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import styled from "@emotion/styled";
import ItemsList from "components/tools/item-planner/ItemsList";
import Tooltip from "components/Tooltip";

const filterOptions = createFilterOptions({
  trim: true,
});

const defaultItem = { rawName: 'EquipmentTransparent108' };

const ItemPlanner = ({}) => {
  const { state, lastUpdated, dispatch } = useContext(AppContext);
  const { planner = { sections: [] } } = state;
  const [labels] = useState(Object.keys(crafts));
  const [value, setValue] = useState({ '0': '' });
  const [defaultItems, setDefaultItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [item, setItem] = useState([defaultItem]);
  const [showEquips, setShowEquips] = useState(false);
  const [showFinishedItems, setShowFinishedItems] = useState(false);
  const [includeEquippedItems, setIncludeEquippedItems] = useState(false);
  const [itemCount, setItemCount] = useState(1);
  const [buttons, setButtons] = useState({});

  useEffect(() => {
    const charItems = state?.characters?.reduce((res, { inventory }) => [...res, ...inventory], []) || [];
    const totalItems = [...charItems, ...(state?.account?.storage || [])];
    setMyItems(totalItems);
    setDefaultItems(totalItems);
    setItem(planner?.sections?.map(() => defaultItem))
  }, [state, lastUpdated]);

  useEffect(() => {
    if (defaultItems?.length) {
      setMyItems(includeEquippedItems ? [...defaultItems, ...equippedItems] : defaultItems);
    }
  }, [includeEquippedItems])

  const addEquippedItems = (shouldInclude) => {
    return shouldInclude ? state?.characters.reduce((res, {
      tools,
      equipment,
      food
    }) => [...res, ...tools, ...equipment, ...food], [])
      .filter(({ rawName }) => rawName !== 'Blank')
      .map((item) => item?.amount ? item : { ...item, amount: 1 }) : [];
  };

  const equippedItems = useMemo(() => addEquippedItems(includeEquippedItems), [includeEquippedItems]);

  const onItemChange = (newValue, sectionIndex) => {
    const newArr = item.map((_, index) => index === sectionIndex ? newValue ? crafts[newValue] : defaultItem : _);
    setValue({ ...value, [`${sectionIndex}`]: newValue });
    setItem(newArr);
  }

  const onRemoveItem = (sectionIndex, itemObject, amount) => {
    let accumulatedItems, accumulatedMaterials;
    const section = planner?.sections?.[sectionIndex];
    const originalItem = crafts[itemObject?.itemName];
    if (originalItem) {
      accumulatedItems = calculateItemsQuantity(section?.items, originalItem, false, false, amount);
      const list = Array.isArray(itemObject) ? itemObject : flattenCraftObject(itemObject);
      accumulatedMaterials = list?.reduce((res, itemObject) => {
        return calculateItemsQuantity(res, itemObject, true, false, amount);
      }, section?.materials);
      const sections = updateSectionData(sectionIndex, { materials: accumulatedMaterials, items: accumulatedItems });
      dispatch({ type: 'planner', data: { sections } });
    }
  }

  const onAddItem = (sectionIndex, item, count) => {
    if (item?.rawName !== defaultItem.rawName) {
      const section = planner?.sections?.[sectionIndex];
      let accumulatedItems, accumulatedMaterials;
      accumulatedItems = calculateItemsQuantity(section?.items, item, false, true, count);
      const list = Array.isArray(crafts[item?.itemName]) ? crafts[item?.itemName] : flattenCraftObject(crafts[item?.itemName]);
      accumulatedMaterials = list?.reduce((res, itemObject) => {
        return calculateItemsQuantity(res, itemObject, true, true, count);
      }, section?.materials);
      const sections = updateSectionData(sectionIndex, { materials: accumulatedMaterials, items: accumulatedItems });
      dispatch({ type: 'planner', data: { sections } });
      setValue({ ...value, [sectionIndex]: '' });
      setItemCount(1);
    }
  }

  const updateSectionData = (sectionIndex, data) => {
    return planner?.sections?.map((section, index) => {
      return sectionIndex === index ? data : section;
    });
  }

  const calculateItemsQuantity = (array, itemObject, isMaterial, add = true, amount) => {
    const updatedItem = array?.find((innerItem) => itemObject?.itemName === innerItem?.itemName);
    if (updatedItem) {
      return array?.reduce((res, innerItem) => {
        if (itemObject?.itemName !== innerItem?.itemName) return [...res, innerItem];
        const quantity = amount ? amount * itemObject?.itemQuantity : innerItem?.itemQuantity;
        if (!add && updatedItem?.itemQuantity - quantity <= 0) {
          return res;
        }
        return [...res, {
          ...updatedItem,
          itemQuantity: add ? updatedItem?.itemQuantity + quantity : updatedItem?.itemQuantity - quantity
        }]
      }, [])
    }
    return add ? [...(array || []), { ...itemObject, itemQuantity: itemObject?.itemQuantity * amount }] : array;
  }

  const addSection = () => {
    dispatch({ type: 'planner', data: { sections: [...planner?.sections, { items: [], materials: [] }] } });
  }

  const removeSection = (sectionIndex) => {
    const sections = planner.sections.filter((_, index) => index !== sectionIndex);
    setValue({ ...value, [sectionIndex]: '' })
    dispatch({ type: 'planner', data: { sections } });
  }

  const handleResetAll = () => {
    setValue({ '0': '' })
    setItem([defaultItem]);
    dispatch({ type: 'planner', data: { sections: [{ items: [], materials: [] }] } })
  }

  return (
    <TodoStyle>
      <div>
        <Tooltip title={'This will reset all sections and items'}>
          <Button onClick={handleResetAll}>
            <RestartAltIcon/> Reset All
          </Button>
        </Tooltip>
        <Button onClick={addSection}>
          <AddIcon/> Add new section
        </Button>
      </div>
      <div>
        <FormControlLabel
          control={
            <StyledCheckbox
              checked={showEquips}
              onChange={() => setShowEquips(!showEquips)}
              name='Show equips'
              color='default'
            />
          }
          label={'Show equips'}
        />
        <FormControlLabel
          control={
            <StyledCheckbox
              checked={showFinishedItems}
              onChange={() => setShowFinishedItems(!showFinishedItems)}
              name='Show Finished Items'
              color='default'
            />
          }
          label={'Show Finished Items'}
        />
        <FormControlLabel
          control={
            <StyledCheckbox
              checked={includeEquippedItems}
              onChange={() => setIncludeEquippedItems(!includeEquippedItems)}
              name='Include Equipped Items'
              color='default'
            />
          }
          label={'Include Equipped Items'}
        />
      </div>
      {planner?.sections?.map(({ items, materials }, sectionIndex) => {
        return <Card sx={{ my: 2 }} variant={'outlined'} key={`section-${sectionIndex}`}>
          <CardContent>
            {planner?.sections?.length > 1 && <Button onClick={() => removeSection(sectionIndex)}>
              <RemoveIcon/> Remove Section
            </Button>}
            <div className={'controls'}>
              <div className="preview">
                {item?.[sectionIndex] ? <img
                  src={`${prefix}data/${item?.[sectionIndex]?.rawName}.png`}
                  alt=''
                /> : null}
              </div>
              <Autocomplete
                id='item-locator'
                value={value?.[sectionIndex]}
                onChange={(event, newValue) => onItemChange(newValue, sectionIndex)}
                autoComplete
                options={[value?.[sectionIndex], ...labels]}
                filterSelectedOptions
                filterOptions={filterOptions}
                getOptionLabel={(option) => {
                  return option ? option?.replace(/_/g, " ") : "";
                }}
                renderOption={(props, option) => {
                  return option ? (
                    <Stack gap={2} {...props} direction={'row'}>
                      <img
                        width={24}
                        height={24}
                        src={`${prefix}data/${crafts?.[option]?.rawName}.png`}
                        alt=''
                      />
                      {option?.replace(/_/g, " ")}
                    </Stack>
                  ) : <span style={{ height: 0 }} key={'empty'}/>;
                }}
                style={{ width: 300 }}
                renderInput={(params) => (
                  <StyledTextField {...params} label='Item Name' variant='outlined'/>
                )}
              />
              <StyledTextField
                value={itemCount}
                width={'100px'}
                inputProps={{ min: 1 }}
                onChange={(e) => setItemCount(e?.target?.value)}
                type={'number'}
                label={'Item Count'}
                variant={'outlined'}/>
              <Button color={'primary'} variant={'contained'}
                      onClick={() => onAddItem(sectionIndex, item?.[sectionIndex], itemCount)}
                      title={'Add Item'}>
                Add
              </Button>
            </div>
            <div className={'content'}>
              <div className={'items-wrapper'}>
                <span className={'title'}>Tracked Items</span>
                <div className={'items'}>
                  {items?.map((item, index) => {
                    return <div className={'item-wrapper'} key={sectionIndex + '' + item?.itemName + '' + index}
                                onMouseEnter={() => setButtons({ ...buttons, [`${sectionIndex}-${index}`]: true })}
                                onMouseLeave={() => setButtons({ ...buttons, [`${sectionIndex}-${index}`]: false })}>
                      <Badge badgeContent={numberWithCommas(item?.itemQuantity)}
                             max={10000}
                             anchorOrigin={{
                               vertical: 'top',
                               horizontal: 'right',
                             }}
                             color="primary">
                        <Tooltip title={<MaterialsTooltip name={item?.itemName} items={flattenCraftObject(item)}/>}>
                          <img key={item?.rawName + ' ' + index}
                               src={`${prefix}data/${item?.rawName}.png`}
                               alt=''/>
                        </Tooltip>
                      </Badge>
                      {buttons?.[`${sectionIndex}-${index}`] ? <div className={'buttons'}>
                        <IconButton type={'bottom'} size={"small"}
                                    onClick={() => onAddItem(sectionIndex, { ...item, itemQuantity: 1 }, 1)}>
                          <AddIcon/>
                        </IconButton>
                        <IconButton type={'bottom'} size={"small"} onClick={() => onRemoveItem(sectionIndex, item, 1)}>
                          <RemoveIcon/>
                        </IconButton>
                        <IconButton size={"small"} onClick={() => onRemoveItem(sectionIndex, item, item?.itemQuantity)}>
                          <DeleteForeverIcon/>
                        </IconButton>
                      </div> : null}
                    </div>
                  })}
                </div>
              </div>
              <div className={'crafts-container'}>
                <span className={'title'}>Required Materials</span>
                {myItems?.length > 0 ?
                  <ItemsList itemsList={materials} inventoryItems={myItems} showEquips={showEquips}
                             showFinishedItems={showFinishedItems}/> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      })}
    </TodoStyle>
  );
};

const MaterialsTooltip = ({ name, items }) => {
  return <>
    <Typography fontWeight={'bold'} variant={'h5'}>{cleanUnderscore(name)}</Typography>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {items?.map(({ rawName, itemQuantity }, index) => {
        return <Stack alignItems={'center'} key={rawName + '' + index}>
          <MaterialIcon src={`${prefix}data/${rawName}.png`} alt=""/>
          <Typography>{itemQuantity}</Typography>
        </Stack>
      })}
    </Stack>
  </>
}

const MaterialIcon = styled.img`
  width: 50px;
`

const TodoStyle = styled.div`
  padding: 15px;
  margin-top: 15px;
  margin-bottom: 25px;

  .item-wrapper {
    width: 105px;
    height: 102px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .title {
    font-size: 20px;
    font-weight: bold;
    display: inline-block;
    margin-bottom: 10px;
  }

  .preview {
    min-height: 77px;
    min-width: 77px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    @media (max-width: 800px) {
      padding: 10px;
    }
  }

  .items-wrapper {
    margin-top: 15px;

    .items {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
  }

  .content {
    margin-top: 25px;
    display: grid;
    grid-template-columns: 1fr 3fr;
    column-gap: 50px;
  }

  .crafts-container {
    margin-top: 15px;
  }
`;

const StyledTextField = styled(TextField)`
  ${({ width }) => width ? `width:${width};` : ''}
  && label.Mui-focused {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const StyledCheckbox = styled(Checkbox)`
  && {
    color: white;
  }
`;

export default ItemPlanner;
