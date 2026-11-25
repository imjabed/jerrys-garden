import { createContext, useContext } from 'react';
import type { SiteContent } from '../../shared/siteEditor';
export const CustomerTextContext = createContext<{text: SiteContent['customerText']; styles: SiteContent['customerTextStyles'];links?:Record<string,string>}>({text:{},styles:{}});
export function useCustomerText() {
  const values = useContext(CustomerTextContext);
  return (key: string, fallback: string): string => values.text[key]?.trim() || fallback;
}
export function useCustomerTextStyle(key: string) {
  return useContext(CustomerTextContext).styles[key];
}

export function useCustomerTextLink(key:string){return useContext(CustomerTextContext).links?.[key]||'';}
