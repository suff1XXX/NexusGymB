export function cropRectangle(sourceWidth, sourceHeight, width, height, crop = {}) {
  const x = crop.x ?? 0.5, y = crop.y ?? 0.5, zoom = crop.zoom ?? 1;
  if (![sourceWidth, sourceHeight, width, height].every((v) => Number.isFinite(v) && v > 0) ||
    ![x,y,zoom].every(Number.isFinite) || x < 0 || x > 1 || y < 0 || y > 1 || zoom < 1 || zoom > 3)
    throw Error('Перевір область обрізання зображення.');
  const scale = Math.max(width / sourceWidth, height / sourceHeight) * zoom;
  const cropWidth = Math.min(sourceWidth, width / scale), cropHeight = Math.min(sourceHeight, height / scale);
  return { left: (sourceWidth - cropWidth) * x, top: (sourceHeight - cropHeight) * y, width: cropWidth, height: cropHeight };
}
export function drawProfileCrop(canvas, bitmap, kind, crop) {
  canvas.width = kind === 'avatar' ? 256 : 1200; canvas.height = kind === 'avatar' ? 256 : 320;
  const rect = cropRectangle(bitmap.width, bitmap.height, canvas.width, canvas.height, crop);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, rect.left, rect.top, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  return rect;
}
