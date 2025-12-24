import { LessonComponent } from '../types';

export function getQuestionText(component: LessonComponent): string {
  if (component.type === 'fill-blank') {
    return component.config.text || '';
  }
  if (component.type === 'code-editor') {
    const sections = component.config.sections || [];
    return sections.map((s: any) => s.title).filter(Boolean).join(' / ') || '代码编辑题';
  }
  return component.config.question || '';
}

export function formatAnswer(component: LessonComponent, answer: any): string {
  if (!component) return JSON.stringify(answer);

  switch (component.type) {
    case 'single-choice':
      const option = component.config.options[answer];
      return option ? String.fromCharCode(65 + answer) : '未作答';

    case 'multiple-choice':
      if (!Array.isArray(answer) || answer.length === 0) return '未作答';
      return answer
        .map(idx => {
          const opt = component.config.options[idx];
          return opt ? String.fromCharCode(65 + idx) : '';
        })
        .filter(Boolean)
        .join('、');

    case 'fill-blank':
      if (!Array.isArray(answer)) return '未作答';
      return answer.map((a, i) => `空${i + 1}: ${a || '(未填写)'}`).join('、');

    case 'question-answer':
      return answer || '未作答';

    case 'code-editor':
      return answer || '未作答';

    default:
      return JSON.stringify(answer);
  }
}

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  'single-choice': '单选题',
  'multiple-choice': '多选题',
  'fill-blank': '填空题',
  'question-answer': '问答题',
  'code-editor': '代码编辑'
};

export function cleanQuestionText(text: string): string {
  return text.replace(/^题目[（(].*?[)）]\s*/, '');
}
