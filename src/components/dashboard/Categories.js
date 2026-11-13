'use client';

// Category management: the company's own catalog categories — name, how the designer uses their products,
// the attributes their products carry, and the order of the catalog tabs — and the parent categories they are
// filed under (parent category → category → products), which group the proposal's bill of materials.
import { ArrowDown, ArrowUp, Boxes, Eye, FolderPlus, FolderTree, Package, PanelsTopLeft, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { categorySchema, parentCategorySchema, useValidation } from '@/lib/validation';
import { api } from '@/lib/api';
import { useResource } from '@/lib/useResource';
import { useCatalogCan } from '@/lib/useCan';
import { Alert, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, FormField, FormModal, IconButton, Input, LoadingBlock, Modal, PageHeader, Select, Table, Td, Th, Tr, buttonClass, cx, toast, RowMenu } from '../kit';
import { PRODUCT_TYPES, typeOf } from './CatalogProducts';
import { ATTRIBUTE_TYPES, MAX_ATTRIBUTES, sortedDefs } from './attributes';

let seq = 0;
const USE = {
  general: { label: 'Not used', tone: 'slate', icon: Package },
  panels: { label: 'Solar panels', tone: 'brand', icon: PanelsTopLeft },
  poles: { label: 'Poles', tone: 'violet', icon: Boxes },
};

export function CategoryIconMark({ category, className = 'h-9 w-9' }) {
  const use = USE[typeOf(category)];
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-lg bg-brand-soft text-brand', className)}>
      <use.icon className="h-[18px] w-[18px]" />
    </span>
  );
}


function ParentForm({ parent, onClose, onSaved }) {
  const editing = Boolean(parent?.id);
  const [form, setForm] = useState({ name: parent?.name || '', description: parent?.description || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const v = useValidation(parentCategorySchema, form);
  const submit = async () => {
    const body = v.validate();
    if (!body) return;
    setBusy(true);
    setError('');
    try {
      onSaved(editing ? await api(`/api/parent-categories/${parent.id}`, { method: 'PUT', body }) : await api('/api/parent-categories', { method: 'POST', body }));
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <FormModal open onClose={onClose} title={editing ? 'Edit parent category' : 'New parent category'} description="A heading for several categories — Structures, Electricals… The bill of materials on the proposal is printed under these headings." submitLabel={editing ? 'Save changes' : 'Create parent category'} busy={busy} error={error} onSubmit={submit} noValidate>
      <FormField label="Parent category name" error={v.error('name')}><Input maxLength={60} value={form.name} onValue={(x) => setForm({ ...form, name: x.replace(/^\s+/, '').replace(/^./, (c) => c.toUpperCase()) })} placeholder="e.g. Electricals" /></FormField>
      <FormField label="Description" optional error={v.error('description')}><Input maxLength={300} value={form.description} onValue={(x) => setForm({ ...form, description: x })} /></FormField>
    </FormModal>
  );
}

const DESIGNER_TYPES = new Set(['panels', 'poles']);

const attrTypeLabel = (id) => ATTRIBUTE_TYPES.find((t) => t.id === id)?.label || id;

function CategoryDetails({ category, parents, catalogPath, canEdit, canDelete, onClose, onEdit, onDelete }) {
  const attrs = sortedDefs(category);
  const parent = category.parent ? parents.find((p) => p.id === category.parent) : null;
  const designer = DESIGNER_TYPES.has(typeOf(category));
  return (
    <Modal
      open
      onClose={onClose}
      title="Category details"
      size="md"
      footer={(
        <>
          {/* <Button variant="ghost" onClick={onClose}>Close</Button> */}
          <Link href={`${catalogPath}?category=${category.id}`} className={buttonClass()}>View products</Link>
          {canEdit && <Button icon={Pencil} onClick={onEdit}>Edit category</Button>}
          {canDelete && !designer && <Button variant="danger" icon={Trash2} onClick={onDelete}>Delete</Button>}
        </>
      )}
    >
      <div className="flex items-start gap-4">
        <CategoryIconMark category={category} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-slate-900">{category.name}</p>
          {category.description ? <p className="mt-1 text-sm text-slate-600">{category.description}</p> : <p className="mt-1 text-sm text-slate-400">No description</p>}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-slate-500">Parent category</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{parent?.name || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Products</dt>
          <dd className="mt-0.5 tabular-nums font-medium text-slate-900">{category.products ?? 0}</dd>
        </div>
        {designer && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500">Solar designer</dt>
            <dd className="mt-1"><Badge tone={USE[typeOf(category)].tone}>{USE[typeOf(category)].label}</Badge><span className="ml-2 text-xs text-slate-500">Required category — used in structure design</span></dd>
          </div>
        )}
      </dl>

      <h3 className="mt-6 mb-2 text-[13px] font-semibold tracking-wide text-slate-500 uppercase">Attributes</h3>
      <p className="mb-3 text-xs text-slate-500">Fields every product in this category can carry. Edit the category to add or change them.</p>
      {attrs.length ? (
        <Table>
          <thead><tr><Th>Name</Th><Th>Type</Th><Th>Required</Th><Th>Choices</Th></tr></thead>
          <tbody>
            {attrs.map((a) => (
              <Tr key={a.key}>
                <Td className="font-medium text-slate-900">{a.label}</Td>
                <Td className="text-slate-600">{attrTypeLabel(a.dataType)}</Td>
                <Td>{a.isRequired ? <Badge tone="blue">Yes</Badge> : <span className="text-slate-400">No</span>}</Td>
                <Td className="max-w-[200px] truncate text-slate-600" title={(a.options || []).join(', ')}>{a.dataType === 'select' && a.options?.length ? a.options.join(', ') : '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">No attributes yet — optional specs like capacity or phase.</p>
      )}
    </Modal>
  );
}

function CategoryForm({ category, parents, onClose, onSaved }) {
  const editing = Boolean(category?.id);
  const [form, setForm] = useState({ name: category?.name || '', description: category?.description || '', parent: category?.parent || '' });
  // `key` is kept for existing attributes, so renaming a label never orphans the values products already store
  const [attrs, setAttrs] = useState(() => sortedDefs(category).map((a) => ({ ...a, id: ++seq, optionsText: (a.options || []).join(', ') })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const patchAttr = (id, p) => setAttrs((list) => list.map((a) => (a.id === id ? { ...a, ...p } : a)));
  const moveAttr = (i, by) => setAttrs((list) => {
    const next = [...list];
    next.splice(i + by, 0, next.splice(i, 1)[0]);
    return next;
  });

  const attributes = attrs.filter((a) => a.label.trim()).map((a, i) => ({
    ...(a.key ? { key: a.key } : {}),
    label: a.label.trim(),
    dataType: a.dataType,
    isRequired: Boolean(a.isRequired),
    options: a.dataType === 'select' ? [...new Set(a.optionsText.split(',').map((o) => o.trim()).filter(Boolean))] : [],
    sortOrder: i + 1,
  }));
  const categoryType = editing ? typeOf(category) : 'general';
  const v = useValidation(categorySchema, { ...form, type: categoryType, attributes });
  const submit = async () => {
    const body = v.validate();
    if (!body) return;
    setBusy(true);
    setError('');
    try {
      const saved = editing ? await api(`/api/categories/${category.id}`, { method: 'PUT', body }) : await api('/api/categories', { method: 'POST', body });
      onSaved({ products: category?.products || 0, ...saved });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <FormModal open onClose={onClose} title={editing ? 'Edit category' : 'New category'} description="Group what you sell your way — panels, poles, inverters, wire, earthing, ACDB, DCDB…" submitLabel={editing ? 'Save changes' : 'Create category'} busy={busy} error={error} onSubmit={submit} size="lg" noValidate>
      <FormField label="Category name" error={v.error('name')}><Input maxLength={60} value={form.name} onValue={(x) => setForm({ ...form, name: x.replace(/^\s+/, '').replace(/^./, (c) => c.toUpperCase()) })} placeholder="e.g. Inverters" /></FormField>
      <FormField label="Description" optional error={v.error('description')}><Input maxLength={300} value={form.description} onValue={(x) => setForm({ ...form, description: x })} /></FormField>
      <FormField label="Parent category" optional hint={parents.length ? 'The heading this category is printed under in the bill of materials.' : 'Create a parent category first (Structures, Electricals…) to group your categories.'}>
        <Select value={form.parent} onValue={(x) => setForm({ ...form, parent: x })} disabled={!parents.length}>
          <option value="">No parent category</option>
          {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </FormField>

      <fieldset>
        <legend className="mb-1.5 flex w-full items-baseline justify-between text-[13px] font-medium text-slate-700">Attributes <span className="text-xs font-normal text-slate-400">Optional</span></legend>
        <p className="mb-2.5 text-xs text-slate-500">What every product here is described by — wattage, capacity, phase… Each product form asks for these. Products keep their values when you change this list; a new required attribute is asked for the next time a product is saved.</p>
        {attrs.length > 0 && (
          <div className="mb-2.5 space-y-2">
            {attrs.map((a, i) => (
              <div key={a.id} className="rounded-lg border border-slate-200 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Input aria-label="Attribute name" maxLength={60} value={a.label} onValue={(x) => patchAttr(a.id, { label: x })} placeholder="e.g. Capacity (kW)" className="w-48 min-w-0 flex-1" />
                  <Select aria-label="Type" value={a.dataType} onValue={(x) => patchAttr(a.id, { dataType: x })} className="w-36">
                    {ATTRIBUTE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </Select>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={Boolean(a.isRequired)} onChange={(e) => patchAttr(a.id, { isRequired: e.target.checked })} /> Required</label>
                  <IconButton icon={ArrowUp} label="Move up" disabled={i === 0} className="disabled:opacity-30" onClick={() => moveAttr(i, -1)} />
                  <IconButton icon={ArrowDown} label="Move down" disabled={i === attrs.length - 1} className="disabled:opacity-30" onClick={() => moveAttr(i, 1)} />
                  <IconButton icon={X} label="Remove attribute" tone="danger" onClick={() => setAttrs(attrs.filter((x) => x.id !== a.id))} />
                </div>
                {a.dataType === 'select' && (
                  <Input aria-label={`Choices for ${a.label || 'attribute'}`} className="mt-2" value={a.optionsText} onValue={(x) => patchAttr(a.id, { optionsText: x })} placeholder="Choices, separated by commas — e.g. Single phase, Three phase" />
                )}
                {(v.error(`attributes.${i}.label`) || v.error(`attributes.${i}.options`)) && <p className="mt-1.5 text-xs text-red-600">{v.error(`attributes.${i}.label`) || v.error(`attributes.${i}.options`)}</p>}
              </div>
            ))}
          </div>
        )}
        {v.error('attributes') && <p className="mb-2 text-xs text-red-600">{v.error('attributes')}</p>}
        <Button size="sm" icon={Plus} disabled={attrs.length >= MAX_ATTRIBUTES} onClick={() => setAttrs([...attrs, { id: ++seq, key: '', label: '', dataType: 'text', isRequired: false, optionsText: '' }])}>Add attribute</Button>
      </fieldset>
    </FormModal>
  );
}

export default function Categories({ catalogPath = '/dashboard/catalog' }) {
  const may = useCatalogCan();
  const canCreate = may('inventory', 'create');
  const canEdit = may('inventory', 'update');
  const canDelete = may('inventory', 'delete');
  const { data, setData, loading, error } = useResource('/api/categories');
  const parentsResource = useResource('/api/parent-categories');
  const parents = parentsResource.data || [];
  const parentName = new Map(parents.map((p) => [p.id, p.name]));
  const childrenOf = (id) => (data || []).filter((c) => c.parent === id);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState('');

  const close = () => { setModal(null); setModalError(''); };
  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/categories/${modal.item.id}`, { method: 'DELETE' });
      setData((list) => list.filter((x) => x.id !== modal.item.id));
      toast.success('Category deleted');
      close();
    } catch (e) {
      setModalError(e.message);
    }
    setBusy(false);
  };
  /** The categories under it stay, with their products; they only lose the heading. */
  const removeParent = async () => {
    setBusy(true);
    try {
      await api(`/api/parent-categories/${modal.item.id}`, { method: 'DELETE' });
      parentsResource.setData((list) => list.filter((x) => x.id !== modal.item.id));
      setData((list) => list.map((c) => (c.parent === modal.item.id ? { ...c, parent: null } : c)));
      toast.success('Parent category deleted');
      close();
    } catch (e) {
      setModalError(e.message);
    }
    setBusy(false);
  };
  const moveParent = async (i, by) => {
    const before = parents;
    const next = [...parents];
    next.splice(i + by, 0, next.splice(i, 1)[0]);
    parentsResource.setData(next);
    try {
      await api('/api/parent-categories/reorder', { method: 'POST', body: { ids: next.map((p) => p.id) } });
    } catch (e) {
      parentsResource.setData(before);
      toast.error(e.message);
    }
  };
  /** Move right away, save in the background; put it back if saving fails. */
  const move = async (i, by) => {
    const before = data;
    const next = [...data];
    next.splice(i + by, 0, next.splice(i, 1)[0]);
    setData(next);
    try {
      await api('/api/categories/reorder', { method: 'POST', body: { ids: next.map((c) => c.id) } });
    } catch (e) {
      setData(before);
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="Catalog categories" description="Group what you sell your way. The order here is the order of the tabs in your product catalog.">
        <Link href={catalogPath} className={buttonClass()}>Open catalog</Link>
        {canCreate && <Button icon={FolderTree} onClick={() => setModal({ type: 'parent' })}>New parent category</Button>}
        {canCreate && <Button variant="primary" icon={Plus} onClick={() => setModal({ type: 'form' })}>New category</Button>}
      </PageHeader>
      {error && <Alert className="mb-6">{error}</Alert>}
      {parentsResource.error && <Alert className="mb-6">{parentsResource.error}</Alert>}

      <Card className="mb-6 overflow-hidden">
        <CardHeader title="Parent categories" description="Headings your categories are filed under. The bill of materials on the proposal is printed in these groups, in this order." />
        {parentsResource.loading ? <LoadingBlock /> : !parents.length ? (
          <EmptyState icon={FolderTree} title="No parent categories yet" description="Create headings such as Structures and Electricals, then choose one for each category below.">
            {canCreate && <Button variant="primary" icon={FolderTree} onClick={() => setModal({ type: 'parent' })}>New parent category</Button>}
          </EmptyState>
        ) : (
          <Table>
            <thead><tr><Th className="w-10">#</Th><Th>Parent category</Th><Th>Categories</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {parents.map((p, i) => {
                const children = childrenOf(p.id);
                return (
                  <Tr key={p.id}>
                    <Td className="text-slate-400 tabular-nums">{i + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><FolderTree className="h-[18px] w-[18px]" /></span>
                        <div className="min-w-0"><div className="max-w-[240px] truncate font-medium text-slate-900">{p.name}</div>{p.description && <div className="max-w-[240px] truncate text-xs text-slate-500">{p.description}</div>}</div>
                      </div>
                    </Td>
                    <Td>
                      {children.length ? <div className="flex max-w-[460px] flex-wrap gap-1">{children.slice(0, 6).map((c) => <Badge key={c.id}>{c.name}</Badge>)}{children.length > 6 && <span title={children.slice(6).map((c) => c.name).join(', ')}><Badge>+{children.length - 6}</Badge></span>}</div> : <span className="text-slate-400">No categories yet</span>}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-0.5">
                        {canEdit && <IconButton icon={ArrowUp} label="Move up" disabled={i === 0} className="disabled:opacity-30" onClick={() => moveParent(i, -1)} />}
                        {canEdit && <IconButton icon={ArrowDown} label="Move down" disabled={i === parents.length - 1} className="disabled:opacity-30" onClick={() => moveParent(i, 1)} />}
                        <RowMenu
                          label={`Actions for ${p.name}`}
                          items={[
                            canEdit && { key: 'edit', icon: Pencil, label: 'Edit parent category', onClick: () => setModal({ type: 'parent', item: p }) },
                            canDelete && { key: 'delete', icon: Trash2, label: 'Delete parent category', tone: 'danger', onClick: () => setModal({ type: 'deleteParent', item: p }) },
                          ]}
                        />
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Categories" description="Each category holds products and can sit under one parent category." />
        {loading ? <LoadingBlock /> : !data?.length ? (
          <EmptyState icon={Tags} title="No categories yet" description="Create a category — solar panels, poles, inverters, batteries… — then add your products to it.">
            {canCreate && <Button variant="primary" icon={FolderPlus} onClick={() => setModal({ type: 'form' })}>New category</Button>}
          </EmptyState>
        ) : (
          <Table>
            <thead><tr><Th className="w-10">#</Th><Th>Category</Th><Th>Parent category</Th><Th className="text-right">Products</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {data.map((c, i) => (
                  <Tr key={c.id}>
                    <Td className="text-slate-400 tabular-nums">{i + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <CategoryIconMark category={c} />
                        <div className="min-w-0 text-left">
                          <button type="button" onClick={() => setModal({ type: 'detail', item: c })} className="max-w-[240px] truncate font-medium text-slate-900 hover:text-brand hover:underline">{c.name}</button>
                          {c.description && <div className="max-w-[240px] truncate text-xs text-slate-500">{c.description}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td>{parentName.has(c.parent) ? <Badge tone="blue">{parentName.get(c.parent)}</Badge> : <span className="text-slate-400">—</span>}</Td>
                    <Td className="text-right tabular-nums"><Link href={`${catalogPath}?category=${c.id}`} className="font-medium text-brand hover:underline">{c.products}</Link></Td>
                    <Td>
                      <div className="flex items-center justify-end gap-0.5">
                        {canEdit && <IconButton icon={ArrowUp} label="Move up" disabled={i === 0} className="disabled:opacity-30" onClick={() => move(i, -1)} />}
                        {canEdit && <IconButton icon={ArrowDown} label="Move down" disabled={i === data.length - 1} className="disabled:opacity-30" onClick={() => move(i, 1)} />}
                        <RowMenu
                          label={`Actions for ${c.name}`}
                          items={[
                            { key: 'details', icon: Eye, label: 'Category details', onClick: () => setModal({ type: 'detail', item: c }) },
                            { key: 'products', icon: Package, label: 'View products', href: `${catalogPath}?category=${c.id}` },
                            canEdit && { key: 'edit', icon: Pencil, label: 'Edit category', onClick: () => setModal({ type: 'form', item: c }) },
                            canDelete && !DESIGNER_TYPES.has(typeOf(c)) && { key: 'delete', icon: Trash2, label: 'Delete category', tone: 'danger', onClick: () => setModal({ type: 'delete', item: c }) },
                          ]}
                        />
                      </div>
                    </Td>
                  </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {modal?.type === 'detail' && (
        <CategoryDetails
          category={data?.find((x) => x.id === modal.item.id) || modal.item}
          parents={parents}
          catalogPath={catalogPath}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={close}
          onEdit={() => setModal({ type: 'form', item: modal.item })}
          onDelete={() => setModal({ type: 'delete', item: modal.item })}
        />
      )}
      {modal?.type === 'form' && (
        <CategoryForm
          category={modal.item}
          parents={parents}
          onClose={close}
          onSaved={(c) => {
            setData((list) => (list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]));
            toast.success(modal.item ? 'Category updated' : 'Category created');
            close();
          }}
        />
      )}
      {modal?.type === 'parent' && (
        <ParentForm
          parent={modal.item}
          onClose={close}
          onSaved={(p) => {
            parentsResource.setData((list) => ((list || []).some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...(list || []), p]));
            toast.success(modal.item ? 'Parent category updated' : 'Parent category created');
            close();
          }}
        />
      )}
      <ConfirmDialog open={modal?.type === 'deleteParent'} onClose={close} onConfirm={removeParent} busy={busy} error={modalError} title="Delete this parent category?" confirmLabel="Delete parent category">
        <b className="text-slate-900">{modal?.item?.name}</b> will be deleted. Its categories and their products are kept — they just no longer sit under a parent category.
      </ConfirmDialog>
      <ConfirmDialog open={modal?.type === 'delete'} onClose={close} onConfirm={remove} busy={busy} error={modalError} title="Delete this category?" confirmLabel="Delete category">
        <b className="text-slate-900">{modal?.item?.name}</b> will be deleted{modal?.item?.products ? <>, together with <b className="text-slate-900">its {modal.item.products} product{modal.item.products > 1 ? 's' : ''}</b></> : ''}. A category whose products have stock received can’t be deleted.{typeOf(modal?.item) !== 'general' && ' Designs using its products fall back to another product.'}
      </ConfirmDialog>
    </>
  );
}
