
// In a real app, you'd fetch this from a server or have an API endpoint to update it.
// For now, we'll read from the JSON file.

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

export const networks: Network[] = [];
