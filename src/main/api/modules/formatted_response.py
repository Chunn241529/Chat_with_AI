from pygments import highlight
from pygments.lexers import guess_lexer
from pygments.formatters import HtmlFormatter
import markdown
import re


def format_response(ai_response):
    """
    Format AI response with Markdown and syntax highlighting for code blocks.
    """
    # Step 1: Process Markdown (convert Markdown to HTML)
    formatted_response = markdown.markdown(ai_response)

    # Step 2: Replace bold with custom color
    formatted_response = re.sub(
        r"(\*\*|__)(.*?)\1", r'<b style="color:#ce2479;">\2</b>', formatted_response
    )

    # Step 3: Replace italic with HTML <i> tag, but exclude code blocks
    formatted_response = re.sub(r"(\*|_)(.*?)\1", r"<i>\2</i>", formatted_response)

    # Step 4: Handle code blocks
    def highlight_code_blocks(match):
        code_block = match.group(1)  # Get the code inside the block
        lexer = guess_lexer(code_block)  # Automatically detect the language of the code
        formatter = HtmlFormatter(
            cssclass="source", linenos=False
        )  # Do not show line numbers
        highlighted_code = highlight(code_block, lexer, formatter)

        # Return the highlighted code wrapped with a div and a copy button
        return f"""
        <div class="code-block">
            <button class="copy-button" onclick="copyToClipboard(this)">Copy</button>
            <pre><code class="language-{lexer.name}">{highlighted_code}</code></pre>
        </div>
        """

    # Step 5: Regex to match both <p><code> blocks and ``` code blocks
    code_block_pattern = re.compile(r"(<p><code>.*?</code></p>|```(.*?)```)", re.DOTALL)

    # Perform regex substitution to highlight code blocks
    formatted_response = re.sub(
        code_block_pattern,
        lambda match: highlight_code_blocks(match),
        formatted_response,
    )

    # Step 6: Replace <p><code> and </code></p> tags correctly
    formatted_response = re.sub(
        r"<p><code>(.*?)</code></p>", r"<pre><code>\1</code></pre>", formatted_response
    )

    # Final Step: Clean any unnecessary tags like <p>, <i> from code blocks and HTML content
    formatted_response = re.sub(
        r"<p>|</p>", "", formatted_response
    )  # Remove <p> tags entirely

    return formatted_response
