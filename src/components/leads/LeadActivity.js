'use client';

// All activity on leads (status changes, remarks, assignments), newest first — same filters as the leads list.
import { Activity } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useCan } from '@/lib/useCan';
import { useResource } from '@/lib/useResource';
import { PRIORITY_FILTER_OPTIONS } from '@/components/admin/leads/PriorityToggle';
import { SCHEDULE_OPTIONS } from '@/lib/leadSchedule';
import {
  Alert, Badge, Button, Card, DATE_PRESETS, EmptyState, FormField, LoadingBlock, PageHeader,
  Select, Table, TablePagination, Td, Th, Tr, capName, formatDate, timeAgo, toast,
} from '../kit';
import LeadListFilterBar from './LeadListFilterBar';
import LeadSourceTabs from '@/components/leads/LeadSourceTabs';
import LeadViewSwitch, { leadPaths } from './LeadViewSwitch';
import ManualLeadDetail from './ManualLeadDetail';
import ConvertToClient, { referrerOf } from './ConvertToClient';
import LeadForm from './LeadForm';

const PAGE_SIZE = 20;
const EMPTY_FILTERS = {
  search: '', assignedTo: '', statusId: '', source: '', priority: '', schedule: '',
  fromDate: '', toDate: '', pageId: '', formId: '',
};
const SOURCE_TONE = { meta: 'blue', google: 'amber', manual: 'slate', import: 'violet' };
const SOURCE_QUERY = { meta: 'meta', google: 'google', manual: 'manual_all' };
const ACTIVITY_DATE_PRESETS = [DATE_PRESETS.today, DATE_PRESETS.yesterday, DATE_PRESETS.week];

export default function LeadActivity() {
  const router = useRouter();
  const paths = leadPaths(usePathname());
  const fixedSource = paths.source;
  const can = useCan();
  const may = {
    all: can('leads', 'view_all'),
    create: can('leads', 'create'),
    update: can('leads', 'update'),
    status: can('leads', 'change_status'),
    assign: can('leads', 'assign'),
  };
  const form = useResource('/api/leads/form');
  const fields = form.data?.fields || [];
  const statusesRes = useResource('/api/leads/statuses');
  const assigneesRes = useResource(may.all || may.assign ? '/api/leads/assignees' : null);
  const metaFiltersRes = useResource(may.all ? '/api/leads/meta/filters' : null);
  const statuses = statusesRes.data || [];
  const assignees = assigneesRes.data || [];
  const metaPages = metaFiltersRes.data?.pages || [];

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const metaForms = useMemo(() => {
    const forms = metaFiltersRes.data?.forms || [];
    if (!filters.pageId) return forms;
    return forms.filter((f) => f.pageId === filters.pageId);
  }, [metaFiltersRes.data, filters.pageId]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ activities: [], total: 0, totalPages: 1, loading: true, error: '' });
  const [modal, setModal] = useState(null);

  const showSourceFilter = !fixedSource || fixedSource === 'manual';
  const showMetaFilters = may.all && ((!fixedSource && (!filters.source || filters.source === 'meta')) || fixedSource === 'meta');

  useEffect(() => {
    const t = setTimeout(() => { setFilters((f) => ({ ...f, search: query.trim() })); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setState((s) => ({ ...s, loading: true }));
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (filters.search) params.set('search', filters.search);
    if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
    if (filters.statusId) params.set('statusId', filters.statusId);
    if (fixedSource && !(fixedSource === 'manual' && filters.source)) params.set('source', SOURCE_QUERY[fixedSource]);
    else if (filters.source) params.set('source', filters.source);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.schedule) params.set('schedule', filters.schedule);
    if (filters.fromDate) params.set('from', filters.fromDate);
    if (filters.toDate) params.set('to', filters.toDate);
    if (showMetaFilters && filters.pageId) params.set('pageId', filters.pageId);
    if (showMetaFilters && filters.formId) params.set('formId', filters.formId);
    try {
      const res = await api(`/api/leads/activity?${params}`);
      setState({
        activities: res.activities || [],
        total: res.total || 0,
        totalPages: res.totalPages || 1,
        loading: false,
        error: '',
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, [filters, page, fixedSource, showMetaFilters]);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k) => (v) => {
    setFilters((f) => {
      const next = { ...f, [k]: v };
      if (k === 'source' && v && v !== 'meta') {
        next.pageId = '';
        next.formId = '';
      }
      if (k === 'pageId' && v !== f.pageId) next.formId = '';
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setQuery('');
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const extraFilterCount = [
    filters.assignedTo,
    filters.statusId,
    showSourceFilter && filters.source,
    filters.priority,
    filters.schedule,
    filters.fromDate,
    filters.toDate,
    showMetaFilters && filters.pageId,
    showMetaFilters && filters.formId,
  ].filter(Boolean).length;

  const hasFilters = Boolean(filters.search || extraFilterCount);

  const SOURCE_PATH = { meta: `${paths.base}/meta`, google: `${paths.base}/google` };
  const openLead = async (lead) => {
    if (!lead?._id) return;
    if (SOURCE_PATH[lead.leadSource]) {
      router.push(`${SOURCE_PATH[lead.leadSource]}${lead.phone ? `?search=${encodeURIComponent(lead.phone)}` : ''}`);
      return;
    }
    try {
      const res = await api(`/api/leads/manual?limit=5&search=${encodeURIComponent(lead.phone || lead.fullName)}`);
      const full = (res.leads || []).find((l) => l._id === lead._id);
      if (!full) return toast.error('This lead could not be opened');
      setModal({ type: 'detail', lead: full });
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <LeadSourceTabs />
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LeadViewSwitch view="activity" />
        </div>
      </PageHeader>

      <LeadListFilterBar
        search={query}
        onSearchChange={setQuery}
        placeholder="Search name, phone, assigned to or activity…"
        activeFilterCount={extraFilterCount}
        showClear={hasFilters}
        onClear={clearFilters}
        dateLabel="Activity"
        datePresets={ACTIVITY_DATE_PRESETS}
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        onDateChange={({ from, to }) => {
          setFilters((f) => ({ ...f, fromDate: from, toDate: to }));
          setPage(1);
        }}
      >
        {showSourceFilter && (
          <FormField label={fixedSource === 'manual' ? 'Added or imported' : 'Source'}>
            <Select aria-label="Source" value={filters.source} onValue={setFilter('source')}>
              {fixedSource === 'manual' ? (
                <>
                  <option value="">All</option>
                  <option value="manual">Added</option>
                  <option value="import">Imported</option>
                </>
              ) : (
                <>
                  <option value="">All sources</option>
                  <option value="meta">Meta</option>
                  <option value="google">Google Ads</option>
                  <option value="manual">Added</option>
                  <option value="import">Imported</option>
                </>
              )}
            </Select>
          </FormField>
        )}
        {may.all && (
          <FormField label="Assigned to">
            <Select aria-label="Assigned to" value={filters.assignedTo} onValue={setFilter('assignedTo')}>
              <option value="">Anyone</option>
              <option value="unassigned">Unassigned</option>
              <option value="reassigned">Reassigned (handed over)</option>
              {assignees.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </Select>
          </FormField>
        )}
        <FormField label="Status change">
          <Select aria-label="Status change" value={filters.statusId} onValue={setFilter('statusId')}>
            <option value="">Any activity</option>
            <option value="none">Assignments & other</option>
            {statuses.map((s) => <option key={s._id} value={s._id}>Changed to {s.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Priority">
          <Select aria-label="Priority" value={filters.priority} onValue={setFilter('priority')}>
            {PRIORITY_FILTER_OPTIONS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Scheduled">
          <Select aria-label="Scheduled" value={filters.schedule} onValue={setFilter('schedule')}>
            {SCHEDULE_OPTIONS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
          </Select>
        </FormField>
        {showMetaFilters && (
          <>
            <FormField label="Meta page">
              <Select aria-label="Meta page" value={filters.pageId} onValue={setFilter('pageId')}>
                <option value="">All pages</option>
                {metaPages.map((p) => <option key={p.pageId} value={p.pageId}>{p.pageName}</option>)}
              </Select>
            </FormField>
            <FormField label="Meta form">
              <Select aria-label="Meta form" value={filters.formId} onValue={setFilter('formId')} disabled={!metaForms.length && !filters.pageId}>
                <option value="">All forms</option>
                {metaForms.map((f) => <option key={f.formId} value={f.formId}>{f.formName}</option>)}
              </Select>
            </FormField>
          </>
        )}
      </LeadListFilterBar>

      {state.error && <Alert className="mb-4">{state.error}</Alert>}
      <Card className="overflow-hidden">
        {state.loading ? <LoadingBlock /> : !state.activities.length ? (
          <EmptyState
            icon={Activity}
            title={hasFilters ? 'No activity matches' : 'No activity yet'}
            description={hasFilters ? 'Try a different search or filter.' : 'Status changes, remarks and assignments on leads will show here.'}
          >
            {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear filters</Button>}
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Assigned to</Th>
                  <Th>Activity</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody>
                {state.activities.map((row) => (
                  <Tr
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => openLead(row.lead)}
                  >
                    <Td>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="max-w-[220px] truncate font-medium text-slate-900">{capName(row.lead?.fullName) || '—'}</div>
                          <Badge tone={SOURCE_TONE[row.lead?.leadSource] || 'slate'} className="shrink-0">{row.lead?.sourceLabel}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">{row.lead?.phone || '—'}</div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-700">
                      {row.assignedTo?.name || <span className="text-slate-400">Unassigned</span>}
                    </Td>
                    <Td>
                      <div className="max-w-[420px]">
                        <div className="text-[13px] font-medium text-slate-900">{row.summary}</div>
                        {row.remark && (
                          <p className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-[13px] break-words text-slate-700">“{row.remark}”</p>
                        )}
                        {row.byName && <div className="mt-1 text-xs text-slate-400">by {row.byName}</div>}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-600">
                      <div title={row.at ? new Date(row.at).toLocaleString() : undefined}>{row.at ? timeAgo(row.at) : '—'}</div>
                      {row.at && <div className="text-xs text-slate-400">{formatDate(row.at)}</div>}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <TablePagination
              page={page}
              totalPages={state.totalPages}
              total={state.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              className="border-t border-slate-100"
            />
          </>
        )}
      </Card>

      {modal?.type === 'detail' && (
        <ManualLeadDetail
          fields={fields}
          lead={modal.lead}
          statuses={statuses}
          assignees={assignees}
          may={may}
          onClose={() => setModal(null)}
          onChanged={(lead) => { setModal({ type: 'detail', lead }); load({ quiet: true }); }}
          onEdit={() => setModal({ type: 'form', lead: modal.lead })}
          onConverted={(lead) => setModal({ type: 'convert', lead })}
        />
      )}
      {modal?.type === 'form' && (
        <LeadForm
          fields={fields}
          lead={modal.lead}
          onClose={() => setModal(modal.lead ? { type: 'detail', lead: modal.lead } : null)}
          onSaved={(lead) => { setModal({ type: 'detail', lead }); load({ quiet: true }); }}
        />
      )}
      {modal?.type === 'convert' && (
        <ConvertToClient
          lead={{
            source: 'manual',
            id: modal.lead._id,
            name: modal.lead.fullName,
            phone: modal.lead.phone,
            address: modal.lead.address,
            email: fields.filter((f) => f.type === 'email').map((f) => modal.lead.fields?.[f.key]).find(Boolean),
            referredBy: referrerOf(modal.lead),
          }}
          onClose={() => setModal({ type: 'detail', lead: modal.lead })}
          onConverted={(link) => { setModal({ type: 'detail', lead: { ...modal.lead, ...link } }); load({ quiet: true }); }}
        />
      )}
    </>
  );
}
