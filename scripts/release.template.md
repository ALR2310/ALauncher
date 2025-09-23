# 📑 Release Note Generation Rule

When generating release notes, always follow this structure:

## 🚀 Release Notes

### ✨ Added
- List new **features** or **functionalities**.  
- Keep each item **short** (1–2 lines), focusing on the **value** for the user.  
- Use bullet points (`-`).

### 🔄 Changed
- List **refactors, improvements, or modifications**.  
- Mention **code structure changes**, **UI/UX enhancements**, or **API updates**.  
- Each item should be concise and clear.

### 🛠 Fixed
- List **bug fixes** or **issues resolved**.  
- Keep items short and specific.

### 📦 Build & CI/CD
- List updates related to **build tools, workflows, pipelines, dependencies**.  
- Mention automation, CI/CD enhancements, or dependency upgrades.

---

👉 **Summary**:  
End with a **short summary paragraph** (2–3 sentences).  
- Highlight the **biggest changes** (e.g., API migration, new features).  
- Explain the **overall impact** (e.g., improved maintainability, better UX, smoother build).  
- Avoid too much detail.

---

# ✅ Formatting Rules
- Use **Markdown headings** (`##`, `###`) and **emojis** for clarity.  
- Each list item should start with `-`.  
- No more than **1–2 lines per bullet point**.  
- The `Summary` section is optional.  
- Keep wording **clear, simple, and professional**.  
- If a section (Added, Changed, Fixed, Build & CI/CD) has no relevant content, **omit the section entirely**.  
- Do not include empty headings or placeholder text like "No changes".

---

# 🚫 Content Restrictions
- ❌ Do **not** mention specific filenames, file paths, or extensions (e.g., `useUpdater.ts`, `release.ts`, `build.ts`, `src/`, `dist/`).  
- ❌ Do **not** mention specific classes, functions, or variables (e.g., `UpdateService`, `UpdateController`).  
- ❌ Do **not** mention external tool warnings or build logs.  
- ✅ Always describe changes in **general terms**: focus on features, improvements, and user impact.  
- ✅ Prefer high-level language such as *"Refactored update logic"* instead of *"Refactored useUpdater hook"*.  
