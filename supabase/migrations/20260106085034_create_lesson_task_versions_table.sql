/*
  创建学习单版本历史表

  1. 新建表
    - lesson_task_versions
      - id (uuid, 主键) - 版本ID
      - task_id (uuid, 外键) - 关联的学习单ID
      - user_id (uuid, 外键) - 用户ID
      - title (text) - 标题快照
      - content_json (jsonb) - 内容快照
      - change_description (text, 可选) - 变更说明
      - created_at (timestamptz) - 版本创建时间

  2. 索引
    - 在 task_id 和 created_at 上创建索引,优化查询性能

  3. 安全性
    - 启用 RLS
    - 用户只能查看自己学习单的版本历史
    - 系统自动创建版本,用户不能手动插入或删除
*/

CREATE TABLE IF NOT EXISTS lesson_task_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES lesson_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  change_description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_task_versions_task_id ON lesson_task_versions(task_id);
CREATE INDEX IF NOT EXISTS idx_lesson_task_versions_created_at ON lesson_task_versions(task_id, created_at DESC);

ALTER TABLE lesson_task_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task versions"
  ON lesson_task_versions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
