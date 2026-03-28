import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Community from '../components/Community';
import ChatBox from '../components/ChatBox';
import StatsDashboard from '../components/StatsDashboard';
import api from '../api';
import { useToast } from '../hooks/useToast';
import './FarmerApp.css';

const IMG_BASE = 'http://localhost:5000/uploads/';
const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Other'];

const FARMER_TABS = [
  { id: 'sell',      label: '🌽 Sell' },
  { id: 'bookings',  label: '📦 Bookings' },
  { id: 'stats',     label: '📊 Statistics' },
  { id: 'chat',      label: '💬 Chat' },
  { id: 'community', label: '🌾 Community' },
];

export default function FarmerApp() {
  const [tab, setTab] = useState('sell');
  const { showToast, ToastComponent } = useToast();

  // ── Products ──
  const [products, setProducts]     = useState([]);
  const [form, setForm]             = useState({ name:'', description:'', price:'', unit:'', quantity:'', stock:'', category:'Vegetables' });
  const [imageFile, setImageFile]   = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [listing, setListing]       = useState(false);

  // ── Bookings ──
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (tab === 'sell')     fetchProducts();
    if (tab === 'bookings') fetchBookings();
  }, [tab]);

  const fetchProducts = async () => {
    try { const { data } = await api.get('/products/mine'); setProducts(data); }
    catch { showToast('Failed to load products', 'error'); }
  };

  const fetchBookings = async () => {
    try { const { data } = await api.get('/bookings/farmer'); setBookings(data); }
    catch { showToast('Failed to load bookings', 'error'); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const listProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.unit) {
      showToast('Name, price, and unit are required!', 'error'); return;
    }
    setListing(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      const { data } = await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProducts([data, ...products]);
      setForm({ name:'', description:'', price:'', unit:'', quantity:'', stock:'', category:'Vegetables' });
      setImageFile(null); setImgPreview('');
      showToast('✅ Product listed successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to list product', 'error');
    } finally { setListing(false); }
  };

  const removeProduct = async (id) => {
    if (!window.confirm('Remove this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      showToast('Product removed');
    } catch { showToast('Failed to remove', 'error'); }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/bookings/${id}/status`, { status });
      setBookings(bookings.map(b => b._id === id ? { ...b, status: data.status } : b));
      if (status === 'confirmed') fetchProducts(); // refresh stock
      showToast(status === 'confirmed' ? '✅ Booking confirmed!' : '❌ Booking rejected');
    } catch { showToast('Failed to update booking', 'error'); }
  };

  const pending   = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div>
      {ToastComponent}
      <Navbar tabs={FARMER_TABS} activeTab={tab} onTab={setTab} />

      {/* ── SELL TAB ── */}
      {tab === 'sell' && (
        <div className="page-wrap">
          {/* Stats row */}
          <div className="stats-row">
            <div className="stat-card card"><div className="stat-num">{products.length}</div><div className="stat-lbl">Products Listed</div></div>
            <div className="stat-card card"><div className="stat-num">{bookings.length || '—'}</div><div className="stat-lbl">Total Bookings</div></div>
            <div className="stat-card card"><div className="stat-num">{pending || '—'}</div><div className="stat-lbl">Pending Orders</div></div>
          </div>

          {/* List form */}
          <div className="card sell-form">
            <h2 className="section-title">🌽 List a New Product</h2>
            <form onSubmit={listProduct}>
              <label className="img-upload-area">
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                {imgPreview
                  ? <img src={imgPreview} alt="preview" className="upload-preview" />
                  : <><div className="upload-icon">📷</div><p>Click to upload product photo from gallery</p></>
                }
              </label>

              <div className="form-group" style={{marginTop:16}}>
                <label>Product Name *</label>
                <input placeholder="e.g. Fresh Tomatoes" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="How it was grown, harvest date, quality..."
                  value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" placeholder="80" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Per (unit) *</label>
                  <input placeholder="kg / dozen / bunch" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock (numeric) *</label>
                  <input type="number" placeholder="e.g. 50" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{width:'100%'}} disabled={listing}>
                {listing ? <span className="spinner"/> : '✅ List Product for Sale'}
              </button>
            </form>
          </div>

          {/* My products */}
          <h2 className="section-title" style={{marginBottom:16}}>Your Listed Products</h2>
          {products.length === 0
            ? <div className="empty-state"><div className="icon">🌱</div><p>No products yet.<br/>Add your first product above!</p></div>
            : (
              <div className="products-grid">
                {products.map(p => (
                  <div className="product-card card" key={p._id}>
                    <div className="product-img-wrap">
                      {p.image ? <img src={`${IMG_BASE}${p.image}`} alt={p.name} /> : <span className="product-emoji">{getEmoji(p.name)}</span>}
                    </div>
                    <div className="product-body">
                      <div className="product-name">{p.name}</div>
                      <div className="product-meta">
                        {p.category} · {p.stock != null ? `${p.stock} ${p.unit} available` : p.quantity}
                      </div>
                      <div className="product-price">₹{p.price} <span>/ {p.unit}</span></div>
                      {p.stock != null && (
                        <div style={{
                          marginTop:6, fontSize:12, fontWeight:600,
                          color: p.stock === 0 ? '#dc2626' : p.stock <= 10 ? '#d97706' : '#16a34a'
                        }}>
                          {p.stock === 0 ? '❌ Out of Stock' : p.stock <= 10 ? `⚠️ Low Stock: ${p.stock} ${p.unit}` : `✅ ${p.stock} ${p.unit} in stock`}
                        </div>
                      )}
                      <button className="btn-danger" style={{marginTop:12,width:'100%'}} onClick={()=>removeProduct(p._id)}>
                        🗑 Remove Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── BOOKINGS TAB ── */}
      {tab === 'bookings' && (
        <div className="page-wrap">
          <h2 className="section-title">📦 Customer Bookings</h2>
          <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
            <div className="summary-chip" style={{background:'#fef3c7',color:'#92400e'}}>⏳ {pending} Pending</div>
            <div className="summary-chip" style={{background:'#dcfce7',color:'#166534'}}>✅ {confirmed} Confirmed</div>
          </div>
          {bookings.length === 0
            ? <div className="empty-state"><div className="icon">📭</div><p>No bookings yet.</p></div>
            : (
              <div className="bookings-list">
                {bookings.map(b => (
                  <div className={`booking-card card ${b.status}`} key={b._id}>
                    <div className="booking-thumb">
                      {b.product?.image ? <img src={`${IMG_BASE}${b.product.image}`} alt="" /> : <span>{getEmoji(b.product?.name || '')}</span>}
                    </div>
                    <div className="booking-info">
                      <h4>{b.product?.name} — {b.quantity}</h4>
                      <p>👤 <strong>{b.buyerName}</strong></p>
                      <p>📞 <strong>{b.buyerPhone}</strong></p>
                      {b.message && <p style={{fontStyle:'italic',color:'var(--gray)'}}>"{b.message}"</p>}
                      <p style={{fontSize:12,color:'var(--gray)',marginTop:4}}>
                        ₹{b.product?.price}/{b.product?.unit} · {new Date(b.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="booking-actions">
                      <span className={`badge badge-${b.status}`}>
                        {b.status === 'confirmed' ? '✅ Confirmed' : b.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                      </span>
                      {b.status === 'pending' && (
                        <div style={{display:'flex',gap:8,marginTop:8}}>
                          <button className="btn-primary" style={{padding:'7px 16px',fontSize:13}} onClick={()=>updateBookingStatus(b._id,'confirmed')}>Confirm</button>
                          <button className="btn-danger" onClick={()=>updateBookingStatus(b._id,'rejected')}>Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── STATS TAB (includes ratings) ── */}
      {tab === 'stats' && <StatsDashboard />}

      {/* ── CHAT TAB ── */}
      {tab === 'chat' && (
        <div style={{paddingTop:16}}>
          <ChatBox />
        </div>
      )}

      {/* ── COMMUNITY TAB ── */}
      {tab === 'community' && <Community />}
    </div>
  );
}

function getEmoji(name='') {
  const n = name.toLowerCase();
  if(n.includes('tomato')) return '🍅'; if(n.includes('rice')||n.includes('wheat')) return '🌾';
  if(n.includes('mango')) return '🥭'; if(n.includes('banana')) return '🍌';
  if(n.includes('potato')) return '🥔'; if(n.includes('onion')) return '🧅';
  if(n.includes('carrot')) return '🥕'; if(n.includes('corn')||n.includes('maize')) return '🌽';
  if(n.includes('milk')||n.includes('dairy')) return '🥛'; if(n.includes('egg')) return '🥚';
  return '🌿';
}
