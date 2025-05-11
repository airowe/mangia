import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (uri: string) => {
  const result = await Tesseract.recognize(uri, 'eng');
  return result.data.text;
};

const lookupBarcode = async (barcode: string) => {
  const response = await fetch(`https://grosheries-api.vercel.app/api/lookup-barcode?barcode=${barcode}`);
  const data = await response.json();

  if (!response.ok) {
    console.error('Error:', data.error);
    return null;
  }

  return data;
};