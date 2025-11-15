
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the JSON file
const dataFilePath = path.join(process.cwd(), 'data', 'locations.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locations } = body;

    if (!Array.isArray(locations)) {
      return NextResponse.json({ message: 'Invalid data format: locations must be an array.' }, { status: 400 });
    }

    // Convert the data to a JSON string
    const jsonData = JSON.stringify(locations, null, 2);

    // Write the data to the file
    await fs.writeFile(dataFilePath, jsonData, 'utf8');

    return NextResponse.json({ message: 'Locations saved successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Failed to save locations:', error);
    return NextResponse.json({ message: 'Failed to save locations.' }, { status: 500 });
  }
}
