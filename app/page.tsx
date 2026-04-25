'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, CheckCircle2, Plus, Minus, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';


// ── PAYNOW QR GENERATOR ──
function buildPayNowQR(phone: string): string {
  function crc16(str: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return ((crc & 0xFFFF).toString(16).toUpperCase()).padStart(4, '0');
  }
  function field(id: string, value: string): string {
    return id + value.length.toString().padStart(2, '0') + value;
  }
  const paynowString = field('00','SG.PAYNOW') + field('01','0') + field('02', phone) + field('03','1') + field('04','20491231');
  const qrData =
    field('00','01') + field('01','12') + field('26', paynowString) +
    field('52','0000') + field('53','702') + field('58','SG') +
    field('59','TUNYS KITCHEN') + field('60','Singapore');
  const withCrc = qrData + '6304';
  return withCrc + crc16(withCrc);
}

// ── CONFIGURATION ──
const CONFIG = {
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Default Kitchen",
  paynowNumber: process.env.NEXT_PUBLIC_PAYNOW_NUMBER || "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  callMeBotPhone: process.env.NEXT_PUBLIC_CALLMEBOT_PHONE || "",
  callMeBotApiKey: process.env.NEXT_PUBLIC_CALLMEBOT_APIKEY || "",
};

// ── MENU DATA ──
const MENU = {
  main: [
    { id:'m1', name:'Nasi Kuning (Yellow Rice) Set', emoji:'🍛', price:12.00, desc:'Fragrant turmeric yellow rice served with sides & sambal.', image:'/images/nasi_kuning.jpg' },
    { id:'m2', name:'Nasi Uduk Set', emoji:'🍲', price:12.00, desc:'Fragrant coconut steamed rice served with traditional Indonesian sides.', image:'/images/nasi_uduk.jpg' },
    { id:'m3', name:'Sambal Udang Belado', emoji:'🦐', price:10.00, desc:'Succulent prawns & petai beans wok-tossed in fiery Belado sambal.', image:'/images/udang_belado.jpg' },
    { id:'m4', name:'Soto Ayam Betawi', emoji:'🍜', price:10.00, desc:'Rich and creamy Jakarta-style chicken soup with lontong and crispy shallots.' },
    { id:'m5', name:'Ayam Taliwang', emoji:'🍗', price:11.00, desc:'Lombok-style grilled chicken marinated in a smoky, spicy taliwang sauce.', image:'/images/ayam_taliwang.jpg' },
  ],
  sides: [
    { id:'s1', name:'Bakwan Jagung', emoji:'🌽', price:5.00, desc:'Crispy Indonesian sweetcorn fritters, golden and fluffy inside.' },
    { id:'s2', name:'Sambal Goreng Teri', emoji:'🫑', price:4.50, desc:'Crispy anchovies, tempe & long beans tossed in fragrant sambal.' },
    { id:'s4', name:'Jalang Kote Ujung Pandang', emoji:'🥠', price:5.00, desc:'Crispy Makassar-style pastry pockets.', image:'/images/jalang_kote.jpg' },
  ],
  drinks: [
    { id:'d1', name:'Hot Americano', emoji:'☕', price:3.00, desc:'Bold espresso with hot water, rich and smooth.' },
    { id:'d2', name:'Latte', emoji:'🥛', price:4.50, desc:'Espresso with steamed milk and a light layer of foam.' },
  ]
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('main');
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showPayNow, setShowPayNow] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [snapshotCartTotal, setSnapshotCartTotal] = useState(0);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', unit: '' });
  const [errors, setErrors] = useState({ name: '', phone: '', address: '', unit: '' });
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);


  useEffect(() => {
    if (showPayNow) {
      import('qrcode').then(QRCode => {
        const qrString = buildPayNowQR('+6597850256');
        QRCode.toDataURL(qrString, { width: 220, margin: 2 }, (_: any, url: string) => {
          setQrDataUrl(url);
        });
      });
    }
  }, [showPayNow]);

  // ── Validation ──
  const validatePhone = (phone: string) => /^[89]\d{7}$/.test(phone.replace(/\s/g, ''));
  const validateName = (name: string) => name.trim().length >= 2;

  // ── OneMap Address Search ──
  const searchAddress = async (query: string) => {
    setAddressQuery(query);
    setCustomer(prev => ({ ...prev, address: '' }));
    if (query.length < 3) { setAddressSuggestions([]); return; }
    setAddressLoading(true);
    try {
      const res = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=N&getAddrDetails=Y&pageNum=1`
      );
      const data = await res.json();
      setAddressSuggestions(data.results?.slice(0, 5) || []);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const selectAddress = (result: any) => {
    const formatted = `${result.BLK_NO ? result.BLK_NO + ' ' : ''}${result.ROAD_NAME}${result.BUILDING && result.BUILDING !== 'NIL' ? ', ' + result.BUILDING : ''}, Singapore ${result.POSTAL}`;
    setCustomer(prev => ({ ...prev, address: formatted }));
    setAddressQuery(formatted);
    setAddressSuggestions([]);
    setErrors(prev => ({ ...prev, address: '' }));
  };

  // ── Checkout with validation ──
  const handleCheckout = () => {
    const newErrors = { name: '', phone: '', address: '', unit: '' };
    if (!validateName(customer.name)) newErrors.name = 'Please enter your full name (min. 2 characters)';
    if (!validatePhone(customer.phone)) newErrors.phone = 'Enter a valid SG mobile number (e.g. 91234567)';
    if (!customer.address.trim()) newErrors.address = 'Please search and select a Singapore address';
    setErrors(newErrors);
    if (!newErrors.name && !newErrors.phone && !newErrors.address) {
      setSnapshotCartTotal(cartTotal);
      setIsCartOpen(false);
      setShowPayNow(true);
    }
  };

  // ── Cart Logic ──
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

  const confirmOrder = async () => {
    // Snapshot values before any async ops or state changes
    const items = Object.values(cart);
    const snapshotTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const dollarSign = 'SGD ';
    const orderLines = items.map(i => '• ' + i.qty + 'x ' + i.name + ' — ' + dollarSign + (i.price * i.qty).toFixed(2)).join('\n');
    const fullAddress = customer.unit ? `${customer.unit}, ${customer.address}` : customer.address;
    const msg = '🛎️ *NEW ORDER — Tuny\'s Kitchen*\n\n👤 *Customer:* ' + customer.name + '\n📞 *Phone:* +65 ' + customer.phone + '\n📍 *Delivery:* ' + fullAddress + '\n\n🧾 *Order Details:*\n' + orderLines + '\n\n💰 *Total Paid:* ' + dollarSign + snapshotTotal.toFixed(2);

    // Save to Supabase
    await supabase.from('orders').insert({
      customer_name: customer.name,
      customer_phone: customer.phone,
      delivery_address: fullAddress,
      items: items,
      total: snapshotTotal,
      status: 'pending'
    });

    // Send WhatsApp notification via CallMeBot
    try {
      await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${CONFIG.callMeBotPhone}&text=${encodeURIComponent(msg)}&apikey=${CONFIG.callMeBotApiKey}`
      );
    } catch (err) {
      console.error('CallMeBot notification failed:', err);
    }

    // Clear cart and show success
    setCart({});
    setShowPayNow(false);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#fdf6ec] text-[#2a1a0e]">
      {/* HEADER */}
      <header className="bg-[#3b2415] text-[#fdf6ec] p-4 sticky top-0 z-40 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍲</span>
          <div>
            <h1 className="font-serif text-xl font-bold">Tuny's Kitchen</h1>
            <p className="text-[10px] text-[#d4952a] tracking-widest uppercase">Pre-Order · Home-cooked · Singapore</p>
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
        <div className="mt-5 inline-flex items-center gap-2 bg-[#d4952a]/20 border border-[#d4952a] rounded-full px-5 py-2">
          <span className="text-lg">📅</span>
          <span className="text-[#fdf6ec] text-sm font-semibold tracking-wide">Pre-Order Only — Order in Advance</span>
        </div>
      </section>

      {/* PRE-ORDER NOTICE BANNER */}
      <div className="bg-[#d4952a]/10 border-b border-[#d4952a]/30 py-3 px-4 text-center">
        <p className="text-[#3b2415] text-sm font-medium">
          ⏰ <strong>All orders are pre-ordered in advance.</strong> We will confirm your delivery date &amp; time via WhatsApp after your order is placed.
        </p>
      </div>

      {/* OUR STORY */}
      <section className="max-w-2xl mx-auto px-6 py-10 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="block h-px w-8 bg-[#d4952a]"></span>
          <span className="text-[#d4952a] text-xs font-bold tracking-widest uppercase">Our Story</span>
          <span className="block h-px w-8 bg-[#d4952a]"></span>
        </div>
        <h3 className="font-serif text-2xl md:text-3xl text-[#3b2415] mb-5 italic">A Family Kitchen, Born from Homesickness</h3>
        <p className="text-[#5a3a25] text-sm md:text-base leading-relaxed">
          Nestled in the East Coast of Singapore is a pre-ordered home cooked Indonesian food. We started off without the intention of selling food online. We as a family usually miss the true authentic Indonesian food that is not available at affordable price in Singapore. So we started cooking at home and sometimes offer the excess to our Indonesian friends. Friends who tried our food suggested that we should cook more and offer the food for sale online. When the Covid-19 hit Singapore in 2020 and since we were working from home, we decided to start this online business to keep ourselves busy and occupied. So that is how the story of how our online pre-ordered food started on Instagram.
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <span className="bg-[#f5e6cc] text-[#3b2415] text-xs font-semibold px-4 py-1.5 rounded-full">🏠 Home-cooked</span>
          <span className="bg-[#f5e6cc] text-[#3b2415] text-xs font-semibold px-4 py-1.5 rounded-full">🇮🇩 Authentic Indonesian</span>
          <span className="bg-[#f5e6cc] text-[#3b2415] text-xs font-semibold px-4 py-1.5 rounded-full">📅 Pre-Order</span>
          <span className="bg-[#f5e6cc] text-[#3b2415] text-xs font-semibold px-4 py-1.5 rounded-full">📍 East Coast, Singapore</span>
        </div>
      </section>

      {/* MENU HEADING */}
      <div className="text-center pb-2">
        <h3 className="font-serif text-xl text-[#3b2415] italic">Browse Our Menu</h3>
        <p className="text-xs text-[#8a6a50] mt-1">Pre-order your favourites below</p>
      </div>

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
        {MENU[activeTab as keyof typeof MENU]?.map((item: any) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-[#f5e6cc] overflow-hidden flex flex-col">
            {item.image ? (
              <div className="h-48 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="bg-[#f5e6cc] text-5xl py-8 text-center">{item.emoji}</div>
            )}
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

            {/* Cart Items */}
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

            {/* Customer Form */}
            <div className="p-4 border-t bg-[#fdf6ec] space-y-3">

              {/* Name */}
              <div>
                <input
                  placeholder="Full Name *"
                  value={customer.name}
                  className={`w-full p-2 border rounded text-sm ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                  onChange={e => {
                    setCustomer({ ...customer, name: e.target.value });
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <div className={`flex items-center border rounded overflow-hidden ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}>
                  <span className="bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 border-r border-gray-300 whitespace-nowrap">+65</span>
                  <input
                    placeholder="8 digit mobile number *"
                    value={customer.phone}
                    maxLength={8}
                    className={`flex-1 p-2 text-sm outline-none ${errors.phone ? 'bg-red-50' : 'bg-white'}`}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCustomer({ ...customer, phone: val });
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                  />
                  {customer.phone.length === 8 && (
                    <span className="pr-2 text-sm">{validatePhone(customer.phone) ? '✅' : '❌'}</span>
                  )}
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Address with OneMap Search */}
              <div className="relative">
                <div className={`flex items-center border rounded overflow-hidden ${errors.address ? 'border-red-400' : 'border-gray-300'}`}>
                  <MapPin size={16} className="ml-2 text-gray-400 shrink-0" />
                  <input
                    placeholder="Search Singapore address or postal code *"
                    value={addressQuery}
                    className={`flex-1 p-2 text-sm outline-none ${errors.address ? 'bg-red-50' : 'bg-white'}`}
                    onChange={e => searchAddress(e.target.value)}
                  />
                  {addressLoading && <Loader2 size={16} className="mr-2 animate-spin text-gray-400" />}
                </div>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}

                {/* Suggestions Dropdown */}
                {addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                    {addressSuggestions.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectAddress(result)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#f5e6cc] border-b border-gray-100 last:border-0"
                      >
                        <div className="font-semibold text-[#3b2415] text-xs">
                          {result.BLK_NO ? result.BLK_NO + ' ' : ''}{result.ROAD_NAME}
                          {result.BUILDING && result.BUILDING !== 'NIL' ? `, ${result.BUILDING}` : ''}
                        </div>
                        <div className="text-gray-400 text-xs">Singapore {result.POSTAL}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Confirmed address badge */}
                {customer.address && (
                  <p className="mt-1 text-xs text-green-600 font-medium">✅ Address confirmed</p>
                )}
              </div>

              {/* Unit / Apartment Number */}
              {customer.address && (
                <div>
                  <input
                    placeholder="Unit / Apartment No. (e.g. #05-12)"
                    value={customer.unit}
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                    onChange={e => setCustomer({ ...customer, unit: e.target.value })}
                  />
                  <p className="text-gray-400 text-xs mt-1">Optional — leave blank if not applicable</p>
                </div>
              )}

              {/* Total & Checkout */}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cartCount === 0}
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
            <div className="bg-[#fdf6ec] border-2 border-dashed border-[#d4952a] p-4 rounded-xl mb-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="PayNow QR Code" className="mx-auto w-52 h-52" />
              ) : (
                <div className="w-52 h-52 mx-auto flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-[#d4952a]" />
                </div>
              )}
              <div className="text-sm text-gray-500 mt-2">Tuny's Kitchen</div>
              <div className="text-2xl font-bold text-[#c8401a] mt-1">SGD {snapshotCartTotal.toFixed(2)}</div>
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
