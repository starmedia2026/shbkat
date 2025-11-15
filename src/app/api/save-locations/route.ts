
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const locations = data.locations;

    if (!locations) {
      return NextResponse.json({ message: 'بيانات المواقع مفقودة' }, { status: 400 });
    }
    
    // Save to the data directory at the project root
    const filePath = path.join(process.cwd(), 'data', 'locations.json');
    
    const fileContent = JSON.stringify(locations, null, 2);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    return NextResponse.json({ message: 'تم حفظ المواقع بنجاح.' }, { status: 200 });
  } catch (error) {
    console.error('فشل حفظ المواقع:', error);
    return NextResponse.json({ message: 'حدث خطأ أثناء حفظ الملف' }, { status: 500 });
  }
}
