
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'networks.json');
    
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const networks = JSON.parse(fileContent);
        return NextResponse.json(networks, { status: 200 });
    } else {
        // If the file doesn't exist, return an empty array.
        // This is important for the first network owner signup.
        return NextResponse.json([], { status: 200 });
    }

  } catch (error) {
    console.error('Failed to read networks file:', error);
    return NextResponse.json({ message: 'Error reading networks file' }, { status: 500 });
  }
}
