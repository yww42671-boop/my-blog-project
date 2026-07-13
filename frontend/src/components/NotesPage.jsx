import { useState, useMemo } from 'react';

const STORAGE_KEY = 'notes_posts';

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function formatNow() {
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ─── 简易 Markdown → HTML 渲染器 ─── */
function renderMarkdown(text) {
  if (!text) return '';

  let html = text
    // 下划线 <u>text</u>（必须在 HTML 转义之前处理）
    .replace(/<u>([\s\S]*?)<\/u>/g, '<u style="text-decoration:underline;text-decoration-color:rgba(232,224,208,0.5);">$1</u>')

    // 转义 HTML 特殊字符
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // 图片 ![alt](url)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0;" />')

    // 链接 [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#64b5f6;text-decoration:underline;">$1</a>')

    // 行内代码 `code`
    .replace(/`([^`]+)`/g, '<code style="background:rgba(232,224,208,0.08);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>')

    // 加粗 **text** 或 __text__
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')

    // 斜体 *text* 或 _text_
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/(?<![*\w])_([^_]+)_(?![*\w])/g, '<em>$1</em>')

    // 高亮 ==text==
    .replace(/==([^=]+)==/g, '<mark style="background:rgba(255,235,100,0.25);color:inherit;padding:0 4px;border-radius:4px;">$1</mark>')

    // 删除线 ~~text~~
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')

    // 引用块 > text
    .replace(/^&gt;\s+(.*)$/gm, '<blockquote style="border-left:3px solid rgba(232,224,208,0.2);margin:8px 0;padding:6px 14px;color:rgba(232,224,208,0.55);">$1</blockquote>')

    // 分隔线 --- 或 ***
    .replace(/^---\s*$/gm, '<hr style="border:none;border-top:1px solid rgba(232,224,208,0.08);margin:20px 0;" />')
    .replace(/^\*\*\*\s*$/gm, '<hr style="border:none;border-top:1px solid rgba(232,224,208,0.08);margin:20px 0;" />')

    // 标题 (#### 到 #)
    .replace(/^######\s+(.*)$/gm, '<h6 style="font-size:14px;margin:14px 0 6px;font-weight:500;">$1</h6>')
    .replace(/^#####\s+(.*)$/gm, '<h5 style="font-size:15px;margin:14px 0 6px;font-weight:500;">$1</h5>')
    .replace(/^####\s+(.*)$/gm, '<h4 style="font-size:17px;margin:16px 0 8px;font-weight:500;">$1</h4>')
    .replace(/^###\s+(.*)$/gm, '<h3 style="font-size:20px;margin:18px 0 8px;font-weight:500;">$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2 style="font-size:24px;margin:20px 0 10px;font-weight:500;letter-spacing:1px;">$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1 style="font-size:28px;margin:24px 0 12px;font-weight:500;letter-spacing:1px;">$1</h1>')

    // 无序列表 - 或 *
    .replace(/^[\*\-]\s+(.*)$/gm, '<li style="margin:2px 0 2px 20px;list-style-type:disc;">$1</li>')
    // 有序列表 1. 2.
    .replace(/^\d+\.\s+(.*)$/gm, '<li style="margin:2px 0 2px 20px;list-style-type:decimal;">$1</li>')

    // 代码块 ```lang ... ```
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
      `<pre style="background:rgba(0,0,0,0.3);border-radius:8px;padding:16px;overflow-x:auto;margin:12px 0;border:1px solid rgba(255,255,255,0.06);"><code style="font-size:13px;line-height:1.6;color:#a8d8ea;">${code.trim()}</code></pre>`
    )

    // 换行
    .replace(/\n\s*\n/g, '</p><p style="margin:12px 0;line-height:1.8;">')
    .replace(/\n/g, '<br />');

  html = '<p style="margin:0;line-height:1.8;">' + html + '</p>';

  return html;
}

/* ─── 主组件 ─── */
export default function NotesPage({ onBack }) {
  const [notes, setNotes] = useState(loadNotes);
  const [editing, setEditing] = useState(null); // null=列表, 'new'=新建, id=编辑
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(true);

  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags || []))].sort(), [notes]);

  function resetForm() {
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setEditing(null);
  }

  function openNew() {
    resetForm();
    setEditing('new');
  }

  function openEdit(note) {
    setTitle(note.title);
    setContent(note.content);
    setTags([...(note.tags || [])]);
    setEditing(note.id);
  }

  function save() {
    if (!title.trim()) return;
    const now = formatNow();
    let next;
    if (editing === 'new') {
      const entry = { id: Date.now(), title: title.trim(), content, tags, date: now };
      next = [entry, ...notes];
    } else {
      next = notes.map((n) =>
        n.id === editing ? { ...n, title: title.trim(), content, tags, date: now } : n
      );
    }
    setNotes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    resetForm();
  }

  function remove(id) {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addTag(tag) {
    const t = tag.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput('');
  }

  function removeTag(tag) {
    setTags(tags.filter((t) => t !== tag));
  }

  /* 生成纯文本摘要（用于列表卡片） */
  function excerpt(text, maxLen = 120) {
    const plain = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
      .replace(/[#*`>_~=-]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain;
  }

  /* ── 编辑器视图 ── */
  if (editing) {
    return (
      <div style={container}>
        {/* ── 顶栏 ── */}
        <div style={header}>
          <button onClick={resetForm} style={backBtn}>{'< back'}</button>
          <span style={{ fontSize: 16, letterSpacing: '1px', color: '#e8e0d0' }}>
            {editing === 'new' ? '✏️ 新笔记' : '✏️ 编辑'}
          </span>
          <button onClick={save} style={saveBtn}>保存</button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* ── 标题 ── */}
          <div style={{ padding: '16px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入标题…"
              style={{
                width: '100%', padding: '10px 0', boxSizing: 'border-box',
                backgroundColor: 'transparent', border: 'none', outline: 'none',
                color: '#e8e0d0', fontSize: 22, fontFamily: 'inherit',
                fontWeight: 500, letterSpacing: '0.5px',
              }}
            />
            {/* 标签 */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 0 12px' }}>
              {tags.map((t) => (
                <span key={t} style={tagChip}>
                  {t}
                  <button onClick={() => removeTag(t)} style={tagDelBtn}>✕</button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                placeholder="标签…"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: 'rgba(232,224,208,0.4)', fontSize: 13,
                  fontFamily: 'inherit', width: 80, padding: 0,
                }}
              />
            </div>
          </div>

          {/* ── 编辑区：左编辑 右预览 ── */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* 编辑区 */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              borderRight: preview ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                padding: '8px 16px', fontSize: 11, color: 'rgba(232,224,208,0.2)',
                letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                MARKDOWN
                <button
                  onClick={() => setPreview(!preview)}
                  style={{
                    marginLeft: 12, background: 'none', border: 'none',
                    color: preview ? 'rgba(232,224,208,0.4)' : 'rgba(232,224,208,0.2)',
                    cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                    padding: 0, textDecoration: preview ? 'underline' : 'none',
                  }}
                >
                  {preview ? '预览开' : '预览关'}
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="使用 Markdown 格式书写…&#10;&#10;# 标题&#10;## 二级标题&#10;**加粗** *斜体* &#96;代码&#96;&#10;- 列表项&#10;1. 有序列表&#10;> 引用&#10;==高亮== &lt;u&gt;下划线&lt;/u&gt;&#10;&#96;&#96;&#96;&#10;代码块&#10;&#96;&#96;&#96;&#10;[链接](url) ![图片](url)"
                style={{
                  flex: 1, width: '100%', padding: 16, boxSizing: 'border-box',
                  backgroundColor: 'transparent', border: 'none', outline: 'none',
                  color: '#e8e0d0', fontSize: 14, fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                  lineHeight: 1.7, resize: 'none', tabSize: 2,
                }}
              />
            </div>

            {/* 预览区 */}
            {preview && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                <div style={{
                  padding: '8px 16px', fontSize: 11, color: 'rgba(232,224,208,0.2)',
                  letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  PREVIEW
                </div>
                <div
                  className="markdown-preview"
                  style={{
                    flex: 1, overflow: 'auto', padding: 16,
                    fontSize: 15, color: '#e8e0d0', lineHeight: 1.8,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── 列表视图 ── */
  return (
    <div style={container}>
      <div style={header}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={onBack} style={backBtn}>{'< back'}</button>
          <button onClick={openNew} style={plusBtn}>+</button>
        </div>
        <span style={{ fontSize: 18, letterSpacing: '1px', color: '#e8e0d0' }}>📓 NOTES</span>
        <div />
      </div>

      <div style={body}>
        {notes.length === 0 ? (
          <div style={emptyState}>
            暂无笔记<br />点击左上角 + 开始写第一篇博客
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {notes.map((n) => (
              <div key={n.id} style={card} onClick={() => openEdit(n)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 标题 */}
                  <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 6, letterSpacing: '0.5px' }}>
                    {n.title}
                  </div>
                  {/* 标签 */}
                  {n.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                      {n.tags.map((t) => (
                        <span key={t} style={cardTag}>{t}</span>
                      ))}
                    </div>
                  )}
                  {/* 摘要 */}
                  <div style={{ fontSize: 14, color: 'rgba(232,224,208,0.45)', lineHeight: 1.6, marginBottom: 8 }}>
                    {excerpt(n.content)}
                  </div>
                  {/* 底部 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 11, color: 'rgba(232,224,208,0.2)',
                  }}>
                    <span>{n.date}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      style={{
                        background: 'none', border: 'none',
                        color: 'rgba(232,224,208,0.2)', cursor: 'pointer',
                        fontSize: 11, fontFamily: 'inherit', padding: 0,
                      }}
                    >删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 样式 ── */
const LABEL_STYLE = {
  marginBottom: 8, color: 'rgba(232,224,208,0.55)', fontSize: '13px', letterSpacing: '1px',
};

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

const cardTag = {
  fontSize: 11, padding: '2px 10px', borderRadius: 12,
  backgroundColor: 'rgba(232,224,208,0.07)',
  color: 'rgba(232,224,208,0.5)', letterSpacing: '0.5px',
};

const tagChip = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 8px', borderRadius: 4,
  backgroundColor: 'rgba(232,224,208,0.08)',
  color: 'rgba(232,224,208,0.5)', fontSize: 12,
};

const tagDelBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.25)', cursor: 'pointer',
  fontSize: 10, padding: 0, lineHeight: 1, fontFamily: 'inherit',
};
