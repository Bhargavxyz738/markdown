document.addEventListener('DOMContentLoaded', () => {
    const markdownEditor = document.getElementById('markdown-editor');
    const preview = document.getElementById('preview');

    // Listen for changes in the markdown editor
    markdownEditor.addEventListener('input', updatePreview);

    // Function to convert markdown to HTML
    function updatePreview() {
        const markdown = markdownEditor.value;
        const html = convertMarkdownToHTML(markdown);
        preview.innerHTML = html;
        
        // Apply syntax highlighting to code blocks
        preview.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    // Simple markdown to HTML converter
    function convertMarkdownToHTML(markdown) {
        // Process code blocks with language support
        let html = markdown.replace(/```(\w+)?\n?([^`]*?)```/gs, (match, lang, code) => {
            const language = lang ? lang.trim() : '';
            const escapedCode = escapeHTML(code.trim());
            // Add language class for highlight.js
            return `<pre><code class="${language ? `language-${language}` : ''}">${escapedCode}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, (match, code) => {
            return `<code>${escapeHTML(code)}</code>`;
        });

        // Headers
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
        html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');

        // Bold and Italic
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/\_\_([^_]+)\_\_/g, '<strong>$1</strong>');
        html = html.replace(/\_([^_]+)\_/g, '<em>$1</em>');

        // Horizontal Rule
        html = html.replace(/^---$/gm, '<hr>');

        // Improved list handling
        // First identify list sections to avoid capturing non-list content
        let listSections = [];
        let inList = false;
        let listStart = 0;
        let listType = '';
        
        // Split the html into lines to process lists
        const lines = html.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if line is part of ordered list
            const isOrderedList = /^\s*\d+\.\s+(.+)$/.test(line);
            // Check if line is part of unordered list
            const isUnorderedList = /^\s*[\-\*]\s+(.+)$/.test(line);
            
            if (isOrderedList || isUnorderedList) {
                if (!inList) {
                    // Start a new list
                    inList = true;
                    listStart = i;
                    listType = isOrderedList ? 'ol' : 'ul';
                }
            } else if (inList && line.trim() === '') {
                // End the list if there's an empty line
                listSections.push({
                    start: listStart,
                    end: i - 1,
                    type: listType
                });
                inList = false;
            }
        }
        
        // If there's an ongoing list at the end of the document
        if (inList) {
            listSections.push({
                start: listStart,
                end: lines.length - 1,
                type: listType
            });
        }
        
        // Process each list section
        for (const section of listSections.reverse()) { // Process in reverse to preserve indices
            const listLines = lines.slice(section.start, section.end + 1);
            const listHtml = listLines.map(line => {
                // Extract the content part after the list marker
                const content = line.replace(/^\s*(?:\d+\.|\-|\*)\s+(.+)$/, '$1');
                return `<li>${content}</li>`;
            }).join('');
            
            // Replace the lines with the processed list HTML
            lines.splice(section.start, section.end - section.start + 1, 
                         `<${section.type}>${listHtml}</${section.type}>`);
        }
        
        // Rejoin the lines
        html = lines.join('\n');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // Blockquotes - improved
        html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Fix consecutive blockquotes
        html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');

        // Paragraphs - more careful handling
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Collect all text nodes that are direct children of the div
        const textNodes = [];
        for (const node of tempDiv.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                textNodes.push(node);
            }
        }
        
        // Wrap each text node in a paragraph
        for (const node of textNodes) {
            if (node.textContent.trim()) {
                const p = document.createElement('p');
                p.textContent = node.textContent;
                node.replaceWith(p);
            }
        }
        
        return tempDiv.innerHTML;
    }

    // Helper function to escape HTML
    function escapeHTML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}); 
