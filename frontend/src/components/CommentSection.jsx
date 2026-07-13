import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { commentApi } from '../api';

export default function CommentSection({ blogId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { id, userName }
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (blogId) {
      commentApi.list(blogId)
        .then((data) => setComments(data.comments || []))
        .catch(() => {});
    }
  }, [blogId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await commentApi.create(blogId, newComment.trim(), replyTo?.id);
      setNewComment('');
      setReplyTo(null);
      // 刷新
      const data = await commentApi.list(blogId);
      setComments(data.comments || []);
    } catch (err) {
      alert('评论失败: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await commentApi.remove(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  // 分离顶级评论和回复
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, letterSpacing: '0.5px' }}>
        💬 评论 ({comments.length})
      </div>

      {/* 评论输入框 */}
      {user ? (
        <div style={{ marginBottom: 20 }}>
          {replyTo && (
            <div style={{ fontSize: 12, color: 'rgba(232,224,208,0.4)', marginBottom: 6 }}>
              回复 @{replyTo.userName}：
              <span
                onClick={() => setReplyTo(null)}
                style={{ color: '#64b5f6', cursor: 'pointer', marginLeft: 8 }}
              >
                取消
              </span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
              placeholder="写下你的评论…"
              style={{
                flex: 1, padding: '10px 14px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, outline: 'none',
                color: '#e8e0d0', fontSize: 14, fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={sending || !newComment.trim()}
              style={{
                padding: '8px 18px',
                backgroundColor: sending ? 'rgba(232,224,208,0.3)' : 'rgba(232,224,208,0.85)',
                color: '#1a1a1a', border: 'none', borderRadius: 8,
                fontSize: 13, fontFamily: 'inherit', cursor: sending ? 'not-allowed' : 'pointer',
                letterSpacing: '1px',
              }}
            >
              {sending ? '...' : '发送'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'rgba(232,224,208,0.3)', marginBottom: 20, textAlign: 'center' }}>
          登录后即可评论
        </div>
      )}

      {/* 评论列表 */}
      {topLevel.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(232,224,208,0.2)', textAlign: 'center', padding: '20px 0' }}>
          暂无评论，来说点什么吧
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {topLevel.map((c) => {
            const childReplies = replies.filter((r) => r.parent_id === c.id);
            return (
              <div key={c.id}>
                <div style={commentCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        backgroundColor: 'rgba(232,224,208,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: 'rgba(232,224,208,0.5)',
                      }}>
                        {c.user_name?.[0] || '?'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(232,224,208,0.7)' }}>
                        {c.user_name}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(232,224,208,0.2)' }}>
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    {user && user.id === c.user_id && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'rgba(232,224,208,0.2)', cursor: 'pointer',
                          fontSize: 11, fontFamily: 'inherit', padding: 0,
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#e8e0d0' }}>{c.content}</div>
                  {user && (
                    <div style={{ marginTop: 6 }}>
                      <button
                        onClick={() => setReplyTo({ id: c.id, userName: c.user_name })}
                        style={{
                          background: 'none', border: 'none',
                          color: 'rgba(232,224,208,0.25)', cursor: 'pointer',
                          fontSize: 11, fontFamily: 'inherit', padding: 0,
                        }}
                      >
                        回复
                      </button>
                    </div>
                  )}
                </div>

                {/* 子回复 */}
                {childReplies.length > 0 && (
                  <div style={{ marginLeft: 28, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {childReplies.map((reply) => (
                      <div key={reply.id} style={{ ...commentCardStyle, backgroundColor: 'rgba(255,255,255,0.015)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              backgroundColor: 'rgba(232,224,208,0.08)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, color: 'rgba(232,224,208,0.4)',
                            }}>
                              {reply.user_name?.[0] || '?'}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(232,224,208,0.6)' }}>
                              {reply.user_name}
                            </span>
                            <span style={{ fontSize: 10, color: 'rgba(232,224,208,0.2)' }}>
                              {formatDate(reply.created_at)}
                            </span>
                          </div>
                          {user && user.id === reply.user_id && (
                            <button
                              onClick={() => handleDelete(reply.id)}
                              style={{
                                background: 'none', border: 'none',
                                color: 'rgba(232,224,208,0.2)', cursor: 'pointer',
                                fontSize: 10, fontFamily: 'inherit', padding: 0,
                              }}
                            >
                              删除
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#d0c8b8' }}>{reply.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const commentCardStyle = {
  backgroundColor: 'rgba(255,255,255,0.025)',
  borderRadius: 10, padding: '10px 14px',
  border: '1px solid rgba(255,255,255,0.04)',
};
