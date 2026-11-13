import { X, Phone, Mail, MapPin, Calendar, Clock, QrCode, CheckCircle2, XCircle, AlertCircle, MessageCircle, ExternalLink, Printer, Banknote } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export default function OrderDetailsModal({ order, onClose, onUpdateStatus }: OrderDetailsModalProps) {
  if (!order) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Order Placed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold">
              📋
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-xl font-bold">
                  {order.orderNumber}
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Created: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Order Receipt"
              className="p-2 text-stone-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Status Quick Action Bar for Owner */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">
                Owner Order Status Controls:
              </span>
              <p className="text-stone-600 text-xs">Select new status to immediately update:</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['Order Placed', 'Pending', 'Delivered', 'Cancelled'] as OrderStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onUpdateStatus(order.id, status)}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    order.status === status
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Complete Details Section */}
          <div>
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-2 mb-3">
              Customer Entire Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Customer Name</span>
                  <p className="font-bold text-stone-900 text-sm">{order.customer.fullName}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Contact Phone</span>
                    <p className="font-medium text-stone-800">{order.customer.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-100"
                      title="Call customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(order.customer.fullName)},%20regarding%20your%20Jame%20Bouquets%20order%20${order.orderNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      title="WhatsApp customer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {order.customer.email && (
                  <div className="pt-1 border-t border-stone-200/60">
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Email</span>
                    <p className="text-stone-700">{order.customer.email}</p>
                  </div>
                )}
              </div>

              {/* Delivery Address & Schedule */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Delivery Address</span>
                  <p className="text-stone-800 font-medium leading-relaxed">
                    {order.customer.deliveryAddress}
                  </p>
                  <p className="text-stone-500 text-[11px]">
                    {order.customer.city} — PIN: {order.customer.pincode}
                  </p>
                </div>

                <div className="pt-1 border-t border-stone-200/60">
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Preferred Schedule</span>
                  <p className="font-semibold text-stone-800">
                    {order.customer.deliveryDate} ({order.customer.deliveryTimeSlot || 'Standard'})
                  </p>
                </div>

                {order.customer.specialInstructions && (
                  <div className="pt-1 border-t border-stone-200/60">
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Special Delivery Note</span>
                    <p className="text-stone-700 italic">{order.customer.specialInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border border-stone-200 bg-[#FCFAF7]">
            <h3 className="font-serif text-lg text-stone-900">Contact & confirmation</h3>
            <p className="mt-2 text-sm text-stone-600">Customer submitted the order online. Call to confirm the items, availability and payment arrangements.</p>
            <p className="mt-2 text-sm font-medium text-stone-800">Product subtotal: ₹{order.subtotal}</p>
          </div>

          {/* Ordered Products List */}
          <div>
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-2 mb-3">
              Ordered Bouquet Items ({order.items.length})
            </h3>

            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.bouquet.imageUrl}
                      alt={item.bouquet.title}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="font-bold text-stone-900">{item.bouquet.title}</h4>
                      <p className="text-[11px] text-stone-500">
                        Qty: <strong className="text-stone-800">{item.quantity}</strong> × ₹{item.bouquet.price} • {item.bouquet.flowerCount} Pieces
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-bold text-stone-900 text-sm shrink-0">
                    ₹{item.bouquet.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t border-stone-200 pt-4 text-sm text-stone-800">
              <span>Products subtotal</span><strong>₹{order.subtotal}</strong>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs uppercase tracking-wider cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
