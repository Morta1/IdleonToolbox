import { AppContext } from "components/common/context/AppProvider";
import { useContext, useEffect, useMemo, useState } from "react";
import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import HtmlTooltip from "components/Tooltip";

const Looty = () => {
  const { state } = useContext(AppContext);
  const [checked, setChecked] = useState(false);
  const [items, setItems] = useState();

  const sortedItems = useMemo(() => [...state?.account?.storage]?.sort((a, b) => b?.amount - a?.amount), [state]);

  useEffect(() => {
    if (state?.account?.storage) {
      setItems(checked ? sortedItems : state?.account?.storage);
    }
  }, [state]);

  const handleChange = (event) => {
    if (event.target.checked) {
      setItems(sortedItems);
    } else {
      setItems(state?.account?.storage);
    }
    setChecked(event.target.checked);
  };

  return (
    <Stack>
      <Typography textAlign={"center"} mt={2} mb={2} variant={"h2"}>
        Storage
      </Typography>
      <Stack>
        <Stack>
          <FormControlLabel control={<Checkbox checked={checked} onChange={handleChange}/>} label="Sort by stack size"/>
        </Stack>
        <Stack direction={"row"} gap={1} flexWrap={"wrap"}>
          {items?.map(({ name, rawName, amount }, index) => {
            return (
              <Card sx={{ width: 75 }} key={`${name}-${index}`}>
                <CardContent>
                  <Stack alignItems="center" key={`${rawName}-${index}`} data-index={index}>
                    <HtmlTooltip title={cleanUnderscore(name)}>
                      <ItemImg width={50} height={50} src={`${prefix}data/${rawName}.png`} alt=""/>
                    </HtmlTooltip>
                    <Typography color={amount >= 1e7 ? "success.light" : ""}>{notateNumber(amount, "Big")}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  );
};

const ItemImg = styled.img`
  height: 30px;
  width: 30px;
  object-fit: contain;
`;

export default Looty;
