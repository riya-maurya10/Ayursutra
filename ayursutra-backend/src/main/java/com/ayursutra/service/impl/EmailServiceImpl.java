package com.ayursutra.service.impl;

import com.ayursutra.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    public EmailServiceImpl() {
        this(null);
    }

    @Autowired
    public EmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${mail.from:no-reply@ayursutra.com}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new RuntimeException("Recipient email address is required.");
        }

        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            if (!"prod".equalsIgnoreCase(activeProfile) && !"production".equalsIgnoreCase(activeProfile)) {
                log.warn("[DEV ENVIRONMENT] JavaMailSender or MAIL_USERNAME is not configured in environment. Displaying OTP in terminal for local testing: Recipient={}, OTP={}", toEmail, otp);
                return;
            }
            log.error("SMTP delivery failed: JavaMailSender or MAIL_USERNAME environment variable is not configured.");
            throw new RuntimeException("Email delivery service is currently not configured. Please set MAIL_USERNAME and MAIL_PASSWORD in your environment.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.isBlank()) ? fromAddress : mailUsername;
            helper.setFrom(sender, "AyurSutra Care Team");
            helper.setTo(toEmail.trim());
            helper.setSubject("Your AyurSutra Password Reset Code");

            String htmlBody = buildHtmlEmail(otp);
            String plainText = buildPlainTextEmail(otp);

            helper.setText(plainText, htmlBody);

            mailSender.send(message);

            if (!"prod".equalsIgnoreCase(activeProfile) && !"production".equalsIgnoreCase(activeProfile)) {
                log.info("[DEV ENVIRONMENT] Password Reset OTP email successfully dispatched via SMTP to {}", toEmail);
            } else {
                log.info("Password Reset OTP email successfully dispatched via SMTP to {}", toEmail);
            }
        } catch (MailException e) {
            log.error("Failed to deliver password reset email via SMTP to {}: {}", toEmail, e.getMessage());
            if (!"prod".equalsIgnoreCase(activeProfile) && !"production".equalsIgnoreCase(activeProfile)) {
                log.warn("[DEV ENVIRONMENT FALLBACK] SMTP failed ({}), but logging OTP in terminal for local testing: Recipient={}, OTP={}", e.getMessage(), toEmail, otp);
                return;
            }
            throw new RuntimeException("Unable to deliver password reset verification email. Please verify your email address or SMTP configuration.", e);
        } catch (Exception e) {
            log.error("Unexpected error creating password reset email for {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("An error occurred while dispatching the password reset email. Please try again.", e);
        }
    }

    private String buildHtmlEmail(String otp) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>AyurSutra Password Reset Code</title>"
                + "<style>"
                + "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin: 0; padding: 24px; color: #1F3D2E; }"
                + ".container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; border: 1px solid #D8D2C3; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }"
                + ".header { background: #1F3D2E; padding: 32px 24px; text-align: center; color: #FFFFFF; }"
                + ".header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px; color: #FFFFFF; }"
                + ".header p { margin: 6px 0 0; font-size: 13px; color: #DCD7A5; letter-spacing: 1px; text-transform: uppercase; }"
                + ".content { padding: 36px 32px; }"
                + ".greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #173D2D; }"
                + ".lead { font-size: 14px; line-height: 1.6; color: #5A4A3A; margin-bottom: 24px; }"
                + ".otp-box { background: #F8F6F0; border: 2px dashed #1F3D2E; border-radius: 14px; padding: 20px; text-align: center; margin: 28px 0; }"
                + ".otp-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #71834F; margin-bottom: 8px; }"
                + ".otp-code { font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1F3D2E; font-family: 'Courier New', Courier, monospace; margin: 4px 0; }"
                + ".expiry-pill { display: inline-block; background: #EEF2E8; color: #315A46; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 8px; }"
                + ".warning-card { background: #FFF9F5; border-left: 4px solid #A46A4C; padding: 14px 16px; border-radius: 8px; margin: 24px 0; font-size: 12px; line-height: 1.5; color: #78350F; }"
                + ".footer { background: #FAF9F5; border-top: 1px solid #ECEFE6; padding: 20px 24px; text-align: center; font-size: 11px; color: #8A918B; line-height: 1.5; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class=\"container\">"
                + "<div class=\"header\">"
                + "<h1>AYURSUTRA</h1>"
                + "<p>Classical Ayurvedic Care &amp; Wellness</p>"
                + "</div>"
                + "<div class=\"content\">"
                + "<div class=\"greeting\">Namaste,</div>"
                + "<div class=\"lead\">"
                + "We received a request to reset the password for your AyurSutra account. Use the verification code below to complete the password reset process:"
                + "</div>"
                + "<div class=\"otp-box\">"
                + "<div class=\"otp-label\">Verification Code</div>"
                + "<div class=\"otp-code\">" + otp + "</div>"
                + "<div class=\"expiry-pill\">⏱️ Valid for 5 minutes</div>"
                + "</div>"
                + "<div class=\"warning-card\">"
                + "<strong>Security Notice:</strong> Never share this OTP code with anyone. AyurSutra care team members will never ask for your verification code or password. If you did not request this, please ignore this email."
                + "</div>"
                + "</div>"
                + "<div class=\"footer\">"
                + "AyurSutra Ayurvedic Healthcare System &bull; Automated Security Notification<br>"
                + "This is a system generated email. Please do not reply directly to this message."
                + "</div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }

    private String buildPlainTextEmail(String otp) {
        return "AYURSUTRA - Password Reset Verification Code\n\n"
                + "Namaste,\n\n"
                + "We received a request to reset your AyurSutra password.\n\n"
                + "Your 6-digit verification code is: " + otp + "\n\n"
                + "This code is valid for 5 minutes.\n\n"
                + "Security Warning: Never share this code with anyone. AyurSutra staff will never ask for your verification code.\n\n"
                + "If you did not request a password reset, please ignore this email.\n\n"
                + "AyurSutra Ayurvedic Healthcare System";
    }

}
