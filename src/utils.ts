import { auth } from './lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getGradeFromScore(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-500';
  if (grade === 'B') return 'text-blue-500';
  if (grade === 'C') return 'text-amber-500';
  return 'text-red-500';
}

export async function addWatermarkToImage(base64Str: string, userInfo?: { email: string, name?: string }): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Setup watermark style
      const timestamp = new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const fontSize = Math.max(20, Math.floor(canvas.width / 30));
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Position bottom right for timestamp
      const padding = fontSize;
      const textWidth = ctx.measureText(timestamp).width;
      let x = canvas.width - textWidth - padding;
      let y = canvas.height - padding;

      ctx.fillText(timestamp, x, y);

      // Add Top Right Watermark: Login ID / Name
      if (userInfo) {
        const userInfoText = `${userInfo.email}${userInfo.name ? ` / ${userInfo.name}` : ''}`.toUpperCase();
        const watermarkFontSize = Math.floor(fontSize * 0.8);
        ctx.font = `900 ${watermarkFontSize}px "Inter", sans-serif`;
        const watermarkWidth = ctx.measureText(userInfoText).width;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(userInfoText, canvas.width - watermarkWidth - padding, padding + watermarkFontSize);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64Str);
  });
}
