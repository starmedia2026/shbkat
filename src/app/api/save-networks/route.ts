import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the networks.ts file
const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'networks.ts');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { networks } = body;

    if (!Array.isArray(networks)) {
      return NextResponse.json({ message: 'Invalid data format: networks must be an array.' }, { status: 400 });
    }

    // Convert the data to a JSON string for storing inside the template literal
    const jsonData = JSON.stringify(networks, null, 2);

    // Create the full TypeScript file content
    const fileContent = `
const allNetworksData = ${jsonData};

interface Category {
  id: string;
  name: string;
  price: number;
  validity: string;
  capacity: string;
}

export interface Network {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  ownerPhone?: string;
  categories: Category[];
}

export { allNetworksData };
`;

    // Write the data to the file
    await fs.writeFile(dataFilePath, fileContent, 'utf8');

    return NextResponse.json({ message: 'Networks saved successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Failed to save networks:', error);
    return NextResponse.json({ message: 'Failed to save networks.' }, { status: 500 });
  }
}
