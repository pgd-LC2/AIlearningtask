/*
  # 修复函数安全设置

  ## 变更说明
  为 update_lesson_controls_updated_at 函数添加安全设置，修复 search_path 警告

  ## 安全改进
  1. 添加 SECURITY DEFINER 或 SECURITY INVOKER
  2. 设置明确的 search_path 防止 search_path 注入攻击
  3. 符合 Supabase 安全最佳实践

  ## 注意事项
  - 使用 SECURITY INVOKER 确保函数以调用者权限执行
  - 设置 search_path = '' 防止恶意搜索路径注入
*/

-- 重新创建函数，添加安全设置
CREATE OR REPLACE FUNCTION update_lesson_controls_updated_at()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;