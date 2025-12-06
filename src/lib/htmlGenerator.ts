import { LessonComponent } from '../types';

export function generateHTML(title: string, components: LessonComponent[]): string {
  const htmlContent = components.map((component, index) => generateComponentHTML(component, index)).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      background: #fafafa;
      color: #171717;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 56rem;
      margin: 0 auto;
    }
    .component {
      background: white;
      border: 2px solid #d4d4d4;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .title-large { font-size: 1.875rem; font-weight: bold; }
    .title-medium { font-size: 1.5rem; font-weight: bold; }
    .title-small { font-size: 1.25rem; font-weight: bold; }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .paragraph-normal { font-size: 1rem; white-space: pre-wrap; }
    .paragraph-large { font-size: 1.125rem; white-space: pre-wrap; }
    .columns { display: grid; gap: 1rem; }
    .columns-2 { grid-template-columns: repeat(2, 1fr); }
    .columns-3 { grid-template-columns: repeat(3, 1fr); }
    .column-content { padding: 1rem; background: #f5f5f5; border-radius: 0.5rem; white-space: pre-wrap; }
    .question { font-weight: 500; margin-bottom: 0.75rem; }
    .options { display: flex; flex-direction: column; gap: 0.5rem; }
    .option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .option:hover { background: #f5f5f5; }
    .option-radio, .option-checkbox {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #d4d4d4;
      flex-shrink: 0;
    }
    .option-radio { border-radius: 50%; }
    .option-checkbox { border-radius: 0.25rem; }
    .option.selected .option-radio,
    .option.selected .option-checkbox {
      background: #3b82f6;
      border-color: #3b82f6;
    }
    .option.correct { background: #d1fae5; border: 2px solid #10b981; }
    .option.incorrect { background: #fee2e2; border: 2px solid #ef4444; }
    .explanation {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      display: none;
    }
    .explanation.show { display: block; }
    .blank-container { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }
    .blank-row { display: flex; align-items: center; gap: 0.5rem; }
    .blank-input {
      flex: 1;
      height: 2.25rem;
      padding: 0 1rem;
      border: 2px solid #d4d4d4;
      border-radius: 0.5rem;
      font-size: 1rem;
    }
    .blank-input.correct { border-color: #10b981; background: #d1fae5; }
    .blank-input.incorrect { border-color: #ef4444; background: #fee2e2; }
    .answer-area {
      width: 100%;
      min-height: 6rem;
      padding: 0.75rem;
      border: 2px solid #d4d4d4;
      border-radius: 0.5rem;
      font-size: 1rem;
      resize: vertical;
      font-family: inherit;
    }
    .reference-answer {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      display: none;
    }
    .reference-answer.show { display: block; }
    .lucky-box {
      text-align: center;
      padding: 2rem;
      background: linear-gradient(to bottom right, #dbeafe, rgba(59, 130, 246, 0.2));
      border-radius: 12px;
    }
    .lucky-box-title { font-weight: 600; margin-bottom: 1rem; }
    .lucky-box-button {
      padding: 0.5rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 999px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .lucky-box-button:hover { background: #2563eb; }
    .lucky-box-result {
      margin-top: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 0.5rem;
      font-weight: 500;
      display: none;
    }
    .lucky-box-result.show { display: block; }
    .embed-container {
      width: 100%;
      border: 1px solid #d4d4d4;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .submit-btn {
      margin-top: 0.75rem;
      padding: 0.5rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .submit-btn:hover { background: #2563eb; }
    .show-answer-btn {
      padding: 0.5rem 1rem;
      background: #f5f5f5;
      border: 1px solid #d4d4d4;
      border-radius: 999px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .show-answer-btn:hover { background: #d4d4d4; }
    @media (max-width: 768px) {
      .columns-2, .columns-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="component">
      <h1 class="title-large text-center">${escapeHtml(title)}</h1>
    </div>
    ${htmlContent}
  </div>
  <script>
    ${generateJavaScript()}
  </script>
</body>
</html>`;
}

function generateComponentHTML(component: LessonComponent, index: number): string {
  const id = `component-${index}`;

  switch (component.type) {
    case 'title':
      const { text, size, align } = component.config;
      return `<div class="component">
        <h1 class="title-${size} text-${align}">${escapeHtml(text)}</h1>
      </div>`;

    case 'paragraph':
      return `<div class="component">
        <p class="paragraph-${component.config.size}">${escapeHtml(component.config.text)}</p>
      </div>`;

    case 'two-column':
      return `<div class="component">
        <div class="columns columns-2">
          <div class="column-content">${escapeHtml(component.config.leftContent)}</div>
          <div class="column-content">${escapeHtml(component.config.rightContent)}</div>
        </div>
      </div>`;

    case 'three-column':
      return `<div class="component">
        <div class="columns columns-3">
          <div class="column-content">${escapeHtml(component.config.content1)}</div>
          <div class="column-content">${escapeHtml(component.config.content2)}</div>
          <div class="column-content">${escapeHtml(component.config.content3)}</div>
        </div>
      </div>`;

    case 'single-choice':
      return `<div class="component">
        <div class="question">${escapeHtml(component.config.question)}</div>
        <div class="options" data-type="single" data-answer="${component.config.correctAnswer}">
          ${component.config.options.map((opt, i) => `
            <div class="option" data-index="${i}">
              <div class="option-radio"></div>
              <span>${String.fromCharCode(65 + i)}. ${escapeHtml(opt)}</span>
            </div>
          `).join('')}
        </div>
        ${component.config.explanation ? `
          <div class="explanation">解析：${escapeHtml(component.config.explanation)}</div>
          <button class="show-answer-btn" onclick="toggleExplanation(this)">查看解析</button>
        ` : ''}
      </div>`;

    case 'multiple-choice':
      return `<div class="component">
        <div class="question">${escapeHtml(component.config.question)}</div>
        <div class="options" data-type="multiple" data-answers="${JSON.stringify(component.config.correctAnswers)}">
          ${component.config.options.map((opt, i) => `
            <div class="option" data-index="${i}">
              <div class="option-checkbox"></div>
              <span>${String.fromCharCode(65 + i)}. ${escapeHtml(opt)}</span>
            </div>
          `).join('')}
        </div>
        <button class="submit-btn" onclick="checkMultipleChoice(this)">提交答案</button>
        ${component.config.explanation ? `
          <div class="explanation">解析：${escapeHtml(component.config.explanation)}</div>
          <button class="show-answer-btn" onclick="toggleExplanation(this)" style="margin-left: 0.5rem;">查看解析</button>
        ` : ''}
      </div>`;

    case 'fill-blank':
      return `<div class="component">
        <div class="question">${escapeHtml(component.config.question)}</div>
        <div class="blank-container">
          ${component.config.blanks.map((blank, i) => `
            <div class="blank-row">
              <span style="color: #525252;">空格 ${i + 1}:</span>
              <input type="text" class="blank-input" data-answer="${escapeHtml(blank.answer)}"
                     data-case="${blank.caseSensitive ? 'true' : 'false'}"
                     onblur="checkBlank(this)" placeholder="输入答案">
            </div>
          `).join('')}
        </div>
        ${component.config.explanation ? `
          <div class="explanation">解析：${escapeHtml(component.config.explanation)}</div>
          <button class="show-answer-btn" onclick="toggleExplanation(this)">查看解析</button>
        ` : ''}
      </div>`;

    case 'question-answer':
      return `<div class="component">
        <div class="question">${escapeHtml(component.config.question)}</div>
        <textarea class="answer-area" placeholder="在此输入您的答案..."
                  ${component.config.maxLength ? `maxlength="${component.config.maxLength}"` : ''}></textarea>
        ${component.config.referenceAnswer ? `
          <div class="reference-answer">参考答案：${escapeHtml(component.config.referenceAnswer)}</div>
          <button class="show-answer-btn" onclick="toggleReference(this)">查看参考答案</button>
        ` : ''}
      </div>`;

    case 'lucky-box':
      return `<div class="component">
        <div class="lucky-box">
          <div class="lucky-box-title">${escapeHtml(component.config.title)}</div>
          <button class="lucky-box-button"
                  onclick="drawLuckyBox(this, ${JSON.stringify(component.config.options)}, '${component.config.mode}')">
            点击抽取
          </button>
          <div class="lucky-box-result"></div>
        </div>
      </div>`;

    case 'embed-html':
      const height = component.config.height || 400;
      if (!component.config.htmlCode) {
        return `<div class="component">
          <div class="embed-container" style="height: ${height}px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px;">
            <p style="color: #9ca3af; font-size: 14px;">无嵌入内容</p>
          </div>
        </div>`;
      }
      return `<div class="component">
        <div class="embed-container" style="height: ${height}px;">
          <iframe srcdoc="${escapeHtml(component.config.htmlCode)}"
                  style="width: 100%; height: 100%; border: none;"
                  sandbox="allow-scripts"></iframe>
        </div>
      </div>`;

    default:
      return '';
  }
}

function generateJavaScript(): string {
  return `
    document.querySelectorAll('.options[data-type="single"] .option').forEach(option => {
      option.addEventListener('click', function() {
        const container = this.closest('.options');
        const selectedIndex = parseInt(this.getAttribute('data-index'));
        const correctAnswer = parseInt(container.getAttribute('data-answer'));

        container.querySelectorAll('.option').forEach(opt => {
          opt.classList.remove('selected', 'correct', 'incorrect');
        });

        this.classList.add('selected');
        if (selectedIndex === correctAnswer) {
          this.classList.add('correct');
        } else {
          this.classList.add('incorrect');
          container.querySelector(\`.option[data-index="\${correctAnswer}"]\`).classList.add('correct');
        }
      });
    });

    document.querySelectorAll('.options[data-type="multiple"] .option').forEach(option => {
      option.addEventListener('click', function() {
        this.classList.toggle('selected');
      });
    });

    function checkMultipleChoice(btn) {
      const container = btn.previousElementSibling;
      const correctAnswers = JSON.parse(container.getAttribute('data-answers'));
      const selectedOptions = Array.from(container.querySelectorAll('.option.selected'))
        .map(opt => parseInt(opt.getAttribute('data-index')));

      const isCorrect = correctAnswers.length === selectedOptions.length &&
                        correctAnswers.every(ans => selectedOptions.includes(ans));

      container.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        const index = parseInt(opt.getAttribute('data-index'));
        if (correctAnswers.includes(index)) {
          opt.classList.add('correct');
        } else if (opt.classList.contains('selected')) {
          opt.classList.add('incorrect');
        }
      });

      btn.textContent = isCorrect ? '回答正确！' : '回答错误';
      btn.style.background = isCorrect ? '#10b981' : '#ef4444';
      btn.disabled = true;
    }

    function checkBlank(input) {
      const answer = input.getAttribute('data-answer');
      const caseSensitive = input.getAttribute('data-case') === 'true';
      const userAnswer = input.value.trim();
      const correctAnswer = answer.trim();

      const isCorrect = caseSensitive
        ? userAnswer === correctAnswer
        : userAnswer.toLowerCase() === correctAnswer.toLowerCase();

      input.classList.remove('correct', 'incorrect');
      if (userAnswer) {
        input.classList.add(isCorrect ? 'correct' : 'incorrect');
      }
    }

    function toggleExplanation(btn) {
      const explanation = btn.previousElementSibling;
      if (explanation.classList.contains('show')) {
        explanation.classList.remove('show');
        btn.textContent = '查看解析';
      } else {
        explanation.classList.add('show');
        btn.textContent = '隐藏解析';
      }
    }

    function toggleReference(btn) {
      const reference = btn.previousElementSibling;
      if (reference.classList.contains('show')) {
        reference.classList.remove('show');
        btn.textContent = '查看参考答案';
      } else {
        reference.classList.add('show');
        btn.textContent = '隐藏参考答案';
      }
    }

    let luckyBoxCounters = {};
    function drawLuckyBox(btn, options, mode) {
      const container = btn.closest('.lucky-box');
      const resultDiv = container.querySelector('.lucky-box-result');
      const boxId = Array.from(document.querySelectorAll('.lucky-box')).indexOf(container);

      if (!luckyBoxCounters[boxId]) {
        luckyBoxCounters[boxId] = 0;
      }

      let result;
      if (mode === 'sequential') {
        result = options[luckyBoxCounters[boxId] % options.length];
        luckyBoxCounters[boxId]++;
      } else {
        result = options[Math.floor(Math.random() * options.length)];
      }

      resultDiv.textContent = result;
      resultDiv.classList.add('show');

      resultDiv.style.animation = 'none';
      setTimeout(() => {
        resultDiv.style.animation = 'fadeIn 0.5s';
      }, 10);
    }
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
