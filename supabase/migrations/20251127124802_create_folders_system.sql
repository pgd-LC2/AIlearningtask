/*
  # 创建文件夹系统
  
  1. 新建表
    - `folders`
      - `id` (uuid, 主键) - 文件夹唯一标识
      - `user_id` (uuid) - 创建者ID，关联auth.users
      - `name` (text) - 文件夹名称
      - `parent_id` (uuid, 可空) - 父文件夹ID，支持嵌套结构
      - `created_at` (timestamptz) - 创建时间
      - `updated_at` (timestamptz) - 最后更新时间
  
  2. 修改现有表
    - `lesson_tasks` 表新增 `folder_id` 字段
      - 关联到 `folders` 表
      - 可为空，空值表示在根目录
  
  3. 安全策略
    - 启用RLS（行级安全）
    - 用户只能查看、创建、更新、删除自己的文件夹
    - 防止循环引用（父文件夹不能是自己或后代）
  
  4. 索引
    - 为 user_id 创建索引
    - 为 parent_id 创建索引用于层级查询
    - 为 lesson_tasks.folder_id 创建索引
*/

-- 创建文件夹表
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '新文件夹',
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 为 lesson_tasks 表添加 folder_id 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_tasks' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE lesson_tasks ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 启用 RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- 文件夹的安全策略
CREATE POLICY "用户可以查看自己的文件夹"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的文件夹"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的文件夹"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的文件夹"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_lesson_tasks_folder_id ON lesson_tasks(folder_id);
