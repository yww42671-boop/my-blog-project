import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { likeApi } from '../api';

export default function LikeButton({ blogId, initialCount = 0 }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && blogId) {
      likeApi.status(blogId)
        .then((data) => {
          setLiked(data.liked);
          setCount(data.like_count);
        })
        .catch(() => {});
    }
  }, [user, blogId]);

  const handleToggle = async () => {
    if (!user) return;
    if (loading) return;
    setLoading(true);
    // 乐观更新
    setLiked(!liked);
    setCount((c) => (liked ? c - 1 : c + 1));
    try {
      const data = await likeApi.toggle(blogId);
      setLiked(data.liked);
      setCount(data.like_count);
    } catch {
      // 回滚
      setLiked(liked);
      setCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!user || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 24px',
        backgroundColor: liked ? 'rgba(255,100,100,0.15)' : 'rgba(255,255,255,0.04)',
        border: liked
          ? '1px solid rgba(255,100,100,0.3)'
          : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        cursor: user ? 'pointer' : 'not-allowed',
        fontSize: 15,
        fontFamily: 'inherit',
        color: liked ? '#ff6b6b' : 'rgba(232,224,208,0.5)',
        transition: 'all 0.2s',
        opacity: user ? 1 : 0.5,
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>
        {liked ? '❤️' : '🤍'}
      </span>
      <span style={{ fontSize: 14 }}>{count}</span>
    </button>
  );
}
