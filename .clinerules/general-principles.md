## Brief overview
These guidelines outline general software engineering principles to follow when developing code, focusing on code quality, design, security, testing, documentation, and versioning. These are general principles and should be adapted to specific project contexts and existing conventions.

## Code Quality
- **Readability and Conventions:** Write clear, concise, and self-explanatory code. Use meaningful names. Follow general readability principles, but also try to detect and adhere to specific language or project style guides (e.g., PEP 8, Google Style Guide), when identifiable. Add comments only when necessary to explain the *why* (complex logic, decisions), not the *what*.
- **Maintainability and Paradigms:** Favor modular and loosely coupled code. Follow principles relevant to the paradigm in use (e.g., SOLID for OOP; immutability and pure functions for Functional, or other applicable principles). Avoid unnecessary complexity (KISS).
- **Cautious Refactoring:** Be aware of obvious and safe refactoring opportunities to improve structure, remove technical debt, or fix identified security weaknesses.
  - **Mandatory Process:** 1. Identify the improvement. 2. Present a clear plan for the proposed refactoring. 3. Request explicit permission from the user. 4. Implement only after approval.
- **Contextual Error Handling:** Implement robust error handling, adapting the approach (e.g., exceptions vs. error codes) to the language and project conventions. Provide clear error messages. Use the existing logging system to record relevant debugging information (without exposing sensitive data).
  - **Suggestion Trigger:** If logging is essential and missing, suggest adding it with explicit permission.
- **Don't Repeat Yourself (DRY):** Avoid code duplication by abstracting common logic into reusable functions, classes, or modules.

## Design and Architecture
- **Separation of Concerns (SoC) and Architecture:** Organize code into modules or layers with well-defined responsibilities. Seek to identify and follow specific architectural patterns (e.g., MVC, MVVM, Microservices, Hexagonal) that are appropriate for the project context or already in use.
  - **Suggestion Trigger:** Propose (with explicit permission) the adoption of or refactoring towards a clear architectural pattern if significant benefits are identified.
- **Proactive Design Patterns:** Use recognized Design Patterns when appropriate.
  - **Suggestion Trigger:** Be proactive in suggesting patterns that can bring clear benefits in design, maintainability, or flexibility, even if the need is not immediately critical.
  - **Process:** When suggesting a pattern, explain the choice, consider relevant alternatives, and justify why the proposed pattern is preferable in that context. Follow the permission request process before implementing.
- **Contextual Configuration:** Externalize configurations (endpoints, properly managed passwords, flags, etc.) from the code.
  - **Rule:** When adding or modifying configurations, follow the format and mechanism already established in the project (e.g., .env files, YAML, JSON, platform-specific environment variables). If no clear standard exists, use the most common or native format for the specific technology in use.

## Security
- **Comprehensive Input Validation:** Always validate and sanitize data coming from any untrusted source, including external users, third-party APIs, files, and boundaries between internal systems (e.g., inter-microservice communication). The goal is to prevent injection vectors (SQL, NoSQL, Command Injection, XSS, etc.).
- **Least Privilege Applied:** Apply the principle of least privilege at all layers: configure access permissions for resources (database, file system, APIs) strictly as needed and prevent code from running with unnecessary elevated privileges.
- **Secrets Management:** Never hardcode API keys, passwords, tokens, or other secrets directly in the code or in version-controlled configuration files. Use secure mechanisms such as environment variables, secret vault services (Vault, AWS Secrets Manager, etc.), or deploy-platform-specific configurations. Follow existing rules about not reading/modifying sensitive files.
- **Proactive Dependency Checking:** Keep project dependencies up-to-date.
  - **Process:** After any addition or update of dependencies, suggest running a vulnerability scan (e.g., `npm audit`, `snyk`, `pip check`). With explicit permission, execute the scan command and present the results.
- **Secure Coding (Best Practices):**
    - **Output Encoding:** Properly encode data before displaying it in user interfaces (HTML, etc.) to prevent Cross-Site Scripting (XSS).
    - **CSRF Prevention (Web):** In web applications, implement measures against Cross-Site Request Forgery (e.g., anti-CSRF tokens).
    - **Security Headers (Web):** Use appropriate HTTP security headers (e.g., CSP, HSTS, X-Frame-Options) to harden web applications.
    - **Security Logging:** Log relevant security events (failed login attempts, authorization errors, critical changes) securely, without logging sensitive information.

## Testing
- **Focused Coverage:** Encourage and implement unit, integration, and E2E tests (as defined in general or project-specific Testing Standards). The focus should be on ensuring the correctness of critical business logic, core functionalities, and preventing regressions, rather than just hitting a percentage coverage metric.
  - **Suggestion Trigger:** Suggest (with permission) adding coverage analysis tools to identify untested areas.
- **Design for Testability:** Write code that is inherently testable.
  - **Suggestion Trigger:** Actively suggest (with permission) refactorings, such as using Dependency Injection (DI), interfaces, or other techniques, if they significantly improve the testability of existing code.
- **Test Data Management:** Use realistic test data and manage it effectively (e.g., fixtures, factories, separate test databases).

## Documentation
- **Self-Documenting Code:** Prioritize clear and expressive code that minimizes the need for explanatory comments.
- **Essential Comments:** Use comments to explain the *why* of complex logic, non-obvious design decisions, workarounds, or specific algorithms. Avoid commenting the *what* the code already clearly states.
- **Documentation Formats:** When adding in-code documentation (docstrings, etc.), try to detect and follow the formats and conventions already existing in the project (e.g., JSDoc, Python Docstrings, XML Docs).
- **External Documentation (READMEs, etc.):** Keep relevant external documentation (READMEs, architecture guides, etc.) concise, up-to-date, and synchronized with the current state of the code, following general documentation rules.

## Versioning
- **Version Control (Git):** Use Git effectively for version control.
- **Meaningful Commit Messages:** Write clear and descriptive commit messages.
  - **Rule:** If no other standard is defined in the project, follow the [Conventional Commits](https://www.conventionalcommits.org/) standard for consistency (e.g., `feat:`, `fix:`, `refactor:`, `chore:`).
- **Atomic Commits:** Keep commits small and focused on a single logical change.
- **Branching Practices:** Follow the agreed-upon branching practices in the project, if any.
  - **Rule:** If no standard is defined, use short-lived feature branches created from the main branch (e.g., `main` or `master`), named descriptively (e.g., `feature/add-user-auth`), and integrate them back into the main branch frequently (preferably via Pull/Merge Requests).
