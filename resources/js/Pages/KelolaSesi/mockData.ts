import type { WorkSession } from './types';

export const mockWorkSessions: WorkSession[] = [
    {
        id: '01J000001',
        sessionId: 'SES-2048',
        unitName: 'Excavator CAT 320',
        currentStage: 'Pelabuhan',
        petugas: 'Budi S.',
        createdAt: '2026-08-01 08:30',
        notes: null,
        units: [
            { id: 'u1', unit_name: 'Excavator CAT 320', quantity: 2 },
            { id: 'u2', unit_name: 'Dump Truck HD465', quantity: 1 },
        ],
        stages: [
            { id: 's1', stage_type: 'kapal', stage_order: 1, status: 'selesai', pic_user: { id: 'p1', name: 'Budi S.' }, workers: [{ id: 'w1', name: 'Anto F.' }], notes: null, started_at: '2026-08-01T01:00:00Z', completed_at: '2026-08-01T05:00:00Z' },
            { id: 's2', stage_type: 'tongkang', stage_order: 2, status: 'selesai', pic_user: { id: 'p2', name: 'Hendra W.' }, workers: [{ id: 'w2', name: 'Rudi H.' }], notes: null, started_at: '2026-08-01T05:00:00Z', completed_at: '2026-08-01T08:00:00Z' },
            { id: 's3', stage_type: 'pelabuhan', stage_order: 3, status: 'aktif', pic_user: { id: 'p3', name: 'Ahmad K.' }, workers: [{ id: 'w3', name: 'Denny P.' }], notes: null, started_at: '2026-08-01T08:00:00Z', completed_at: null },
            { id: 's4', stage_type: 'site', stage_order: 4, status: 'pending', pic_user: null, workers: [], notes: null, started_at: null, completed_at: null },
        ],
    },
    {
        id: '01J000002',
        sessionId: 'SES-2050',
        unitName: 'Mobile Crane 50T',
        currentStage: 'Kapal',
        petugas: 'Anto F.',
        createdAt: '2026-08-01 09:15',
        notes: null,
        units: [{ id: 'u3', unit_name: 'Mobile Crane 50T', quantity: 1 }],
        stages: [
            { id: 's5', stage_type: 'kapal', stage_order: 1, status: 'aktif', pic_user: { id: 'p4', name: 'Anto F.' }, workers: [{ id: 'w4', name: 'Siti M.' }], notes: null, started_at: '2026-08-01T02:00:00Z', completed_at: null },
            { id: 's6', stage_type: 'tongkang', stage_order: 2, status: 'pending', pic_user: null, workers: [], notes: null, started_at: null, completed_at: null },
            { id: 's7', stage_type: 'pelabuhan', stage_order: 3, status: 'pending', pic_user: null, workers: [], notes: null, started_at: null, completed_at: null },
            { id: 's8', stage_type: 'site', stage_order: 4, status: 'pending', pic_user: null, workers: [], notes: null, started_at: null, completed_at: null },
        ],
    },
    {
        id: '01J000003',
        sessionId: 'SES-2045',
        unitName: 'Dump Truck HD465',
        currentStage: 'Site',
        petugas: 'Hendra W.',
        createdAt: '2026-07-31 14:00',
        notes: null,
        units: [{ id: 'u4', unit_name: 'Dump Truck HD465', quantity: 3 }],
        stages: [
            { id: 's9', stage_type: 'kapal', stage_order: 1, status: 'selesai', pic_user: { id: 'p5', name: 'Irfan S.' }, workers: [{ id: 'w5', name: 'Fajar R.' }], notes: null, started_at: '2026-07-31T07:00:00Z', completed_at: '2026-07-31T09:00:00Z' },
            { id: 's10', stage_type: 'tongkang', stage_order: 2, status: 'selesai', pic_user: { id: 'p6', name: 'Rian T.' }, workers: [{ id: 'w6', name: 'Budi S.' }], notes: null, started_at: '2026-07-31T09:00:00Z', completed_at: '2026-07-31T11:00:00Z' },
            { id: 's11', stage_type: 'pelabuhan', stage_order: 3, status: 'selesai', pic_user: { id: 'p7', name: 'Ahmad K.' }, workers: [{ id: 'w7', name: 'Anto F.' }], notes: null, started_at: '2026-07-31T11:00:00Z', completed_at: '2026-07-31T13:00:00Z' },
            { id: 's12', stage_type: 'site', stage_order: 4, status: 'aktif', pic_user: { id: 'p8', name: 'Hendra W.' }, workers: [{ id: 'w8', name: 'Rudi H.' }, { id: 'w9', name: 'Denny P.' }], notes: null, started_at: '2026-07-31T13:00:00Z', completed_at: null },
        ],
    },
];
