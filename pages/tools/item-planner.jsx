import { crafts, itemsArray } from 'data/website-data';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Badge,
  Checkbox,
  createFilterOptions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, downloadFile, numberWithCommas, prefix, tryToParse } from 'utility/helpers';
import Button from '@mui/material/Button';
import { addEquippedItems, flattenCraftObject, getAllItems } from 'parsers/items';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import styled from '@emotion/styled';
import ItemsList from 'components/tools/item-planner/ItemsList';
import Tooltip from 'components/Tooltip';
import { NextSeo } from 'next-seo';
import GetAppIcon from '@mui/icons-material/GetApp';
import FileUploadIcon from '@mui/icons-material/FileUpload';

const filterOptions = createFilterOptions({
  trim: true
});

const defaultItem = { rawName: 'EquipmentTransparent108' };

const ItemPlanner = ({}) => {
  const { state, lastUpdated, dispatch } = useContext(AppContext);
  const { planner = { sections: [] } } = state;
  const [labels] = useState(Object.keys(crafts));
  const [value, setValue] = useState({ '0': '' });
  const [myItems, setMyItems] = useState([]);
  const [item, setItem] = useState([defaultItem]);
  const [itemDisplay, setItemDisplay] = useState('0');
  const [includeEquippedItems, setIncludeEquippedItems] = useState(false);
  const [itemCount, setItemCount] = useState(1);
  const [buttons, setButtons] = useState({});
  const [sectionName, setSectionName] = useState();
  const equippedItems = useMemo(() => addEquippedItems(state?.characters, includeEquippedItems), [includeEquippedItems]);
  const totalItems = useMemo(() => getAllItems(state?.characters, state?.account), [state?.characters, state?.account]);
  const inputRef = useRef();
  const [confirmationDialog, setConfirmationDialog] = useState({ open: false, type: '', data: null });

  useEffect(() => {
    if (!state?.characters && !state?.account) {
      setMyItems(itemsArray);
    } else {
      setMyItems(includeEquippedItems ? [...(totalItems || []), ...(equippedItems || [])] : totalItems);
    }
    setItem(planner?.sections?.map(() => defaultItem))
  }, [state, lastUpdated, includeEquippedItems]);

  const handleExport = () => {
    const data = localStorage.getItem('planner');
    if (!data || planner?.sections?.length === 0) return;
    downloadFile(data, 'it-item-planner.json')
  }

  const handleImport = () => {
    inputRef.current.click();
  }

  const handleFileChange = async (e) => {
    const fileObject = e.target.files[0];
    if (!fileObject || fileObject?.type !== 'application/json') {
      console.error('File isn\'t a json file');
      return;
    }
    let content = await fileObject.text();
    if (content) {
      content = tryToParse(content);
      if (content?.sections) {
        dispatch({ type: 'planner', data: { sections: content?.sections } });
      }
    }
  }

  const onItemChange = (newValue, sectionIndex) => {
    const newArr = item.map((_, index) => index === sectionIndex ? newValue ? crafts[newValue] : defaultItem : _);
    setValue({ ...value, [`${sectionIndex}`]: newValue });
    setItem(newArr);
  }

  const onRemoveItem = (sectionIndex, itemObject, amount, isDelete) => {
    if (itemObject?.itemQuantity === 0 && amount > 0) return;
    let accumulatedItems, accumulatedMaterials;
    const section = planner?.sections?.[sectionIndex];
    const originalItem = crafts[itemObject?.itemName];
    if (originalItem) {
      accumulatedItems = calculateItemsQuantity(section?.items, originalItem, false, false, amount, isDelete);
      const list = Array.isArray(itemObject) ? itemObject : flattenCraftObject(itemObject);
      accumulatedMaterials = list?.reduce((res, itemObject) => {
        return calculateItemsQuantity(res, itemObject, true, false, amount, isDelete);
      }, section?.materials);
      const sections = updateSectionData(sectionIndex, {
        materials: accumulatedMaterials,
        items: accumulatedItems,
        name: section?.name
      });
      dispatch({ type: 'planner', data: { sections } });
    }
  }

  const onAddItem = (sectionIndex, item, count) => {
    if (item?.rawName !== defaultItem.rawName) {
      const section = planner?.sections?.[sectionIndex];
      let accumulatedItems, accumulatedMaterials;
      accumulatedItems = calculateItemsQuantity(section?.items, item, false, true, count);
      const list = Array.isArray(crafts[item?.itemName])
        ? crafts[item?.itemName]
        : flattenCraftObject(crafts[item?.itemName]);
      accumulatedMaterials = list?.reduce((res, itemObject) => {
        return calculateItemsQuantity(res, itemObject, true, true, count);
      }, section?.materials);
      const sections = updateSectionData(sectionIndex, {
        materials: accumulatedMaterials,
        items: accumulatedItems,
        name: section?.name
      });
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

  const calculateItemsQuantity = (array, itemObject, isMaterial, add = true, amount, isDelete) => {
    const updatedItem = array?.find((innerItem) => itemObject?.itemName === innerItem?.itemName);
    if (updatedItem) {
      return array?.reduce((res, innerItem) => {
        if (itemObject?.itemName !== innerItem?.itemName) return [...res, innerItem];
        const quantity = amount ? amount * itemObject?.itemQuantity : innerItem?.itemQuantity;
        if (!add && updatedItem?.itemQuantity - quantity <= 0 && isDelete) {
          return res;
        }
        return [...res, {
          ...updatedItem,
          itemQuantity: add ? updatedItem?.itemQuantity + quantity : updatedItem?.itemQuantity - quantity,
          itemCount: parseFloat(amount)
        }]
      }, [])
    }
    return add ? [...(array || []),
      { ...itemObject, itemQuantity: itemObject?.itemQuantity * amount, itemCount: parseFloat(amount) }] : array;
  }

  const addSection = () => {
    const name = sectionName ? sectionName : `section-${Math.floor(planner?.sections?.length + 1)}`;
    dispatch({
      type: 'planner',
      data: { sections: [...(planner?.sections || []), { items: [], materials: [], name }] }
    });
  }

  const removeSection = (sectionIndex) => {
    setConfirmationDialog({ open: true, type: 'section', data: sectionIndex })
  }

  const handleResetAll = () => {
    setConfirmationDialog({ open: true, type: 'sections', data: null })
  }

  return (
    (<TodoStyle>
      <NextSeo
        title="Item Planner | Idleon Toolbox"
        description="Useful tool to keep track of your crafting projects by tracking existing and missing materials"
      />
      {!state?.characters && !state?.account ?
        <Typography component={'div'} sx={{ mb: 2 }} variant={'caption'}>* This tool will work better if you're logged
          in</Typography> : null}
      <Stack direction={'row'} gap={5} flexWrap={'wrap'}>
        <div>
          <Stack direction={'row'} alignItems={'center'}>
            <TextField size={'small'} sx={{ mt: 1 }} label={'Section name'} placeholder={'Enter section name'}
                       onChange={(e) => setSectionName(e.target.value)}
                       InputProps={{
                         endAdornment: <InputAdornment position="end">
                           <IconButton onClick={addSection}>
                             <AddIcon/>
                           </IconButton>
                         </InputAdornment>
                       }}/>
          </Stack>
          <Tooltip title={'This will reset all sections and items'}>
            <Button sx={{ mt: 1 }} onClick={handleResetAll}>
              <RestartAltIcon/> Reset all sections
            </Button>
          </Tooltip>
        </div>
        <Stack sx={{ pl: 1, mt: 1 }}>
          <FormControl>
            <FormLabel id="demo-radio-buttons-group-label">Display</FormLabel>
            <RadioGroup
              row
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="0"
              name="radio-buttons-group"
              onChange={(e) => setItemDisplay(e.target.value)}
            >
              <FormControlLabel value="0" control={<Radio/>} label="Show Missing Items"/>
              <FormControlLabel value="1" control={<Radio/>} label="Show All Items"/>
            </RadioGroup>
          </FormControl>
          <FormControlLabel
            control={
              <StyledCheckbox
                checked={includeEquippedItems}
                onChange={() => setIncludeEquippedItems(!includeEquippedItems)}
                name="Include Equipped Items"
                color="default"
              />
            }
            label={'Include Equipped Items'}
          />
        </Stack>
        <Stack gap={1} sx={{ ml: 'auto' }} alignItems={'center'} justifyContent={'center'} direction={'row'}>
          <Tooltip title={'Export all sections'}>
            <Button onClick={handleExport}>
              <GetAppIcon sx={{ mr: 1 }}/>
              Export
            </Button>
          </Tooltip>
          <Tooltip title={'Import (this will override your sections)'}>
            <Button onClick={handleImport}>
              <FileUploadIcon sx={{ mr: 1 }}/>
              Import
            </Button>
          </Tooltip>
          <input type="file" id="file" ref={inputRef} style={{ display: 'none' }} accept=".json"
                 onChange={handleFileChange}/>
        </Stack>
      </Stack>
      <Stack sx={{ mt: 2 }}>
        {planner?.sections?.length > 0 ? planner?.sections?.map(({ items, materials, name }, sectionIndex) => {
          return (
            (<Accordion key={`accordion-${sectionIndex}`}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon/>}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography>{name || `Accordion-${sectionIndex}`}</Typography>

              </AccordionSummary>
              <AccordionDetails>
                <Button onClick={() => removeSection(sectionIndex)}>
                  <RemoveIcon/> Remove Section
                </Button>
                <div className={'controls'}>
                  <div className="preview">
                    {item?.[sectionIndex] ? <img
                      src={`${prefix}data/${item?.[sectionIndex]?.rawName}.png`}
                      alt="item-icon"
                    /> : null}
                  </div>
                  <Autocomplete
                    id="item-locator"
                    value={value?.[sectionIndex]}
                    onChange={(event, newValue) => onItemChange(newValue, sectionIndex)}
                    autoComplete
                    options={[value?.[sectionIndex], ...labels]}
                    filterSelectedOptions
                    filterOptions={filterOptions}
                    getOptionLabel={(option) => {
                      return option ? option?.replace(/_/g, ' ') : '';
                    }}
                    renderOption={(props, option) => {
                      return option ? (
                        <Stack {...props} gap={2} direction={'row'}>
                          <img
                            width={24}
                            height={24}
                            src={`${prefix}data/${crafts?.[option]?.rawName}.png`}
                            alt="item-icon"
                          />
                          {option?.replace(/_/g, ' ')}
                        </Stack>
                      ) : <span {...props} style={{ height: 0 }} key={'empty'}/>;
                    }}
                    style={{ width: 300 }}
                    renderInput={(params) => (
                      <StyledTextField {...params} label="Item Name" variant="outlined"/>
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
                                    onMouseEnter={() => setButtons({
                                      ...buttons,
                                      [`${sectionIndex}-${index}`]: true
                                    })}
                                    onMouseLeave={() => setButtons({
                                      ...buttons,
                                      [`${sectionIndex}-${index}`]: false
                                    })}>
                          <Badge badgeContent={numberWithCommas(item?.itemQuantity)}
                                 max={10000}
                                 anchorOrigin={{
                                   vertical: 'top',
                                   horizontal: 'right'
                                 }}
                                 color="primary">
                            <Tooltip
                              title={<MaterialsTooltip name={item?.itemName} items={flattenCraftObject(item)}/>}>
                              <img key={item?.rawName + ' ' + index}
                                   src={`${prefix}data/${item?.rawName}.png`}
                                   alt=""/>
                            </Tooltip>
                          </Badge>
                          {buttons?.[`${sectionIndex}-${index}`] ? <div className={'buttons'}>
                            <IconButton type={'bottom'} size={'small'}
                                        onClick={() => onAddItem(sectionIndex, { ...item, itemQuantity: 1 }, 1)}>
                              <AddIcon/>
                            </IconButton>
                            <IconButton type={'bottom'} size={'small'}
                                        onClick={() => onRemoveItem(sectionIndex, item, 1)}>
                              <RemoveIcon/>
                            </IconButton>
                            <IconButton size={'small'}
                                        onClick={() => onRemoveItem(sectionIndex, item, item?.itemQuantity, true)}>
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
                      <ItemsList itemsList={materials}
                                 account={state?.account}
                                 inventoryItems={myItems}
                                 itemDisplay={itemDisplay}
                      /> : null}
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>)
          );
        }) : <Typography sx={{ mt: 3 }} variant={'h3'}>Please add a section</Typography>}
      </Stack>
      <Dialog
        open={confirmationDialog.open}
        onClose={() => setConfirmationDialog({ ...confirmationDialog, open: false })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Section deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmationDialog.type === 'section'
              ? 'Are you sure you would like to delete this section?'
              : 'Are you sure you would like to delete all sections?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialog({ ...confirmationDialog, open: false })}>Close</Button>
          <Button onClick={() => {
            if (confirmationDialog.type === 'section') {
              const sections = planner.sections.filter((_, index) => index !== confirmationDialog.data);
              setValue({ ...value, [confirmationDialog.data]: '' })
              dispatch({ type: 'planner', data: { sections } });
            } else if (confirmationDialog.type === 'sections') {
              setValue({ '0': '' })
              setItem([defaultItem]);
              dispatch({ type: 'planner', data: { sections: [] } });
            }
            setConfirmationDialog({ open: false, type: '', data: null })
          }} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </TodoStyle>)
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
