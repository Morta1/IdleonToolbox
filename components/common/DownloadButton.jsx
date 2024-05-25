import React, { useRef } from 'react';
import Button from '@mui/material/Button';
import { tryToParse } from '@utility/helpers';

const FileUploadButton = ({ children, onFileUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsed = tryToParse(e.target.result);
        if (typeof parsed !== 'string'){
          // console.log('e.target.result', parsed);
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

  return (
    <div>
      <input style={{ display: 'none' }} ref={fileInputRef} type="file" onChange={handleFileChange}/>
      <Button onClick={handleButtonClick} variant={'outlined'} size={'small'}>{children}</Button>
    </div>
  );
};

export default FileUploadButton;
