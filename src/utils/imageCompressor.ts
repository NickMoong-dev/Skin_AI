export async function compressBase64Image(base64: string, maxWidth = 600, quality = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Use webp if possible as it's more efficient
      const compressedBase64 = canvas.toDataURL('image/webp', quality);
      
      img.src = '';
      canvas.width = 0;
      canvas.height = 0;
      
      resolve(compressedBase64);
    };
    
    img.onerror = (err) => {
      img.src = '';
      reject(err);
    };
  });
}

export async function compressImage(file: File, maxWidth = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to webp with specified quality
      const compressedBase64 = canvas.toDataURL('image/webp', quality);
      
      // Memory cleanup
      URL.revokeObjectURL(url);
      img.src = '';
      canvas.width = 0;
      canvas.height = 0;
      
      resolve(compressedBase64);
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      img.src = '';
      reject(err);
    };
  });
}
