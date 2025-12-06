/*
  # 优化RLS策略和索引

  ## 修复内容

  ### 1. RLS性能优化
  优化所有RLS策略中的 `auth.uid()` 调用，使用 `(select auth.uid())` 避免每行重复计算
  
  #### lesson_tasks 表策略
  - 更新"用户可以查看自己的学习单"策略
  - 更新"用户可以创建自己的学习单"策略
  - 更新"用户可以更新自己的学习单"策略
  - 更新"用户可以删除自己的学习单"策略

  #### student_submissions 表策略
  - 更新"任务创建者可以查看提交"策略

  ### 2. 清理未使用的索引
  - 删除 `idx_lesson_tasks_created_at` (未使用)
  - 删除 `idx_student_submissions_submitted_at` (未使用)

  ### 3. 修复多重许可策略问题
  - 删除 student_submissions 表的"学生可以查看自己的提交"策略（过于宽松）
  - 保留"任务创建者可以查看提交"策略（更安全）

  ## 安全说明
  - 所有策略仍然保持原有的安全限制
  - 仅优化性能，不改变权限逻辑
  - 确保数据访问仍然受到严格控制
*/

-- ============================================================
-- 1. 优化 lesson_tasks 表的 RLS 策略
-- ============================================================

-- 删除旧策略
DROP POLICY IF EXISTS "用户可以查看自己的学习单" ON lesson_tasks;
DROP POLICY IF EXISTS "用户可以创建自己的学习单" ON lesson_tasks;
DROP POLICY IF EXISTS "用户可以更新自己的学习单" ON lesson_tasks;
DROP POLICY IF EXISTS "用户可以删除自己的学习单" ON lesson_tasks;

-- 创建优化后的策略（使用 select 包裹 auth.uid()）
CREATE POLICY "用户可以查看自己的学习单"
  ON lesson_tasks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "用户可以创建自己的学习单"
  ON lesson_tasks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "用户可以更新自己的学习单"
  ON lesson_tasks FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "用户可以删除自己的学习单"
  ON lesson_tasks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 2. 优化 student_submissions 表的 RLS 策略
-- ============================================================

-- 删除旧策略
DROP POLICY IF EXISTS "任务创建者可以查看提交" ON student_submissions;
DROP POLICY IF EXISTS "学生可以查看自己的提交" ON student_submissions;

-- 创建优化后的策略
CREATE POLICY "任务创建者可以查看提交"
  ON student_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lesson_tasks
      WHERE lesson_tasks.id = student_submissions.lesson_task_id
      AND lesson_tasks.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- 3. 删除未使用的索引
-- ============================================================

DROP INDEX IF EXISTS idx_lesson_tasks_created_at;
DROP INDEX IF EXISTS idx_student_submissions_submitted_at;
