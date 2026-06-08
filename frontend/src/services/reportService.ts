import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type ReportType = 'user' | 'post' | 'comment';

interface ReportData {
  targetId: string;
  targetType: ReportType;
  reporterId: string;
  reason: string;
  details?: string;
}

export const reportService = {
  async submitReport(data: ReportData) {
    try {
      const reportsRef = collection(db, 'reports');
      await addDoc(reportsRef, {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      console.log('[ReportService] Report submitted successfully');
      return true;
    } catch (error) {
      console.error('[ReportService] Error submitting report:', error);
      throw error;
    }
  }
};
