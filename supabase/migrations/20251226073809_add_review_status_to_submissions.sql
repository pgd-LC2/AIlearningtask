/*
  # 添加提交记录审核状态

  1. 变更
    - 为 `student_submissions` 表添加 `review_status` 字段
    - 可选值：'pending'（待审核）、'approved'（通过）、'rejected'（不通过）
    - 默认值为 'pending'
  
  2. 安全性
    - 添加 UPDATE 策略，允许任务创建者更新审核状态
*/

-- 添加审核状态字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_submissions' AND column_name = 'review_status'
  ) THEN
    ALTER TABLE student_submissions 
    ADD COLUMN review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 为现有记录设置默认值
UPDATE student_submissions SET review_status = 'pending' WHERE review_status IS NULL;

-- 允许任务创建者更新提交记录的审核状态
CREATE POLICY "任务创建者可以更新提交"
  ON student_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM lesson_tasks
      WHERE lesson_tasks.id = student_submissions.lesson_task_id
      AND lesson_tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM lesson_tasks
      WHERE lesson_tasks.id = student_submissions.lesson_task_id
      AND lesson_tasks.user_id = auth.uid()
    )
  );
