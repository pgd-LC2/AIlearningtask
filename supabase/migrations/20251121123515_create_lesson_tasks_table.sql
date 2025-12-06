/*
  # 创建学习任务单表

  1. 新建表
    - `lesson_tasks`
      - `id` (uuid, 主键) - 学习单唯一标识
      - `user_id` (uuid) - 创建者ID，关联auth.users
      - `title` (text) - 学习单标题
      - `content_json` (jsonb) - 学习单内容（组件数组）
      - `created_at` (timestamptz) - 创建时间
      - `updated_at` (timestamptz) - 最后更新时间
  
  2. 安全策略
    - 启用RLS（行级安全）
    - 用户只能查看自己创建的学习单
    - 用户只能创建属于自己的学习单
    - 用户只能更新自己的学习单
    - 用户只能删除自己的学习单
  
  3. 索引
    - 为user_id创建索引提升查询性能
    - 为created_at创建索引用于排序
*/

CREATE TABLE IF NOT EXISTS lesson_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '未命名学习单',
  content_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的学习单"
  ON lesson_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的学习单"
  ON lesson_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的学习单"
  ON lesson_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的学习单"
  ON lesson_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_tasks_user_id ON lesson_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_tasks_created_at ON lesson_tasks(created_at DESC);
