export type ComponentType =
  | 'title'
  | 'paragraph'
  | 'two-column'
  | 'three-column'
  | 'single-choice'
  | 'multiple-choice'
  | 'fill-blank'
  | 'question-answer'
  | 'lucky-box'
  | 'embed-html'
  | 'image'
  | 'video'
  | 'ai-chatbox'
  | 'page-break'
  | 'hyperlink';

export interface BaseComponent {
  id: string;
  type: ComponentType;
}

export interface TitleComponent extends BaseComponent {
  type: 'title';
  config: {
    text: string;
    size: 'large' | 'medium' | 'small';
    align: 'left' | 'center' | 'right';
  };
}

export interface ParagraphComponent extends BaseComponent {
  type: 'paragraph';
  config: {
    text: string;
    size: 'normal' | 'large';
  };
}

export interface TwoColumnComponent extends BaseComponent {
  type: 'two-column';
  config: {
    leftContent: string;
    rightContent: string;
  };
}

export interface ThreeColumnComponent extends BaseComponent {
  type: 'three-column';
  config: {
    content1: string;
    content2: string;
    content3: string;
  };
}

export interface SingleChoiceComponent extends BaseComponent {
  type: 'single-choice';
  config: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  };
}

export interface MultipleChoiceComponent extends BaseComponent {
  type: 'multiple-choice';
  config: {
    question: string;
    options: string[];
    correctAnswers: number[];
    explanation?: string;
  };
}

export interface FillBlankComponent extends BaseComponent {
  type: 'fill-blank';
  config: {
    text: string;
    correctAnswers?: string[];
  };
}

export interface QuestionAnswerComponent extends BaseComponent {
  type: 'question-answer';
  config: {
    question: string;
    referenceAnswer?: string;
    maxLength?: number;
  };
}

export interface LuckyBoxComponent extends BaseComponent {
  type: 'lucky-box';
  config: {
    title: string;
    options: string[];
    mode: 'random' | 'sequential';
  };
}

export interface EmbedHtmlComponent extends BaseComponent {
  type: 'embed-html';
  config: {
    htmlCode: string;
    height?: number;
  };
}

export interface ImageComponent extends BaseComponent {
  type: 'image';
  config: {
    url: string;
    alt?: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
  };
}

export interface VideoComponent extends BaseComponent {
  type: 'video';
  config: {
    platform: 'bilibili' | 'youtube' | 'custom';
    embedCode: string;
    height?: number;
  };
}

export interface AIChatboxComponent extends BaseComponent {
  type: 'ai-chatbox';
  config: {
    title?: string;
    systemPrompt?: string;
    model?: string;
    placeholder?: string;
    enableThinking?: boolean;
    thinkingType?: 'disabled' | 'auto' | 'enabled';
  };
}

export interface PageBreakComponent extends BaseComponent {
  type: 'page-break';
  config: {
    label?: string;
  };
}

export interface HyperlinkComponent extends BaseComponent {
  type: 'hyperlink';
  config: {
    text: string;
    url: string;
  };
}

export type LessonComponent =
  | TitleComponent
  | ParagraphComponent
  | TwoColumnComponent
  | ThreeColumnComponent
  | SingleChoiceComponent
  | MultipleChoiceComponent
  | FillBlankComponent
  | QuestionAnswerComponent
  | LuckyBoxComponent
  | EmbedHtmlComponent
  | ImageComponent
  | VideoComponent
  | AIChatboxComponent
  | PageBreakComponent
  | HyperlinkComponent;

export interface LessonTask {
  id: string;
  user_id: string;
  title: string;
  content_json: LessonComponent[];
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonControl {
  task_id: string;
  current_page: number;
  control_enabled: boolean;
  navigation_locked: boolean;
  updated_at: string;
  created_at: string;
}

export type ControlMessageType = 'navigate' | 'lock' | 'unlock';

export interface ControlMessage {
  type: ControlMessageType;
  page?: number;
  timestamp: number;
}
