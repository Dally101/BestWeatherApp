# Security Policy

## Supported Versions

We actively support the following versions of The Best Weather App:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Create Public Issues
Please **do not** create public GitHub issues for security vulnerabilities. This could put users at risk.

### 2. Report Privately
Send security reports to: **security@yourproject.com** (replace with actual email)

Include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if you have one)
- Your contact information

### 3. Response Timeline
- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies based on severity

## Security Considerations

### API Keys
- **Never commit API keys** to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor API usage for unusual activity

### Data Privacy
- Location data is processed locally on device
- No personal data is stored on external servers
- Calendar data remains on device (not transmitted)
- News data is fetched from public APIs only

### Permissions
The app requests the following permissions:
- **Location**: For weather data accuracy
- **Calendar**: For event integration (optional)
- **Notifications**: For weather alerts (optional)

### Third-Party Services
We integrate with these external services:
- **Open-Meteo**: Weather data (no API key required)
- **OpenAI**: AI features (API key required)
- **News API**: News content (API key required)
- **Google Custom Search**: Enhanced news (API key required)

### Best Practices for Users
1. **Keep the app updated** to the latest version
2. **Review permissions** before granting access
3. **Use strong API keys** and keep them secure
4. **Monitor API usage** to detect unauthorized access
5. **Report suspicious behavior** immediately

## Vulnerability Disclosure Policy

We follow responsible disclosure practices:

1. **Investigation**: We investigate all reports thoroughly
2. **Acknowledgment**: We acknowledge valid reports
3. **Fix Development**: We develop and test fixes
4. **Coordinated Release**: We coordinate release timing
5. **Credit**: We provide credit to reporters (if desired)

## Security Updates

Security updates are released as soon as possible after a vulnerability is confirmed and fixed. Users will be notified through:
- GitHub releases
- App store updates
- Security advisories

## Contact

For security-related questions or concerns:
- **Email**: security@yourproject.com
- **PGP Key**: [Link to PGP key if available]

---

Thank you for helping keep The Best Weather App secure! 🔒 