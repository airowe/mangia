import { createWorker, PSM, Worker as TesseractWorker } from 'tesseract.js';

export interface ReceiptItem {
  title: string;
  price?: number;
  quantity: number;
  total?: number;
}

export const parseReceipt = async (imageUri: string): Promise<ReceiptItem[]> => {
  const worker: TesseractWorker = await createWorker();

  try {
    
    // Configure worker for receipt parsing
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$ ', 
      preserve_interword_spaces: '1',
    });

    const { data: { text } } = await worker.recognize(imageUri);
    await worker.terminate();
    
    return processReceiptText(text);
  } catch (error) {
    console.error('Error parsing receipt:', error);
    throw new Error('Failed to parse receipt. Please try again.');
  }
};

// Helper function to process the raw OCR text into structured receipt items
const processReceiptText = (text: string): ReceiptItem[] => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const items: ReceiptItem[] = [];
  
  // Common grocery store receipt patterns
  const pricePattern = /\$?\d+\.\d{2}/;
  const itemPattern = /^[^0-9$]+/;
  const quantityPattern = /^(\d+)\s*[xX]\s*/;

  for (const line of lines) {
    try {
      // Skip lines that are likely headers, footers, or totals
      if (line.toLowerCase().includes('total') || 
          line.toLowerCase().includes('subtotal') ||
          line.match(/^\s*[xX]\s*\d/)) {
        continue;
      }

      // Try to extract quantity (e.g., "2 x" or "3x")
      let quantity = 1;
      let itemLine = line;
      const qtyMatch = line.match(quantityPattern);
      
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10);
        itemLine = line.slice(qtyMatch[0].length);
      }

      // Find price (last number in the line that looks like a price)
      const priceMatch = itemLine.match(/\d+\.\d{2}(?=\s*$)/);
      if (!priceMatch) continue;
      
      const price = parseFloat(priceMatch[0]);
      
      // Get item name (everything before the price, trimmed)
      const name = itemLine.slice(0, priceMatch.index).trim();
      
      // Skip if name is too short or doesn't look like an item
      if (name.length < 2 || /^[^a-zA-Z0-9]/.test(name)) continue;
      
      items.push({ title: name, quantity, price });
    } catch (error) {
      console.warn('Error processing line:', line, error);
    }
  }
  
  return items;
};

// Function to merge receipt items with existing pantry items
export const mergeWithPantry = (
  receiptItems: ReceiptItem[], 
  pantryItems: { name: string; id: string }[]
): ReceiptItem[] => {
  const mergedItems = [...receiptItems];
  
  // For each pantry item, check if it exists in receipt items
  for (const pantryItem of pantryItems) {
    const existingItem = mergedItems.find(item => 
      item.title.toLowerCase() === pantryItem.name.toLowerCase()
    );
    
    if (existingItem) {
      // Add pantry ID to the receipt item for updating
      (existingItem as any).id = pantryItem.id;
    }
  }
  
  return mergedItems;
};
