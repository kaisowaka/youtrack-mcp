# 🚨 Security Policy

## Supported Versions

We actively support the following versions of YouTrack MCP Server:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please:

1. **Email us privately** at: [your-security-email@domain.com]
2. **Include detailed information**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### 📧 What to Include

Please provide as much information as possible:

```
Subject: [SECURITY] YouTrack MCP Server Vulnerability Report

Vulnerability Type: [e.g., Authentication bypass, Data exposure, etc.]
Affected Component: [e.g., YouTrack client, API integration, etc.]
Severity: [Critical/High/Medium/Low]

Description:
[Detailed description of the vulnerability]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [etc.]

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

Impact:
[Potential security impact]

Environment:
- YouTrack MCP Version: [version]
- Node.js Version: [version]
- Operating System: [OS]
- YouTrack Instance: [version/type]
```

### ⏱️ Response Timeline

- **Initial Response**: Within 48 hours
- **Investigation**: Within 7 days
- **Fix Development**: Depends on severity
- **Public Disclosure**: After fix is released

### 🏆 Security Considerations

Common security areas we monitor:

#### Authentication & Authorization
- YouTrack token handling
- API permission validation
- Access control enforcement

#### Data Protection
- Sensitive data exposure
- API response sanitization
- Log data security

#### Input Validation
- Parameter injection prevention
- Query validation
- File upload security

#### Network Security
- HTTPS enforcement
- Certificate validation
- Proxy configurations

### 🛡️ Best Practices for Users

To use YouTrack MCP Server securely:

1. **Environment Variables**
   ```bash
   # ✅ DO: Use environment variables for secrets
   export YOUTRACK_TOKEN="your-token-here"
   
   # ❌ DON'T: Hard-code tokens in configuration files
   ```

2. **Token Management**
   - Use tokens with minimal required permissions
   - Rotate tokens regularly
   - Never commit tokens to version control

3. **Network Security**
   - Use HTTPS for YouTrack connections
   - Validate SSL certificates
   - Use secure network configurations

4. **Access Control**
   - Limit MCP server access to authorized users
   - Monitor API usage and access logs
   - Implement proper user authentication

### 🔄 Security Updates

Security updates will be:

- **Released immediately** for critical vulnerabilities
- **Communicated** through GitHub security advisories
- **Documented** in release notes with severity information

### 📋 Vulnerability Categories

We classify vulnerabilities as:

- **Critical**: Remote code execution, data exposure
- **High**: Authentication bypass, privilege escalation
- **Medium**: Information disclosure, DoS
- **Low**: Minor information leaks

### ✅ Safe Disclosure

After we've addressed the vulnerability:

1. We'll coordinate with you on disclosure timing
2. You'll be credited in our security advisory (if desired)
3. We may offer recognition in our contributors list

### 🤝 Bug Bounty

Currently, we don't offer a formal bug bounty program, but we greatly appreciate security research and responsible disclosure.

---

**Thank you for helping keep YouTrack MCP Server secure!** 🙏
