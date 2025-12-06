/*
  # 修复学生提交RLS策略

  ## 问题
  - 当前INSERT策略只允许认证用户（authenticated）
  - 学生通过HTML文件提交时使用的是匿名用户（anon）
  - 导致提交失败：401 Unauthorized

  ## 修改
  1. 删除旧的INSERT策略
  2. 创建新的INSERT策略，允许匿名用户提交
     - 对象：anon（匿名用户）
     - 操作：INSERT
     - 条件：无限制（所有学生都可以提交）

  ## 安全考虑
  - 学生提交是公开功能，应该允许匿名访问
  - 数据完整性通过必填字段保证
  - 查看权限仍然受限于认证用户
*/

-- 删除旧的INSERT策略
DROP POLICY IF EXISTS "任何人都可以提交答案" ON student_submissions;

-- 创建新的INSERT策略，允许匿名用户提交
CREATE POLICY "学生可以匿名提交答案"
  ON student_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);
