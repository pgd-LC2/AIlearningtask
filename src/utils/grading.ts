import { LessonComponent } from '../types';

export interface ComparisonResult {
  isCorrect: boolean;
  studentAnswer: any;
  correctAnswer: any;
  detail?: string;
}

export function compareAnswers(
  component: LessonComponent,
  studentAnswer: any
): ComparisonResult {
  const correctAnswer = getCorrectAnswer(component);

  if (correctAnswer === null) {
    return {
      isCorrect: false,
      studentAnswer,
      correctAnswer: null,
      detail: '未设置正确答案'
    };
  }

  switch (component.type) {
    case 'single-choice':
      return {
        isCorrect: studentAnswer === correctAnswer,
        studentAnswer,
        correctAnswer
      };

    case 'multiple-choice':
      if (!Array.isArray(studentAnswer) || !Array.isArray(correctAnswer)) {
        return { isCorrect: false, studentAnswer, correctAnswer };
      }
      const sortedStudent = [...studentAnswer].sort();
      const sortedCorrect = [...correctAnswer].sort();
      const isCorrect = JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect);
      return { isCorrect, studentAnswer, correctAnswer };

    case 'fill-blank':
      if (!Array.isArray(studentAnswer) || !Array.isArray(correctAnswer)) {
        return { isCorrect: false, studentAnswer, correctAnswer };
      }
      const allCorrect = studentAnswer.every((answer, index) => {
        const expected = correctAnswer[index];
        if (!expected) return false;
        return normalizeText(answer) === normalizeText(expected);
      });
      return { isCorrect: allCorrect, studentAnswer, correctAnswer };

    case 'question-answer':
      return {
        isCorrect: false,
        studentAnswer,
        correctAnswer,
        detail: '主观题需人工批改'
      };

    default:
      return { isCorrect: false, studentAnswer, correctAnswer };
  }
}

function getCorrectAnswer(component: LessonComponent): any {
  switch (component.type) {
    case 'single-choice':
      return component.config.correctAnswer ?? null;
    case 'multiple-choice':
      return component.config.correctAnswers ?? null;
    case 'fill-blank':
      return component.config.correctAnswers ?? null;
    case 'question-answer':
      return component.config.referenceAnswer ?? null;
    default:
      return null;
  }
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '');
}

export function formatCorrectAnswer(component: LessonComponent): string {
  const correctAnswer = getCorrectAnswer(component);

  if (correctAnswer === null || correctAnswer === undefined) {
    return '未设置';
  }

  switch (component.type) {
    case 'single-choice':
      const option = component.config.options?.[correctAnswer];
      return option ? String.fromCharCode(65 + correctAnswer) : '未设置';

    case 'multiple-choice':
      if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) return '未设置';
      return correctAnswer
        .map(idx => {
          const opt = component.config.options?.[idx];
          return opt ? String.fromCharCode(65 + idx) : '';
        })
        .filter(Boolean)
        .join('、');

    case 'fill-blank':
      if (!Array.isArray(correctAnswer)) return '未设置';
      return correctAnswer.map((a, i) => `空${i + 1}: ${a || '(未设置)'}`).join('、');

    case 'question-answer':
      return correctAnswer || '未设置';

    default:
      return JSON.stringify(correctAnswer);
  }
}
