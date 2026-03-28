import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import './Community.css';

const IMG_BASE = 'http://localhost:5000/uploads/';

export default function Community() {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [commentText, setCommentText] = useState({});

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/posts');
      setPosts(data);
    } catch { showToast('Failed to load posts', 'error'); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submitPost = async () => {
    if (!text.trim() && !imageFile) { showToast('Add text or image!', 'error'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('text', text);
      if (imageFile) fd.append('image', imageFile);
      const { data } = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts([data, ...posts]);
      setText(''); setImageFile(null); setImagePreview('');
      showToast('Post shared! 🌱');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post', 'error');
    } finally { setLoading(false); }
  };

  const toggleLike = async (postId) => {
    try {
      const { data } = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => {
        if (p._id !== postId) return p;
        const likes = data.liked
          ? [...p.likes, user._id]
          : p.likes.filter(id => id !== user._id);
        return { ...p, likes };
      }));
    } catch { showToast('Failed to like', 'error'); }
  };

  const submitComment = async (postId) => {
    const txt = commentText[postId]?.trim();
    if (!txt) return;
    try {
      const { data } = await api.post(`/posts/${postId}/comment`, { text: txt });
      setPosts(posts.map(p => p._id === postId ? { ...p, comments: data } : p));
      setCommentText({ ...commentText, [postId]: '' });
    } catch { showToast('Failed to comment', 'error'); }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
      showToast('Post deleted');
    } catch { showToast('Failed to delete', 'error'); }
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div className="community-page">
      {ToastComponent}
      {/* ── Compose post ── */}
      <div className="card post-compose">
        <textarea
          className="compose-input"
          placeholder="Share your review ,story, tips, or recipe... 🌾"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
        />
        {imagePreview && (
          <div className="compose-preview-wrap">
            <img src={imagePreview} alt="preview" className="compose-preview" />
            <button className="remove-img" onClick={() => { setImagePreview(''); setImageFile(null); }}>✕</button>
          </div>
        )}
        <div className="compose-actions">
          <label className="attach-label">
            📷 Add Photo
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>
          <button className="btn-primary" onClick={submitPost} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Post'}
          </button>
        </div>
      </div>

      {/* ── Posts feed ── */}
      {posts.length === 0 ? (
        <div className="empty-state"><div className="icon">💬</div><p>No posts yet. Be the first to share!</p></div>
      ) : (
        posts.map(post => {
          const liked = post.likes?.includes(user._id);
          const isOwn = post.author === user._id || post.authorName === user.name;
          return (
            <div className="post-card card" key={post._id}>
              <div className="post-header">
                <div className="post-avatar">{post.authorName?.charAt(0).toUpperCase()}</div>
                <div className="post-meta">
                  <div className="post-author">
                    {post.authorName}
                    <span className={`badge ${post.authorRole === 'farmer' ? 'badge-farmer' : 'badge-customer'}`}>
                      {post.authorRole === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}
                    </span>
                  </div>
                  <div className="post-time">{timeAgo(post.createdAt)}</div>
                </div>
                {isOwn && (
                  <button className="post-delete" onClick={() => deletePost(post._id)} title="Delete">🗑</button>
                )}
              </div>

              {post.text && <p className="post-text">{post.text}</p>}

              {post.image && (
                <div className="post-image">
                  <img src={`${IMG_BASE}${post.image}`} alt="post" />
                </div>
              )}

              <div className="post-actions">
                <button
                  className={`action-btn ${liked ? 'liked' : ''}`}
                  onClick={() => toggleLike(post._id)}
                >
                  {liked ? '❤️' : '🤍'} {post.likes?.length || 0} Like{post.likes?.length !== 1 ? 's' : ''}
                </button>
                <button
                  className="action-btn"
                  onClick={() => setOpenComments({ ...openComments, [post._id]: !openComments[post._id] })}
                >
                  💬 {post.comments?.length || 0} Comment{post.comments?.length !== 1 ? 's' : ''}
                </button>
              </div>

              {openComments[post._id] && (
                <div className="comments-section">
                  <div className="comment-input-row">
                    <input
                      placeholder="Write a comment..."
                      value={commentText[post._id] || ''}
                      onChange={e => setCommentText({ ...commentText, [post._id]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && submitComment(post._id)}
                    />
                    <button className="comment-send" onClick={() => submitComment(post._id)}>➤</button>
                  </div>
                  <div className="comment-list">
                    {post.comments?.map((c, i) => (
                      <div className="comment-item" key={i}>
                        <strong>{c.name}</strong>: {c.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
