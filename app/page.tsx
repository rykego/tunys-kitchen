'use client';

import React, { useState } from 'react';
import { ShoppingCart, X, CheckCircle2, QrCode, Plus, Minus } from 'lucide-react';

// ── CONFIGURATION (Now pulling from Environment Variables) ──
const CONFIG = {
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Default Kitchen",
  paynowNumber: process.env.NEXT_PUBLIC_PAYNOW_NUMBER || "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
};

// ── MENU DATA (From your original index.html) ──
const MENU = {
  main: [
    { id:'m1', name:'Nasi Kuning (Yellow Rice) Set', emoji:'🍛', price:12.00,  desc:'Fragrant turmeric yellow rice served with sides & sambal.' },
    { id:'m2', name:'Nasi Uduk Set', emoji:'🍲', price:12.00,  desc:'Fragrant coconut steamed rice served with traditional Indonesian sides.' },
    { id:'m3', name:'Sambal Udang Belado', emoji:'🦐', price:10.00,  desc:'Succulent prawns & petai beans wok-tossed in fiery Belado sambal.' },
    { id:'m4', name:'Soto Ayam Betawi', emoji:'🍜', price:10.00,  desc:'Rich and creamy Jakarta-style chicken soup with lontong and crispy shallots.' },
    { id:'m5', name:'Ayam Taliwang', emoji:'🍗', price:11.00,  desc:'Lombok-style grilled chicken marinated in a smoky, spicy taliwang sauce.' },
  ],
  sides: [
    { id:'s1', name:'Bakwan Jagung', emoji:'🌽', price:5.00,  desc:'Crispy Indonesian sweetcorn fritters, golden and fluffy inside.' },
    { id:'s2', name:'Sambal Goreng Teri', emoji:'🫑', price:4.50,  desc:'Crispy anchovies, tempe & long beans tossed in fragrant sambal.' },
    { id:'s4', name:'Jalang Kote Ujung Pandang', emoji:'🥠', price:5.00,  desc:'Crispy Makassar-style pastry pockets.' },
  ],
  drinks: [
    { id:'d1', name:'Hot Americano', emoji:'☕', price:3.00,  desc:'Bold espresso with hot water, rich and smooth.' },
    { id:'d2', name:'Latte', emoji:'🥛', price:4.50,  desc:'Espresso with steamed milk and a light layer of foam.' },
  ]
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('main');
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showPayNow, setShowPayNow] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });

  // 🛒 Cart Logic
  const addToCart = (item: any) => {
    setCart(prev => ({
      ...prev,
      [item.id]: prev[item.id] ? { ...prev[item.id], qty: prev[item.id].qty + 1 } : { ...item, qty: 1 }
    }));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (!newCart[id]) return prev;
      newCart[id].qty += delta;
      if (newCart[id].qty <= 0) delete newCart[id];
      return newCart;
    });
  };

  const cartTotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  const confirmOrder = () => {
    const items = Object.values(cart);
    const orderLines = items.map(i => `• ${i.qty}x ${i.name} — $${(i.price * i.qty).toFixed(2)}`).join('\n');
    const msg = `🛎️ *NEW ORDER — Tuny's Kitchen*\n\n👤 *Customer:* ${customer.name}\n📞 *Phone:* ${customer.phone}\n📍 *Delivery:* ${customer.address || 'Self-collect'}\n\n🧾 *Order Details:*\n${orderLines}\n\n💰 *Total Paid:* $${cartTotal.toFixed(2)}`;
    
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    setShowPayNow(false);
    setShowSuccess(true);
    setCart({}); // Clear cart after order
  };

  return (
    <div className="min-h-screen bg-[#fdf6ec] text-[#2a1a0e]">
      {/* HEADER */}
      <header className="bg-[#3b2415] text-[#fdf6ec] p-4 sticky top-0 z-40 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍲</span>
          <div>
            <h1 className="font-serif text-xl font-bold">Tuny's Kitchen</h1>
            <p className="text-[10px] text-[#d4952a] tracking-widest uppercase">Home-cooked · Singapore</p>
          </div>
        </div>
        <button onClick={() => setIsCartOpen(true)} className="bg-[#c8401a] px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition">
          <ShoppingCart size={18} /> <span>Cart ({cartCount})</span>
        </button>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#3b2415] to-[#c8401a] text-[#fdf6ec] text-center py-12 px-6">
        <h2 className="text-4xl md:text-5xl mb-3 font-serif italic">Fresh & <span className="text-[#d4952a]">Homemade</span></h2>
        <p className="max-w-md mx-auto text-[#e8d5b7] text-sm">Indonesian home-cooked meals delivered to your doorstep.</p>
      </section>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto p-4 md:justify-center sticky top-[68px] bg-[#fdf6ec] z-30">
        {['main', 'sides', 'drinks'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full border-2 text-sm font-bold transition whitespace-nowrap ${
              activeTab === tab ? 'bg-[#3b2415] text-white' : 'bg-white border-[#f5e6cc] text-[#8a6a50]'
            }`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* GRID */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MENU[activeTab as keyof typeof MENU]?.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-[#f5e6cc] overflow-hidden flex flex-col">
            <div className="bg-[#f5e6cc] text-5xl py-8 text-center">{item.emoji}</div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-[#3b2415]">{item.name}</h3>
              <p className="text-xs text-[#8a6a50] mt-1 flex-1">{item.desc}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-[#c8401a] text-lg">${item.price.toFixed(2)}</span>
                <button onClick={() => addToCart(item)} className="bg-[#3b2415] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#c8401a]">
                  + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#3b2415] text-white flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingCart size={20}/> Your Order</h2>
              <button onClick={() => setIsCartOpen(false)}><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.values(cart).length === 0 ? (
                <p className="text-center text-gray-400 py-10">Your cart is empty... 😋</p>
              ) : (
                Object.values(cart).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 border-b border-[#f5e6cc] pb-4">
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-[#c8401a] font-bold text-sm">${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 border rounded-full"><Minus size={14}/></button>
                      <span className="font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 border rounded-full"><Plus size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t bg-[#fdf6ec] space-y-3">
              <input placeholder="Your Name" className="w-full p-2 border rounded" onChange={e => setCustomer({...customer, name: e.target.value})} />
              <input placeholder="WhatsApp Phone" className="w-full p-2 border rounded" onChange={e => setCustomer({...customer, phone: e.target.value})} />
              <input placeholder="Address / Self-collect" className="w-full p-2 border rounded" onChange={e => setCustomer({...customer, address: e.target.value})} />
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => { setIsCartOpen(false); setShowPayNow(true); }}
                disabled={cartCount === 0 || !customer.name || !customer.phone}
                className="w-full bg-[#c8401a] text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                Checkout via PayNow →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYNOW MODAL */}
      {showPayNow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-2xl font-bold text-[#3b2415] mb-4">Pay via PayNow</h2>
            <div className="bg-[#fdf6ec] border-2 border-dashed border-[#d4952a] p-6 rounded-xl mb-4">
              <QrCode size={64} className="mx-auto text-gray-400 mb-2" />
              <div className="text-xl font-bold">{CONFIG.paynowNumber}</div>
              <div className="text-sm text-gray-500">Tuny's Kitchen</div>
              <div className="text-2xl font-bold text-[#c8401a] mt-2">${cartTotal.toFixed(2)}</div>
            </div>
            <button onClick={confirmOrder} className="w-full bg-[#2d6a4f] text-white py-3 rounded-xl font-bold mb-2">✅ I've Paid — Confirm Order</button>
            <button onClick={() => setShowPayNow(false)} className="text-gray-400 text-sm underline">Go Back</button>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#3b2415]/90">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
            <CheckCircle2 size={64} className="text-[#2d6a4f] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#3b2415] mb-2">Order Placed!</h2>
            <p className="text-sm text-[#8a6a50] mb-6">Thank you! Your order was sent to WhatsApp. We'll confirm shortly.</p>
            <button onClick={() => setShowSuccess(false)} className="bg-[#3b2415] text-white px-8 py-2 rounded-lg font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}