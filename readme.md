### News to inbox (news2inbox)

Fully configurable news subscribe widget, send headlines from different countries and categories to your mail inbox everyday at the time you appointed.

### TODO

#### Backend

:white_check_mark: Design schema for user and subscribe tables

:white_check_mark: Api endpoints for authentication (JWT)

:dart: Api for create/remove/update/get subscribe

:dart: Prepare email template (email-templates)

:dart: Log system to track sent emails

:dart: Timer function to fetch news and send email automatically

:dart: Add rate limit

#### Frontend

:dart: UI to register/login/forgot/reset password

:dart: UI for subscribe manipulation

### Part of Techniques Explain

#### Reset password flow with JWT

1. The application will display a form that accepts the user’s email address.
2. It will handle the form’s POST with the user’s email address.
3. This will create a link, with a JWT token embedded in the URL. The user will click this link and be allowed to reset their password.
4. The application will create a password-reset page. This page will require the token and will decode it to ensure it is valid.
5. If successful, a form will be displayed allowing the user to reset their password.
6. The application will handle the form’s POST with the user’s new password.
7. This page will also decode and validate the token before saving the new password.

![reset password flow](https://cloud.netlifyusercontent.com/assets/344dbf88-fdf9-42bb-adb4-46f01eedd629/2a2c2f82-1c92-4319-8af2-871ff6d4624b/reset-password-workflow-preview-opt.png)
