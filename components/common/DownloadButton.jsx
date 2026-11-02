import React, { useRef } from 'react';
import Button from '@mui/material/Button';
import { tryToParse } from '@utility/helpers';
import { IconFileImport } from '@tabler/icons-react';

// ref reaches the visible button, for a caller that hands the focus back to it. The button keeps its label at every
// width, as an Export beside it does: an icon alone named it only to a screen reader.
const FileUploadButton = ({ children, onFileUpload, onInvalidFile, ref }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsed = tryToParse(e.target.result);
        if (typeof parsed !== 'string') {
          onFileUpload?.(parsed, selectedFile.name);
        } else {
          onInvalidFile?.(selectedFile.name);
        }
        fileInputRef.current.value = '';
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return <>
    <input style={{ display: 'none' }} ref={fileInputRef} type="file" onChange={handleFileChange}/>
    <Button ref={ref} startIcon={<IconFileImport size={18}/>} onClick={handleButtonClick} variant={'outlined'}
            size={'small'}>{children}</Button>
  </>;
};

export default FileUploadButton;
