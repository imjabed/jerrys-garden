import RichText from './RichText';
import { useCustomerText, useCustomerTextStyle } from '../services/customerText';
export default function CustomerCopy({id, fallback}: {id:string;fallback:string}) {
  const text = useCustomerText()(id,fallback);
  const style = useCustomerTextStyle(id);
  return <RichText value={text} presentation={style} inline/>;
}
