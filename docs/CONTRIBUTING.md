# Contributing to Nora Personal Assistant

Thank you for your interest in contributing to Nora PA! This document provides guidelines and instructions for contributing.

## 🎯 Mission

Help build an intelligent life management system that **never lets users miss an obligation, deadline, or important detail**.

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/nora-pa/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, .NET version, browser)

### Suggesting Features

1. Check [existing feature requests](https://github.com/yourusername/nora-pa/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)
2. Create a new issue with:
   - Clear use case
   - Proposed solution
   - Alternative solutions considered
   - Impact on existing features

### Code Contributions

#### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/nora-pa.git
   cd nora-pa
   ```

2. **Set up development environment**
   ```bash
   # Start infrastructure
   docker-compose up -d
   
   # Restore .NET packages
   dotnet restore
   
   # Install frontend dependencies
   cd src/NoraPA.Web
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Workflow

1. **Make your changes**
   - Follow the coding standards (see below)
   - Write tests for new functionality
   - Update documentation as needed

2. **Test your changes**
   ```bash
   # Run unit tests
   dotnet test
   
   # Run integration tests
   dotnet test --filter Category=Integration
   
   # Run frontend tests
   cd src/NoraPA.Web
   npm test
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add obligation auto-detection"
   ```
   
   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template
   - Link related issues

## 📝 Coding Standards

### C# (.NET)

- Follow [Microsoft C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- Use meaningful variable and method names
- Add XML documentation comments for public APIs
- Keep methods small and focused (single responsibility)
- Use async/await for I/O operations
- Handle exceptions appropriately

**Example:**
```csharp
/// <summary>
/// Extracts obligations from a message using AI
/// </summary>
/// <param name="message">The message to analyze</param>
/// <param name="cancellationToken">Cancellation token</param>
/// <returns>Extracted obligations</returns>
public async Task<IEnumerable<Obligation>> ExtractObligationsAsync(
    Message message, 
    CancellationToken cancellationToken = default)
{
    ArgumentNullException.ThrowIfNull(message);
    
    try
    {
        var extraction = await _aiService.ExtractAsync(message, cancellationToken);
        return MapToObligations(extraction);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to extract obligations from message {MessageId}", message.Id);
        throw;
    }
}
```

### TypeScript/React

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for type safety
- Use functional components with hooks
- Keep components small and reusable
- Use meaningful prop names
- Add JSDoc comments for complex functions

**Example:**
```typescript
interface MessageCardProps {
  message: Message;
  onSelect: (id: string) => void;
}

/**
 * Displays a message card with obligations and deadlines
 */
export function MessageCard({ message, onSelect }: MessageCardProps) {
  const obligationCount = message.obligations.length;
  const hasDeadlines = message.deadlines.length > 0;
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onSelect(message.id)}
      className="message-card"
    >
      <h3>{message.subject}</h3>
      {obligationCount > 0 && (
        <Badge variant="warning">{obligationCount} obligations</Badge>
      )}
      {hasDeadlines && (
        <Badge variant="danger">Deadline</Badge>
      )}
    </motion.div>
  );
}
```

### Database Migrations

- Always create migrations for schema changes
- Use descriptive migration names
- Test migrations both up and down
- Never modify existing migrations (create new ones)

```bash
# Create migration
dotnet ef migrations add AddObligationPriorityField

# Apply migration
dotnet ef database update

# Rollback migration
dotnet ef database update PreviousMigrationName
```

## 🧪 Testing Guidelines

### Unit Tests

- Test one thing at a time
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Aim for >80% code coverage

**Example:**
```csharp
[Fact]
public async Task ExtractAsync_WithInsuranceEmail_ExtractsObligations()
{
    // Arrange
    var message = new Message
    {
        Subject = "BMW Insurance Policy",
        BodyPlain = "Please read policy documents..."
    };
    var mockAI = new Mock<IAIExtractionService>();
    mockAI.Setup(x => x.ExtractAsync(It.IsAny<Message>(), default))
          .ReturnsAsync(CreateMockExtraction());
    
    // Act
    var result = await mockAI.Object.ExtractAsync(message);
    
    // Assert
    Assert.NotEmpty(result.Obligations.Obligations);
    Assert.Contains(result.Obligations.Obligations, 
        o => o.Action.Contains("Read policy"));
}
```

### Integration Tests

- Test complete workflows
- Use test database
- Clean up after tests
- Test error scenarios

### E2E Tests

- Test critical user journeys
- Use realistic data
- Test on multiple browsers
- Include accessibility tests

## 📚 Documentation

### Code Documentation

- Add XML comments for public APIs
- Document complex algorithms
- Explain "why" not just "what"
- Keep comments up to date

### User Documentation

- Update README for new features
- Add examples and screenshots
- Keep API documentation current
- Write clear error messages

## 🎨 UI/UX Guidelines

### Design Principles

1. **No Pop-ups** - Use toasts and slide-ins
2. **Fluid Motion** - Animate with Framer Motion
3. **Keyboard-First** - Every action has a shortcut
4. **Progressive Disclosure** - Show what's needed
5. **Dark-First** - Beautiful dark theme

### Accessibility

- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- Test with screen readers
- Maintain color contrast ratios

## 🔒 Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Sanitize data before display
- Follow OWASP guidelines
- Report security issues privately

## 📦 Pull Request Process

1. **Before submitting:**
   - Run all tests
   - Update documentation
   - Add changelog entry
   - Rebase on latest main

2. **PR Requirements:**
   - Clear description of changes
   - Link to related issues
   - Screenshots (for UI changes)
   - Test coverage maintained or improved
   - No merge conflicts

3. **Review Process:**
   - At least one approval required
   - All CI checks must pass
   - Address review comments
   - Squash commits before merge

## 🌟 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to contributor Discord channel
- Eligible for swag (coming soon!)

## 📞 Getting Help

- 💬 [Discord Community](https://discord.gg/nora-pa)
- 📧 Email: dev@nora-pa.com
- 📖 [Documentation](https://docs.nora-pa.com)
- 🐛 [GitHub Issues](https://github.com/yourusername/nora-pa/issues)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to conduct@nora-pa.com. All complaints will be reviewed and investigated promptly and fairly.

## 🙏 Thank You

Thank you for contributing to Nora PA! Together, we're building something that will help millions of people never miss an important obligation again.

**Let's make "I forgot" a thing of the past.** 🎯
