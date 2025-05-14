export interface Reclamation {
  _id: string;
  title: string;
  department: string;
  description: string;
  status: 'traitée' | 'en attente' | 'rejetée' | 'envoyer' | 'brouillant';
  createdAt: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  employeeId?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  guichetierId?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
}