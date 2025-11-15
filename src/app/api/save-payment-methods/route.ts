import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the payment-methods.ts file
const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'payment-methods.ts');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentMethods } = body;

    if (!Array.isArray(paymentMethods)) {
      return NextResponse.json({ message: 'Invalid data format: paymentMethods must be an array.' }, { status: 400 });
    }

    // Convert the data to a JSON string
    const jsonData = JSON.stringify(paymentMethods, null, 2);

    // Create the full TypeScript file content
    const fileContent = `
const paymentMethodsData = ${jsonData};

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  accountName: string;
  accountNumber: string;
  logoUrl?: string;
  theme: {
    iconBg: string;
    iconColor: string;
    borderColor: string;
  };
}

export const paymentMethods: PaymentMethod[] = paymentMethodsData;
`;

    // Write the data to the file
    await fs.writeFile(dataFilePath, fileContent, 'utf8');

    return NextResponse.json({ message: 'Payment methods saved successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Failed to save payment methods:', error);
    return NextResponse.json({ message: 'Failed to save payment methods.' }, { status: 500 });
  }
}
