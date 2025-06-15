declare module '../services/veryfiService' {
  export interface ReceiptItem {
    name: string;
    price: number;
    quantity: number;
    total?: number;
  }

  export interface ReceiptData {
    items: ReceiptItem[];
    total: number;
    date: string;
    vendor?: {
      name: string;
      address: string;
    };
    subtotal?: number;
    tax?: number;
    raw_text?: string;
  }

  export function scanReceipt(imageUri: string): Promise<ReceiptData>;
}
