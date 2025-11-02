# ChatGPT Search Templater

**ChatGPT Search Templater** is a Chrome extension that allows you to take selected text from a webpage, embed it into a predefined template, and open it on `chatgpt.com`.

It provides a flexible way to manage multiple search templates, enabling you to quickly perform searches with ChatGPT tailored to your needs.

## Key Features

- **Template-Based Searching**: Opens `chatgpt.com` by inserting selected text into a template URL, such as `https://chatgpt.com/?q={TEXT}`.
- **Manage Multiple Templates**:
  - Add, edit, and delete templates through the options page.
  - Configure settings for each template, including the ChatGPT model (`gpt-4o`, `gpt-5`, etc.), whether to use hint-based searching, and temporary chat options.
- **Query Input Mode**:
  - Choose “Customize query…” from the context menu to adjust the query, model, and other options before opening ChatGPT.
  - Use the dedicated shortcut (default: `Ctrl+Shift+U` / `Cmd+Shift+U`) to open the same input dialog for the default template.
  - Run fully ad-hoc searches by entering the template URL and query template on the fly—no need to edit saved templates.
- **Easy Access**:
  - Select and execute templates from the extension's popup.
  - Run searches directly from the right-click context menu.
  - Use a keyboard shortcut (`Ctrl+Shift+Y` / `Cmd+Shift+Y`) to quickly execute the default template.

## How to Use

1.  **Select Text**: Highlight any text on a webpage.
2.  **Execute Search**:
    -   **Popup**: Click the extension icon and choose your desired template from the popup list.
    -   **Right-Click**: Right-click on the selected text and choose a template from the context menu.
    -   **Shortcut**: Press `Ctrl+Shift+Y` (or `Command+Shift+Y` on Mac) to run the search with your default template.
3.  **Open in ChatGPT**: A new tab will open `chatgpt.com` with the URL generated from your template.

## Configuration

1.  Right-click the extension icon and select "Options."
2.  The options page will open, allowing you to:
    -   **Manage Templates**: Create new templates or edit/delete existing ones.
    -   **Set a Default Template**: Choose the default template to be used with shortcuts.
    -   **Edit Context Menu**: Manage the items that appear in the right-click menu.

## Installation

(Link to the Chrome Web Store or manual installation instructions will go here.)

## How to Build

Follow these steps to build the extension for development:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/chatgpt-search-templater.git
    cd chatgpt-search-templater
    ```

2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

3.  **Build the Extension**:
    ```bash
    pnpm build
    ```
    The built files will be generated in the `dist` directory.

4.  **Load into Chrome**:
    -   Open Chrome and navigate to `chrome://extensions`.
    -   Enable "Developer mode."
    -   Click "Load unpacked" and select the `dist` directory.
