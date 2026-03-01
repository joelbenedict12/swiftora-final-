import React, { useState, useEffect } from 'react';
import { ndrApi } from '@/lib/api';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Phone, MapPin, Calendar, RotateCcw, Truck, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const COURIER_COLORS: Record<string, string> = {
    DELHIVERY: '#e83e8c',
    EKART: '#fd7e14',
    XPRESSBEES: '#20c997',
    BLITZ: '#6f42c1',
    INNOFULFILL: '#0dcaf0',
};

export default function NdrCases() {
    const [stats, setStats] = useState<any>(null);
    const [cases, setCases] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ courier: '', resolved: '', page: 1 });
    const [actionModal, setActionModal] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionForm, setActionForm] = useState({ action: '', phone: '', address: '', date: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, casesRes] = await Promise.all([
                ndrApi.adminStats(),
                ndrApi.list({ ...filter, page: filter.page, limit: 20 }),
            ]);
            setStats(statsRes.data);
            setCases(casesRes.data.cases || []);
            setPagination(casesRes.data.pagination || {});
        } catch (e) {
            toast.error('Failed to load NDR data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filter.courier, filter.resolved, filter.page]);

    const handleAction = async () => {
        if (!actionModal || !actionForm.action) return;
        setActionLoading(true);
        try {
            const payload: any = {};
            if (actionForm.phone) payload.phone = actionForm.phone;
            if (actionForm.address) payload.address = actionForm.address;
            if (actionForm.address) payload.address1 = actionForm.address;
            if (actionForm.date) payload.date = actionForm.date;
            const res = await ndrApi.action(actionModal.orderId, { action: actionForm.action, payload });
            if (res.data.success) {
                toast.success(res.data.message || 'NDR action submitted');
                setActionModal(null);
                setActionForm({ action: '', phone: '', address: '', date: '' });
                fetchData();
            } else {
                toast.error(res.data.message || 'Action failed');
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>NDR Cases</h1>
                    <p style={{ color: '#666', fontSize: 14 }}>Manage non-delivery reports across all couriers</p>
                </div>
                <button className="action-btn" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[
                        { label: 'Total NDR', value: stats.total, color: '#e74c3c', icon: <AlertTriangle size={20} /> },
                        { label: 'Pending', value: stats.pending, color: '#f39c12', icon: <RotateCcw size={20} /> },
                        { label: 'Resolved', value: stats.resolved, color: '#27ae60', icon: <Truck size={20} /> },
                        { label: 'NDR Rate', value: `${stats.ndrRate}%`, color: '#8e44ad', icon: <Filter size={20} /> },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)'
                        }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                <select
                    value={filter.courier}
                    onChange={(e) => setFilter({ ...filter, courier: e.target.value, page: 1 })}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' }}
                >
                    <option value="">All Couriers</option>
                    {['DELHIVERY', 'EKART', 'XPRESSBEES', 'BLITZ', 'INNOFULFILL'].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select
                    value={filter.resolved}
                    onChange={(e) => setFilter({ ...filter, resolved: e.target.value, page: 1 })}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' }}
                >
                    <option value="">All Status</option>
                    <option value="false">Pending</option>
                    <option value="true">Resolved</option>
                </select>
            </div>

            {/* Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>AWB</th>
                            <th>Courier</th>
                            <th>Customer</th>
                            <th>Reason</th>
                            <th>Action Taken</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading...</td></tr>
                        ) : cases.length === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#999' }}>No NDR cases found</td></tr>
                        ) : cases.map((ndr: any) => (
                            <tr key={ndr.id}>
                                <td style={{ fontWeight: 600, fontSize: 13 }}>{ndr.order?.orderNumber || '-'}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{ndr.awbNumber}</td>
                                <td>
                                    <span style={{
                                        background: `${COURIER_COLORS[ndr.courierName] || '#6c757d'}15`,
                                        color: COURIER_COLORS[ndr.courierName] || '#6c757d',
                                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    }}>
                                        {ndr.courierName}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ fontSize: 13 }}>{ndr.order?.customerName}</div>
                                    <div style={{ fontSize: 11, color: '#999' }}>{ndr.order?.customerPhone}</div>
                                </td>
                                <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ndr.ndrReason || '-'}</td>
                                <td style={{ fontSize: 12 }}>{ndr.actionTaken || 'None'}</td>
                                <td>
                                    <span style={{
                                        background: ndr.resolved ? '#d4edda' : '#fff3cd',
                                        color: ndr.resolved ? '#155724' : '#856404',
                                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    }}>
                                        {ndr.resolved ? 'Resolved' : 'Pending'}
                                    </span>
                                </td>
                                <td style={{ fontSize: 12, color: '#666' }}>{new Date(ndr.createdAt).toLocaleDateString()}</td>
                                <td>
                                    {!ndr.resolved && (
                                        <button
                                            className="action-btn"
                                            onClick={() => setActionModal(ndr)}
                                            style={{ fontSize: 11, padding: '4px 10px' }}
                                        >
                                            Take Action
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    <button disabled={filter.page <= 1} onClick={() => setFilter({ ...filter, page: filter.page - 1 })} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                        <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '6px 12px', fontSize: 13 }}>Page {filter.page} of {pagination.totalPages}</span>
                    <button disabled={filter.page >= pagination.totalPages} onClick={() => setFilter({ ...filter, page: filter.page + 1 })} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* Action Modal */}
            {actionModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setActionModal(null)}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 460, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>NDR Action</h3>
                        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>
                            AWB: {actionModal.awbNumber} • {actionModal.courierName}
                        </p>
                        <div style={{ fontSize: 12, background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                            <div><strong>Customer:</strong> {actionModal.order?.customerName} ({actionModal.order?.customerPhone})</div>
                            <div><strong>Address:</strong> {actionModal.order?.shippingAddress}, {actionModal.order?.shippingCity}</div>
                            <div><strong>Reason:</strong> {actionModal.ndrReason}</div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Action *</label>
                            <select
                                value={actionForm.action}
                                onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
                            >
                                <option value="">Select action...</option>
                                <option value="reattempt">🔄 Reattempt Delivery</option>
                                <option value="rto">↩️ Return to Origin (RTO)</option>
                                <option value="update_address">📍 Update Address</option>
                                <option value="update_phone">📞 Update Phone</option>
                                <option value="reschedule">📅 Reschedule Delivery</option>
                            </select>
                        </div>

                        {['reattempt', 'reschedule'].includes(actionForm.action) && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                                    <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} /> Reattempt / Reschedule Date
                                </label>
                                <input
                                    type="date"
                                    value={actionForm.date}
                                    onChange={(e) => setActionForm({ ...actionForm, date: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
                                />
                            </div>
                        )}

                        {actionForm.action === 'update_phone' && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                                    <Phone size={12} style={{ display: 'inline', marginRight: 4 }} /> New Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={actionForm.phone}
                                    onChange={(e) => setActionForm({ ...actionForm, phone: e.target.value })}
                                    placeholder="10-digit phone number"
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
                                />
                            </div>
                        )}

                        {actionForm.action === 'update_address' && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                                    <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> New Address
                                </label>
                                <textarea
                                    value={actionForm.address}
                                    onChange={(e) => setActionForm({ ...actionForm, address: e.target.value })}
                                    placeholder="Updated delivery address"
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button onClick={() => setActionModal(null)} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={!actionForm.action || actionLoading}
                                style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: actionForm.action ? '#3b82f6' : '#d1d5db', color: '#fff', cursor: actionForm.action ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}
                            >
                                {actionLoading ? 'Submitting...' : 'Submit Action'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
