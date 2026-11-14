'use client';

// Super admin: messages from the public landing page's Contact Us form. Each is a lead to call back.
import { Eye, Mail, MessageSquare, Phone, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { usePaginatedResource } from '@/lib/useResource';
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, LoadingBlock, Modal, PageHeader, Select, Table, TablePagination, Td, Textarea, Th, Tr, formatDate, timeAgo, toast } from '../kit';

const PAGE_SIZE = 20;
const STATUS = {
  new: { tone: 'amber', label: 'New' },
  contacted: { tone: 'blue', label: 'Contacted' },
  closed: { tone: 'slate', label: 'Closed' },
};

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-6 py-2 text-sm"><dt className="shrink-0 text-slate-500">{label}</dt><dd className="min-w-0 break-words text-right font-medium text-slate-900">{children || '—'}</dd></div>
);

function Details({ id, onClose, onSaved }) {
  const [row, setRow] = useState(null);
  const [failed, setFailed] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let off = false;
    api(`/api/admin/contact-messages/${id}`).then((r) => { if (!off) { setRow(r); setNotes(r.adminNotes || ''); } }).catch((e) => !off && setFailed(e.message));
    return () => { off = true; };
  }, [id]);

  const save = async () => {
    setBusy(true);
    try {
      onSaved(await api(`/api/admin/contact-messages/${id}`, { method: 'PATCH', body: { adminNotes: notes } }));
      toast.success('Notes saved');
    } catch (err) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} size="lg" title={row ? row.name : 'Contact message'} description={row ? `From the landing page · ${formatDate(row.createdAt)}` : undefined} footer={<><Button onClick={onClose}>Close</Button>{row && <Button variant="primary" loading={busy} onClick={save}>Save notes</Button>}</>}>
      {failed ? <Alert>{failed}</Alert> : !row ? <LoadingBlock /> : (
        <div className="space-y-6">
          <dl className="divide-y divide-slate-100">
            <Row label="Name">{row.name}</Row>
            <Row label="Email">{row.email && <a className="text-brand hover:underline" href={`mailto:${row.email}`}>{row.email}</a>}</Row>
            <Row label="Mobile">{row.phone && <a className="text-brand hover:underline" href={`tel:${row.phone}`}>{row.phone}</a>}</Row>
            <Row label="Company">{row.company}</Row>
            <Row label="Status"><Badge dot tone={(STATUS[row.status] || STATUS.new).tone}>{(STATUS[row.status] || STATUS.new).label}</Badge></Row>
            <Row label="IP">{row.ip}</Row>
            <Row label="Came from">{row.referrer}</Row>
          </dl>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Message</h3>
            <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800">{row.message}</p>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Your notes</h3>
            <Textarea rows={3} maxLength={2000} value={notes} onValue={setNotes} placeholder="e.g. Called back, demo booked for Friday" />
          </section>
        </div>
      )}
    </Modal>
  );
}

export default function AdminContactMessages() {
  const [open, setOpen] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const listPath = useMemo(() => {
    const qs = new URLSearchParams(filter ? { status: filter } : {}).toString();
    return `/api/admin/contact-messages${qs ? `?${qs}` : ''}`;
  }, [filter]);
  const { items, setItems, loading, error, total, page, setPage, totalPages, reload } = usePaginatedResource(listPath, { limit: PAGE_SIZE });

  const replace = (row) => setItems((list) => list.map((r) => (r.id === row.id ? { ...r, ...row } : r)));
  const setStatus = async (row, status) => {
    try {
      replace(await api(`/api/admin/contact-messages/${row.id}`, { method: 'PATCH', body: { status } }));
      if (filter && status !== filter) reload();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/contact-messages/${removing.id}`, { method: 'DELETE' });
      toast.success('Removed');
      setRemoving(null);
      if (items.length <= 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title="Contact messages" description="Messages from the Contact Us form on the public site. Treat each one as a lead: call them, then mark what happened.">
        <Select aria-label="Status" value={filter} onValue={setFilter} className="w-44">
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </Select>
      </PageHeader>
      {error && <Alert className="mb-6">{error}</Alert>}
      <Card className="overflow-hidden">
        {loading && !items.length ? <LoadingBlock /> : !items.length ? (
          <EmptyState icon={MessageSquare} title={filter ? 'Nothing with this status' : 'No contact messages yet'} description={filter ? 'Choose another status above.' : 'When someone sends the Contact Us form on the landing page, it appears here.'} />
        ) : (
          <Table>
            <thead><tr><Th>Name</Th><Th>Contact</Th><Th>Company</Th><Th>Message</Th><Th>Received</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {items.map((r) => {
                const s = STATUS[r.status] || STATUS.new;
                return (
                  <Tr key={r.id}>
                    <Td>
                      <button type="button" onClick={() => setOpen(r.id)} className="text-left font-semibold text-slate-900 hover:text-brand">{r.name || '—'}</button>
                    </Td>
                    <Td className="text-[13px]">
                      {r.phone && <div className="flex items-center gap-1.5 text-slate-700"><Phone className="h-3 w-3 shrink-0" /> <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a></div>}
                      {r.email && <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Mail className="h-3 w-3 shrink-0" /> <a href={`mailto:${r.email}`} className="max-w-[200px] truncate hover:underline">{r.email}</a></div>}
                    </Td>
                    <Td className="text-[13px] text-slate-700">{r.company || '—'}</Td>
                    <Td className="max-w-[240px] truncate text-[13px] text-slate-600" title={r.message}>{r.message}</Td>
                    <Td className="whitespace-nowrap text-slate-500" title={formatDate(r.createdAt)}>{timeAgo(r.createdAt)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Badge dot tone={s.tone}>{s.label}</Badge>
                        <Select aria-label={`Status of ${r.name}`} value={r.status} onValue={(v) => setStatus(r, v)} className="h-8 w-32 text-xs">
                          {Object.entries(STATUS).map(([k, x]) => <option key={k} value={k}>{x.label}</option>)}
                        </Select>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <IconButton icon={Eye} label={`Open message from ${r.name}`} onClick={() => setOpen(r.id)} />
                        <IconButton icon={Trash2} tone="danger" label={`Remove message from ${r.name}`} onClick={() => setRemoving(r)} />
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <TablePagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} className="border-t border-slate-100" />
      </Card>
      {open && <Details id={open} onClose={() => setOpen(null)} onSaved={replace} />}
      <ConfirmDialog open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} busy={busy} title={`Remove message from ${removing?.name || 'this person'}?`} confirmLabel="Remove">
        <p>The message and their contact details are deleted. This cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
}
