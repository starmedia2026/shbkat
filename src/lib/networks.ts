import fs from 'fs';
import path from 'path';

// In a real app, you'd fetch this from a server or have an API endpoint to update it.
// For now, we'll read from the JSON file and provide a mock save function.

interface Category {
  id: string;
  name: string;
  price: number;
  validity: string;
  capacity: string;
}

interface Network {
  id: string;
  name: string;
  logo?: string;
  categories: Category[];
}

const getNetworks = (): Network[] => {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'networks.json');
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        return data.networks;
    } catch (error) {
        console.error("Error reading networks.json:", error);
        return [];
    }
};


export const networks: Network[] = getNetworks();


// Mock function to simulate saving data to the server.
// In a real implementation, this would make a POST/PUT request to your backend.
export const saveNetworks = (updatedNetworks: Network[]): Promise<void> => {
  console.log("Simulating saving networks to server:", updatedNetworks);
  // This is where you would typically write to a file or send to an API.
  // Since we can't write to the file system from the browser in this environment,
  // we'll just log it. A proper backend would be needed.
  return new Promise((resolve) => setTimeout(resolve, 500));
};
