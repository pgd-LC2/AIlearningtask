import { LessonComponent } from '../types';

export function generateStudentHTML(title: string, components: LessonComponent[], taskId: string, supabaseUrl: string, supabaseAnonKey: string): string {
  const questionComponents = components.filter(comp =>
    ['single-choice', 'multiple-choice', 'fill-blank', 'question-answer', 'code-editor'].includes(comp.type)
  );

  const answerCollectionCode = questionComponents.map(comp => {
    const safeId = comp.id.replace(/-/g, '_');
    if (comp.type === 'single-choice') {
      return `const radio_${safeId} = document.querySelector('input[name="q_${comp.id}"]:checked');
      if (radio_${safeId}) answers['${comp.id}'] = parseInt(radio_${safeId}.value);`;
    } else if (comp.type === 'multiple-choice') {
      return `const checkboxes_${safeId} = document.querySelectorAll('input[name="q_${comp.id}"]:checked');
      answers['${comp.id}'] = Array.from(checkboxes_${safeId}).map(cb => parseInt(cb.value));`;
    } else if (comp.type === 'fill-blank') {
      const blankCount = (comp.config.text || '').split('__').length - 1;
      const collectCode = [];
      for (let i = 0; i < blankCount; i++) {
        collectCode.push(`const blank_${safeId}_${i} = document.getElementById('q_${comp.id}_${i}');`);
      }
      collectCode.push(`answers['${comp.id}'] = [${Array.from({ length: blankCount }, (_, i) => `blank_${safeId}_${i}?.value || ''`).join(', ')}];`);
      return collectCode.join('\n      ');
    } else if (comp.type === 'question-answer') {
      return `const textarea_${safeId} = document.getElementById('q_${comp.id}');
      if (textarea_${safeId}) answers['${comp.id}'] = textarea_${safeId}.value;`;
    } else if (comp.type === 'code-editor') {
      return `const codeEditor_${safeId} = document.getElementById('code_${comp.id}');
      if (codeEditor_${safeId}) answers['${comp.id}'] = codeEditor_${safeId}.value;`;
    }
    return '';
  }).join('\n      ');

  const pages: LessonComponent[][] = [];
  let currentPage: LessonComponent[] = [];

  components.forEach(comp => {
    if (comp.type === 'page-break') {
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }
    } else {
      currentPage.push(comp);
    }
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  const hasPagination = pages.length > 1;

  let questionIndex = 0;

  const renderComponent = (comp: LessonComponent) => {
    switch (comp.type) {
      case 'title':
        return `<div class="component"><h2 style="font-size: ${comp.config.size === 'large' ? '24px' : comp.config.size === 'medium' ? '20px' : '18px'}; text-align: ${comp.config.align};">${escapeHtml(comp.config.text || '')}</h2></div>`;
      case 'paragraph':
        return `<div class="component"><div style="font-size: ${comp.config.size === 'large' ? '18px' : '16px'}; ${isRichText(comp.config.text || '') ? '' : 'white-space: pre-wrap;'}">${renderTextContent(comp.config.text || '')}</div></div>`;
      case 'hyperlink':
        return `<div class="component"><a href="${escapeHtml(comp.config.url || '')}" target="${comp.config.openInNewTab ? '_blank' : '_self'}" ${comp.config.openInNewTab ? 'rel="noopener noreferrer"' : ''} style="color: #2563eb; text-decoration: underline; font-weight: 500;">${escapeHtml(comp.config.text || '链接')}</a></div>`;
      case 'two-column':
        return `<div class="component"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;"><div style="white-space: pre-wrap;">${escapeHtml(comp.config.leftContent || '')}</div><div style="white-space: pre-wrap;">${escapeHtml(comp.config.rightContent || '')}</div></div></div>`;
      case 'three-column':
        return `<div class="component"><div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;"><div style="white-space: pre-wrap;">${escapeHtml(comp.config.content1 || '')}</div><div style="white-space: pre-wrap;">${escapeHtml(comp.config.content2 || '')}</div><div style="white-space: pre-wrap;">${escapeHtml(comp.config.content3 || '')}</div></div></div>`;
      case 'single-choice':
        questionIndex++;
        return '<div class="component">' +
          '<div class="question">' + questionIndex + '. [单选] ' + escapeHtml(comp.config.question || '') + '</div>' +
          '<div class="options">' +
            (comp.config.options || []).map((opt: string, i: number) =>
              '<label class="option">' +
                '<input type="radio" name="q_' + comp.id + '" value="' + i + '">' +
                '<span>' + String.fromCharCode(65 + i) + '. ' + escapeHtml(opt) + '</span>' +
              '</label>'
            ).join('') +
          '</div>' +
        '</div>';
      case 'multiple-choice':
        questionIndex++;
        return '<div class="component">' +
          '<div class="question">' + questionIndex + '. [多选] ' + escapeHtml(comp.config.question || '') + '</div>' +
          '<div class="options">' +
            (comp.config.options || []).map((opt: string, i: number) =>
              '<label class="option">' +
                '<input type="checkbox" name="q_' + comp.id + '" value="' + i + '">' +
                '<span>' + String.fromCharCode(65 + i) + '. ' + escapeHtml(opt) + '</span>' +
              '</label>'
            ).join('') +
          '</div>' +
        '</div>';
      case 'fill-blank': {
        questionIndex++;
        const text = comp.config.text || '';
        const parts = text.split('__');
        return '<div class="component">' +
          '<div class="question">' + questionIndex + '. [填空] ' +
          parts.map((part: string, partIndex: number) =>
            escapeHtml(part) + (partIndex < parts.length - 1 ? '<input type="text" class="fill-blank-inline" id="q_' + comp.id + '_' + partIndex + '">' : '')
          ).join('') +
          '</div>' +
        '</div>';
      }
      case 'question-answer':
        questionIndex++;
        return '<div class="component">' +
          '<div class="question">' + questionIndex + '. [问答] ' + escapeHtml(comp.config.question || '') + '</div>' +
          '<textarea class="question-answer-input" id="q_' + comp.id + '" rows="6" placeholder="请输入答案"' +
          (comp.config.maxLength ? ' maxlength="' + comp.config.maxLength + '"' : '') + '></textarea>' +
        '</div>';
      case 'lucky-box': {
        const luckyOptions = (comp.config.options || []).map((opt: string) => escapeHtml(opt));
        return '<div class="component">' +
          '<div class="question">' + escapeHtml(comp.config.title || '盲盒抽取') + '</div>' +
          '<button id="lucky_btn_' + comp.id + '" onclick="drawLuckyBox(\'' + comp.id + '\')" class="lucky-btn" ' +
          'style="padding: 12px 24px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 16px; transition: all 0.3s; position: relative; overflow: hidden;">抽取</button>' +
          '<div id="lucky_' + comp.id + '" class="lucky-result" style="margin-top: 16px; font-size: 20px; font-weight: 700; min-height: 30px;"></div>' +
          '<script>window.luckyBoxData = window.luckyBoxData || {}; window.luckyBoxData[\'' + comp.id + '\'] = {options: ' + JSON.stringify(luckyOptions) + ', mode: \'' + (comp.config.mode || 'random') + '\'};</script>' +
        '</div>';
      }
      case 'embed-html': {
        if (!comp.config.htmlCode) return '';
        const embedId = 'embed_' + comp.id;
        const btnRefreshId = 'btn_refresh_' + comp.id;
        const btnPauseId = 'btn_pause_' + comp.id;
        const btnFullscreenId = 'btn_fullscreen_' + comp.id;
        const fullscreenModalId = 'fullscreen_' + comp.id;
        const containerScrollId = 'scroll_' + comp.id;
        const customWidth = comp.config.width ? comp.config.width + 'px' : '100%';
        const customHeight = comp.config.height ? comp.config.height : 800;
        const base64Html = btoa(unescape(encodeURIComponent(comp.config.htmlCode)));
        const isFullDocument = /<!DOCTYPE|<html/i.test(comp.config.htmlCode);

        return '<div class="component">' +
          '<div style="display: flex; gap: 8px; margin-bottom: 12px;">' +
          '<button id="' + btnRefreshId + '" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>' +
          '刷新' +
          '</button>' +
          '<button id="' + btnPauseId + '" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;">' +
          '<svg id="icon_' + btnPauseId + '" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
          '<span id="text_' + btnPauseId + '">暂停</span>' +
          '</button>' +
          '<button id="' + btnFullscreenId + '" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #9333ea; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>' +
          '全屏' +
          '</button>' +
          '</div>' +
          '<div id="' + containerScrollId + '" style="max-height: ' + customHeight + 'px; width: ' + customWidth + '; overflow: auto; border: 1px solid #e5e7eb; border-radius: 8px; background: white;">' +
          '<iframe id="' + embedId + '" class="embed-iframe" sandbox="allow-scripts" style="width: 100%; border: none; min-height: 200px;"></iframe>' +
          '</div>' +
          '<div id="' + fullscreenModalId + '" style="display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.95); flex-direction: column;">' +
          '<div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #111827;">' +
          '<div style="display: flex; gap: 8px;">' +
          '<button id="' + btnRefreshId + '_fs" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>刷新</button>' +
          '<button id="' + btnPauseId + '_fs" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;">' +
          '<svg id="icon_' + btnPauseId + '_fs" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
          '<span id="text_' + btnPauseId + '_fs">暂停</span></button>' +
          '</div>' +
          '<button id="btn_close_' + comp.id + '" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>关闭</button>' +
          '</div>' +
          '<div style="flex: 1; overflow: auto;"><iframe id="' + embedId + '_fs" sandbox="allow-scripts" style="width: 100%; height: 100%; border: none;"></iframe></div>' +
          '</div>' +
          '<script>' +
          '(function() {' +
          '  const iframe = document.getElementById("' + embedId + '");' +
          '  const iframeFs = document.getElementById("' + embedId + '_fs");' +
          '  const btnRefresh = document.getElementById("' + btnRefreshId + '");' +
          '  const btnRefreshFs = document.getElementById("' + btnRefreshId + '_fs");' +
          '  const btnPause = document.getElementById("' + btnPauseId + '");' +
          '  const btnPauseFs = document.getElementById("' + btnPauseId + '_fs");' +
          '  const iconPause = document.getElementById("icon_' + btnPauseId + '");' +
          '  const iconPauseFs = document.getElementById("icon_' + btnPauseId + '_fs");' +
          '  const textPause = document.getElementById("text_' + btnPauseId + '");' +
          '  const textPauseFs = document.getElementById("text_' + btnPauseId + '_fs");' +
          '  const btnFullscreen = document.getElementById("' + btnFullscreenId + '");' +
          '  const btnClose = document.getElementById("btn_close_' + comp.id + '");' +
          '  const fullscreenModal = document.getElementById("' + fullscreenModalId + '");' +
          '  const base64Html = "' + base64Html + '";' +
          '  const html = decodeURIComponent(escape(atob(base64Html)));' +
          '  const isFullDoc = ' + isFullDocument + ';' +
          '  let isPaused = false;' +
          '  function loadContent(target) {' +
          '    const doc = target.contentDocument || target.contentWindow.document;' +
          '    doc.open();' +
          '    if (isFullDoc) { doc.write(html); } else {' +
          '      doc.write("<!DOCTYPE html><html><head><meta charset=\\"UTF-8\\"><style>body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }</style></head><body>" + html + "</body></html>");' +
          '    }' +
          '    doc.close();' +
          '    if (target === iframe) {' +
          '      setTimeout(() => {' +
          '        const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);' +
          '        iframe.style.height = (height + 40) + "px";' +
          '      }, 100);' +
          '    }' +
          '  }' +
          '  loadContent(iframe);' +
          '  function refresh() { loadContent(iframe); if (fullscreenModal.style.display === "flex") loadContent(iframeFs); isPaused = false; iconPause.innerHTML = iconPauseFs.innerHTML = \'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>\'; textPause.textContent = textPauseFs.textContent = "暂停"; }' +
          '  function togglePause() {' +
          '    isPaused = !isPaused;' +
          '    if (isPaused) {' +
          '      [iframe, iframeFs].forEach(f => { const d = f.contentDocument; if (d) d.querySelectorAll("script").forEach(s => s.remove()); });' +
          '      iconPause.innerHTML = iconPauseFs.innerHTML = \'<polygon points="5 3 19 12 5 21 5 3"/>\'; textPause.textContent = textPauseFs.textContent = "继续";' +
          '    } else {' +
          '      [iframe, iframeFs].forEach(f => f.contentWindow.location.reload());' +
          '      iconPause.innerHTML = iconPauseFs.innerHTML = \'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>\'; textPause.textContent = textPauseFs.textContent = "暂停";' +
          '    }' +
          '  }' +
          '  btnRefresh.addEventListener("click", refresh); btnRefreshFs.addEventListener("click", refresh);' +
          '  btnPause.addEventListener("click", togglePause); btnPauseFs.addEventListener("click", togglePause);' +
          '  btnRefresh.addEventListener("mouseenter", function() { this.style.background = "#2563eb"; }); btnRefresh.addEventListener("mouseleave", function() { this.style.background = "#3b82f6"; });' +
          '  btnRefreshFs.addEventListener("mouseenter", function() { this.style.background = "#2563eb"; }); btnRefreshFs.addEventListener("mouseleave", function() { this.style.background = "#3b82f6"; });' +
          '  btnPause.addEventListener("mouseenter", function() { this.style.background = "#4b5563"; }); btnPause.addEventListener("mouseleave", function() { this.style.background = "#6b7280"; });' +
          '  btnPauseFs.addEventListener("mouseenter", function() { this.style.background = "#4b5563"; }); btnPauseFs.addEventListener("mouseleave", function() { this.style.background = "#6b7280"; });' +
          '  btnFullscreen.addEventListener("mouseenter", function() { this.style.background = "#7c3aed"; }); btnFullscreen.addEventListener("mouseleave", function() { this.style.background = "#9333ea"; });' +
          '  btnClose.addEventListener("mouseenter", function() { this.style.background = "#dc2626"; }); btnClose.addEventListener("mouseleave", function() { this.style.background = "#ef4444"; });' +
          '  btnFullscreen.addEventListener("click", function() { fullscreenModal.style.display = "flex"; loadContent(iframeFs); });' +
          '  btnClose.addEventListener("click", function() { fullscreenModal.style.display = "none"; });' +
          '})();' +
          '</script>' +
        '</div>';
      }
      case 'image': {
        if (!comp.config.url) return '';
        const imgAlign = comp.config.align || 'center';
        const imgTextAlign = imgAlign === 'left' ? 'text-align: left;' : imgAlign === 'right' ? 'text-align: right;' : 'text-align: center;';
        return '<div class="component" style="text-align: ' + imgAlign + ';">' +
          '<div style="display: inline-block; max-width: ' + (comp.config.width || 100) + '%; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">' +
          '<img src="' + escapeHtml(comp.config.url) + '" alt="' + escapeHtml(comp.config.alt || '') + '" ' +
          'style="width: 100%; height: auto; border-radius: 4px; display: block;">' +
          (comp.config.alt ? '<p style="margin-top: 8px; font-size: 14px; color: #4b5563; ' + imgTextAlign + '">' + escapeHtml(comp.config.alt) + '</p>' : '') +
          '</div>' +
        '</div>';
      }
      case 'video': {
        if (!comp.config.embedCode) return '';
        const videoHeight = comp.config.height || 400;
        let embedCode = comp.config.embedCode.trim();

        embedCode = embedCode.replace(/src=["'](\/\/[^"']+)["']/gi, 'src="https:$1"');

        embedCode = embedCode.replace(/src=["']([^"']*player\.bilibili\.com[^"']*)["']/gi, (match, url) => {
          if (url.includes('autoplay=')) {
            url = url.replace(/[?&]autoplay=[01]/gi, '');
          }
          const separator = url.includes('?') ? '&' : '?';
          return 'src="' + url + separator + 'autoplay=0"';
        });

        if (embedCode.includes('<iframe')) {
          embedCode = embedCode.replace(/<iframe([^>]*)>/gi, (match, attributes) => {
            let newAttributes = attributes;

            newAttributes = newAttributes.replace(/\s*width\s*=\s*["'][^"']*["']/gi, '');
            newAttributes = newAttributes.replace(/\s*height\s*=\s*["'][^"']*["']/gi, '');
            newAttributes = newAttributes.replace(/\s*scrolling\s*=\s*["'][^"']*["']/gi, '');
            newAttributes = newAttributes.replace(/\s*border\s*=\s*["'][^"']*["']/gi, '');
            newAttributes = newAttributes.replace(/\s*frameborder\s*=\s*["'][^"']*["']/gi, '');
            newAttributes = newAttributes.replace(/\s*framespacing\s*=\s*["'][^"']*["']/gi, '');

            const hasStyle = /style\s*=/i.test(newAttributes);
            if (hasStyle) {
              newAttributes = newAttributes.replace(/style\s*=\s*["']([^"']*)["']/i,
                'style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"');
            } else {
              newAttributes = newAttributes + ' style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"';
            }

            if (!/allowfullscreen/i.test(newAttributes)) {
              newAttributes = newAttributes + ' allowfullscreen';
            }

            return '<iframe' + newAttributes + '>';
          });
        }

        return '<div class="component video-component">' +
          '<div style="position: relative; width: 100%; padding-top: ' + ((videoHeight / 800) * 100) + '%; overflow: hidden; border-radius: 12px; background: #000;">' +
          embedCode +
          '</div>' +
        '</div>';
      }
      case 'ai-chatbox':
        return '<div class="component ai-chatbox-component" id="chatbox_' + comp.id + '">' +
          '<div class="chatbox-header">' +
            '<span>' + escapeHtml(comp.config.title || 'AI 对话') + '</span>' +
            '<div class="chatbox-header-actions">' +
              '<button onclick="window.clearChatHistory(\'' + comp.id + '\')" class="chatbox-action-btn" title="清空对话">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
                '</svg>' +
              '</button>' +
              '<button onclick="window.exportChatHistory(\'' + comp.id + '\')" class="chatbox-action-btn" title="导出对话">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' +
                '</svg>' +
              '</button>' +
              '<button onclick="window.toggleChatFullscreen(\'' + comp.id + '\')" class="chatbox-action-btn" title="全屏">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>' +
                '</svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="chatbox-messages" id="messages_' + comp.id + '">' +
            '<div class="chatbox-empty">开始与 AI 对话...</div>' +
          '</div>' +
          '<div id="attachments_' + comp.id + '" class="chatbox-attachments"></div>' +
          '<div class="chatbox-input-container">' +
            '<div class="attachment-btn-container">' +
              '<button onclick="window.toggleAttachmentMenu(\'' + comp.id + '\')" class="attachment-btn" id="attachBtn_' + comp.id + '">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M12 5v14M5 12h14"/>' +
                '</svg>' +
              '</button>' +
              '<div id="attachMenu_' + comp.id + '" class="attachment-menu" style="display: none;">' +
                '<button onclick="window.triggerFileUpload(\'' + comp.id + '\', \'image\')" class="attachment-menu-item">' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>' +
                  '</svg>' +
                  '上传图片' +
                '</button>' +
                '<button onclick="window.addLink(\'' + comp.id + '\')" class="attachment-menu-item">' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' +
                  '</svg>' +
                  '添加链接' +
                '</button>' +
              '</div>' +
              '<input type="file" id="fileInput_' + comp.id + '" style="display: none;" onchange="window.handleFileUpload(\'' + comp.id + '\', event)" accept="image/*">' +
            '</div>' +
            '<input type="text" id="input_' + comp.id + '" class="chatbox-input" placeholder="' + escapeHtml(comp.config.placeholder || '输入消息...') + '" ' +
              'data-model="' + escapeHtml(comp.config.model || 'kimi-k2-thinking-251104') + '" ' +
              'data-systemprompt="' + escapeHtml(comp.config.systemPrompt || '') + '">' +
            '<button onclick="window.sendChatMessage(\'' + comp.id + '\')" class="chatbox-send-btn">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>';
      case 'ai-html-generator': {
        const genId = 'gen_' + comp.id;
        const parametersHtml = (comp.config.parameters || []).map((param: { type: string; name: string; placeholder?: string; required?: boolean; label: string; options?: string[] }) => {
          let inputHtml = '';
          if (param.type === 'text') {
            inputHtml = '<input type="text" id="param_' + comp.id + '_' + param.name + '" ' +
              'class="generator-input" ' +
              (param.placeholder ? 'placeholder="' + escapeHtml(param.placeholder) + '" ' : '') +
              (param.required ? 'required ' : '') + '/>';
          } else if (param.type === 'select') {
            inputHtml = '<select id="param_' + comp.id + '_' + param.name + '" class="generator-input" ' +
              (param.required ? 'required' : '') + '>' +
              '<option value="">请选择...</option>' +
              (param.options || []).map(opt => '<option value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</option>').join('') +
              '</select>';
          } else if (param.type === 'color') {
            inputHtml = '<input type="color" id="param_' + comp.id + '_' + param.name + '" ' +
              'class="generator-input-color" value="#3b82f6" />';
          }
          return '<div class="generator-param">' +
            '<label class="generator-label">' +
              escapeHtml(param.label) +
              (param.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : '') +
            '</label>' +
            inputHtml +
          '</div>';
        }).join('');

        return '<div class="component ai-generator-component" id="' + genId + '">' +
          (comp.config.title ? '<h3 class="generator-title">' + escapeHtml(comp.config.title) + '</h3>' : '') +
          (comp.config.description ? '<p class="generator-description">' + escapeHtml(comp.config.description) + '</p>' : '') +
          '<div class="generator-form">' +
            parametersHtml +
            '<button onclick="window.generateHTML(\'' + comp.id + '\')" id="genBtn_' + comp.id + '" ' +
              'class="generator-btn">' +
              escapeHtml(comp.config.buttonText || '生成 HTML 游戏') +
            '</button>' +
          '</div>' +
          '<div id="output_' + comp.id + '" class="generator-output" style="display: none;"></div>' +
          '<div id="render_' + comp.id + '" class="generator-render" style="display: none;">' +
            '<div class="generator-render-header">' +
              '<span>渲染结果</span>' +
              '<button onclick="window.clearGeneratedHTML(\'' + comp.id + '\')" class="generator-clear-btn">清除</button>' +
            '</div>' +
            '<iframe id="iframe_' + comp.id + '" class="generator-iframe" sandbox="allow-scripts"></iframe>' +
          '</div>' +
          '<script>' +
            'window.generatorConfig = window.generatorConfig || {};' +
            'window.generatorConfig[\'' + comp.id + '\'] = {' +
              'promptTemplate: ' + JSON.stringify(comp.config.promptTemplate || '') + ',' +
              'model: ' + JSON.stringify(comp.config.model || 'doubao-seed-code-preview-251028') + ',' +
              'parameters: ' + JSON.stringify((comp.config.parameters || []).map(p => ({ name: p.name, required: p.required }))) +
            '};' +
          '</script>' +
        '</div>';
      }
      case 'code-editor': {
        questionIndex++;
        const sectionsHTML = (comp.config.sections || []).map((section: { color?: string; title?: string }) =>
          '<div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">' +
            '<div style="width: 4px; min-height: 32px; border-radius: 4px; background-color: ' + (section.color || '#3b82f6') + ';"></div>' +
            '<div style="flex: 1;">' +
              renderTextContent(section.title || '') +
            '</div>' +
          '</div>'
        ).join('');

        return '<div class="component">' +
          '<div class="question">' + questionIndex + '. [代码编辑] </div>' +
          sectionsHTML +
          '<div style="border: 1px solid #374151; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 12px;">' +
            '<div style="background: #111827; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #374151;">' +
              '<span style="color: #9ca3af; font-family: monospace; font-size: 12px;">' + escapeHtml(comp.config.language || 'python') + '</span>' +
            '</div>' +
            '<textarea id="code_' + comp.id + '" ' +
              'style="width: 100%; padding: 16px; background: #111827; color: #f3f4f6; font-family: \'Courier New\', monospace; font-size: 14px; ' +
              'resize: vertical; border: none; outline: none; min-height: 240px; box-sizing: border-box;" ' +
              'placeholder="' + escapeHtml(comp.config.placeholder || '请在此输入代码...') + '" ' +
              'onkeydown="if(event.key===\'Tab\'){event.preventDefault();const s=this.selectionStart;const e=this.selectionEnd;this.value=this.value.substring(0,s)+\'    \'+this.value.substring(e);this.selectionStart=this.selectionEnd=s+4;}">' +
              escapeHtml(comp.config.initialCode || '') +
            '</textarea>' +
          '</div>' +
        '</div>';
      }
      default:
        return '';
    }
  };

  const pagesHTML = hasPagination
    ? pages.map((pageComponents, pageIndex) => `
      <div class="page" data-page="${pageIndex}" style="display: ${pageIndex === 0 ? 'block' : 'none'};">
        ${pageComponents.map(comp => renderComponent(comp)).join('')}
      </div>
    `).join('')
    : `<div class="page">${components.filter(c => c.type !== 'page-break').map(comp => renderComponent(comp)).join('')}</div>`;

  const paginationHTML = hasPagination ? `
    <div class="pagination">
      <button id="prevBtn" onclick="changePage(-1)" class="page-btn" disabled>上一页</button>
      <span id="pageInfo" class="page-info">第 1 / ${pages.length} 页</span>
      <button id="nextBtn" onclick="changePage(1)" class="page-btn">下一页</button>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script>
    // 多CDN备用加载方案
    (function() {
      const cdnSources = {
        supabase: [
          'https://unpkg.com/@supabase/supabase-js@2',
          'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
          'https://cdn.skypack.dev/@supabase/supabase-js@2'
        ],
        marked: [
          'https://unpkg.com/marked@11/marked.min.js',
          'https://cdn.jsdelivr.net/npm/marked@11/marked.min.js',
          'https://cdn.skypack.dev/marked@11'
        ]
      };

      function loadScriptWithFallback(name, urls, index = 0) {
        return new Promise((resolve, reject) => {
          if (index >= urls.length) {
            reject(new Error(\`所有CDN加载失败: \${name}\`));
            return;
          }

          const script = document.createElement('script');
          script.src = urls[index];
          script.timeout = 10000;

          const timer = setTimeout(() => {
            script.remove();
            console.warn(\`CDN超时，尝试下一个: \${urls[index]}\`);
            loadScriptWithFallback(name, urls, index + 1).then(resolve).catch(reject);
          }, 10000);

          script.onload = () => {
            clearTimeout(timer);
            console.log(\`成功加载 \${name} from \${urls[index]}\`);
            resolve();
          };

          script.onerror = () => {
            clearTimeout(timer);
            script.remove();
            console.warn(\`CDN失败，尝试下一个: \${urls[index]}\`);
            loadScriptWithFallback(name, urls, index + 1).then(resolve).catch(reject);
          };

          document.head.appendChild(script);
        });
      }

      window.initializeLibraries = async function() {
        try {
          await loadScriptWithFallback('Supabase', cdnSources.supabase);
          await loadScriptWithFallback('Marked', cdnSources.marked);
          return true;
        } catch (error) {
          console.error('库加载失败:', error);
          alert('网络资源加载失败，请检查网络连接后刷新页面。\\n\\n如果问题持续，请联系老师。');
          return false;
        }
      };
    })();
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #dbeafe 0%, #f3e8ff 50%, #fce7f3 100%); padding: 32px 16px; line-height: 1.6; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3); }
    .header h1 { font-size: 32px; color: white; margin-bottom: 8px; font-weight: 700; }
    .header p { color: rgba(255, 255, 255, 0.9); font-size: 16px; }
    .component { background: white; padding: 24px; border-radius: 16px; margin-bottom: 16px; border: 1px solid #e0e7ff; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1); }
    .question { font-weight: 600; color: #111827; margin-bottom: 16px; font-size: 17px; }
    .options { display: flex; flex-direction: column; gap: 10px; }
    .option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 2px solid #e0e7ff; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .option:hover { background: linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%); border-color: #a78bfa; transform: translateX(4px); }
    .option input[type="radio"], .option input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; accent-color: #8b5cf6; }
    .fill-blank-input, .question-answer-input { width: 100%; padding: 12px 16px; border: 2px solid #e0e7ff; border-radius: 10px; font-size: 14px; font-family: inherit; resize: vertical; transition: all 0.2s; }
    .fill-blank-input:focus, .question-answer-input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
    .fill-blank-inline { display: inline-block; min-width: 120px; padding: 6px 16px; border: none; border-bottom: 3px solid #8b5cf6; background: linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%); font-size: 14px; text-align: center; margin: 0 6px; border-radius: 4px 4px 0 0; transition: all 0.2s; }
    .fill-blank-inline:focus { outline: none; border-bottom-color: #6d28d9; background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%); transform: translateY(-2px); }
    .question-answer-input { min-height: 120px; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 20px; margin: 24px 0; padding: 16px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1); }
    .page-btn { padding: 10px 24px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 15px; transition: all 0.2s; }
    .page-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; background: #9ca3af; }
    .page-info { font-weight: 600; color: #4b5563; font-size: 15px; }
    .submit-section { background: linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%); padding: 28px; border-radius: 16px; margin-top: 24px; border: 2px solid #8b5cf6; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2); }
    .submit-section h3 { font-size: 20px; color: #111827; margin-bottom: 20px; font-weight: 700; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
    .form-group label { display: block; font-size: 14px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
    .form-group input, .form-group select { width: 100%; padding: 12px 14px; border: 2px solid #e0e7ff; border-radius: 10px; font-size: 14px; transition: all 0.2s; background: white; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
    .form-group select { cursor: pointer; }
    .submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; border-radius: 12px; font-size: 17px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
    .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5); }
    .submit-btn:active { transform: translateY(0); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .success { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #34d399; padding: 20px; border-radius: 12px; text-align: center; color: #065f46; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
    .error { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #f87171; padding: 20px; border-radius: 12px; text-align: center; color: #991b1b; font-weight: 700; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
    .lucky-btn:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5); }
    .lucky-btn:active { transform: scale(0.98); }
    .lucky-btn.spinning { animation: shake 0.5s ease-in-out; pointer-events: none; }
    .lucky-result { transition: all 0.3s ease; }
    .lucky-result.show { animation: fadeInScale 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
    .lucky-result.show { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px 24px; border-radius: 12px; border: 2px solid #fbbf24; color: #92400e; box-shadow: 0 4px 16px rgba(251, 191, 36, 0.4); }
    @keyframes shake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-2deg); }
      20%, 40%, 60%, 80% { transform: translateX(4px) rotate(2deg); }
    }
    @keyframes fadeInScale {
      0% { opacity: 0; transform: scale(0.8) translateY(-10px); }
      50% { transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .ai-chatbox-component { border: 2px solid #06b6d4; overflow: hidden; display: flex; flex-direction: column; }
    .chatbox-header { background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); color: white; padding: 16px; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: space-between; }
    .chatbox-header-actions { display: flex; gap: 6px; }
    .chatbox-action-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; background: rgba(255, 255, 255, 0.2); color: white; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .chatbox-action-btn:hover { background: rgba(255, 255, 255, 0.3); transform: scale(1.05); }
    .chatbox-action-btn:active { transform: scale(0.95); }
    .chatbox-fullscreen-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; background: rgba(0, 0, 0, 0.9); display: none; flex-direction: column; }
    .chatbox-fullscreen-overlay.active { display: flex; }
    .chatbox-fullscreen-overlay .chatbox-header { font-size: 18px; }
    .chatbox-fullscreen-overlay .chatbox-messages { flex: 1; height: auto; }
    .chatbox-fullscreen-overlay .ai-chatbox-component { width: 100%; height: 100%; display: flex; flex-direction: column; border-radius: 0; }
    .chatbox-fullscreen-overlay .chatbox-input-container { border-radius: 0; }
    .chatbox-fullscreen-overlay .attachment-menu { z-index: 10000; }
    .chatbox-messages { height: 400px; overflow-y: auto; padding: 16px; background: #f9fafb; display: flex; flex-direction: column; gap: 12px; }
    .chatbox-empty { text-align: center; color: #9ca3af; font-size: 14px; margin: auto; }
    .chat-message { max-width: 80%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; animation: fadeInScale 0.3s ease; position: relative; }
    .chat-message.user { background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); color: white; margin-left: auto; border-bottom-right-radius: 4px; white-space: pre-wrap; }
    .chat-message.assistant { background: white; color: #111827; border: 1px solid #e0e7ff; border-bottom-left-radius: 4px; }
    .chat-message-copy-btn { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; padding: 0; background: rgba(0, 0, 0, 0.1); border: none; border-radius: 4px; cursor: pointer; display: none; align-items: center; justify-content: center; transition: all 0.2s; }
    .chat-message:hover .chat-message-copy-btn { display: flex; }
    .chat-message-copy-btn:hover { background: rgba(0, 0, 0, 0.2); }
    .chat-message.user .chat-message-copy-btn { background: rgba(255, 255, 255, 0.3); }
    .chat-message.user .chat-message-copy-btn:hover { background: rgba(255, 255, 255, 0.4); }
    .chat-message.assistant h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
    .chat-message.assistant h2 { font-size: 1.3em; font-weight: 600; margin: 0.5em 0; }
    .chat-message.assistant h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0; }
    .chat-message.assistant p { margin: 0.5em 0; }
    .chat-message.assistant ul, .chat-message.assistant ol { margin: 0.5em 0; padding-left: 1.5em; }
    .chat-message.assistant li { margin: 0.25em 0; }
    .chat-message.assistant code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
    .chat-message.assistant pre { background: #1f2937; color: #f9fafb; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0.5em 0; }
    .chat-message.assistant pre code { background: transparent; padding: 0; color: inherit; }
    .chat-message.assistant blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; margin: 0.5em 0; color: #6b7280; }
    .chat-message.assistant a { color: #3b82f6; text-decoration: underline; }
    .chat-message.assistant strong { font-weight: 600; }
    .chat-message.assistant em { font-style: italic; }
    .chat-message.loading { background: white; border: 1px solid #e0e7ff; padding: 12px; display: flex; align-items: center; justify-content: center; width: 60px; }
    .chat-loading-spinner { width: 24px; height: 24px; border: 3px solid #e0e7ff; border-top-color: #06b6d4; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .reasoning-toggle { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; width: 100%; }
    .reasoning-toggle:hover { opacity: 0.8; }
    .reasoning-content { margin-top: 8px; }
    .reasoning-content.collapsed { display: none; }
    .chatbox-attachments { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px 8px 12px; background: white; }
    .attachment-tag { display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: #f3f4f6; border-radius: 8px; font-size: 12px; }
    .attachment-tag svg { width: 12px; height: 12px; }
    .attachment-tag .remove-btn { margin-left: 4px; color: #ef4444; cursor: pointer; }
    .attachment-tag .remove-btn:hover { color: #dc2626; }
    .chatbox-input-container { display: flex; gap: 8px; padding: 12px; background: white; border-top: 1px solid #e0e7ff; }
    .attachment-btn-container { position: relative; }
    .attachment-btn { width: 40px; height: 40px; border-radius: 999px; border: 2px solid #d1d5db; background: white; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
    .attachment-btn:hover { background: #f3f4f6; }
    .attachment-menu { position: absolute; bottom: 100%; left: 0; margin-bottom: 8px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; z-index: 10; min-width: 150px; }
    .attachment-menu-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px 16px; font-size: 14px; border: none; background: white; cursor: pointer; text-align: left; transition: background 0.2s; }
    .attachment-menu-item:hover { background: #f9fafb; }
    .attachment-menu-item svg { flex-shrink: 0; }
    .chatbox-input { flex: 1; padding: 0 16px; height: 40px; border: 2px solid #e0e7ff; border-radius: 999px; font-size: 14px; font-family: inherit; transition: all 0.2s; }
    .chatbox-input:focus { outline: none; border-color: #06b6d4; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1); }
    .chatbox-send-btn { width: 40px; height: 40px; border-radius: 999px; background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
    .chatbox-send-btn:hover { opacity: 0.9; transform: scale(1.05); }
    .chatbox-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .ai-generator-component { border: 2px solid #06b6d4; border-radius: 20px; padding: 24px; background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%); }
    .generator-title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 8px; }
    .generator-description { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
    .generator-form { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .generator-param { margin-bottom: 16px; }
    .generator-param:last-of-type { margin-bottom: 20px; }
    .generator-label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
    .generator-input { width: 100%; height: 44px; padding: 0 16px; border: 2px solid #e5e7eb; border-radius: 999px; font-size: 14px; font-family: inherit; transition: all 0.2s; background: #f9fafb; box-sizing: border-box; }
    .generator-input:focus { outline: none; border-color: #06b6d4; background: white; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1); }
    .generator-input:hover { border-color: #d1d5db; }
    select.generator-input { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 44px; }
    .generator-input-color { width: 100%; height: 44px; padding: 6px; border: 2px solid #e5e7eb; border-radius: 999px; cursor: pointer; background: #f9fafb; transition: all 0.2s; }
    .generator-input-color:hover { border-color: #d1d5db; }
    .generator-input-color:focus { outline: none; border-color: #06b6d4; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1); }
    .generator-btn { width: 100%; height: 48px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; border: none; border-radius: 999px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35); }
    .generator-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4); }
    .generator-btn:active { transform: translateY(0); }
    .generator-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .generator-output { margin-top: 16px; padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 16px; }
    .generator-render { margin-top: 16px; border: 2px solid #06b6d4; border-radius: 16px; overflow: hidden; background: white; }
    .generator-render-header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
    .generator-clear-btn { padding: 8px 16px; background: rgba(255, 255, 255, 0.2); color: white; border: none; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .generator-clear-btn:hover { background: rgba(255, 255, 255, 0.3); }
    .generator-iframe { width: 100%; min-height: 400px; height: 600px; border: none; display: block; }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .pagination { gap: 12px; }
      .page-btn { padding: 8px 16px; font-size: 14px; }
      .chatbox-messages { height: 300px; }
    }
  </style>
</head>
<body>
  <div id="loadingOverlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999;">
    <div style="width: 60px; height: 60px; border: 5px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <div style="margin-top: 24px; color: white; font-size: 18px; font-weight: 600;">正在初始化学习单...</div>
    <div style="margin-top: 8px; color: rgba(255, 255, 255, 0.8); font-size: 14px;">检查流程控制状态</div>
  </div>
  <div id="mainContent" class="container" style="display: none;">
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <p>请认真完成以下题目，完成后填写信息并提交</p>
      <div id="controlBanner" style="display: none; margin-top: 16px; padding: 12px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; border: 2px solid rgba(255, 255, 255, 0.3);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style="color: white; font-weight: 600; font-size: 14px;">教师流程控制模式</span>
          <span id="controlStatus" style="color: rgba(255, 255, 255, 0.9); font-size: 13px;">(连接中...)</span>
        </div>
        <div style="margin-top: 6px; padding-left: 28px; color: rgba(255, 255, 255, 0.85); font-size: 12px;">
          由教师统一控制页面切换，学生端翻页功能已禁用
        </div>
      </div>
    </div>

    ${pagesHTML}

    ${paginationHTML}

    <div id="submitSection" class="submit-section"${hasPagination ? ' style="display: none;"' : ''}>
      <h3>提交答案</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>班级 *</label>
          <select id="studentClass" required>
            <option value="">请选择班级</option>
            <option value="1">1班</option>
            <option value="2">2班</option>
            <option value="3">3班</option>
            <option value="4">4班</option>
            <option value="5">5班</option>
            <option value="6">6班</option>
            <option value="7">7班</option>
            <option value="8">8班</option>
            <option value="9">9班</option>
            <option value="10">10班</option>
          </select>
        </div>
        <div class="form-group">
          <label>姓名 *</label>
          <input type="text" id="studentName" required placeholder="输入姓名">
        </div>
      </div>
      <button class="submit-btn" onclick="window.submitAnswers()">提交答案</button>
      <div id="message" style="margin-top: 16px;"></div>
    </div>
  </div>

  <script>
    const SUPABASE_URL = '${supabaseUrl}';
    const SUPABASE_ANON_KEY = '${supabaseAnonKey}';
    const TASK_ID = '${taskId}';
    const HAS_PAGINATION = ${hasPagination};
    const TOTAL_PAGES = ${pages.length};
    const STORAGE_KEY = 'student_answers_' + TASK_ID;
    const CHAT_STORAGE_KEY = 'chat_history_' + TASK_ID;

    let supabaseClient;

    async function initializeApp() {
      console.log('开始初始化应用...');

      const loadSuccess = await window.initializeLibraries();
      if (!loadSuccess) {
        document.body.innerHTML = '<div style="text-align:center;padding:40px;"><h2 style="color:#ef4444;">加载失败</h2><p>网络资源加载失败，请检查网络连接后刷新页面。</p></div>';
        return;
      }

      console.log('Supabase配置:', {
        url: SUPABASE_URL,
        taskId: TASK_ID,
        hasAnonKey: !!SUPABASE_ANON_KEY,
        anonKeyLength: SUPABASE_ANON_KEY?.length
      });

      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      console.log('应用初始化完成');
      initializeContent();
    }

    function initializeContent() {

    window.luckyBoxData = window.luckyBoxData || {};
    let currentPage = 0;
    let usedLuckyOptions = {};

    function saveToLocalStorage() {
      try {
        const data = {
          studentClass: document.getElementById('studentClass')?.value || '',
          studentName: document.getElementById('studentName')?.value || '',
          answers: {},
          timestamp: Date.now()
        };

        document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
          const questionId = radio.name.replace('q_', '');
          data.answers[questionId] = { type: 'radio', value: parseInt(radio.value) };
        });

        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          const questionId = checkbox.name.replace('q_', '');
          if (!data.answers[questionId]) {
            data.answers[questionId] = { type: 'checkbox', value: [] };
          }
          if (checkbox.checked) {
            data.answers[questionId].value.push(parseInt(checkbox.value));
          }
        });

        document.querySelectorAll('input[type="text"].fill-blank-inline').forEach(input => {
          const matches = input.id.match(/q_(.+)_(\\d+)/);
          if (matches) {
            const questionId = matches[1];
            const blankIndex = parseInt(matches[2]);
            if (!data.answers[questionId]) {
              data.answers[questionId] = { type: 'fillblank', value: [] };
            }
            data.answers[questionId].value[blankIndex] = input.value;
          }
        });

        document.querySelectorAll('textarea.question-answer-input').forEach(textarea => {
          const questionId = textarea.id.replace('q_', '');
          data.answers[questionId] = { type: 'textarea', value: textarea.value };
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('保存到localStorage失败:', e);
      }
    }

    function loadFromLocalStorage() {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return;

        const data = JSON.parse(savedData);

        if (data.studentClass) {
          const classSelect = document.getElementById('studentClass');
          if (classSelect) classSelect.value = data.studentClass;
        }

        if (data.studentName) {
          const nameInput = document.getElementById('studentName');
          if (nameInput) nameInput.value = data.studentName;
        }

        Object.keys(data.answers).forEach(questionId => {
          const answer = data.answers[questionId];

          if (answer.type === 'radio') {
            const radio = document.querySelector('input[name="q_' + questionId + '"][value="' + answer.value + '"]');
            if (radio) radio.checked = true;
          } else if (answer.type === 'checkbox') {
            answer.value.forEach(val => {
              const checkbox = document.querySelector('input[name="q_' + questionId + '"][value="' + val + '"]');
              if (checkbox) checkbox.checked = true;
            });
          } else if (answer.type === 'fillblank') {
            answer.value.forEach((val, index) => {
              const input = document.getElementById('q_' + questionId + '_' + index);
              if (input) input.value = val;
            });
          } else if (answer.type === 'textarea') {
            const textarea = document.getElementById('q_' + questionId);
            if (textarea) textarea.value = answer.value;
          }
        });

        console.log('已从本地缓存恢复答案');
      } catch (e) {
        console.error('从localStorage加载失败:', e);
      }
    }

    function saveChatHistory() {
      try {
        const chatData = {
          history: window.chatHistory || {},
          attachments: window.attachmentData || {},
          timestamp: Date.now()
        };
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatData));
      } catch (e) {
        console.error('保存聊天记录失败:', e);
      }
    }

    function loadChatHistory() {
      try {
        const savedChat = localStorage.getItem(CHAT_STORAGE_KEY);
        if (!savedChat) return;

        const chatData = JSON.parse(savedChat);
        window.chatHistory = chatData.history || {};
        window.attachmentData = chatData.attachments || {};

        Object.keys(window.chatHistory).forEach(chatboxId => {
          const messagesDiv = document.getElementById('messages_' + chatboxId);
          if (!messagesDiv) return;

          const emptyDiv = messagesDiv.querySelector('.chatbox-empty');
          if (emptyDiv) emptyDiv.remove();

          window.chatHistory[chatboxId].forEach((msg, msgIndex) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message ' + msg.role;
            const textContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

            if (msg.role === 'reasoning') {
              msgDiv.style.cssText = 'background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; max-width: 85%;';

              const toggleDiv = document.createElement('div');
              toggleDiv.className = 'reasoning-toggle';
              toggleDiv.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; color: #b45309;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>思维链</div><svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>';

              const contentDiv = document.createElement('div');
              contentDiv.className = 'reasoning-content';
              contentDiv.innerHTML = marked.parse(msg.content);

              toggleDiv.onclick = function() {
                if (contentDiv.classList.contains('collapsed')) {
                  contentDiv.classList.remove('collapsed');
                  toggleDiv.querySelector('.chevron-icon').innerHTML = '<polyline points="18 15 12 9 6 15"/>';
                } else {
                  contentDiv.classList.add('collapsed');
                  toggleDiv.querySelector('.chevron-icon').innerHTML = '<polyline points="6 9 12 15 18 9"/>';
                }
              };

              msgDiv.appendChild(toggleDiv);
              msgDiv.appendChild(contentDiv);
            } else if (msg.role === 'assistant') {
              msgDiv.innerHTML = marked.parse(msg.content);
            } else {
              msgDiv.textContent = textContent;
            }

            if (msg.role !== 'reasoning') {
              const copyBtn = document.createElement('button');
              copyBtn.className = 'chat-message-copy-btn';
              copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
              copyBtn.onclick = function(e) {
                e.stopPropagation();
                window.copyChatMessage(textContent);
              };
              msgDiv.appendChild(copyBtn);
            }

            messagesDiv.appendChild(msgDiv);
          });

          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });

        console.log('已从本地缓存恢复聊天记录');
      } catch (e) {
        console.error('加载聊天记录失败:', e);
      }
    }

    window.addEventListener('load', function() {
      loadFromLocalStorage();
      loadChatHistory();
    });

    document.addEventListener('input', function(e) {
      if (e.target.matches('input, textarea, select')) {
        saveToLocalStorage();
      }
    });

    document.addEventListener('change', function(e) {
      if (e.target.matches('input[type="radio"], input[type="checkbox"]')) {
        saveToLocalStorage();
      }
    });

    document.addEventListener('click', function(e) {
      const menus = document.querySelectorAll('.attachment-menu');
      menus.forEach(menu => {
        if (menu.style.display === 'block') {
          const chatboxId = menu.id.replace('attachMenu_', '');
          const btn = document.getElementById('attachBtn_' + chatboxId);
          if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            menu.style.display = 'none';
          }
        }
      });
    });

    function changePage(direction) {
      if (controlEnabled) {
        console.log('[流程控制] 教师控制模式下无法手动翻页');
        return;
      }

      const allPages = document.querySelectorAll('.page');
      const newPage = currentPage + direction;

      if (newPage >= 0 && newPage < TOTAL_PAGES) {
        allPages[currentPage].style.display = 'none';
        allPages[newPage].style.display = 'block';
        currentPage = newPage;

        document.getElementById('pageInfo').textContent = '第 ' + (currentPage + 1) + ' / ' + TOTAL_PAGES + ' 页';
        updateNavigationButtons();
        updateSubmitSection();

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function updateSubmitSection() {
      if (!HAS_PAGINATION) return;

      const submitSection = document.getElementById('submitSection');
      if (!submitSection) return;

      if (currentPage === TOTAL_PAGES - 1) {
        submitSection.style.display = 'block';
      } else {
        submitSection.style.display = 'none';
      }
    }

    function drawLuckyBox(id) {
      const resultDiv = document.getElementById('lucky_' + id);
      const btnDiv = document.getElementById('lucky_btn_' + id);
      const data = window.luckyBoxData[id];

      if (!data || !data.options || data.options.length === 0) {
        resultDiv.textContent = '错误：无可用选项';
        resultDiv.style.color = '#991b1b';
        return;
      }

      btnDiv.classList.add('spinning');
      resultDiv.classList.remove('show');
      resultDiv.textContent = '抽取中...';
      resultDiv.style.color = '#8b5cf6';
      resultDiv.style.background = 'none';
      resultDiv.style.padding = '0';
      resultDiv.style.border = 'none';
      resultDiv.style.boxShadow = 'none';

      let counter = 0;
      const maxCount = 15;
      const interval = setInterval(() => {
        const randomOption = data.options[Math.floor(Math.random() * data.options.length)];
        resultDiv.textContent = randomOption;
        counter++;

        if (counter >= maxCount) {
          clearInterval(interval);

          let finalResult;
          if (data.mode === 'sequential') {
            if (!usedLuckyOptions[id]) usedLuckyOptions[id] = 0;
            finalResult = data.options[usedLuckyOptions[id] % data.options.length];
            usedLuckyOptions[id]++;
          } else {
            finalResult = data.options[Math.floor(Math.random() * data.options.length)];
          }

          setTimeout(() => {
            resultDiv.textContent = '🎉 ' + finalResult + ' 🎉';
            resultDiv.classList.add('show');
            btnDiv.classList.remove('spinning');
          }, 100);
        }
      }, 80);
    }

    window.chatHistory = {};
    window.attachmentData = {};
    window.fullscreenOverlays = {};

    window.clearChatHistory = function(chatboxId) {
      if (!confirm('确定要清空所有对话记录吗？此操作不可恢复。')) {
        return;
      }

      window.chatHistory[chatboxId] = [];
      window.attachmentData[chatboxId] = [];

      const messagesDiv = document.getElementById('messages_' + chatboxId);
      if (messagesDiv) {
        messagesDiv.innerHTML = '<div class="chatbox-empty">开始与 AI 对话...</div>';
      }

      const overlay = window.fullscreenOverlays[chatboxId];
      if (overlay) {
        const overlayMessages = overlay.querySelector('#messages_' + chatboxId);
        if (overlayMessages) {
          overlayMessages.innerHTML = '<div class="chatbox-empty">开始与 AI 对话...</div>';
        }
      }

      const attachmentsDiv = document.getElementById('attachments_' + chatboxId);
      if (attachmentsDiv) {
        attachmentsDiv.innerHTML = '';
      }

      saveChatHistory();
    };

    window.exportChatHistory = function(chatboxId) {
      const history = window.chatHistory[chatboxId] || [];

      if (history.length === 0) {
        alert('暂无对话记录可导出');
        return;
      }

      let content = '# AI 对话记录\\n\\n';
      content += '导出时间: ' + new Date().toLocaleString('zh-CN') + '\\n\\n';
      content += '---\\n\\n';

      history.forEach((msg, index) => {
        const role = msg.role === 'user' ? '👤 用户' : msg.role === 'reasoning' ? '🧠 思维链' : '🤖 AI助手';
        const msgContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        content += '## ' + role + '\\n\\n';
        content += msgContent + '\\n\\n';
        content += '---\\n\\n';
      });

      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chat_history_' + new Date().getTime() + '.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    window.copyChatMessage = function(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          const tooltip = document.createElement('div');
          tooltip.textContent = '已复制';
          tooltip.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; z-index: 10000; animation: fadeInScale 0.3s ease;';
          document.body.appendChild(tooltip);
          setTimeout(function() {
            document.body.removeChild(tooltip);
          }, 1500);
        }).catch(function(err) {
          console.error('复制失败:', err);
          alert('复制失败');
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          alert('已复制');
        } catch (err) {
          console.error('复制失败:', err);
          alert('复制失败');
        }
        document.body.removeChild(textarea);
      }
    };

    window.toggleChatFullscreen = function(chatboxId) {
      let overlay = window.fullscreenOverlays[chatboxId];

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'chatbox-fullscreen-overlay';
        overlay.id = 'fullscreen_' + chatboxId;

        const chatbox = document.getElementById('chatbox_' + chatboxId);
        const clonedChatbox = chatbox.cloneNode(true);

        const header = clonedChatbox.querySelector('.chatbox-header');
        const actionBtns = header.querySelectorAll('.chatbox-action-btn');

        if (actionBtns.length >= 1) {
          actionBtns[0].onclick = function() { window.clearChatHistory(chatboxId); };
        }
        if (actionBtns.length >= 2) {
          actionBtns[1].onclick = function() { window.exportChatHistory(chatboxId); };
        }
        if (actionBtns.length >= 3) {
          actionBtns[2].innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 3h3v3M6 3H3v3m15 12v3h3m-9 0H3v-3"/></svg>';
          actionBtns[2].title = '退出全屏';
          actionBtns[2].onclick = function() { window.toggleChatFullscreen(chatboxId); };
        }

        const attachBtn = clonedChatbox.querySelector('.attachment-btn');
        attachBtn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          window.toggleAttachmentMenu(chatboxId);
        };

        const attachMenuBtns = clonedChatbox.querySelectorAll('.attachment-menu-item');
        attachMenuBtns.forEach(function(btn) {
          const originalOnclick = btn.getAttribute('onclick');
          if (originalOnclick) {
            btn.onclick = function() { eval(originalOnclick); };
          }
        });

        const sendBtn = clonedChatbox.querySelector('.chatbox-send-btn');
        sendBtn.onclick = function() { window.sendChatMessage(chatboxId); };

        const inputField = clonedChatbox.querySelector('.chatbox-input');
        inputField.onkeypress = function(e) {
          if (e.key === 'Enter') {
            window.sendChatMessage(chatboxId);
          }
        };

        const fileInput = clonedChatbox.querySelector('#fileInput_' + chatboxId);
        fileInput.onchange = function(event) {
          window.handleFileUpload(chatboxId, event);
        };

        overlay.appendChild(clonedChatbox);
        document.body.appendChild(overlay);
        window.fullscreenOverlays[chatboxId] = overlay;

        const originalInput = document.getElementById('input_' + chatboxId);
        const clonedInput = overlay.querySelector('#input_' + chatboxId);
        clonedInput.dataset.model = originalInput.dataset.model;
        clonedInput.dataset.systemprompt = originalInput.dataset.systemprompt;
      }

      if (overlay.classList.contains('active')) {
        const originalChatbox = document.getElementById('chatbox_' + chatboxId);
        const overlayMessages = overlay.querySelector('#messages_' + chatboxId);
        const originalMessages = originalChatbox.querySelector('#messages_' + chatboxId);
        originalMessages.innerHTML = overlayMessages.innerHTML;

        const overlayInput = overlay.querySelector('#input_' + chatboxId);
        const originalInput = originalChatbox.querySelector('#input_' + chatboxId);
        originalInput.value = overlayInput.value;

        const overlayAttachments = overlay.querySelector('#attachments_' + chatboxId);
        const originalAttachments = originalChatbox.querySelector('#attachments_' + chatboxId);
        originalAttachments.innerHTML = overlayAttachments.innerHTML;

        overlay.classList.remove('active');
      } else {
        const originalMessages = document.getElementById('messages_' + chatboxId);
        const overlayMessages = overlay.querySelector('#messages_' + chatboxId);
        overlayMessages.innerHTML = originalMessages.innerHTML;

        const originalInput = document.getElementById('input_' + chatboxId);
        const overlayInput = overlay.querySelector('#input_' + chatboxId);
        overlayInput.value = originalInput.value;

        const originalAttachments = document.getElementById('attachments_' + chatboxId);
        const overlayAttachments = overlay.querySelector('#attachments_' + chatboxId);
        overlayAttachments.innerHTML = originalAttachments.innerHTML;

        overlay.classList.add('active');
      }
    };

    window.toggleAttachmentMenu = function(chatboxId) {
      const overlay = window.fullscreenOverlays[chatboxId];
      let menu;

      if (overlay && overlay.classList.contains('active')) {
        menu = overlay.querySelector('#attachMenu_' + chatboxId);
      } else {
        menu = document.getElementById('attachMenu_' + chatboxId);
      }

      if (menu) {
        const currentDisplay = window.getComputedStyle(menu).display;
        menu.style.display = (currentDisplay === 'none' || !menu.style.display) ? 'block' : 'none';
      }
    };

    window.triggerFileUpload = function(chatboxId, type) {
      const overlay = window.fullscreenOverlays[chatboxId];
      let fileInput;

      if (overlay && overlay.classList.contains('active')) {
        fileInput = overlay.querySelector('#fileInput_' + chatboxId);
      } else {
        fileInput = document.getElementById('fileInput_' + chatboxId);
      }
      fileInput.click();
      window.toggleAttachmentMenu(chatboxId);
    };

    window.handleFileUpload = function(chatboxId, event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (file.type.startsWith('image/')) {
          if (!window.attachmentData[chatboxId]) {
            window.attachmentData[chatboxId] = [];
          }
          window.attachmentData[chatboxId].push({ type: 'image', name: file.name, content });
          window.renderAttachments(chatboxId);
          saveChatHistory();
        }
      };

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      }
    };

    window.addLink = function(chatboxId) {
      const url = prompt('请输入链接地址:');
      if (url) {
        if (!window.attachmentData[chatboxId]) {
          window.attachmentData[chatboxId] = [];
        }
        window.attachmentData[chatboxId].push({ type: 'link', name: url, content: url });
        window.renderAttachments(chatboxId);
        saveChatHistory();
      }
      window.toggleAttachmentMenu(chatboxId);
    };

    window.removeAttachment = function(chatboxId, index) {
      window.attachmentData[chatboxId].splice(index, 1);
      window.renderAttachments(chatboxId);
      saveChatHistory();
    };

    window.renderAttachments = function(chatboxId) {
      const overlay = window.fullscreenOverlays[chatboxId];
      let container;

      if (overlay && overlay.classList.contains('active')) {
        container = overlay.querySelector('#attachments_' + chatboxId);
      } else {
        container = document.getElementById('attachments_' + chatboxId);
      }

      const attachments = window.attachmentData[chatboxId] || [];

      if (attachments.length === 0) {
        if (container) container.innerHTML = '';
        return;
      }

      let html = '';
      attachments.forEach((att, index) => {
        let icon = '';
        if (att.type === 'image') {
          icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
        } else if (att.type === 'link') {
          icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
        }

        html += '<div class="attachment-tag">' + icon + '<span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + att.name + '</span><span class="remove-btn" onclick="window.removeAttachment(\\'' + chatboxId + '\\', ' + index + ')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></div>';
      });

      container.innerHTML = html;
    };

    window.sendChatMessage = async function(chatboxId) {
      const overlay = window.fullscreenOverlays[chatboxId];
      let input, messagesDiv;

      if (overlay && overlay.classList.contains('active')) {
        input = overlay.querySelector('#input_' + chatboxId);
        messagesDiv = overlay.querySelector('#messages_' + chatboxId);
      } else {
        input = document.getElementById('input_' + chatboxId);
        messagesDiv = document.getElementById('messages_' + chatboxId);
      }

      const sendBtn = event.currentTarget;
      let message = input.value.trim();
      const attachments = window.attachmentData[chatboxId] || [];

      if (!message && attachments.length === 0) return;

      const contentParts = [];

      if (message) {
        contentParts.push({ type: 'text', text: message });
      }

      let displayMessage = message;

      if (attachments.length > 0) {
        displayMessage += '\\n\\n附件:\\n';
        attachments.forEach(att => {
          if (att.type === 'image') {
            contentParts.push({
              type: 'image_url',
              image_url: { url: att.content }
            });
            displayMessage += '[图片: ' + att.name + ']\\n';
          } else if (att.type === 'link') {
            contentParts.push({ type: 'text', text: '[链接: ' + att.content + ']' });
            displayMessage += '[链接: ' + att.content + ']\\n';
          }
        });
      }

      if (!window.chatHistory[chatboxId]) {
        window.chatHistory[chatboxId] = [];
        const emptyDiv = messagesDiv.querySelector('.chatbox-empty');
        if (emptyDiv) emptyDiv.remove();
      }

      const userMsgDiv = document.createElement('div');
      userMsgDiv.className = 'chat-message user';
      userMsgDiv.textContent = displayMessage;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'chat-message-copy-btn';
      copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      copyBtn.onclick = function(e) {
        e.stopPropagation();
        window.copyChatMessage(displayMessage);
      };
      userMsgDiv.appendChild(copyBtn);

      messagesDiv.appendChild(userMsgDiv);

      const messageContent = contentParts.length > 1 ? contentParts : (contentParts[0]?.text || displayMessage);
      window.chatHistory[chatboxId].push({ role: 'user', content: messageContent });
      saveChatHistory();

      input.value = '';
      window.attachmentData[chatboxId] = [];
      window.renderAttachments(chatboxId);
      input.disabled = true;
      sendBtn.disabled = true;

      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'chat-message loading';
      loadingDiv.innerHTML = '<div class="chat-loading-spinner"></div>';
      messagesDiv.appendChild(loadingDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      let retryCount = 0;
      const maxRetries = 3;

      async function attemptSendMessage() {
        try {
          const model = input.dataset.model;
          const systemPrompt = input.dataset.systemprompt;

          const messages = [];
          if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
          }
          messages.push(...window.chatHistory[chatboxId].filter(msg => msg.role !== 'reasoning'));

        const response = await fetch(SUPABASE_URL + '/functions/v1/volcengine-ai', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true
          })
        });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API错误响应:', errorText);
            throw new Error('API请求失败: ' + response.status);
          }

          let reasoningMsgDiv = null;
          let assistantMsgDiv = null;
          let reasoningMessage = '';
          let fullMessage = '';
          let firstContentReceived = false;

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;

                  if (delta && (delta.reasoning_content || delta.thinking_content)) {
                    const reasoningContent = delta.reasoning_content || delta.thinking_content;
                    reasoningMessage += reasoningContent;

                    if (!firstContentReceived) {
                      firstContentReceived = true;
                      if (loadingDiv && loadingDiv.parentNode) {
                        loadingDiv.remove();
                      }
                    }

                    if (!reasoningMsgDiv) {
                      reasoningMsgDiv = document.createElement('div');
                      reasoningMsgDiv.className = 'chat-message reasoning';
                      reasoningMsgDiv.style.cssText = 'background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; max-width: 85%;';

                      const toggleDiv = document.createElement('div');
                      toggleDiv.className = 'reasoning-toggle';
                      toggleDiv.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; color: #b45309;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>思维链</div><svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>';

                      const contentDiv = document.createElement('div');
                      contentDiv.className = 'reasoning-content';

                      toggleDiv.onclick = function() {
                        if (contentDiv.classList.contains('collapsed')) {
                          contentDiv.classList.remove('collapsed');
                          toggleDiv.querySelector('.chevron-icon').innerHTML = '<polyline points="18 15 12 9 6 15"/>';
                        } else {
                          contentDiv.classList.add('collapsed');
                          toggleDiv.querySelector('.chevron-icon').innerHTML = '<polyline points="6 9 12 15 18 9"/>';
                        }
                      };

                      reasoningMsgDiv.appendChild(toggleDiv);
                      reasoningMsgDiv.appendChild(contentDiv);
                      reasoningMsgDiv._contentDiv = contentDiv;

                      messagesDiv.appendChild(reasoningMsgDiv);
                    }

                    const contentDiv = reasoningMsgDiv._contentDiv;
                    if (contentDiv) {
                      contentDiv.innerHTML = marked.parse(reasoningMessage);
                    }
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                  }

                  if (delta && delta.content) {
                    const content = delta.content;
                    fullMessage += content;

                    if (!firstContentReceived) {
                      firstContentReceived = true;
                      if (loadingDiv && loadingDiv.parentNode) {
                        loadingDiv.remove();
                      }
                    }

                    if (!assistantMsgDiv) {
                      assistantMsgDiv = document.createElement('div');
                      assistantMsgDiv.className = 'chat-message assistant';
                      assistantMsgDiv.innerHTML = '';
                      messagesDiv.appendChild(assistantMsgDiv);
                    }

                    const parsedHTML = marked.parse(fullMessage);
                    assistantMsgDiv.innerHTML = parsedHTML;

                    let copyBtn = assistantMsgDiv.querySelector('.chat-message-copy-btn');
                    if (!copyBtn) {
                      copyBtn = document.createElement('button');
                      copyBtn.className = 'chat-message-copy-btn';
                      copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                      assistantMsgDiv.appendChild(copyBtn);
                    }
                    copyBtn.onclick = function(e) {
                      e.stopPropagation();
                      window.copyChatMessage(fullMessage);
                    };

                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                  }
                } catch (e) {
                  console.warn('解析SSE数据失败:', data);
                }
              }
            }
          }

          if (reasoningMessage) {
            window.chatHistory[chatboxId].push({ role: 'reasoning', content: reasoningMessage });
          }
          if (fullMessage) {
            window.chatHistory[chatboxId].push({ role: 'assistant', content: fullMessage });
          }
          saveChatHistory();

          input.disabled = false;
          sendBtn.disabled = false;
          input.focus();

        } catch (error) {
          console.error('AI对话错误 (尝试 ' + (retryCount + 1) + '/' + maxRetries + '):', error);
          retryCount++;

          if (retryCount < maxRetries) {
            if (loadingDiv && loadingDiv.parentNode) {
              loadingDiv.innerHTML = '<div class="chat-loading-spinner"></div>';
            }

            const retryMsgDiv = document.createElement('div');
            retryMsgDiv.className = 'chat-message assistant';
            retryMsgDiv.style.cssText = 'background: #fef3c7; border-color: #fbbf24; color: #92400e; font-size: 13px; padding: 8px 12px;';
            retryMsgDiv.textContent = '连接失败，正在重试 (' + retryCount + '/' + maxRetries + ')...';
            messagesDiv.appendChild(retryMsgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            await new Promise(resolve => setTimeout(resolve, 2000));
            retryMsgDiv.remove();
            return attemptSendMessage();
          } else {
            if (loadingDiv && loadingDiv.parentNode) {
              loadingDiv.remove();
            }

            const errorMsgDiv = document.createElement('div');
            errorMsgDiv.className = 'chat-message assistant';
            errorMsgDiv.style.cssText = 'background: #fee2e2; border-color: #ef4444; color: #991b1b;';
            errorMsgDiv.textContent = '抱歉，连接失败。已重试 ' + maxRetries + ' 次，请稍后再试。';
            messagesDiv.appendChild(errorMsgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
          }
        }
      }

      await attemptSendMessage();
    };

    document.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && e.target.classList.contains('chatbox-input')) {
        const chatboxId = e.target.id.replace('input_', '');
        window.sendChatMessage(chatboxId);
      }
    });

    window.generateHTML = async function(componentId) {
      const config = window.generatorConfig[componentId];
      if (!config) return;

      const paramValues = {};
      let hasError = false;

      config.parameters.forEach(param => {
        const input = document.getElementById('param_' + componentId + '_' + param.name);
        const value = input ? input.value.trim() : '';

        if (param.required && !value) {
          alert('请填写必填项：' + param.name);
          hasError = true;
          return;
        }

        paramValues[param.name] = value;
      });

      if (hasError) return;

      let promptText = config.promptTemplate;
      Object.keys(paramValues).forEach(key => {
        const regex = new RegExp('\\\\{\\\\{' + key + '\\\\}\\\\}', 'g');
        promptText = promptText.replace(regex, paramValues[key]);
      });

      const genBtn = document.getElementById('genBtn_' + componentId);
      const outputDiv = document.getElementById('output_' + componentId);
      const renderDiv = document.getElementById('render_' + componentId);

      genBtn.disabled = true;
      genBtn.textContent = '正在生成...';
      outputDiv.style.display = 'block';
      outputDiv.innerHTML = '<p style="color: #06b6d4; font-weight: 600;">AI 正在生成中...</p>';

      try {
        const response = await fetch(SUPABASE_URL + '/functions/v1/volcengine-ai', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: promptText }],
            max_tokens: 32000,
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error('生成失败');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullOutput = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  const text = parsed.choices[0].delta.content;
                  fullOutput += text;
                  outputDiv.innerHTML = '<pre style="font-size: 12px; white-space: pre-wrap; font-family: monospace;">' + fullOutput + '</pre>';

                  const htmlMatch = fullOutput.match(/\`\`\`html\\n([\\s\\S]*?)\\n\`\`\`/);
                  if (htmlMatch) {
                    const html = htmlMatch[1];
                    const iframe = document.getElementById('iframe_' + componentId);
                    const isFullDoc = /<!DOCTYPE|<html/i.test(html);
                    let finalHtml = html;
                    if (!isFullDoc) {
                      finalHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }</style></head><body>' + html + '</body></html>';
                    }
                    iframe.srcdoc = finalHtml;
                    renderDiv.style.display = 'block';
                  }
                }
              } catch (e) {
                console.warn('解析失败:', e);
              }
            }
          }
        }

        genBtn.disabled = false;
        genBtn.textContent = config.buttonText || '生成 HTML 游戏';
        outputDiv.innerHTML = '<p style="color: #10b981; font-weight: 600;">✓ 生成完成</p>';
      } catch (error) {
        console.error('生成错误:', error);
        genBtn.disabled = false;
        genBtn.textContent = config.buttonText || '生成 HTML 游戏';
        outputDiv.innerHTML = '<p style="color: #ef4444; font-weight: 600;">✗ 生成失败，请重试</p>';
      }
    };

    window.clearGeneratedHTML = function(componentId) {
      const renderDiv = document.getElementById('render_' + componentId);
      const outputDiv = document.getElementById('output_' + componentId);
      const iframe = document.getElementById('iframe_' + componentId);

      renderDiv.style.display = 'none';
      outputDiv.style.display = 'none';
      outputDiv.innerHTML = '';

      iframe.srcdoc = '';
    };

    window.submitAnswers = async function() {
      const studentClass = document.getElementById('studentClass').value.trim();
      const studentName = document.getElementById('studentName').value.trim();
      const messageDiv = document.getElementById('message');
      const submitBtn = document.querySelector('.submit-btn');

      if (!studentClass || !studentName) {
        messageDiv.innerHTML = '<div class="error">请填写班级和姓名</div>';
        return;
      }

      const answers = {};
      ${answerCollectionCode}

      const chatHistory = window.chatHistory || {};
      const hasChatHistory = Object.keys(chatHistory).some(key => chatHistory[key] && chatHistory[key].length > 0);

      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';

      let retryCount = 0;
      const maxRetries = 999;
      const retryDelay = 3000;

      async function attemptSubmit() {
        try {
          retryCount++;
          if (retryCount > 1) {
            messageDiv.innerHTML = '<div class="error">提交失败，正在重试 (第 ' + retryCount + ' 次尝试)...</div>';
          }

          const submissionData = {
            lesson_task_id: TASK_ID,
            student_name: studentName,
            student_class: studentClass,
            seat_number: null,
            answers: answers
          };

          if (hasChatHistory) {
            submissionData.chat_history = chatHistory;
          }

          const { error } = await supabaseClient
            .from('student_submissions')
            .insert(submissionData);

          if (error) throw error;

          messageDiv.innerHTML = '<div class="success">提交成功！感谢您的参与' + (hasChatHistory ? '（包含AI对话记录）' : '') + '</div>';
          submitBtn.textContent = '已提交';
          document.getElementById('studentClass').disabled = true;
          document.getElementById('studentName').disabled = true;
        } catch (error) {
          console.error('提交失败 (第 ' + retryCount + ' 次):', error);

          if (retryCount < maxRetries) {
            messageDiv.innerHTML = '<div class="error">提交失败，' + (retryDelay / 1000) + ' 秒后自动重试 (第 ' + retryCount + ' 次尝试)...</div>';
            setTimeout(attemptSubmit, retryDelay);
          } else {
            messageDiv.innerHTML = '<div class="error">提交失败次数过多，请联系老师</div>';
            submitBtn.disabled = false;
            submitBtn.textContent = '重新提交';
          }
        }
      }

      await attemptSubmit();
    }

    const CHANNEL_NAME = 'lesson-control:' + TASK_ID;
    const POLL_INTERVAL = 3000;
    const HEARTBEAT_TIMEOUT = 10000;
    const INIT_TIMEOUT = 5000;
    let controlChannel = null;
    let pollTimer = null;
    let heartbeatTimer = null;
    let lastKnownPage = 0;
    let controlEnabled = false;
    let lastHeartbeat = 0;
    let initialized = false;

    async function initializeControl() {
      try {
        console.log('[流程控制] 正在初始化...');
        const { data, error } = await supabaseClient
          .from('lesson_controls')
          .select('*')
          .eq('task_id', TASK_ID)
          .maybeSingle();

        if (error) {
          console.error('[流程控制] 获取控制状态失败:', error);
          updateControlStatus('离线模式');
          return;
        }

        if (!data) {
          console.log('[流程控制] 未找到控制记录');
          updateControlStatus('等待开启');
          return;
        }

        console.log('[流程控制] 控制状态:', data);

        if (data.control_enabled) {
          controlEnabled = true;
          lastHeartbeat = data.updated_at ? new Date(data.updated_at).getTime() : Date.now();
          showControlBanner();
          lastKnownPage = data.current_page || 0;
          if (HAS_PAGINATION && lastKnownPage !== currentPage) {
            console.log('[流程控制] 同步到页面:', lastKnownPage);
            navigateToPageDirectly(lastKnownPage);
          } else {
            console.log('[流程控制] 已在正确页面:', currentPage);
          }
          updateControlStatus('已连接');
          startHeartbeatCheck();
        } else {
          controlEnabled = false;
          hideControlBanner();
          console.log('[流程控制] 控制已禁用');
        }
      } catch (err) {
        console.error('[流程控制] 初始化失败:', err);
        updateControlStatus('连接失败');
      } finally {
        finishInitialization();
      }
    }

    function finishInitialization() {
      if (initialized) return;
      initialized = true;
      console.log('[流程控制] 初始化完成，controlEnabled =', controlEnabled);

      const overlay = document.getElementById('loadingOverlay');
      const content = document.getElementById('mainContent');

      if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 300);
      }

      if (content) {
        content.style.display = 'block';
        setTimeout(() => {
          content.style.opacity = '1';
          content.style.transition = 'opacity 0.3s ease';

          setTimeout(() => {
            updateNavigationButtons();
            updateSubmitSection();
            console.log('[流程控制] 按钮状态已更新');
          }, 100);
        }, 50);
      }
    }

    function showControlBanner() {
      const banner = document.getElementById('controlBanner');
      if (banner) {
        banner.style.display = 'block';
      }
    }

    function hideControlBanner() {
      const banner = document.getElementById('controlBanner');
      if (banner) {
        banner.style.display = 'none';
      }
    }

    function updateControlStatus(status) {
      const statusEl = document.getElementById('controlStatus');
      if (statusEl) {
        statusEl.textContent = '(' + status + ')';
      }
    }

    function startHeartbeatCheck() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }

      heartbeatTimer = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastHeartbeat;

        if (elapsed > HEARTBEAT_TIMEOUT) {
          console.log('[流程控制] 心跳超时，自动关闭控制模式');
          controlEnabled = false;
          hideControlBanner();
          updateNavigationButtons();
          updateControlStatus('连接已断开');
          stopHeartbeatCheck();
        }
      }, 2000);
    }

    function stopHeartbeatCheck() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    }

    function updateNavigationButtons() {
      if (!HAS_PAGINATION) return;

      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');

      if (controlEnabled) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        prevBtn.title = '教师控制模式下无法手动翻页';
        nextBtn.title = '教师控制模式下无法手动翻页';
        prevBtn.onclick = function() { return false; };
        nextBtn.onclick = function() { return false; };
      } else {
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === TOTAL_PAGES - 1;
        prevBtn.title = '';
        nextBtn.title = '';
        prevBtn.onclick = function() { changePage(-1); };
        nextBtn.onclick = function() { changePage(1); };
      }
    }

    function navigateToPageDirectly(page) {
      if (!HAS_PAGINATION) return;

      const allPages = document.querySelectorAll('.page');
      if (page < 0 || page >= TOTAL_PAGES) return;

      allPages[currentPage].style.display = 'none';
      allPages[page].style.display = 'block';
      currentPage = page;

      document.getElementById('pageInfo').textContent = '第 ' + (currentPage + 1) + ' / ' + TOTAL_PAGES + ' 页';
      updateNavigationButtons();
      updateSubmitSection();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function subscribeToControl() {
      try {
        console.log('[流程控制] 订阅频道:', CHANNEL_NAME);
        controlChannel = supabaseClient.channel(CHANNEL_NAME);

        controlChannel
          .on('broadcast', { event: 'control' }, ({ payload }) => {
            console.log('[流程控制] 收到广播消息:', payload);

            if (payload.type === 'navigate' && typeof payload.page === 'number') {
              console.log('[流程控制] 广播导航到页面:', payload.page);
              lastKnownPage = payload.page;
              if (payload.page !== currentPage) {
                navigateToPageDirectly(payload.page);
                updateControlStatus('已同步 (实时)');
              }
            }
          })
          .subscribe((status) => {
            console.log('[流程控制] 频道状态:', status);
            if (status === 'SUBSCRIBED') {
              updateControlStatus('实时连接');
            } else if (status === 'CHANNEL_ERROR') {
              updateControlStatus('连接错误');
            } else if (status === 'CLOSED') {
              updateControlStatus('连接关闭');
            }
          });
      } catch (err) {
        console.error('[流程控制] 订阅失败:', err);
        updateControlStatus('订阅失败');
      }
    }

    async function pollControlState() {
      try {
        const { data, error } = await supabaseClient
          .from('lesson_controls')
          .select('current_page, control_enabled')
          .eq('task_id', TASK_ID)
          .maybeSingle();

        if (error) {
          console.error('[流程控制] 轮询失败:', error);
          return;
        }

        if (!data) {
          console.log('[流程控制] 轮询: 无数据');
          if (controlEnabled) {
            controlEnabled = false;
            hideControlBanner();
            updateNavigationButtons();
          }
          return;
        }

        if (data.control_enabled !== controlEnabled) {
          console.log('[流程控制] 控制状态变化:', controlEnabled, '->', data.control_enabled);
          controlEnabled = data.control_enabled;
          if (controlEnabled) {
            showControlBanner();
            updateControlStatus('已连接');
            startHeartbeatCheck();
          } else {
            hideControlBanner();
            stopHeartbeatCheck();
          }
          updateNavigationButtons();
        }

        if (data.control_enabled) {
          lastHeartbeat = data.updated_at ? new Date(data.updated_at).getTime() : Date.now();

          if (typeof data.current_page === 'number') {
            if (data.current_page !== lastKnownPage) {
              console.log('[流程控制] 检测到页面变化:', lastKnownPage, '->', data.current_page);
              lastKnownPage = data.current_page;
              if (data.current_page !== currentPage) {
                navigateToPageDirectly(data.current_page);
                updateControlStatus('已同步 (轮询)');
              }
            }
          }
        }
      } catch (err) {
        console.error('[流程控制] 轮询异常:', err);
      }
    }

    function startPolling() {
      console.log('[流程控制] 开始轮询，间隔:', POLL_INTERVAL, 'ms');
      pollControlState();
      pollTimer = setInterval(pollControlState, POLL_INTERVAL);
    }

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }

    if (HAS_PAGINATION) {
      setTimeout(() => {
        if (!initialized) {
          console.log('[流程控制] 初始化超时，强制显示内容');
          finishInitialization();
        }
      }, INIT_TIMEOUT);

      initializeControl();
      subscribeToControl();
      startPolling();

      window.addEventListener('beforeunload', () => {
        stopPolling();
        stopHeartbeatCheck();
        if (controlChannel) {
          controlChannel.unsubscribe();
        }
      });
    } else {
      finishInitialization();
    }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
      initializeApp();
    }
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function isRichText(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function renderTextContent(text: string): string {
  return isRichText(text) ? text : escapeHtml(text);
}
