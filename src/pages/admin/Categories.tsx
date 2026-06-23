import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../components/ToastContext';
import { useRealtimeSync } from '../../lib/realtime';
import { Modal } from '../../components/Modal';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Upload } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const AdminCategories = () => {
  const { admin } = useOutletContext<any>();
  const toast = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', type: 'Singular', emoji: '' });
  const [saving, setSaving] = useState(false);
  const fetchIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token;

  const fetchCategories = useCallback(async (silent = false) => {
    const requestId = ++fetchIdRef.current;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`${API}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      if (res.ok && requestId === fetchIdRef.current) {
        setCategories(await res.json());
      }
    } catch {
      if (!silent && requestId === fetchIdRef.current) {
        toast.error('Failed to load categories');
      }
    } finally {
      if (requestId === fetchIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [toast]);

  const scheduleSilentRefetch = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCategories(true), 300);
  }, [fetchCategories]);

  const patchCategory = useCallback((id: string, patch: Record<string, any>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const upsertNominee = useCallback((categoryId: string, nominee: any) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== categoryId) return c;
      const list = c.nominees || [];
      const exists = list.some((n: any) => n.id === nominee.id);
      return {
        ...c,
        nominees: exists
          ? list.map((n: any) => (n.id === nominee.id ? nominee : n))
          : [...list, nominee],
      };
    }));
  }, []);

  const removeNominee = useCallback((categoryId: string, nomineeId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== categoryId) return c;
      return { ...c, nominees: (c.nominees || []).filter((n: any) => n.id !== nomineeId) };
    }));
  }, []);

  useEffect(() => {
    fetchCategories(false);
    return () => clearTimeout(debounceRef.current);
  }, [fetchCategories]);

  useRealtimeSync('admin-categories', ['nominees', 'categories'], scheduleSilentRefetch);

  if (admin.role !== 'super_admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <p style={{ color: 'var(--color-error-text)', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Super Admin Access Required</p>
      </div>
    );
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    setSaving(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      name: newCat.name.trim(),
      type: newCat.type,
      emoji: newCat.emoji,
      is_active: true,
      nominees: [],
      display_order: categories.length + 1,
    };
    const payload = {
      name: newCat.name.trim(),
      type: newCat.type,
      emoji: newCat.emoji,
      display_order: categories.length + 1,
    };
    setCategories(prev => [...prev, optimistic]);
    setShowCreateModal(false);
    setNewCat({ name: '', type: 'Singular', emoji: '' });

    try {
      const res = await fetch(`${API}/api/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create category');
      const created = await res.json();
      setCategories(prev => prev.map(c => (c.id === tempId ? { ...created, nominees: [] } : c)));
      toast.success('Category created');
    } catch (err: any) {
      setCategories(prev => prev.filter(c => c.id !== tempId));
      toast.error(err.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '22px', color: 'var(--color-text)', margin: 0 }}>
            Categories & Nominees
          </h1>
          {refreshing && (
            <span style={{
              width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
              border: '2px solid var(--color-border)', borderTopColor: 'var(--color-gold)',
              animation: 'spin 0.6s linear infinite',
            }} />
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px', borderRadius: '10px',
            background: 'var(--color-gold)', color: '#000',
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px',
            border: 'none', opacity: loading ? 0.6 : 1,
          }}
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <>
            <CategorySkeleton />
            <CategorySkeleton />
          </>
        ) : (
          <>
            {categories.map(cat => (
              <CategoryRow
                key={cat.id}
                category={cat}
                patchCategory={patchCategory}
                upsertNominee={upsertNominee}
                removeNominee={removeNominee}
                onSilentRefetch={scheduleSilentRefetch}
                toast={toast}
                getToken={getToken}
              />
            ))}
            {categories.length === 0 && (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
              }}>
                No categories created yet. Click &quot;Add Category&quot; to start.
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <Modal
          onClose={() => setShowCreateModal(false)}
          title={
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', color: 'var(--color-text)', margin: 0 }}>
              New Category
            </h2>
          }
        >
          <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <FormField label="Category Name">
              <input
                type="text"
                value={newCat.name}
                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                required
                placeholder="e.g. Best Personality"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Type">
              <select
                value={newCat.type}
                onChange={e => setNewCat({ ...newCat, type: e.target.value })}
                style={inputStyle}
              >
                <option value="Singular">Singular (e.g. Best Artist)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </FormField>
            <FormField label="Emoji (Optional)">
              <input
                type="text"
                value={newCat.emoji}
                onChange={e => setNewCat({ ...newCat, emoji: e.target.value })}
                placeholder="🏆"
                maxLength={2}
                style={inputStyle}
              />
            </FormField>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'var(--color-gold)',
                color: '#000',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '16px',
                border: 'none',
                marginTop: '4px',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        </Modal>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const CategorySkeleton = () => (
  <div style={{
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }}>
    <div className="skeleton-pulse" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="skeleton-pulse" style={{ width: '45%', height: '14px', borderRadius: '6px' }} />
      <div className="skeleton-pulse" style={{ width: '28%', height: '10px', borderRadius: '6px' }} />
    </div>
    <div className="skeleton-pulse" style={{ width: '40px', height: '22px', borderRadius: '11px' }} />
  </div>
);

/* ========== Category Row ========== */
const CategoryRow = ({ category, patchCategory, upsertNominee, removeNominee, onSilentRefetch, toast, getToken }: any) => {
  const [expanded, setExpanded] = useState(false);
  const [editingNominee, setEditingNominee] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [isActive, setIsActive] = useState(category.is_active);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsActive(category.is_active);
  }, [category.is_active]);

  const openNomineeModal = (nominee: any) => {
    setPhotoFile(null);
    setPhotoPreview(nominee.photo_url || null);
    setEditingNominee(nominee);
  };

  const closeNomineeModal = () => {
    setEditingNominee(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleActive = async () => {
    if (toggling) return;
    const nextActive = !isActive;
    setIsActive(nextActive);
    setToggling(true);
    patchCategory(category.id, { is_active: nextActive });

    try {
      const res = await fetch(`${API}/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ is_active: nextActive })
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      patchCategory(category.id, updated);
      toast.success(nextActive ? 'Category enabled' : 'Category disabled');
    } catch {
      setIsActive(!nextActive);
      patchCategory(category.id, { is_active: !nextActive });
      toast.error('Failed to toggle category');
    } finally {
      setToggling(false);
    }
  };

  const deleteNominee = async (id: string) => {
    if (!window.confirm('Delete this nominee?')) return;
    const backup = category.nominees;
    removeNominee(category.id, id);
    try {
      const res = await fetch(`${API}/api/admin/nominees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Nominee deleted');
    } catch (err: any) {
      patchCategory(category.id, { nominees: backup });
      toast.error(err.message || 'Failed to delete');
    }
  };

  const saveNominee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const isEdit = !!editingNominee.id;
    const tempId = isEdit ? editingNominee.id : `temp-nominee-${Date.now()}`;
    const draft = { ...editingNominee };
    const file = photoFile;
    const optimisticNominee = {
      id: tempId,
      name: draft.name,
      subtitle: draft.subtitle || '',
      photo_url: photoPreview || draft.photo_url || '',
      category_id: category.id,
    };

    upsertNominee(category.id, optimisticNominee);
    closeNomineeModal();

    try {
      let photo_url = draft.photo_url || '';

      if (file) {
        const uploadRes = await fetch(`${API}/api/admin/nominees/upload-photo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getToken()}`
          },
          body: JSON.stringify({
            data: await fileToBase64(file),
            mimeType: file.type,
            categoryId: category.id,
          })
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload photo');
        photo_url = uploadData.url;
      }

      const url = isEdit ? `${API}/api/admin/nominees/${draft.id}` : `${API}/api/admin/nominees`;
      const method = isEdit ? 'PATCH' : 'POST';

      const payload: Record<string, string> = {
        name: draft.name,
        subtitle: draft.subtitle || '',
        photo_url,
      };
      if (!isEdit) payload.category_id = category.id;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save');

      const saved = await res.json();
      if (!isEdit) {
        removeNominee(category.id, tempId);
      }
      upsertNominee(category.id, saved);
      toast.success(isEdit ? 'Nominee updated' : 'Nominee added');
    } catch (err: any) {
      if (!isEdit) {
        removeNominee(category.id, tempId);
      }
      onSilentRefetch();
      toast.error(err.message || 'Failed to save nominee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Category Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {category.emoji && <span style={{ fontSize: '18px' }}>{category.emoji}</span>}
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>
              {category.name}
            </span>
            <span style={{
              fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '2px 8px', borderRadius: '4px',
              background: 'rgba(212,175,55,0.1)', color: 'var(--color-gold-dim)',
              fontFamily: 'var(--font-sans)',
            }}>
              {category.type}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              {category.nominees?.length || 0} nominees
            </span>
          </div>

          {/* Active toggle */}
          <div onClick={e => e.stopPropagation()}>
            <button
              onClick={toggleActive}
              disabled={toggling}
              style={{
                width: '40px', height: '22px', borderRadius: '11px',
                background: isActive ? 'var(--color-success)' : 'var(--color-surface-raised)',
                border: 'none', position: 'relative', cursor: toggling ? 'wait' : 'pointer',
                transition: 'background 200ms ease',
                opacity: toggling ? 0.7 : 1,
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#fff',
                position: 'absolute', top: '2px',
                left: isActive ? '20px' : '2px',
                transition: 'left 200ms ease',
              }} />
            </button>
          </div>
        </div>

        {/* Expanded Nominees */}
        {expanded && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-base)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {/* Nominees header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--color-text)' }}>
                Nominees
              </span>
              <button
                onClick={() => openNomineeModal({ name: '', subtitle: '', photo_url: '' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-sans)',
                  color: 'var(--color-gold)', background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add Nominee
              </button>
            </div>

            {/* Nominees grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {category.nominees?.map((n: any) => (
                <div key={n.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  opacity: String(n.id).startsWith('temp-') ? 0.7 : 1,
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden',
                    border: '1px solid var(--color-border)', flexShrink: 0,
                  }}>
                    <img
                      src={n.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.name)}&background=1a1a1a&color=D4AF37`}
                      alt={n.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {n.subtitle || 'No subtitle'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => openNomineeModal(n)} style={{ color: 'var(--color-text-muted)', padding: '4px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteNominee(n.id)} style={{ color: 'var(--color-error-text)', padding: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(!category.nominees || category.nominees.length === 0) && (
                <p style={{ color: 'var(--color-text-faint)', fontSize: '12px', fontFamily: 'var(--font-sans)', padding: '8px 0' }}>
                  No nominees yet. Click "Add Nominee" above.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit/Add Nominee Modal */}
      {editingNominee && (
        <Modal
          onClose={closeNomineeModal}
          title={
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', color: 'var(--color-text)', margin: 0 }}>
              {editingNominee.id ? 'Edit Nominee' : 'Add Nominee'}
            </h2>
          }
        >
          <form onSubmit={saveNominee} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <FormField label="Full Name">
              <input
                type="text"
                value={editingNominee.name || ''}
                onChange={e => setEditingNominee({ ...editingNominee, name: e.target.value })}
                required
                style={inputStyle}
              />
            </FormField>
            <FormField label="Subtitle / Course (Optional)">
              <input
                type="text"
                value={editingNominee.subtitle || ''}
                onChange={e => setEditingNominee({ ...editingNominee, subtitle: e.target.value })}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Photo (Optional)">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {photoPreview && (
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid var(--color-border)', alignSelf: 'center',
                  }}>
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px 14px', borderRadius: '8px',
                    background: 'var(--color-base)', border: '1px dashed var(--color-border)',
                    color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={16} />
                  {photoFile ? 'Change Photo' : photoPreview ? 'Replace Photo' : 'Upload Photo'}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      setEditingNominee({ ...editingNominee, photo_url: '' });
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{
                      fontSize: '12px', color: 'var(--color-error-text)', background: 'none',
                      border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </FormField>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'var(--color-gold)',
                color: '#000',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '16px',
                border: 'none',
                marginTop: '4px',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : editingNominee.id ? 'Save Changes' : 'Create Nominee'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
};

/* ========== Shared Components ========== */
const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-base)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  padding: '12px 14px',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  outline: 'none',
};
