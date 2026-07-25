import { httpClient } from '../../../shared/service/httpClient'

export const authService = {
  register(payload) {
    return httpClient.post('/auth/register', payload)
  },
  login(payload) {
    return httpClient.post('/auth/login', payload)
  },
  logout(payload = {}) {
    return httpClient.post('/auth/logout', payload)
  },
  forgotPassword(payload) {
    return httpClient.post('/auth/forgot-password', payload)
  },
  resetPassword(payload) {
    return httpClient.post('/auth/reset-password', payload)
  },
  verifyEmail(payload) {
    return httpClient.post('/auth/verify-email', payload)
  },
  resendVerification(payload) {
    return httpClient.post('/auth/resend-verification', payload)
  },
  refreshToken(payload = {}) {
    return httpClient.post('/auth/refresh', payload, {
      skipAuthRefresh: true,
    })
  },
}
