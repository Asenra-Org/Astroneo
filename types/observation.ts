export interface Observation {
  id?: string;
  starId: string;
  starName: string;
  observedAt: Date | string;
  notes: string;
  conditions?: string;
  equipment?: string;
  userId: string;
}

export interface ObservationFormData {
  starId: string;
  starName: string;
  notes: string;
  conditions?: string;
  equipment?: string;
}
