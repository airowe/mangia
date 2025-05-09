import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (uri: string) => {
  const result = await Tesseract.recognize(uri, 'eng');
  return result.data.text;
};
