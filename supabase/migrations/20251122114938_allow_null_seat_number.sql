/*
  # 允许座位号为空

  1. 变更
    - 将 seat_number 字段改为可空
    - 这样学生可以选择不填写座位号
  
  2. 安全
    - 不影响现有的RLS策略
*/

-- 允许座位号为空
ALTER TABLE student_submissions 
ALTER COLUMN seat_number DROP NOT NULL;
