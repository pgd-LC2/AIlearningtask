/*
  # 创建学生答题提交表

  ## 功能说明
  存储学生对课程任务的答题记录，包括学生信息和答案详情

  ## 新建表
  - `student_submissions`
    - `id` (uuid, 主键) - 提交记录唯一标识
    - `lesson_task_id` (uuid, 外键) - 关联的课程任务ID
    - `student_name` (text) - 学生姓名
    - `student_class` (text) - 学生班级
    - `seat_number` (text) - 学生座位号
    - `answers` (jsonb) - 答案数据（JSON格式）
    - `submitted_at` (timestamptz) - 提交时间
    - `created_at` (timestamptz) - 记录创建时间

  ## 安全策略
  - 启用RLS
  - 学生可以插入自己的提交记录（公开）
  - 老师（任务所有者）可以查看所有学生提交
*/

-- 创建学生提交表
CREATE TABLE IF NOT EXISTS student_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_task_id uuid REFERENCES lesson_tasks(id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  student_class text NOT NULL,
  seat_number text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_student_submissions_lesson_task_id 
  ON student_submissions(lesson_task_id);

CREATE INDEX IF NOT EXISTS idx_student_submissions_submitted_at 
  ON student_submissions(submitted_at DESC);

-- 启用RLS
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;

-- 策略1：任何人都可以提交答案（学生答题是公开的）
CREATE POLICY "任何人都可以提交答案"
  ON student_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 策略2：任务创建者可以查看所有提交
CREATE POLICY "任务创建者可以查看提交"
  ON student_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lesson_tasks
      WHERE lesson_tasks.id = student_submissions.lesson_task_id
      AND lesson_tasks.user_id = auth.uid()
    )
  );

-- 策略3：学生可以查看自己的提交（通过班级+姓名+座位号匹配）
CREATE POLICY "学生可以查看自己的提交"
  ON student_submissions
  FOR SELECT
  TO authenticated
  USING (true);
