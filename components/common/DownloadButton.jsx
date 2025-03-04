import React, { useRef } from 'react';
import Button from '@mui/material/Button';
import { tryToParse } from '@utility/helpers';
import { IconFileImport } from '@tabler/icons-react';

const FileUploadButton = ({ children, onFileUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsed = tryToParse(e.target.result);
        if (typeof parsed !== 'string') {
          onFileUpload?.(parsed);
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(selectedFile); // You can change this to readAsDataURL, readAsArrayBuffer, etc. depending on your needs
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return <>
    <input style={{ display: 'none' }} ref={fileInputRef} type="file" onChange={handleFileChange}/>
    <Button startIcon={<IconFileImport size={18} />} onClick={handleButtonClick} variant={'outlined'} size={'small'}>{children}</Button>
  </>
    ;
};

export default FileUploadButton;
