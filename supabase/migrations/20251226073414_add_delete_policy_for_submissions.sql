/*
  # 添加学生提交记录的删除权限

  1. 变更
    - 为 `student_submissions` 表添加 DELETE 策略
    - 允许任务创建者删除其任务下的学生提交记录
  
  2. 安全性
    - 只有任务的创建者（老师）可以删除提交记录
    - 通过关联 `lesson_tasks` 表验证所有权
*/

-- 允许任务创建者删除提交记录
CREATE POLICY "任务创建者可以删除提交"
  ON student_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM lesson_tasks
      WHERE lesson_tasks.id = student_submissions.lesson_task_id
      AND lesson_tasks.user_id = auth.uid()
    )
  );
