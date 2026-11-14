import { useMemo, useState } from 'react';
import { ArrowRight, BarChart3, CalendarDays, Mail, Phone, Search, Users } from 'lucide-react';
import type { Order, UserAccount } from '../types';

type Segment = 'Priority' | 'Needs follow-up' | 'Re-engage' | 'New' | 'Regular';
interface CustomerRow {
  key: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  registered: boolean;
  orders: Order[];
  lastOrder?: Order;
  openOrders: number;
  completed: number;
  orderValue: number;
  completedValue: number;
  daysSinceLast: number | null;
  segment: Segment;
}
const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const differenceInDays = (date: string, now: number) => {
  const d = Date.parse(date);
  return Number.isFinite(d) ? Math.max(0, Math.floor((now - d) / 86400000)) : null;
};
export default function CustomerInsights({ customers, orders, onViewOrder }: {
  customers: UserAccount[];
  orders: Order[];
  onViewOrder: (order: Order) => void;
}) {
  const [filter, setFilter] = useState<Segment | 'All'>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'priority' | 'value' | 'recent' | 'orders'>('priority');
  const [selected, setSelected] = useState<string | null>(null);
  const now = Date.now();

  const rows = useMemo(() => {
    const grouped = new Map<string, CustomerRow>();
    const emailKey = (email: string) => email.trim().toLowerCase();
    const phoneKey = (phone: string) => phone.replace(/\D/g, '');
    const findKey = (email: string, phone: string) =>
      (email ? 'email:' + emailKey(email) : '') || (phone ? 'phone:' + phoneKey(phone) : '');
    const findExisting = (email: string, phone: string) =>
      [...grouped.values()].find(row => (email && row.email && emailKey(row.email) === emailKey(email))
        || (phone && row.phone && phoneKey(row.phone) === phoneKey(phone)))?.key;

    for (const customer of customers) {
      const email = String(customer.email || '');
      const phone = String(customer.phone || '');
      const key = findExisting(email, phone) || findKey(email, phone) || 'registered:' + customer.id;
      grouped.set(key, {
        key, name: String(customer.name || 'Customer'), email, phone,
        address: String(customer.address || ''), registered: true, orders: [],
        openOrders: 0, completed: 0, orderValue: 0, completedValue: 0,
        daysSinceLast: null, segment: 'New',
      });
    }

    for (const order of [...orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
      const email = String(order.customer?.email || '');
      const phone = String(order.customer?.phone || '');
      const key = findExisting(email, phone) || findKey(email, phone) || 'guest:' + order.id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key, name: String(order.customer?.fullName || 'Guest customer'), email, phone,
          address: String(order.customer?.deliveryAddress || ''), registered: false, orders: [],
          openOrders: 0, completed: 0, orderValue: 0, completedValue: 0,
          daysSinceLast: null, segment: 'New',
        });
      }
      const row = grouped.get(key)!;
      row.orders.push(order);
      if (!row.lastOrder || String(order.createdAt) > String(row.lastOrder.createdAt)) row.lastOrder = order;
      if (order.status === 'Order Placed' || order.status === 'Pending') row.openOrders++;
      if (order.status === 'Delivered') row.completed++;
      if (order.status !== 'Cancelled' && order.orderType !== 'Custom') row.orderValue += Number(order.totalAmount || 0);
      if (order.status === 'Delivered' && order.orderType !== 'Custom') row.completedValue += Number(order.totalAmount || 0);
      if (!row.name || row.name === 'Customer') row.name = String(order.customer?.fullName || 'Customer');
      if (!row.phone) row.phone = phone;
      if (!row.email) row.email = email;
      if (!row.address) row.address = String(order.customer?.deliveryAddress || '');
    }

    const data = [...grouped.values()];
    const completedValues = data.filter(row => row.completed > 0).map(row => row.completedValue).sort((a,b) => a - b);
    const highValueThreshold = completedValues.length >= 4
      ? completedValues[Math.floor(completedValues.length * 0.75)]
      : Infinity;

    for (const row of data) {
      row.daysSinceLast = row.lastOrder ? differenceInDays(row.lastOrder.createdAt, now) : null;
      if (row.openOrders > 0) row.segment = 'Needs follow-up';
      else if (row.completed >= 3 || (row.completed >= 2 && row.completedValue >= highValueThreshold)) row.segment = 'Priority';
      else if (row.daysSinceLast !== null && row.daysSinceLast >= 60) row.segment = 'Re-engage';
      else if (!row.orders.length || row.completed === 0) row.segment = 'New';
      else row.segment = 'Regular';
    }
    return data;
  }, [customers, orders, now]);

  const segments: Array<Segment | 'All'> = ['All', 'Needs follow-up', 'Priority', 'Re-engage', 'New', 'Regular'];
  const visible = rows.filter(row => {
    const q = query.trim().toLowerCase();
    return (filter === 'All' || row.segment === filter)
      && (!q || [row.name, row.email, row.phone, row.address].some(v => v.toLowerCase().includes(q)));
  }).sort((a, b) => {
    if (sort === 'value') return b.completedValue - a.completedValue;
    if (sort === 'orders') return b.orders.length - a.orders.length;
    if (sort === 'recent') return String(b.lastOrder?.createdAt || '').localeCompare(String(a.lastOrder?.createdAt || ''));
    const priorities: Record<Segment, number> = { 'Needs follow-up': 0, Priority: 1, 'Re-engage': 2, New: 3, Regular: 4 };
    return priorities[a.segment] - priorities[b.segment] || b.completedValue - a.completedValue;
  });
  const active = rows.find(row => row.key === selected);
  const counts = {
    needs: rows.filter(row => row.segment === 'Needs follow-up').length,
    priority: rows.filter(row => row.segment === 'Priority').length,
    sleeping: rows.filter(row => row.segment === 'Re-engage').length,
    buyers: rows.filter(row => row.completed > 0).length,
  };
  return (
    <section className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">Customer intelligence</p>
          <h2 className="mt-2 font-serif text-3xl font-normal text-stone-900">Relationships overview</h2>
          <p className="mt-2 text-sm text-stone-500">Prioritize follow-ups and returning buyers using recorded orders, not assumptions about visits.</p>
        </div>
        <span className="text-xs text-stone-500">{rows.length} unique contacts</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Need follow-up', counts.needs, 'Orders needing attention'],
          ['Priority customers', counts.priority, 'Repeat / high-value buyers'],
          ['Re-engagement', counts.sleeping, 'Inactive 60+ days'],
          ['Completed buyers', counts.buyers, 'At least one delivered order'],
        ].map(([label, value, caption]) => (
          <div key={String(label)} className="border border-stone-200 bg-white p-5">
            <p className="text-[11px] text-stone-500">{label}</p>
            <p className="mt-3 font-serif text-3xl text-stone-900">{value}</p>
            <p className="mt-1 text-[11px] text-stone-400">{caption}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="border border-stone-200 bg-white">
          <div className="border-b border-stone-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <label className="flex flex-1 items-center gap-2 border border-stone-200 px-3">
                <Search className="h-4 w-4 shrink-0 text-stone-400"/>
                <input aria-label="Search customers" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search name, phone, email or address" className="w-full bg-transparent py-3 text-sm outline-none"/>
              </label>
              <select aria-label="Sort customers" value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                className="border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
                <option value="priority">Attention first</option>
                <option value="value">Completed order value</option>
                <option value="recent">Most recent order</option>
                <option value="orders">Most orders</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {segments.map(segment => <button key={segment} onClick={() => setFilter(segment)}
                className={`border px-3 py-1.5 text-[11px] transition-colors ${filter === segment ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-500'}`}>{segment}</button>)}
            </div>
          </div>
          <div className="max-h-[640px] divide-y divide-stone-100 overflow-y-auto">
            {!visible.length && <p className="px-5 py-12 text-center text-sm text-stone-500">No customers match this view.</p>}
            {visible.map(row => <button key={row.key} onClick={() => setSelected(row.key)}
              className={`grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-stone-50 sm:grid-cols-[minmax(0,1fr)_120px_125px_24px] sm:items-center ${selected === row.key ? 'bg-[#F6F3EF]' : ''}`}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-900">{row.name}</p>
                <p className="mt-1 truncate text-xs text-stone-500">{row.phone || row.email || 'No contact details'}</p>
              </div>
              <div><span className="inline-block border border-stone-200 px-2 py-1 text-[10px] text-stone-700">{row.segment}</span></div>
              <div className="text-xs text-stone-700">
                <p>{row.orders.length} orders</p>
                <p className="mt-1 text-stone-500">{money(row.completedValue)} delivered value</p>
              </div>
              <ArrowRight size={15} className="hidden text-stone-400 sm:block"/>
            </button>)}
          </div>
        </div>
        <aside className="border border-stone-200 bg-[#F9F7F4] p-5 sm:p-6">
          {active ? <>
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Customer profile</p>
            <h3 className="mt-2 font-serif text-2xl text-stone-900">{active.name}</h3>
            <span className="mt-3 inline-block border border-stone-300 px-2 py-1 text-[10px] text-stone-700">{active.segment}</span>
            <div className="mt-6 space-y-3 text-xs text-stone-600">
              {active.phone && <a className="flex items-center gap-2 hover:text-stone-900" href={`tel:${active.phone}`}><Phone size={14}/>{active.phone}</a>}
              {active.email && <a className="flex items-center gap-2 break-all hover:text-stone-900" href={`mailto:${active.email}`}><Mail size={14}/>{active.email}</a>}
              <p className="flex items-center gap-2"><CalendarDays size={14}/>{active.daysSinceLast === null ? 'No order recorded' : `Last order ${active.daysSinceLast} day(s) ago`}</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-stone-200 py-5">
              <div><p className="text-[10px] text-stone-500">Delivered orders</p><p className="mt-2 font-serif text-2xl">{active.completed}</p></div>
              <div><p className="text-[10px] text-stone-500">Open orders</p><p className="mt-2 font-serif text-2xl">{active.openOrders}</p></div>
              <div className="col-span-2"><p className="text-[10px] text-stone-500">Delivered order value · not confirmed payment</p><p className="mt-2 font-serif text-2xl">{money(active.completedValue)}</p></div>
            </div>
            <h4 className="mt-6 text-xs font-medium text-stone-900">Order history</h4>
            <div className="mt-3 space-y-2">
              {!active.orders.length && <p className="text-xs text-stone-500">No orders yet. A welcome follow-up may help.</p>}
              {active.orders.slice(0, 12).map(order => <button key={order.id} onClick={() => onViewOrder(order)}
                className="flex w-full items-center justify-between gap-2 border-b border-stone-200 py-2 text-left text-xs hover:text-stone-950">
                <span><span className="block font-medium">{order.orderNumber}</span><span className="text-stone-500">{order.status}{order.orderType === 'Custom' ? ' · Custom' : ''}</span></span>
                <span className="text-stone-500">{order.orderType === 'Custom' ? 'Estimate' : money(order.totalAmount)}</span>
              </button>)}
            </div>
          </> : <div className="py-10 text-center text-stone-500"><Users className="mx-auto h-8 w-8" strokeWidth={1.2}/><p className="mt-4 font-serif text-xl text-stone-800">Select a customer</p><p className="mt-2 text-xs leading-6">Explore order history, priority signals and contact details.</p></div>}
        </aside>
      </div>
      <div className="flex items-start gap-3 border-t border-stone-200 pt-5 text-xs leading-6 text-stone-500">
        <BarChart3 className="mt-1 h-4 w-4 shrink-0"/>
        <p>Priority = 3+ delivered orders, or 2+ with top-quartile delivered value (when enough data exists). Follow-up = open orders; re-engage = last order 60+ days ago. These are operational suggestions. Values reflect order records, not verified payments or browsing behaviour; guest orders are matched by email or phone where available.</p>
      </div>
    </section>
  );
}
