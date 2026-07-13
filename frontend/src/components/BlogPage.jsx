import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { blogApi } from '../api';
import CommentSection from './CommentSection';
import LikeButton from './LikeButton';

/* ─── 复用 NotesPage 的 markdown 渲染器 ─── */
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/<u>([\s\S]*?)<\/u>/g, '<u style="text-decoration:underline;text-decoration-color:rgba(232,224,208,0.5);">$1</u>')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0;" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#64b5f6;text-decoration:underline;">$1</a>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(232,224,208,0.08);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/(?<![*\w])_([^_]+)_(?![*\w])/g, '<em>$1</em>')
    .replace(/==([^=]+)==/g, '<mark style="background:rgba(255,235,100,0.25);color:inherit;padding:0 4px;border-radius:4px;">$1</mark>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/^&gt;\s+(.*)$/gm, '<blockquote style="border-left:3px solid rgba(232,224,208,0.2);margin:8px 0;padding:6px 14px;color:rgba(232,224,208,0.55);">$1</blockquote>')
    .replace(/^---\s*$/gm, '<hr style="border:none;border-top:1px solid rgba(232,224,208,0.08);margin:20px 0;" />')
    .replace(/^\*\*\*\s*$/gm, '<hr style="border:none;border-top:1px solid rgba(232,224,208,0.08);margin:20px 0;" />')
    .replace(/^######\s+(.*)$/gm, '<h6 style="font-size:14px;margin:14px 0 6px;font-weight:500;">$1</h6>')
    .replace(/^#####\s+(.*)$/gm, '<h5 style="font-size:15px;margin:14px 0 6px;font-weight:500;">$1</h5>')
    .replace(/^####\s+(.*)$/gm, '<h4 style="font-size:17px;margin:16px 0 8px;font-weight:500;">$1</h4>')
    .replace(/^###\s+(.*)$/gm, '<h3 style="font-size:20px;margin:18px 0 8px;font-weight:500;">$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2 style="font-size:24px;margin:20px 0 10px;font-weight:500;letter-spacing:1px;">$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1 style="font-size:28px;margin:24px 0 12px;font-weight:500;letter-spacing:1px;">$1</h1>')
    .replace(/^[\*\-]\s+(.*)$/gm, '<li style="margin:2px 0 2px 20px;list-style-type:disc;">$1</li>')
    .replace(/^\d+\.\s+(.*)$/gm, '<li style="margin:2px 0 2px 20px;list-style-type:decimal;">$1</li>')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
      `<pre style="background:rgba(0,0,0,0.3);border-radius:8px;padding:16px;overflow-x:auto;margin:12px 0;border:1px solid rgba(255,255,255,0.06);"><code style="font-size:13px;line-height:1.6;color:#a8d8ea;">${code.trim()}</code></pre>`)
    .replace(/\n\s*\n/g, '</p><p style="margin:12px 0;line-height:1.8;">')
    .replace(/\n/g, '<br />');
  return '<p style="margin:0;line-height:1.8;">' + html + '</p>';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/* ─── 主组件 ─── */
export default function BlogPage({ onBack }) {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // list | detail | editor
  const [blogs, setBlogs] = useState([]);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // 编辑器状态
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // 我的博客列表（编辑管理用）
  const [myBlogs, setMyBlogs] = useState([]);
  const [showMyBlogs, setShowMyBlogs] = useState(false);
  const [sortBy, setSortBy] = useState('latest'); // latest | popular

  // 加载博客列表
  useEffect(() => {
    setLoading(true);
    blogApi.list(page, 20, sortBy)
      .then((data) => {
        setBlogs(data.blogs);
        setTotalPages(data.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, sortBy]);

  // 加载我的博客
  const loadMyBlogs = async () => {
    try {
      const data = await blogApi.myBlogs();
      setMyBlogs(data.blogs);
    } catch {}
  };

  // 打开详情
  const openDetail = async (id) => {
    try {
      const data = await blogApi.getById(id);
      setCurrentBlog(data.blog);
      setView('detail');
    } catch {}
  };

  // 打开编辑器（新建）
  const openNewEditor = () => {
    setEditId(null);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
    setView('editor');
  };

  // 打开编辑器（编辑已有）
  const openEditEditor = (blog) => {
    setEditId(blog.id);
    setEditTitle(blog.title);
    setEditContent(blog.content || '');
    setEditTags(blog.tags ? (typeof blog.tags === 'string' ? blog.tags : blog.tags.join(', ')) : '');
    setView('editor');
  };

  // 保存博客
  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setSaving(true);
    try {
      const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
      if (editId) {
        await blogApi.update(editId, { title: editTitle, content: editContent, tags });
      } else {
        await blogApi.create({ title: editTitle, content: editContent, tags, status: 'published' });
      }
      setView('list');
      setPage(1);
      loadMyBlogs();
    } catch (err) {
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 删除博客
  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这篇博客？')) return;
    try {
      await blogApi.remove(id);
      loadMyBlogs();
      setView('list');
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  // 博客列表视图
  if (view === 'list') {
    return (
      <div style={container}>
        <div style={header}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={onBack} style={backBtn}>{'< back'}</button>
            <button onClick={() => { setShowMyBlogs(!showMyBlogs); if (!showMyBlogs) loadMyBlogs(); }} style={ghostBtn}>
              {showMyBlogs ? '📋 全部' : '📝 我的'}
            </button>
            {!showMyBlogs && (
              <button onClick={() => setSortBy(s => s === 'latest' ? 'popular' : 'latest')} style={ghostBtn}>
                {sortBy === 'latest' ? '🔥 热度' : '⏱️ 最新'}
              </button>
            )}
          </div>
          <span style={{ fontSize: 18, letterSpacing: '1px', color: '#e8e0d0' }}>📝 BLOG</span>
          {user && <button onClick={openNewEditor} style={plusBtn}>+</button>}
        </div>

        <div style={body}>
          {loading ? (
            <div style={emptyState}>加载中...</div>
          ) : (
            <>
              {/* 我的博客管理 */}
              {showMyBlogs && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: 'rgba(232,224,208,0.3)', marginBottom: 10, letterSpacing: '1px' }}>
                    ── 我的博客 ──
                  </div>
                  {myBlogs.length === 0 ? (
                    <div style={{ ...emptyState, padding: '20px 0', fontSize: 13 }}>
                      还没有博客，点击 + 开始写
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {myBlogs.map((b) => (
                        <div key={b.id} style={miniCard}>
                          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openDetail(b.id)}>
                            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{b.title}</div>
                            <div style={{ fontSize: 11, color: 'rgba(232,224,208,0.3)' }}>
                              {b.status === 'draft' ? '📄 草稿' : '📰 已发布'} · {formatDate(b.created_at)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openEditEditor(b)} style={miniBtn}>编辑</button>
                            <button onClick={() => handleDelete(b.id)} style={{ ...miniBtn, color: '#ef9a9a' }}>删除</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
                </div>
              )}

              {/* 全部已发布博客 */}
              {!showMyBlogs && (
                <>
                  {blogs.length === 0 ? (
                    <div style={emptyState}>还没有博客文章</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {blogs.map((b) => (
                        <div key={b.id} style={card} onClick={() => openDetail(b.id)}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 6, letterSpacing: '0.5px' }}>
                              {b.title}
                            </div>
                            {b.tags && typeof b.tags === 'string' && JSON.parse(b.tags || '[]').length > 0 && (
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                                {JSON.parse(b.tags).map((t) => (
                                  <span key={t} style={tagStyle}>{t}</span>
                                ))}
                              </div>
                            )}
                            <div style={{ fontSize: 14, color: 'rgba(232,224,208,0.45)', lineHeight: 1.6, marginBottom: 8 }}>
                              {b.excerpt || ''}
                            </div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(232,224,208,0.25)' }}>
                              <span>{b.author_name}</span>
                              <span>{formatDate(b.created_at)}</span>
                              <span>❤️ {b.like_count ?? 0}</span>
                              <span>💬 {b.comment_count ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i + 1)}
                          style={{
                            padding: '4px 12px', borderRadius: 6,
                            backgroundColor: page === i + 1 ? 'rgba(232,224,208,0.15)' : 'transparent',
                            border: '1px solid rgba(232,224,208,0.1)',
                            color: '#e8e0d0', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // 博客详情视图
  if (view === 'detail' && currentBlog) {
    return (
      <div style={container}>
        <div style={header}>
          <button onClick={() => setView('list')} style={backBtn}>{'< back'}</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {user && user.id === currentBlog.author_id && (
              <>
                <button onClick={() => openEditEditor(currentBlog)} style={ghostBtn}>编辑</button>
                <button onClick={() => handleDelete(currentBlog.id)} style={{ ...ghostBtn, color: '#ef9a9a' }}>删除</button>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', maxWidth: 800, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {/* 标题 */}
          <h1 style={{ fontSize: 28, fontWeight: 500, margin: '0 0 8px', letterSpacing: '1px' }}>{currentBlog.title}</h1>

          {/* 元信息 */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(232,224,208,0.35)', marginBottom: 8 }}>
            <span>✍️ {currentBlog.author_name}</span>
            <span>📅 {formatDate(currentBlog.created_at)}</span>
          </div>

          {/* 标签 */}
          {currentBlog.tags && (typeof currentBlog.tags === 'string' ? JSON.parse(currentBlog.tags || '[]') : currentBlog.tags).length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
              {(typeof currentBlog.tags === 'string' ? JSON.parse(currentBlog.tags || '[]') : currentBlog.tags).map((t) => (
                <span key={t} style={tagStyle}>{t}</span>
              ))}
            </div>
          )}

          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

          {/* 内容 */}
          <div
            className="markdown-preview"
            style={{ fontSize: 15, color: '#e8e0d0', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(currentBlog.content) }}
          />

          {/* 点赞 */}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
            <LikeButton blogId={currentBlog.id} initialCount={currentBlog.like_count ?? 0} />
          </div>

          {/* 评论 */}
          <div style={{ marginTop: 24 }}>
            <CommentSection blogId={currentBlog.id} />
          </div>
        </div>
      </div>
    );
  }

  // 编辑器视图
  if (view === 'editor') {
    return (
      <div style={container}>
        <div style={header}>
          <button onClick={() => setView('list')} style={backBtn}>{'< back'}</button>
          <span style={{ fontSize: 16, letterSpacing: '1px', color: '#e8e0d0' }}>
            {editId ? '✏️ 编辑博客' : '✏️ 写博客'}
          </span>
          <button onClick={handleSave} disabled={saving} style={saveBtn}>
            {saving ? '保存中...' : '发布'}
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 标题 */}
          <div style={{ padding: '16px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="输入博客标题…"
              style={titleInputStyle}
            />
            <div style={{ padding: '6px 0 12px' }}>
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="标签（逗号分隔）"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: 'rgba(232,224,208,0.4)', fontSize: 13,
                  fontFamily: 'inherit', width: '100%', padding: 0,
                }}
              />
            </div>
          </div>

          {/* 编辑器 */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="使用 Markdown 格式书写…"
              style={editorTextareaStyle}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ padding: '8px 16px', fontSize: 11, color: 'rgba(232,224,208,0.2)', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                PREVIEW
              </div>
              <div
                className="markdown-preview"
                style={{ flex: 1, overflow: 'auto', padding: 16, fontSize: 15, color: '#e8e0d0', lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── 样式 ─── */
const container = {
  position: 'fixed', inset: 0, zIndex: 100,
  display: 'flex', flexDirection: 'column',
  fontFamily: "'Special Elite', 'Courier New', monospace",
  backgroundColor: 'rgba(10, 10, 10, 0.88)',
  backdropFilter: 'blur(14px)', color: '#e8e0d0',
};

const header = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  flexShrink: 0,
};

const backBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.45)', cursor: 'pointer', fontSize: 14,
  fontFamily: 'inherit', letterSpacing: '1px', padding: 0,
};

const ghostBtn = {
  background: 'none', border: '1px solid rgba(232,224,208,0.15)',
  color: 'rgba(232,224,208,0.5)', cursor: 'pointer', fontSize: 12,
  fontFamily: 'inherit', padding: '4px 12px', borderRadius: 6,
  letterSpacing: '0.5px',
};

const saveBtn = {
  padding: '6px 18px',
  backgroundColor: 'rgba(232,224,208,0.85)',
  color: '#1a1a1a', border: 'none', borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
  letterSpacing: '1px',
};

const plusBtn = {
  width: 32, height: 32, borderRadius: '50%',
  border: '1.5px solid rgba(232,224,208,0.35)',
  backgroundColor: 'rgba(255,255,255,0.05)',
  color: '#e8e0d0', cursor: 'pointer', fontSize: 18,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', lineHeight: 1,
};

const body = {
  flex: 1, overflow: 'auto', padding: 24,
  maxWidth: 720, width: '100%', margin: '0 auto', boxSizing: 'border-box',
};

const emptyState = {
  textAlign: 'center', padding: '80px 0',
  color: 'rgba(232,224,208,0.25)', fontSize: 14,
  letterSpacing: '1px', lineHeight: 1.8,
};

const card = {
  backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14,
  padding: 18, border: '1px solid rgba(255,255,255,0.05)',
  cursor: 'pointer', transition: 'background 0.15s',
};

const miniCard = {
  backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10,
  padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)',
  display: 'flex', alignItems: 'center', gap: 12,
};

const miniBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.4)', cursor: 'pointer',
  fontSize: 11, fontFamily: 'inherit', padding: '2px 6px',
};

const tagStyle = {
  fontSize: 11, padding: '2px 10px', borderRadius: 12,
  backgroundColor: 'rgba(232,224,208,0.07)',
  color: 'rgba(232,224,208,0.5)', letterSpacing: '0.5px',
};

const titleInputStyle = {
  width: '100%', padding: '10px 0', boxSizing: 'border-box',
  backgroundColor: 'transparent', border: 'none', outline: 'none',
  color: '#e8e0d0', fontSize: 22, fontFamily: 'inherit',
  fontWeight: 500, letterSpacing: '0.5px',
};

const editorTextareaStyle = {
  flex: 1, width: '100%', padding: 16, boxSizing: 'border-box',
  backgroundColor: 'transparent', border: 'none', outline: 'none',
  color: '#e8e0d0', fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Consolas', monospace",
  lineHeight: 1.7, resize: 'none', tabSize: 2,
};
