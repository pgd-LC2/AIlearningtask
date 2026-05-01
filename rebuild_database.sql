/*
  完整重建数据库 Schema

  使用方法：
  1. 打开 Supabase Dashboard -> SQL Editor
  2. 粘贴此文件的全部内容
  3. 点击 Run 执行

  此脚本使用 IF NOT EXISTS 确保安全，可重复执行。
*/

-- ============================================
-- 1. user_profiles 表
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_activated boolean DEFAULT false NOT NULL,
  is_admin boolean DEFAULT false NOT NULL,
  activation_code_id uuid,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can view own profile"
      ON user_profiles FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = id)
      WITH CHECK ((select auth.uid()) = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can insert own profile"
      ON user_profiles FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = id);
  END IF;
END $$;

-- ============================================
-- 2. activation_codes 表
-- ============================================
CREATE TABLE IF NOT EXISTS activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  used boolean DEFAULT false NOT NULL,
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  note text DEFAULT '' NOT NULL
);

ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all activation codes' AND tablename = 'activation_codes') THEN
    CREATE POLICY "Admins can view all activation codes"
      ON activation_codes FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = (select auth.uid())
          AND user_profiles.is_admin = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert activation codes' AND tablename = 'activation_codes') THEN
    CREATE POLICY "Admins can insert activation codes"
      ON activation_codes FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = (select auth.uid())
          AND user_profiles.is_admin = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update activation codes' AND tablename = 'activation_codes') THEN
    CREATE POLICY "Admins can update activation codes"
      ON activation_codes FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = (select auth.uid())
          AND user_profiles.is_admin = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = (select auth.uid())
          AND user_profiles.is_admin = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete activation codes' AND tablename = 'activation_codes') THEN
    CREATE POLICY "Admins can delete activation codes"
      ON activation_codes FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = (select auth.uid())
          AND user_profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- ============================================
-- 3. folders 表
-- ============================================
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own folders' AND tablename = 'folders') THEN
    CREATE POLICY "Users can view own folders"
      ON folders FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own folders' AND tablename = 'folders') THEN
    CREATE POLICY "Users can create own folders"
      ON folders FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own folders' AND tablename = 'folders') THEN
    CREATE POLICY "Users can update own folders"
      ON folders FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own folders' AND tablename = 'folders') THEN
    CREATE POLICY "Users can delete own folders"
      ON folders FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================
-- 4. lesson_tasks 表
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT '未命名学习单' NOT NULL,
  content_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_tasks_user_id ON lesson_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_tasks_folder_id ON lesson_tasks(folder_id);

ALTER TABLE lesson_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own tasks' AND tablename = 'lesson_tasks') THEN
    CREATE POLICY "Users can view own tasks"
      ON lesson_tasks FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own tasks' AND tablename = 'lesson_tasks') THEN
    CREATE POLICY "Users can create own tasks"
      ON lesson_tasks FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own tasks' AND tablename = 'lesson_tasks') THEN
    CREATE POLICY "Users can update own tasks"
      ON lesson_tasks FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own tasks' AND tablename = 'lesson_tasks') THEN
    CREATE POLICY "Users can delete own tasks"
      ON lesson_tasks FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================
-- 5. lesson_task_versions 表
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_task_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES lesson_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content_json jsonb NOT NULL,
  change_description text DEFAULT '' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_task_versions_task_id ON lesson_task_versions(task_id);

ALTER TABLE lesson_task_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own task versions' AND tablename = 'lesson_task_versions') THEN
    CREATE POLICY "Users can view own task versions"
      ON lesson_task_versions FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own task versions' AND tablename = 'lesson_task_versions') THEN
    CREATE POLICY "Users can create own task versions"
      ON lesson_task_versions FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================
-- 6. student_submissions 表
-- ============================================
CREATE TABLE IF NOT EXISTS student_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_task_id uuid REFERENCES lesson_tasks(id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  student_class text DEFAULT '' NOT NULL,
  seat_number text,
  answers jsonb DEFAULT '{}'::jsonb NOT NULL,
  chat_history jsonb,
  review_status text DEFAULT 'pending' NOT NULL CHECK (review_status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_submissions_lesson_task_id ON student_submissions(lesson_task_id);

ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Task creators can view submissions' AND tablename = 'student_submissions') THEN
    CREATE POLICY "Task creators can view submissions"
      ON student_submissions FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = student_submissions.lesson_task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can submit answers' AND tablename = 'student_submissions') THEN
    CREATE POLICY "Anyone can submit answers"
      ON student_submissions FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Task creators can update submissions' AND tablename = 'student_submissions') THEN
    CREATE POLICY "Task creators can update submissions"
      ON student_submissions FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = student_submissions.lesson_task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = student_submissions.lesson_task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Task creators can delete submissions' AND tablename = 'student_submissions') THEN
    CREATE POLICY "Task creators can delete submissions"
      ON student_submissions FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = student_submissions.lesson_task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

-- ============================================
-- 7. lesson_controls 表
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_controls (
  task_id uuid PRIMARY KEY REFERENCES lesson_tasks(id) ON DELETE CASCADE,
  current_page integer DEFAULT 1 NOT NULL,
  control_enabled boolean DEFAULT false NOT NULL,
  navigation_locked boolean DEFAULT false NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE lesson_controls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Task creators can view lesson controls' AND tablename = 'lesson_controls') THEN
    CREATE POLICY "Task creators can view lesson controls"
      ON lesson_controls FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = lesson_controls.task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Task creators can insert lesson controls' AND tablename = 'lesson_controls') THEN
    CREATE POLICY "Task creators can insert lesson controls"
      ON lesson_controls FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = lesson_controls.task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Task creators can update lesson controls' AND tablename = 'lesson_controls') THEN
    CREATE POLICY "Task creators can update lesson controls"
      ON lesson_controls FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = lesson_controls.task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = lesson_controls.task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Task creators can delete lesson controls' AND tablename = 'lesson_controls') THEN
    CREATE POLICY "Task creators can delete lesson controls"
      ON lesson_controls FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM lesson_tasks
          WHERE lesson_tasks.id = lesson_controls.task_id
          AND lesson_tasks.user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active lesson controls' AND tablename = 'lesson_controls') THEN
    CREATE POLICY "Anyone can view active lesson controls"
      ON lesson_controls FOR SELECT
      TO anon, authenticated
      USING (control_enabled = true);
  END IF;
END $$;

-- ============================================
-- 8. 函数与触发器
-- ============================================

-- 新用户注册时自动创建 user_profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, is_activated, is_admin)
  VALUES (NEW.id, false, false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 验证并使用激活码
CREATE OR REPLACE FUNCTION verify_and_use_activation_code(input_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO v_code_id
  FROM public.activation_codes
  WHERE code = input_code AND used = false;

  IF v_code_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.activation_codes
  SET used = true, used_by = v_user_id, used_at = now()
  WHERE id = v_code_id;

  UPDATE public.user_profiles
  SET is_activated = true, activation_code_id = v_code_id, activated_at = now()
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

-- lesson_controls 自动更新时间戳
CREATE OR REPLACE FUNCTION update_lesson_controls_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_lesson_controls_timestamp ON lesson_controls;
CREATE TRIGGER update_lesson_controls_timestamp
  BEFORE UPDATE ON lesson_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_controls_updated_at();

-- 添加 activation_codes 外键引用
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_activation_code_id_fkey'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_activation_code_id_fkey
    FOREIGN KEY (activation_code_id) REFERENCES activation_codes(id);
  END IF;
END $$;
