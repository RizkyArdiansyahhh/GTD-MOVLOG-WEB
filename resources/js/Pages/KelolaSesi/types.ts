export type LogisticsStage = 'Kapal' | 'Tongkang' | 'Pelabuhan' | 'Site';

export interface WorkSession {
    id: string;
    unitName: string;
    currentStage: LogisticsStage;
    petugas: string;
    createdAt?: string;
}
