import { createContext, useContext } from 'react';
export const CustomerTextContext = createContext<Record<string,string>>({});
export function useCustomerText() {
  const values = useContext(CustomerTextContext);
  return (key: string, fallback: string): string => values[key]?.trim() || fallback;
}
