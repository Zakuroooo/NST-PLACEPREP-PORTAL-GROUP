"use client";

import { useState, useMemo } from "react";
import { Search, Plus, MoreVertical, X, UserPlus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Faculty = {
  _id?: string;
  id?: string | number;
  fullName?: string;
  name?: string;
  initials?: string;
  subject?: string;
  stream?: string;
  email?: string;
  status?: string;
  acceptCount?: number;
  declineCount?: number;
  satisfactionAvg?: number;
  responseRate?: number;
  accepted?: number;
  declined?: number;
  satisfaction?: number;
};

export default function ManageFacultyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const itemsPerPage = 6;

  // SWR — real faculty data
  const { data, mutate, isLoading } = useSWR(
    `/api/admin/faculty?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`,
    fetcher
  );
  const faculty: Faculty[] = data?.data?.faculty ?? data?.faculty ?? [];
  const total: number = data?.data?.total ?? data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  // The API already handles pagination and search filtering.
  const paginated = faculty;

  // Modal states
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [removingFacultyId, setRemovingFacultyId] = useState<string | number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', stream: '' });
  const [saving, setSaving] = useState(false);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingFaculty) return;
    setEditingFaculty({ ...editingFaculty, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    if (!editingFaculty) return;
    const id = editingFaculty._id ?? editingFaculty.id;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/faculty/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editingFaculty.fullName ?? editingFaculty.name,
          subject: editingFaculty.subject,
          stream: editingFaculty.stream,
          status: editingFaculty.status,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Faculty updated.');
      mutate();
    } catch {
      toast.error('Could not update faculty.');
    } finally {
      setSaving(false);
      setEditingFaculty(null);
    }
  };

  const confirmRemove = async () => {
    if (removingFacultyId === null) return;
    try {
      const res = await fetch(`/api/admin/faculty/${removingFacultyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Faculty removed.');
      mutate();
    } catch {
      toast.error('Could not remove faculty.');
    } finally {
      setRemovingFacultyId(null);
    }
  };

  const submitNewFaculty = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/faculty/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newFaculty.email, fullName: newFaculty.name, stream: newFaculty.stream }),
      });
      if (!res.ok) throw new Error('Invite failed');
      toast.success(`Invite sent to ${newFaculty.email}`);
      setNewFaculty({ name: '', email: '', stream: '' });
      setIsAddModalOpen(false);
      mutate();
    } catch {
      toast.error('Could not send invite.');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-50 text-emerald-700",
      INACTIVE: "bg-red-50 text-red-700",
      "INVITE PENDING": "bg-amber-50 text-amber-700",
      PENDING: "bg-amber-50 text-amber-700",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Manage Faculty</h1>
            <p className="text-sm text-gray-500">Add, edit, and manage faculty members and their invitations.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
        </div>

        {/* Search */}
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by name, stream, or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            // Skeleton cards — matches faculty card layout
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-40 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between"><div className="h-3 w-12 bg-gray-100 rounded" /><div className="h-3 w-20 bg-gray-100 rounded" /></div>
                  <div className="flex justify-between"><div className="h-3 w-12 bg-gray-100 rounded" /><div className="h-5 w-16 bg-gray-200 rounded-full" /></div>
                </div>
              </div>
            ))
          ) : paginated.map((f) => (
            <div
              key={f._id ?? String(f.id)}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {/* Actions */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => { const id = String(f._id ?? f.id ?? ''); setActiveMenuId(activeMenuId === id ? null : id); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {activeMenuId === (f._id ?? f.id) && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 z-10">
                    <button
                      onClick={() => { setEditingFaculty(f); setActiveMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => { setRemovingFacultyId(f._id ?? f.id ?? null); setActiveMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Faculty Info */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  {f.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{f.fullName ?? f.name}</p>
                  <p className="text-xs text-gray-500 truncate">{f.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">Stream</span>
                  <span className="text-xs font-medium text-gray-700">{f.stream || f.subject}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">Status</span>
                  {statusBadge(f.status ?? '')}
                </div>
              </div>
            </div>
          ))}

          {paginated.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-gray-400">
              No faculty members found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-30"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                    currentPage === page ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                className="p-1.5 rounded text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-30"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Add Faculty Modal ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl relative">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Add Faculty</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input name="name" value={newFaculty.name} onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Prof. John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={newFaculty.email} onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="john@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream / Subject</label>
                <input name="stream" value={newFaculty.stream} onChange={(e) => setNewFaculty({ ...newFaculty, stream: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Computer Science" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={submitNewFaculty} disabled={!newFaculty.name || !newFaculty.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFaculty.email)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Faculty Modal ─── */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl relative">
            <button onClick={() => setEditingFaculty(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Edit Faculty</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" value={editingFaculty.name} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" value={editingFaculty.email} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                <input name="stream" value={editingFaculty.stream || ""} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={editingFaculty.status} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="INVITE PENDING">Invite Pending</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingFaculty(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Remove Confirmation Modal ─── */}
      {removingFacultyId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Remove Faculty?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              This action will remove <span className="font-semibold text-gray-800">{faculty.find(f => (f._id ?? f.id) === removingFacultyId)?.fullName ?? faculty.find(f => (f._id ?? f.id) === removingFacultyId)?.name ?? 'the selected faculty member'}</span> from the faculty list. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemovingFacultyId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmRemove} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
