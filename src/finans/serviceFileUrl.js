// Servis talebi dosyaları için URL helper
// photoPath formatları:
//   "req_4/user_433_xxx_ruhsat.jpg"  → /api/service-requests/4/files/user_433_xxx_ruhsat.jpg
//   "req_4/servis_1_454_390_montaj.jpg" → aynı şekilde
//   "user_433_xxx_ruhsat.jpg" (sadece dosya adı) → requestId ile tamamla
export const serviceFileUrl = (requestId, filePath) => {
  if (!requestId || !filePath) return null;
  const filename = filePath.split('/').pop();
  const reqMatch = filePath.match(/^req_(\d+)\//);
  const resolvedId = reqMatch ? reqMatch[1] : requestId;
  // 5 dakikada bir yenilenir
  const bucket = Math.floor(Date.now() / (1 * 60 * 1000));
  return `/api/service-requests/${resolvedId}/files/${filename}?t=${bucket}`;
};