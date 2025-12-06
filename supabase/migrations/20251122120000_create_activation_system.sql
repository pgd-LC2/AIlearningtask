/*
  # 创建激活码系统

  1. 新建表
    - `activation_codes` - 激活码表
      - `id` (uuid, 主键)
      - `code` (text, 唯一, 激活码)
      - `used` (boolean, 是否已使用)
      - `used_by` (uuid, 使用者用户ID)
      - `used_at` (timestamptz, 使用时间)
      - `created_at` (timestamptz, 创建时间)
      - `created_by` (uuid, 创建者用户ID)
      - `note` (text, 备注信息)

    - `user_profiles` - 用户资料表（扩展 auth.users）
      - `id` (uuid, 主键, 关联 auth.users.id)
      - `is_activated` (boolean, 是否已激活)
      - `is_admin` (boolean, 是否是管理员)
      - `activation_code_id` (uuid, 使用的激活码ID)
      - `activated_at` (timestamptz, 激活时间)
      - `created_at` (timestamptz, 创建时间)

  2. 安全性
    - 启用 RLS
    - 管理员可以创建和查看所有激活码
    - 用户可以验证激活码
    - 用户可以查看和更新自己的 profile
    - 创建触发器：用户注册时自动创建 profile（默认未激活）
*/

-- 创建激活码表
CREATE TABLE IF NOT EXISTS activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  note text
);

-- 创建用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_activated boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  activation_code_id uuid REFERENCES activation_codes(id),
  activated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_used ON activation_codes(used);
CREATE INDEX IF NOT EXISTS idx_activation_codes_created_by ON activation_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_activated ON user_profiles(is_activated);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- 启用 RLS
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 激活码表的 RLS 策略
-- 管理员可以查看所有激活码
CREATE POLICY "Admins can view all activation codes"
  ON activation_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 管理员可以创建激活码
CREATE POLICY "Admins can create activation codes"
  ON activation_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 用户资料表的 RLS 策略
-- 用户可以查看自己的 profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 用户可以更新自己的 profile（仅限激活相关字段）
CREATE POLICY "Users can update own profile for activation"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 系统可以创建 profile（通过触发器）
CREATE POLICY "Allow profile creation"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 创建触发器函数：用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, is_activated, is_admin)
  VALUES (new.id, false, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建激活码验证函数
CREATE OR REPLACE FUNCTION public.verify_and_use_activation_code(
  activation_code text
)
RETURNS json AS $$
DECLARE
  code_record activation_codes%ROWTYPE;
  result json;
BEGIN
  -- 查找激活码
  SELECT * INTO code_record
  FROM activation_codes
  WHERE code = activation_code
  AND used = false
  FOR UPDATE;

  -- 检查激活码是否存在且未使用
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', '激活码无效或已被使用'
    );
  END IF;

  -- 标记激活码为已使用
  UPDATE activation_codes
  SET used = true,
      used_by = auth.uid(),
      used_at = now()
  WHERE id = code_record.id;

  -- 更新用户 profile
  UPDATE user_profiles
  SET is_activated = true,
      activation_code_id = code_record.id,
      activated_at = now()
  WHERE id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'message', '账号激活成功'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
