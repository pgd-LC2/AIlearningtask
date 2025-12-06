/*
  # 创建课堂流程控制表（实验性功能）

  1. 新建表
    - `lesson_controls`
      - `task_id` (uuid, 主键) - 关联的学习单ID
      - `current_page` (integer) - 当前展示的页码（从0开始）
      - `control_enabled` (boolean) - 是否启用流程控制
      - `navigation_locked` (boolean) - 是否锁定学生翻页（预留扩展）
      - `updated_at` (timestamptz) - 最后更新时间
      - `created_at` (timestamptz) - 创建时间

  2. 安全策略
    - 启用RLS
    - 任务创建者可以读写控制状态
    - 学生可以读取控制状态

  3. 索引
    - 为 task_id 创建唯一索引
    - 为 updated_at 创建索引用于排序

  4. 触发器
    - 自动更新 updated_at 字段
*/

-- 创建控制表
CREATE TABLE IF NOT EXISTS lesson_controls (
  task_id uuid PRIMARY KEY REFERENCES lesson_tasks(id) ON DELETE CASCADE,
  current_page integer NOT NULL DEFAULT 0,
  control_enabled boolean NOT NULL DEFAULT false,
  navigation_locked boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lesson_controls_updated_at 
  ON lesson_controls(updated_at DESC);

-- 启用RLS
ALTER TABLE lesson_controls ENABLE ROW LEVEL SECURITY;

-- 策略1：任务创建者可以查看和修改控制状态
CREATE POLICY "任务创建者可以管理流程控制"
  ON lesson_controls
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lesson_tasks
      WHERE lesson_tasks.id = lesson_controls.task_id
      AND lesson_tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson_tasks
      WHERE lesson_tasks.id = lesson_controls.task_id
      AND lesson_tasks.user_id = auth.uid()
    )
  );

-- 策略2：所有认证用户可以读取控制状态（学生端需要）
CREATE POLICY "认证用户可以查看流程控制状态"
  ON lesson_controls
  FOR SELECT
  TO authenticated
  USING (true);

-- 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_lesson_controls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_lesson_controls_updated_at ON lesson_controls;
CREATE TRIGGER trigger_update_lesson_controls_updated_at
  BEFORE UPDATE ON lesson_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_controls_updated_at();
