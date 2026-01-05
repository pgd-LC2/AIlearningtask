import { LessonComponent } from '../types';
import { formatAnswer, getQuestionText, cleanQuestionText, QUESTION_TYPE_LABELS } from './answer';
import { formatDate } from './format';

interface Submission {
  student_class: string;
  student_name: string;
  answers: Record<string, number | number[] | string | string[]>;
  created_at: string;
}

export function generateCSV(
  submissions: Submission[],
  components: LessonComponent[],
  taskTitle: string
): void {
  if (submissions.length === 0) return;

  const questionComponents = components.filter(comp =>
    ['single-choice', 'multiple-choice', 'fill-blank', 'question-answer', 'code-editor'].includes(comp.type)
  );

  const questionHeaders = questionComponents.map((comp, index) => {
    const type = QUESTION_TYPE_LABELS[comp.type] || comp.type;
    let question = getQuestionText(comp);
    question = cleanQuestionText(question);
    const shortQuestion = question.length > 20 ? question.substring(0, 20) + '...' : question;
    return `题${index + 1}(${type}): ${shortQuestion}`;
  });

  const headers = ['班级', '姓名', '提交时间', ...questionHeaders];

  const rows = submissions.map(sub => {
    const answers = questionComponents.map(comp => {
      const answer = sub.answers[comp.id];
      return formatAnswer(comp, answer);
    });

    return [
      sub.student_class,
      sub.student_name,
      formatDate(sub.created_at),
      ...answers
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, taskTitle);
}

function downloadCSV(content: string, taskTitle: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${taskTitle}_提交数据_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
