import { supabase } from './supabase';
import { LessonControl, ControlMessage } from '../types';

const CHANNEL_PREFIX = 'lesson-control:';

export async function initializeControl(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('lesson_controls')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (existing) {
      return { success: true };
    }

    const { error } = await supabase
      .from('lesson_controls')
      .insert({
        task_id: taskId,
        current_page: 0,
        control_enabled: true,
        navigation_locked: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateControlEnabled(
  taskId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (enabled) {
      const { data: existing } = await supabase
        .from('lesson_controls')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('lesson_controls')
          .insert({
            task_id: taskId,
            current_page: 0,
            control_enabled: true,
            navigation_locked: false
          });

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        const { error } = await supabase
          .from('lesson_controls')
          .update({ control_enabled: true })
          .eq('task_id', taskId);

        if (error) {
          return { success: false, error: error.message };
        }
      }
    } else {
      const { error } = await supabase
        .from('lesson_controls')
        .update({ control_enabled: false })
        .eq('task_id', taskId);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function navigateToPage(
  taskId: string,
  page: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: dbError } = await supabase
      .from('lesson_controls')
      .update({ current_page: page })
      .eq('task_id', taskId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    try {
      const channel = supabase.channel(`${CHANNEL_PREFIX}${taskId}`);

      const message: ControlMessage = {
        type: 'navigate',
        page,
        timestamp: Date.now()
      };

      await new Promise<void>((resolve) => {
        let resolved = false;

        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            channel.unsubscribe();
            resolve();
          }
        }, 3000);

        channel
          .on('broadcast', { event: 'control' }, () => {})
          .subscribe(async (status) => {
            if (resolved) return;

            if (status === 'SUBSCRIBED') {
              try {
                await channel.send({
                  type: 'broadcast',
                  event: 'control',
                  payload: message
                });

                setTimeout(() => {
                  if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    channel.unsubscribe();
                    resolve();
                  }
                }, 500);
              } catch {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timeoutId);
                  channel.unsubscribe();
                  resolve();
                }
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                channel.unsubscribe();
                resolve();
              }
            }
          });
      });
    } catch (broadcastError) {
      console.warn('广播失败，但数据库更新成功:', broadcastError);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getControlState(taskId: string): Promise<LessonControl | null> {
  try {
    const { data, error } = await supabase
      .from('lesson_controls')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) {
      console.error('获取控制状态失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('获取控制状态异常:', error);
    return null;
  }
}

export function subscribeToControlChannel(
  taskId: string,
  onMessage: (message: ControlMessage) => void
) {
  const channel = supabase.channel(`${CHANNEL_PREFIX}${taskId}`);

  channel
    .on('broadcast', { event: 'control' }, ({ payload }) => {
      onMessage(payload as ControlMessage);
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export async function sendHeartbeat(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('lesson_controls')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('task_id', taskId)
      .eq('control_enabled', true);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
