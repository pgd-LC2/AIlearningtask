/*
  # 添加AI聊天记录字段到提交表

  ## 变更说明
  在 student_submissions 表中添加 chat_history 字段，用于存储学生与AI的对话记录

  ## 修改内容
  1. 添加字段
    - `chat_history` (jsonb) - 存储AI对话历史记录
      格式: { "chatbox_id": [{ role: "user|assistant", content: "...", timestamp: ... }] }
  
  ## 注意事项
  - 字段可为空，因为不是所有学习单都有AI对话框
  - 使用 JSONB 类型支持灵活的查询和存储
*/

-- 添加 chat_history 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_submissions' AND column_name = 'chat_history'
  ) THEN
    ALTER TABLE student_submissions 
    ADD COLUMN chat_history jsonb DEFAULT NULL;
  END IF;
END $$;