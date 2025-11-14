
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const networks = data.networks;

    if (!networks) {
      return NextResponse.json({ message: 'بيانات الشبكات مفقودة' }, { status: 400 });
    }

    // Changed path to be outside `src` to avoid dev server reloads
    const filePath = path.join(process.cwd(), 'lib', 'networks.json');
    
    // Construct the JSON file content
    const fileContent = JSON.stringify(networks, null, 2);

    fs.writeFileSync(filePath, fileContent, 'utf-8');

    return NextResponse.json({ message: 'تم حفظ الشبكات بنجاح.' }, { status: 200 });
  } catch (error) {
    console.error('فشل حفظ الشبكات:', error);
    return NextResponse.json({ message: 'حدث خطأ أثناء حفظ الملف' }, { status: 500 });
  }
}

    