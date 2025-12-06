import { supabase } from '../lib/supabase';

export async function uploadImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('lesson-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('lesson-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function pasteImageFromClipboard(
  event: ClipboardEvent
): Promise<string | null> {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      if (blob) {
        return await uploadImage(blob);
      }
    }
  }

  const text = event.clipboardData?.getData('text');
  if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
    return text;
  }

  return null;
}
