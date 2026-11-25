import {safeTextLink} from '../../shared/siteEditor';
import RichText from './RichText';
import { useCustomerText, useCustomerTextStyle,useCustomerTextLink } from '../services/customerText';
export default function CustomerCopy({id, fallback}: {id:string;fallback:string}) {
  const text = useCustomerText()(id,fallback);
  const style = useCustomerTextStyle(id);
  const raw=useCustomerTextLink(id);const link=id.startsWith('story.')||['custom.noPayment','custom.estimateNote'].includes(id)?safeTextLink(raw):'';
  const content=<span data-studio-copy={id}><RichText value={text} presentation={style} inline/></span>;
  return link?<a href={link} className="hover:underline">{content}</a>:content;
}
