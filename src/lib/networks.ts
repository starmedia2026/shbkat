
import allNetworksData from './networks.json';

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
