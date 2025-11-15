


const allNetworksData = [
  {
    "id": "network-1763202515559",
    "name": "شبكة الخير",
    "address": "شبام",
    "logo": "",
    "ownerPhone": "773108411",
    "categories": [
      {
        "id": "new-cat-1763202534168",
        "name": "فئة 300",
        "price": 300,
        "validity": "3 ايام",
        "capacity": "مفتوح"
      }
    ]
  }
];

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
