import { useState } from 'react';

const STORAGE_KEY = 'food_reviews';

function loadReviews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function formatNow() {
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* 兼容旧数据 → 新结构 */
function migrate(r) {
  if (r.edits) return r; // 已是最新格式
  const edits = [{
    comment: r.comment || '',
    environment: r.environment || 0,
    taste: r.taste || 0,
    value: r.value || 0,
    date: r.date || formatNow(),
  }];
  return { ...r, tags: r.tags || [], edits };
}

function toImages(r) {
  if (r.images) return r.images;
  if (r.imageData) return [{ data: r.imageData, dishName: '' }];
  return [];
}

/* ─── 子组件 ─── */

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          onClick={() => onChange(i + 1)}
          style={{
            cursor: 'pointer', fontSize: 26,
            color: i < value ? '#ffd700' : 'rgba(255,255,255,0.12)',
            textShadow: i < value ? '0 0 8px rgba(255,215,0,0.35)' : 'none',
            transition: 'color 0.15s',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function TagSelector({ selected, onChange, allTags }) {
  const [input, setInput] = useState('');

  const add = (tag) => {
    const t = tag.trim();
    if (!t || selected.includes(t)) return;
    onChange([...selected, t]);
    setInput('');
  };

  const remove = (tag) => onChange(selected.filter((x) => x !== tag));

  return (
    <div>
      {/* 已选标签 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, minHeight: 30 }}>
        {selected.map((t) => (
          <span key={t} style={tagChip}>
            {t}
            <button onClick={() => remove(t)} style={tagDelBtn}>✕</button>
          </span>
        ))}
      </div>
      {/* 可选已有标签 */}
      {allTags.filter((t) => !selected.includes(t)).length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {allTags.filter((t) => !selected.includes(t)).map((t) => (
            <span key={t} style={tagOption} onClick={() => add(t)}>+ {t}</span>
          ))}
        </div>
      )}
      {/* 新建标签 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }}
          placeholder="新建标签…"
          style={tagInput}
        />
        {input.trim() && (
          <button onClick={() => add(input)} style={tagAddBtn}>添加</button>
        )}
      </div>
    </div>
  );
}

/* ─── 主组件 ─── */
export default function FoodPage({ onBack }) {
  const [reviews, setReviews] = useState(loadReviews().map(migrate));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = 新建
  const [form, setForm] = useState(emptyForm());

  /* 聚合所有已有标签 */
  const allTags = [...new Set(reviews.flatMap((r) => r.tags || []))].sort();

  function emptyForm(editTarget = null) {
    if (editTarget) {
      const last = editTarget.edits[editTarget.edits.length - 1];
      return {
        images: [...(editTarget.images || [])],
        tags: [...(editTarget.tags || [])],
        address: editTarget.address || '',
        environment: last.environment,
        taste: last.taste,
        value: last.value,
        comment: '',
      };
    }
    return {
      images: [],
      tags: [],
      environment: 0,
      taste: 0,
      value: 0,
      comment: '',
      address: '',
    };
  }

  /* 图片 */
  const addImages = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setForm((p) => ({
          ...p,
          images: [...p.images, { data: ev.target.result, dishName: '' }],
        }));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx) =>
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  const updateDishName = (idx, name) =>
    setForm((p) => {
      const imgs = [...p.images];
      imgs[idx] = { ...imgs[idx], dishName: name };
      return { ...p, images: imgs };
    });

  /* 提交 */
  const submit = () => {
    if (!form.comment.trim()) return;

    const now = formatNow();
    const newEdit = {
      comment: form.comment.trim(),
      environment: form.environment,
      taste: form.taste,
      value: form.value,
      date: now,
    };

    let next;
    if (editingId) {
      // 追加编辑
      next = reviews.map((r) => {
        if (r.id !== editingId) return r;
        return {
          ...r,
          images: [...form.images],
          tags: [...form.tags],
          address: form.address,
          edits: [...r.edits, newEdit],
        };
      });
    } else {
      // 新建
      const entry = {
        id: Date.now(),
        images: [...form.images],
        tags: [...form.tags],
        address: form.address,
        edits: [newEdit],
      };
      next = [entry, ...reviews];
    }

    setReviews(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const remove = (id) => {
    const next = reviews.filter((r) => r.id !== id);
    setReviews(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditingId(r.id);
    setForm(emptyForm(r));
    setShowForm(true);
  };

  /* ── 列表页 ── */
  if (!showForm) {
    return (
      <div style={container}>
        <div style={header}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={onBack} style={backBtn}>{'< back'}</button>
            <button onClick={openNew} style={plusBtn}>+</button>
          </div>
          <span style={{ fontSize: 18, letterSpacing: '1px', color: '#e8e0d0' }}>🍰 美食</span>
          <div />
        </div>

        <div style={body}>
          {reviews.length === 0 ? (
            <div style={emptyState}>
              暂无记录<br />点击左上角 + 开始第一篇美食评测
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map((r) => {
                const imgs = toImages(r);
                const last = r.edits[r.edits.length - 1];
                const editCount = r.edits.length;
                return (
                  <div key={r.id} style={card}>
                    {imgs.length > 0 && (
                      <div style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {imgs.map((img, i) => (
                          <div key={i}>
                            <img src={img.data} alt="" style={cardImg} />
                            {img.dishName && (
                              <div style={{ fontSize: 11, color: 'rgba(232,224,208,0.4)', marginTop: 4, textAlign: 'center' }}>
                                {img.dishName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* 标签 */}
                      {r.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                          {r.tags.map((t) => (
                            <span key={t} style={cardTag}>{t}</span>
                          ))}
                        </div>
                      )}
                      {/* 评分 */}
                      <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
                        <span style={badge}>环境 {last.environment}/10</span>
                        <span style={badge}>口味 {last.taste}/10</span>
                        <span style={badge}>性价比 {last.value}/10</span>
                      </div>
                      {/* 评价 */}
                      <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {last.comment}
                      </div>
                      {r.address && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(232,224,208,0.35)' }}>
                          📍 {r.address}
                        </div>
                      )}
                      {/* 编辑历史 + 操作 */}
                      <div style={cardFooter}>
                        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span>{last.date}</span>
                          {editCount > 1 && (
                            <span style={{ fontSize: 11, color: 'rgba(232,224,208,0.25)' }}>
                              (已编辑 {editCount} 次)
                            </span>
                          )}
                        </span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button onClick={() => openEdit(r)} style={editBtn}>编辑</button>
                          <button onClick={() => remove(r.id)} style={delBtn}>删除</button>
                        </div>
                      </div>
                      {/* 展开历史 */}
                      {editCount > 1 && (
                        <details style={{ marginTop: 6 }}>
                          <summary style={historySummary}>查看历史版本</summary>
                          {r.edits.slice(0, -1).reverse().map((e, i) => (
                            <div key={i} style={historyItem}>
                              <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                                <span style={badge}>环境 {e.environment}/10</span>
                                <span style={badge}>口味 {e.taste}/10</span>
                                <span style={badge}>性价比 {e.value}/10</span>
                                <span style={{ color: 'rgba(232,224,208,0.3)', marginLeft: 'auto' }}>{e.date}</span>
                              </div>
                              <div style={{ fontSize: 13, marginTop: 4, color: 'rgba(232,224,208,0.6)' }}>
                                {e.comment}
                              </div>
                            </div>
                          ))}
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── 新建 / 编辑表单 ── */
  return (
    <div style={container}>
      <div style={header}>
        <button onClick={() => { setShowForm(false); setEditingId(null); }} style={backBtn}>
          {'< back'}
        </button>
        <span style={{ fontSize: 18, letterSpacing: '1px', color: '#e8e0d0' }}>
          {editingId ? '追加评测' : '新的评测'}
        </span>
        <div />
      </div>

      <div style={{ ...body, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── 第一行：Tag 选择 ── */}
        <div>
          <div style={LABEL_STYLE}>标签</div>
          <TagSelector
            selected={form.tags}
            onChange={(tags) => setForm((p) => ({ ...p, tags }))}
            allTags={allTags}
          />
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* ── 左侧：多图上传 ── */}
          <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {form.images.map((img, i) => (
              <div key={i} style={imgCard}>
                <div style={imgCardHeader}>
                  <span style={{ fontSize: 12, color: 'rgba(232,224,208,0.3)' }}>#{i + 1}</span>
                  <button onClick={() => removeImage(i)} style={imgDelBtn}>✕</button>
                </div>
                <img src={img.data} alt="" style={imgPreview} />
                <input
                  value={img.dishName}
                  onChange={(e) => updateDishName(i, e.target.value)}
                  placeholder="输入菜品名称…"
                  style={dishInput}
                />
              </div>
            ))}
            <label style={addImgBtn}>
              <span>+ 添加图片</span>
              <input type="file" accept="image/*" multiple onChange={addImages} style={{ display: 'none' }} />
            </label>
          </div>

          {/* ── 右侧：评分 + 信息 ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={LABEL_STYLE}>环境（追加）</div>
              <StarRating value={form.environment} onChange={(v) => setForm((p) => ({ ...p, environment: v }))} />
            </div>
            <div>
              <div style={LABEL_STYLE}>口味（追加）</div>
              <StarRating value={form.taste} onChange={(v) => setForm((p) => ({ ...p, taste: v }))} />
            </div>
            <div>
              <div style={LABEL_STYLE}>性价比（追加）</div>
              <StarRating value={form.value} onChange={(v) => setForm((p) => ({ ...p, value: v }))} />
            </div>
            <div>
              <div style={LABEL_STYLE}>地址</div>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="输入餐厅地址…"
                style={inputStyle}
              />
            </div>
            <div>
              <div style={LABEL_STYLE}>评价（追加）</div>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                placeholder={editingId ? '追加新的评价内容…' : '写下你的美食体验…'}
                style={{ ...inputStyle, height: 160, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
            <button onClick={submit} style={submitBtn}>
              {editingId ? '追加发布' : '发布'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 样式常量 ── */
const LABEL_STYLE = {
  marginBottom: 8,
  color: 'rgba(232,224,208,0.55)',
  fontSize: '13px',
  letterSpacing: '1px',
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#e8e0d0',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
};

const container = {
  position: 'fixed', inset: 0, zIndex: 100,
  display: 'flex', flexDirection: 'column',
  fontFamily: "'Special Elite', 'Courier New', monospace",
  backgroundColor: 'rgba(10, 10, 10, 0.88)',
  backdropFilter: 'blur(14px)',
  color: '#e8e0d0',
};

const header = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 24px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const backBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.45)',
  cursor: 'pointer', fontSize: 14,
  fontFamily: 'inherit', letterSpacing: '1px', padding: 0,
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
  maxWidth: 960, width: '100%', margin: '0 auto',
  boxSizing: 'border-box',
};

const emptyState = {
  textAlign: 'center', padding: '80px 0',
  color: 'rgba(232,224,208,0.25)', fontSize: 14,
  letterSpacing: '1px', lineHeight: 1.8,
};

const card = {
  display: 'flex', gap: 18,
  backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14,
  padding: 18, border: '1px solid rgba(255,255,255,0.05)',
};

const cardImg = { width: 140, height: 100, borderRadius: 8, objectFit: 'cover' };

const badge = {
  fontSize: 12, padding: '2px 10px', borderRadius: 6,
  backgroundColor: 'rgba(255,215,0,0.1)', color: '#ffd700',
};

const cardFooter = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginTop: 10, fontSize: 11, color: 'rgba(232,224,208,0.2)',
};

const delBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.2)',
  cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', padding: 0,
};

const editBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.35)',
  cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', padding: 0,
};

const submitBtn = {
  padding: '12px 0',
  backgroundColor: 'rgba(232,224,208,0.85)',
  color: '#1a1a1a', border: 'none', borderRadius: 10,
  fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '2px',
};

/* ── 图片相关 ── */
const imgCard = {
  backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
};
const imgCardHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '6px 10px',
};
const imgDelBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.25)',
  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0, lineHeight: 1,
};
const imgPreview = {
  width: '100%', height: 180, objectFit: 'cover', display: 'block',
};
const dishInput = {
  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.04)', border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  color: '#e8e0d0', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', textAlign: 'center', letterSpacing: '0.5px',
};
const addImgBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '14px 0',
  border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 12,
  cursor: 'pointer', color: 'rgba(232,224,208,0.4)',
  fontSize: 14, fontFamily: 'inherit', letterSpacing: '1px',
};

/* ── Tag 相关 ── */
const tagChip = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '4px 10px', borderRadius: 20,
  backgroundColor: 'rgba(232,224,208,0.1)',
  color: '#e8e0d0', fontSize: 12, letterSpacing: '0.5px',
};
const tagDelBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.3)',
  cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1,
  fontFamily: 'inherit',
};
const tagOption = {
  cursor: 'pointer', fontSize: 12, color: 'rgba(232,224,208,0.35)',
  padding: '2px 8px', borderRadius: 12,
  border: '1px solid rgba(232,224,208,0.1)',
  letterSpacing: '0.5px',
};
const tagInput = {
  flex: 1, padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  color: '#e8e0d0', fontSize: 13, fontFamily: 'inherit',
  outline: 'none',
};
const tagAddBtn = {
  padding: '8px 14px',
  backgroundColor: 'rgba(232,224,208,0.15)',
  border: 'none', borderRadius: 8,
  color: '#e8e0d0', cursor: 'pointer', fontSize: 13,
  fontFamily: 'inherit', whiteSpace: 'nowrap',
};

/* ── 卡片内的标签 ── */
const cardTag = {
  fontSize: 11, padding: '2px 10px', borderRadius: 12,
  backgroundColor: 'rgba(232,224,208,0.07)',
  color: 'rgba(232,224,208,0.5)', letterSpacing: '0.5px',
};

const historySummary = {
  cursor: 'pointer', fontSize: 12, color: 'rgba(232,224,208,0.25)',
  marginTop: 4, letterSpacing: '0.5px',
};

const historyItem = {
  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
};
