import styled from 'styled-components'
import { Autocomplete } from "@material-ui/lab";
import { breakpoint, flattenCraftObject, numberWithCommas, prefix } from "../../Utilities";
import { crafts } from "../../data/website-data";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createFilterOptions } from "@material-ui/lab/Autocomplete";
import { Button, Checkbox, FormControlLabel, IconButton, TextField, Toolbar } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import Badge from "@material-ui/core/Badge";
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import RemoveIcon from '@material-ui/icons/Remove';
import { AppContext } from "../Common/context";
import MaterialsTooltip from "../Common/Tooltips/MaterialsTooltip";
import useMediaQuery from "../Common/useMediaQuery";
import ItemsList from "./ItemsList";

const filterOptions = createFilterOptions({
  trim: true,
});

const defaultItem = { rawName: 'EquipmentTransparent108' };

const Todo = ({ userData, lastUpdated }) => {
  const { userTodoList, setUserTodoList } = useContext(AppContext);
  const matches = useMediaQuery(breakpoint);
  const [labels] = useState(Object.keys(crafts));
  const [value, setValue] = useState("");
  const [defaultItems, setDefaultItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [item, setItem] = useState({ rawName: 'EquipmentTransparent108' });
  const [materialList, setMaterialList] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [showEquips, setShowEquips] = useState(false);
  const [showFinishedItems, setShowFinishedItems] = useState(false);
  const [includeEquippedItems, setIncludeEquippedItems] = useState(false);
  const [itemCount, setItemCount] = useState(1);
  const itemsRef = useRef({ buttons: [] });

  useEffect(() => {
    itemsRef.current.buttons = itemsRef.current.buttons.slice(0, todoList?.length);
  }, [todoList]);

  useEffect(() => {
    const charItems = userData?.characters.reduce((res, { inventory }) => [...res, ...inventory], []);
    const totalItems = [...charItems, ...userData?.account?.inventory];
    if (userTodoList) {
      setMaterialList(userTodoList?.materialList);
      setTodoList(userTodoList?.todoList);
    }
    setMyItems(totalItems);
    setDefaultItems(totalItems);
  }, [lastUpdated]);

  useEffect(() => {
    if (defaultItems?.length) {
      setMyItems(includeEquippedItems ? [...defaultItems, ...equippedItems] : defaultItems);
    }
  }, [includeEquippedItems])

  const addEquippedItems = (shouldInclude) => {
    return shouldInclude ? userData?.characters.reduce((res, {
      tools,
      equipment,
      food
    }) => [...res, ...tools, ...equipment, ...food], [])
      .filter(({ rawName }) => rawName !== 'Blank')
      .map((item) => item?.amount ? item : { ...item, amount: 1 }) : [];
  };

  const equippedItems = useMemo(() => addEquippedItems(includeEquippedItems), [includeEquippedItems]);

  const onItemChange = (newValue) => {
    setValue(newValue);
    setItem(newValue ? crafts[newValue] : defaultItem);
  }
  const onMouseEnter = (index) => {
    itemsRef.current.buttons[index].style.display = 'block';
  }

  const onMouseExit = (index) => {
    itemsRef.current.buttons[index].style.display = 'none';
  }

  const onRemoveItem = (itemObject, amount) => {
    let accumulatedTodos, accumulatedMaterials;
    const originalItem = crafts[itemObject?.itemName];
    if (originalItem) {
      accumulatedTodos = calculateItemsQuantity(todoList, originalItem, false, false, amount);
      const list = Array.isArray(itemObject) ? itemObject : flattenCraftObject(itemObject);
      accumulatedMaterials = list?.reduce((res, itemObject) => {
        return calculateItemsQuantity(res, itemObject, true, false, amount);
      }, materialList);
      setMaterialList(accumulatedMaterials);
      setTodoList(accumulatedTodos);
      setUserTodoList(accumulatedTodos, accumulatedMaterials);
    }
  }

  const onAddItem = (item, count) => {
    if (item) {
      let accumulatedTodos, accumulatedMaterials;
      accumulatedTodos = calculateItemsQuantity(todoList, item, false, true, count);
      const list = Array.isArray(crafts[item?.itemName]) ? crafts[item?.itemName] : flattenCraftObject(crafts[item?.itemName]);
      accumulatedMaterials = list?.reduce((res, itemObject) => {
        return calculateItemsQuantity(res, itemObject, true, true, count);
      }, materialList);
      setMaterialList(accumulatedMaterials);
      setTodoList(accumulatedTodos);
      setUserTodoList(accumulatedTodos, accumulatedMaterials);
      setItemCount(1);
    }
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
    return add ? [...array, { ...itemObject, itemQuantity: itemObject?.itemQuantity * amount }] : array;
  }

  return (
    <TodoStyle>
      {matches && <Toolbar/>}
      <div className={'controls'}>
        <div className="preview">
          {item ? <img
            src={`${prefix}data/${item?.rawName}.png`}
            alt=''
          /> : null}
        </div>
        <Autocomplete
          id='item-locator'
          value={value}
          onChange={(event, newValue) => onItemChange(newValue)}
          autoComplete
          options={[value, ...labels]}
          filterSelectedOptions
          filterOptions={filterOptions}
          getOptionLabel={(option) => {
            return option ? option?.replace(/_/g, " ") : "";
          }}
          getOptionSelected={(option, value) => option === value}
          renderOption={(option) => {
            return option ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <img
                  width={24}
                  height={24}
                  src={`${prefix}data/${crafts?.[option]?.rawName}.png`}
                  alt=''
                />
                {option?.replace(/_/g, " ")}
              </div>
            ) : <></>;
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
        <Button color={'primary'} variant={'contained'} onClick={() => onAddItem(item, itemCount)} title={'Add Item'}>
          Add
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
      {todoList?.length ? <div className={'content'}>
        <div className={'items-wrapper'}>
          <span className={'title'}>Tracked Items</span>
          <div className={'items'}>
            {todoList?.map((item, index) => {
              return <div className={'item-wrapper'} key={item?.itemName + '' + index}
                          onMouseEnter={() => onMouseEnter(index, 'removeAll')}
                          onMouseLeave={() => onMouseExit(index, 'removeAll')}>
                <Badge badgeContent={numberWithCommas(item?.itemQuantity)}
                       max={10000}
                       anchorOrigin={{
                         vertical: 'top',
                         horizontal: 'right',
                       }}
                       color="primary">
                  <MaterialsTooltip name={item?.itemName} items={flattenCraftObject(item)}>
                    <img key={item?.rawName + ' ' + index}
                         src={`${prefix}data/${item?.rawName}.png`}
                         alt=''/>
                  </MaterialsTooltip>
                </Badge>
                <div className={'buttons'} ref={el => itemsRef.current.buttons[index] = el}>
                  <IconButton type={'bottom'} size={"small"}
                              onClick={() => onAddItem({ ...item, itemQuantity: 1 }, 1)}>
                    <AddIcon/>
                  </IconButton>
                  <IconButton type={'bottom'} size={"small"} onClick={() => onRemoveItem(item, 1)}>
                    <RemoveIcon/>
                  </IconButton>
                  <IconButton size={"small"} onClick={() => onRemoveItem(item, item?.itemQuantity)}>
                    <DeleteForeverIcon/>
                  </IconButton>
                </div>
              </div>
            })}
          </div>
        </div>
        <div className={'crafts-container'}>
          <span className={'title'}>Required Materials</span>
          <ItemsList itemsList={materialList} inventoryItems={myItems} showEquips={showEquips}
                     showFinishedItems={showFinishedItems}/>
        </div>
      </div> : null}
    </TodoStyle>
  );
};

const TodoStyle = styled.div`
  padding: 15px;
  margin-top: 15px;
  margin-bottom: 25px;

  .item-wrapper {
    width: 90px;
    height: 102px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .buttons {
    display: none;
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

export default Todo;
