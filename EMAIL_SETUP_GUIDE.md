# Email Configuration Setup Guide

## 📧 Email Service Setup (Updated 2024)

### 1. Resend Setup (NEW RECOMMENDED - Has Free Tier!)

1. **Sign up for Resend**:
   - Go to [resend.com](https://resend.com)
   - Create a free account (3,000 emails/month forever!)

2. **Get API Key**:
   - Go to API Keys section
   - Create a new API Key
   - Copy the API key

3. **Configure Environment Variables**:
   Add these to your `backend/.env` file:
   ```env
   # Email Configuration (Resend)
   RESEND_API_KEY=your_resend_api_key_here
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=Geo App
   APP_URL=http://localhost:5173
   ```

### 2. Brevo Setup (Alternative Free Option)

1. **Sign up for Brevo**:
   - Go to [brevo.com](https://brevo.com)
   - Create a free account (300 emails/day forever!)

2. **Get SMTP Credentials**:
   - Go to SMTP & API section
   - Generate SMTP credentials

3. **Configure Environment Variables**:
   ```env
   # Email Configuration (Brevo SMTP)
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USERNAME=your_brevo_email
   SMTP_PASSWORD=your_brevo_smtp_key
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=Geo App
   APP_URL=http://localhost:5173
   ```

### 3. Alternative Services (Paid Options)

#### Mailgun Setup (3-month free trial):
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=your_mailgun_smtp_username
SMTP_PASSWORD=your_mailgun_smtp_password
```

#### Amazon SES Setup (Free with EC2):
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your_ses_smtp_username
SMTP_PASSWORD=your_ses_smtp_password
```

#### SendGrid Setup (Paid only - no free tier):
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

## 🔧 Backend Configuration

### Database Migration
The password tokens table has been created. Verify it exists:
```sql
SHOW TABLES LIKE 'password_tokens';
```

### API Endpoints Available:
- `POST /api/password/setup-email` - Send password setup email
- `POST /api/password/validate-token` - Validate password setup token
- `POST /api/password/setup` - Set up password using token
- `POST /api/password/reset-email` - Send password reset email
- `POST /api/password/reset` - Reset password using token

## 🎨 Frontend Integration

### Password Setup Page
- Route: `/setup-password?token=...`
- Validates token and allows user to set password
- Redirects to login after successful setup

### User Management Integration
To integrate with User Management component, add this function:

```typescript
const sendPasswordSetupEmail = async (userId: number, email: string) => {
  try {
    const response = await axiosClient.post('/password/setup-email', {
      user_id: userId,
      email: email
    });
    
    if (response.data.success) {
      // Show success message
      console.log('Password setup email sent successfully');
    } else {
      // Show error message
      console.error('Failed to send email:', response.data.error);
    }
  } catch (error) {
    console.error('Email sending error:', error);
  }
};
```

## 🔒 Security Features

### Token Security:
- ✅ **32-byte random tokens** (64 hex characters)
- ✅ **24-hour expiration** for security
- ✅ **One-time use** tokens
- ✅ **Type validation** (password_setup vs password_reset)

### Password Requirements:
- ✅ **Minimum 8 characters**
- ✅ **Secure hashing** with PHP's `password_hash()`
- ✅ **Client-side validation**

### Email Security:
- ✅ **HTML and text versions** of emails
- ✅ **Professional templates** with branding
- ✅ **Security warnings** about link expiration
- ✅ **No sensitive data** in email content

## 📱 Email Templates

### Password Setup Email Features:
- Professional HTML design
- Clear call-to-action button
- Security warnings
- Fallback text version
- Responsive design

### Password Reset Email Features:
- Similar professional design
- Clear reset instructions
- Security warnings
- Responsive layout

## 📊 Cost Analysis (Updated 2024)

### Resend (NEW RECOMMENDED):
- **Free**: 3,000 emails/month forever! 🎉
- **Paid**: $20/month for 50,000 emails
- **Perfect for**: Small to medium applications

### Brevo (Alternative Free Option):
- **Free**: 300 emails/day (9,000/month) forever! 🎉
- **Paid**: $25/month for 20,000 emails
- **Perfect for**: Small applications

### Amazon SES:
- **Free**: 62,000 emails/month (from EC2)
- **Paid**: $0.10 per 1,000 emails
- **Perfect for**: High-volume applications

### Mailgun:
- **Free**: 5,000 emails/month for 3 months only
- **Paid**: $35/month for 50,000 emails
- **Perfect for**: Short-term projects

### SendGrid:
- **Free**: ❌ No longer available
- **Paid**: $19.95/month for 50,000 emails
- **Perfect for**: Established businesses

## 🚀 Testing

### Test Email Sending:
1. Create a test user in User Management
2. Click "Send Password Setup Email"
3. Check the email inbox
4. Click the link to test the password setup flow

### Test Token Validation:
```bash
curl -X POST http://localhost:8000/api/password/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"your_test_token_here"}'
```

## 🔧 Production Considerations

### Email Deliverability:
- ✅ **SPF Records**: Add your email service to your domain's SPF record
- ✅ **DKIM**: Enable DKIM signing in your email service
- ✅ **DMARC**: Set up DMARC policy
- ✅ **Domain Authentication**: Verify your domain in your email service

### Environment Variables:
- ✅ **Secure storage**: Use environment variables for credentials
- ✅ **Different configs**: Separate dev/staging/production configs
- ✅ **No hardcoding**: Never hardcode credentials in code

### Monitoring:
- ✅ **Email logs**: Monitor email sending success/failure rates
- ✅ **Token usage**: Track token generation and usage
- ✅ **Error handling**: Proper error logging and user feedback

## 📞 Support

If you need help with email setup:
1. Check the SMTP service documentation
2. Verify environment variables are correct
3. Test with a simple email first
4. Check server logs for errors

The system is now ready to send secure password setup emails! 🎉
