
import paymentMethodsData from './payment-methods.json';

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
