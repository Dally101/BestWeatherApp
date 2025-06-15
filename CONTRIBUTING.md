# Contributing to The Best Weather App

Thank you for your interest in contributing to The Best Weather App! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/Dally101/BestWeatherApp/issues) page
- Search existing issues before creating a new one
- Provide detailed information including:
  - Steps to reproduce
  - Expected vs actual behavior
  - Device/platform information
  - Screenshots if applicable

### Suggesting Features
- Open a [GitHub Discussion](https://github.com/Dally101/BestWeatherApp/discussions)
- Describe the feature and its use case
- Explain how it fits with the app's goals

### Code Contributions

#### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/Dally101/BestWeatherApp.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see README.md)
5. Create a feature branch: `git checkout -b feature/your-feature-name`

#### Development Guidelines
- **TypeScript**: All code must be written in TypeScript
- **Code Style**: Follow the existing code style and formatting
- **Testing**: Add tests for new features when applicable
- **Documentation**: Update documentation for significant changes
- **Commits**: Use clear, descriptive commit messages

#### Pull Request Process
1. Ensure your code follows the project's style guidelines
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure all tests pass
5. Create a pull request with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes

## 🏗️ Project Structure

### Key Directories
- `app/` - Expo Router pages and navigation
- `components/` - Reusable UI components
- `services/` - Backend service layer
- `contexts/` - React Context providers
- `utils/` - Utility functions
- `types/` - TypeScript type definitions

### Architecture Principles
- **Service-Oriented**: Business logic in service classes
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error handling and fallbacks
- **Cross-Platform**: iOS, Android, and Web compatibility
- **Performance**: Optimized for mobile performance

## 🔧 Development Commands

```bash
# Start development server
npm start

# Run on specific platforms
npm run ios
npm run android
npm run web

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 Code Style

### TypeScript Guidelines
- Use interfaces over types for object shapes
- Prefer functional components with hooks
- Use descriptive variable names
- Add JSDoc comments for complex functions

### Component Guidelines
- Use functional components
- Implement proper TypeScript interfaces for props
- Handle loading and error states
- Follow React Native best practices

### Service Guidelines
- Use static methods for stateless operations
- Implement proper error handling
- Add comprehensive logging
- Use async/await for asynchronous operations

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Guidelines
- Write unit tests for utility functions
- Test service layer functionality
- Add integration tests for critical flows
- Mock external API calls

## 📱 Platform Considerations

### iOS
- Test on iOS simulator and real devices
- Consider iOS-specific UI guidelines
- Handle iOS permissions properly

### Android
- Test on Android emulator and real devices
- Follow Material Design principles
- Handle Android permissions properly

### Web
- Ensure responsive design
- Handle web-specific limitations
- Test in multiple browsers

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Checklist
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Test on all platforms
- [ ] Update documentation
- [ ] Create release notes

## 🤔 Questions?

- **General Questions**: [GitHub Discussions](https://github.com/Dally101/BestWeatherApp/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/Dally101/BestWeatherApp/issues)
- **Direct Contact**: abhirooprt03@gmail.com

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to The Best Weather App! 🌤️ 