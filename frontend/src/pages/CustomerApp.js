import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Community from '../components/Community';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import './CustomerApp.css';

const IMG_BASE = 'http://localhost:5000/uploads/';
const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Other'];

const CUSTOMER_TABS = [
  { id: 'browse',    label: '🛒 Browse' },
  { id: 'orders',    label: '📋 My Orders' },
  { id: 'community', label: '💬 Community' },
];

export default function CustomerApp() {
  const [tab, setTab]         = useState('browse');
  const { user }              = useAuth();
  const { showToast, ToastComponent } = useToast();

  // ── Browse ──
  const [products, setProducts] = useState([]);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [nearbyCity, setNearbyCity] = useState('');
  const [cities, setCities]     = useState([]);
  const [showCityFilter, setShowCityFilter] = useState(false);

  // ── Booking modal ──
  const [selected, setSelected]   = useState(null);
  const [bookForm, setBookForm]   = useState({ buyerName:'', buyerPhone:'', quantity:'', message:'' });
  const [booking, setBooking]     = useState(false);

  // ── Orders ──
  const [orders, setOrders]             = useState([]);
  const [phone4Orders, setPhone4Orders] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ── Rating ──
  const [ratingModal, setRatingModal]           = useState(null);
  const [ratingForm, setRatingForm]             = useState({ stars: 0, review: '' });
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (tab === 'browse') { fetchProducts(); fetchCities(); }
  }, [tab, search, category, nearbyCity]);

  const fetchCities = async () => {
    try {
      const { data } = await api.get('/farmers/cities');
      setCities(data);
    } catch { /* silent */ }
  };

  const fetchProducts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (nearbyCity) params.city = nearbyCity;
      const { data } = await api.get('/products', { params });
      setProducts(data);
    } catch { showToast('Failed to load products', 'error'); }
  };

  const openModal = (product) => {
    setSelected(product);
    setBookForm({ buyerName: user.name, buyerPhone: user.phone, quantity:'', message:'' });
  };

  const submitBooking = async () => {
    const { buyerName, buyerPhone, quantity } = bookForm;
    if (!buyerName || !buyerPhone || !quantity) { showToast('Fill in all fields!', 'error'); return; }
    if (selected.stock != null) {
      const ordered = parseFloat(quantity);
      if (isNaN(ordered) || ordered <= 0) { showToast('Enter a valid quantity!', 'error'); return; }
      if (ordered > selected.stock) {
        showToast(`Only ${selected.stock} ${selected.unit} available!`, 'error'); return;
      }
    }
    setBooking(true);
    try {
      await api.post('/bookings', { productId: selected._id, ...bookForm });
      setSelected(null);
      showToast('🎉 Booking confirmed! Farmer will contact you.');
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Booking failed', 'error');
    } finally { setBooking(false); }
  };

  const fetchOrders = async () => {
    if (!phone4Orders) { showToast('Enter your phone number', 'error'); return; }
    setLoadingOrders(true);
    try {
      const { data } = await api.get(`/bookings/customer/${phone4Orders}`);
      setOrders(data);
    } catch { showToast('Failed to load orders', 'error'); }
    finally { setLoadingOrders(false); }
  };

  const openRatingModal = (b) => {
    setRatingModal({
      farmerId:    b.farmer || b.product?.farmer,
      farmerName:  b.product?.farmerName,
      productName: b.product?.name,
      buyerPhone:  b.buyerPhone,
    });
    setRatingForm({ stars: 0, review: '' });
  };

  const submitRating = async () => {
    if (!ratingForm.stars) { showToast('Please select stars!', 'error'); return; }
    setSubmittingRating(true);
    try {
      await api.post('/ratings', {
        farmerId:    ratingModal.farmerId,
        buyerName:   user?.name || ratingModal.buyerPhone,
        buyerPhone:  ratingModal.buyerPhone,
        stars:       ratingForm.stars,
        review:      ratingForm.review,
        productName: ratingModal.productName,
      });
      showToast('⭐ Rating submitted! Thank you.');
      setRatingModal(null);
      setRatingForm({ stars: 0, review: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit rating', 'error');
    } finally { setSubmittingRating(false); }
  };

  return (
    <div>
      {ToastComponent}
      <Navbar tabs={CUSTOMER_TABS} activeTab={tab} onTab={setTab} />

      {/* ── BROWSE TAB ── */}
      {tab === 'browse' && (
        <div className="page-wrap">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search fresh produce..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="filter-chips">
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>

          {/* Nearby Farmers Filter */}
          <div className="nearby-section">
            <button className={`nearby-toggle ${showCityFilter ? 'open' : ''}`} onClick={() => setShowCityFilter(v => !v)}>
              📍 {nearbyCity ? `Showing farmers from: ${nearbyCity}` : 'Filter by Nearby City'}
              <span className="nearby-arrow">{showCityFilter ? '▲' : '▼'}</span>
            </button>
            {showCityFilter && (
              <div className="nearby-panel">
                <div className="nearby-search-row">
                  <input className="nearby-input" placeholder="Type a city name..." value={nearbyCity} onChange={e => setNearbyCity(e.target.value)} />
                  {nearbyCity && <button className="clear-btn" onClick={() => setNearbyCity('')}>✕ Clear</button>}
                </div>
                {cities.length > 0 && (
                  <div className="city-chips">
                    <div className="city-chips-label">📌 Cities with farmers:</div>
                    <div className="city-chips-wrap">
                      {cities.map(c => (
                        <button key={c} className={`city-chip ${nearbyCity === c ? 'active' : ''}`} onClick={() => setNearbyCity(nearbyCity === c ? '' : c)}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {products.length === 0
            ? <div className="empty-state"><div className="icon">🌿</div><p>No products found.<br/>Farmers will list items soon!</p></div>
            : (
              <div className="products-grid">
                {products.map(p => (
                  <div className="product-card card" key={p._id}>
                    <div className="product-img-wrap">
                      {p.image ? <img src={`${IMG_BASE}${p.image}`} alt={p.name} /> : <span className="product-emoji">{getEmoji(p.name)}</span>}
                      {p.stock === 0 && <div className="out-of-stock-overlay">Out of Stock</div>}
                    </div>
                    <div className="product-body">
                      <div className="product-name">{p.name}</div>
                      <div className="product-farmer">👨‍🌾 {p.farmerName}</div>
                      {p.farmerCity && <div className="product-city">📍 {p.farmerCity}</div>}
                      {p.description && <div className="product-desc">{p.description}</div>}
                      <div className="product-price">₹{p.price} <span>/ {p.unit}</span></div>
                      {p.stock != null ? (
                        <div className={`product-qty ${p.stock === 0 ? 'stock-out' : p.stock <= 10 ? 'stock-low' : 'stock-ok'}`}>
                          {p.stock === 0 ? '❌ Out of Stock'
                            : p.stock <= 10 ? `⚠️ Only ${p.stock} ${p.unit.replace(/^[0-9]+/, '').trim()} left!`
                            : `✅ ${p.stock} ${p.unit.replace(/^[0-9]+/, '').trim()} available`}
                        </div>
                      ) : (
                        p.quantity && <div className="product-qty">✅ {p.quantity}</div>
                      )}
                      <button className="btn-primary" style={{width:'100%',marginTop:12}} onClick={() => openModal(p)} disabled={p.stock === 0}>
                        {p.stock === 0 ? '❌ Out of Stock' : '🛒 Book Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div className="page-wrap">
          <h2 className="section-title" style={{marginBottom:20}}>📋 Track My Orders</h2>
          <div className="card" style={{marginBottom:24}}>
            <p style={{marginBottom:12,color:'var(--gray)',fontSize:14}}>Enter your phone number to see your bookings:</p>
            <div style={{display:'flex',gap:12}}>
              <input className="phone-input" type="tel" placeholder="Your phone number" value={phone4Orders}
                onChange={e => setPhone4Orders(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchOrders()} />
              <button className="btn-primary" onClick={fetchOrders} disabled={loadingOrders}>
                {loadingOrders ? <span className="spinner"/> : 'Search'}
              </button>
            </div>
          </div>
          {orders.length === 0
            ? <div className="empty-state"><div className="icon">🛒</div><p>No orders found for this number.</p></div>
            : (
              <div className="bookings-list">
                {orders.map(b => (
                  <div className={`booking-card card ${b.status}`} key={b._id}>
                    <div className="booking-thumb">
                      {b.product?.image ? <img src={`${IMG_BASE}${b.product.image}`} alt="" /> : <span>{getEmoji(b.product?.name||'')}</span>}
                    </div>
                    <div className="booking-info">
                      <h4>{b.product?.name} — {b.quantity}</h4>
                      <p>👨‍🌾 <strong>{b.product?.farmerName}</strong></p>
                      <p>📞 Farmer: <strong>{b.product?.farmerPhone}</strong></p>
                      <p style={{fontSize:12,color:'var(--gray)',marginTop:4}}>
                        ₹{b.product?.price}/{b.product?.unit} · {new Date(b.createdAt).toLocaleDateString()}
                      </p>
                      {b.status === 'confirmed' && (
                        <button
                          className="btn-primary"
                          style={{marginTop:10,fontSize:12,padding:'6px 16px',width:'fit-content'}}
                          onClick={() => openRatingModal(b)}
                        >
                          ⭐ Rate Farmer
                        </button>
                      )}
                    </div>
                    <span className={`badge badge-${b.status}`}>
                      {b.status === 'confirmed' ? '✅ Confirmed' : b.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── COMMUNITY TAB ── */}
      {tab === 'community' && <Community />}

      {/* ── BOOKING MODAL ── */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target.classList.contains('modal-overlay') && setSelected(null)}>
          <div className="modal">
            <h3>📦 Book This Product</h3>
            <div className="modal-product">
              <div className="modal-thumb">
                {selected.image ? <img src={`${IMG_BASE}${selected.image}`} alt="" /> : <span>{getEmoji(selected.name)}</span>}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:17}}>{selected.name}</div>
                <div style={{fontSize:13,color:'var(--gray)'}}>by {selected.farmerName}</div>
                <div style={{color:'var(--green)',fontWeight:700,marginTop:4}}>₹{selected.price} / {selected.unit}</div>
                {selected.stock != null && (
                  <div style={{fontSize:12,marginTop:4,color:selected.stock<=10?'#d97706':'#16a34a',fontWeight:600}}>
                    {selected.stock <= 10 ? `⚠️ Only ${selected.stock} ${selected.unit} left` : `✅ ${selected.stock} ${selected.unit} available`}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Your Name</label>
              <input value={bookForm.buyerName} onChange={e=>setBookForm({...bookForm,buyerName:e.target.value})} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Your Phone Number</label>
              <input value={bookForm.buyerPhone} onChange={e=>setBookForm({...bookForm,buyerPhone:e.target.value})} placeholder="+91 XXXXXXXXXX" />
            </div>
            <div className="form-group">
              <label>Quantity Required {selected.stock != null && <span style={{fontSize:11,color:'var(--gray)',fontWeight:400,marginLeft:8}}>(max: {selected.stock} {selected.unit})</span>}</label>
              <input type="number" value={bookForm.quantity} onChange={e=>setBookForm({...bookForm,quantity:e.target.value})}
                placeholder="e.g. 2" min="1" max={selected.stock || undefined} />
            </div>
            <div className="form-group">
              <label>Message to Farmer (optional)</label>
              <input value={bookForm.message} onChange={e=>setBookForm({...bookForm,message:e.target.value})} placeholder="Any special request?" />
            </div>
            <div style={{display:'flex',gap:12,marginTop:4}}>
              <button className="btn-outline" style={{flex:1}} onClick={()=>setSelected(null)}>Cancel</button>
              <button className="btn-primary" style={{flex:2}} onClick={submitBooking} disabled={booking}>
                {booking ? <span className="spinner"/> : '✅ Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RATING MODAL ── */}
      {ratingModal && (
        <div className="modal-overlay" onClick={e => e.target.classList.contains('modal-overlay') && setRatingModal(null)}>
          <div className="modal">
            <h3>⭐ Rate {ratingModal.farmerName}</h3>
            <p style={{fontSize:13,color:'var(--gray)',marginBottom:20,textAlign:'center'}}>
              for <strong>{ratingModal.productName}</strong>
            </p>

            <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:8}}>
              {[1,2,3,4,5].map(s => (
                <span
                  key={s}
                  style={{fontSize:38,cursor:'pointer',opacity:ratingForm.stars>=s?1:0.25,transition:'all 0.15s',transform:ratingForm.stars>=s?'scale(1.15)':'scale(1)'}}
                  onClick={() => setRatingForm({...ratingForm, stars: s})}
                >⭐</span>
              ))}
            </div>

            {ratingForm.stars > 0 && (
              <div style={{textAlign:'center',fontSize:13,color:'var(--green)',fontWeight:600,marginBottom:16}}>
                {ratingForm.stars === 1 ? 'Poor 😞' : ratingForm.stars === 2 ? 'Fair 😐' : ratingForm.stars === 3 ? 'Good 🙂' : ratingForm.stars === 4 ? 'Very Good 😊' : 'Excellent! 🤩'}
              </div>
            )}

            <div className="form-group">
              <label>Write a Review (optional)</label>
              <textarea rows={3} placeholder="Share your experience with this farmer..."
                value={ratingForm.review} onChange={e => setRatingForm({...ratingForm, review: e.target.value})}
                style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border)',fontFamily:'inherit',fontSize:13,resize:'none'}}
              />
            </div>

            <div style={{display:'flex',gap:12,marginTop:8}}>
              <button className="btn-outline" style={{flex:1}} onClick={() => setRatingModal(null)}>Cancel</button>
              <button className="btn-primary" style={{flex:2}} onClick={submitRating} disabled={submittingRating}>
                {submittingRating ? <span className="spinner"/> : '⭐ Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getEmoji(name='') {
  const n = name.toLowerCase();
  if(n.includes('tomato')) return '🍅'; if(n.includes('rice')||n.includes('wheat')) return '🌾';
  if(n.includes('mango')) return '🥭'; if(n.includes('banana')) return '🍌';
  if(n.includes('potato')) return '🥔'; if(n.includes('onion')) return '🧅';
  if(n.includes('carrot')) return '🥕'; if(n.includes('corn')) return '🌽';
  if(n.includes('milk')) return '🥛'; return '🌿';
}
