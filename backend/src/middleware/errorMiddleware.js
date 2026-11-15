// Turns errors into clear JSON replies. Errors from outside services (axios) carry
// request headers with secret tokens, so only safe fields are logged.
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.isAxiosError) {
    console.error('Outside service failed:', {
      url: err.config?.url?.replace(/\?.*$/, ''),
      status: err.response?.status,
      message: err.response?.data?.error?.message || err.response?.data?.errorMessage || err.message,
    });
  } else {
    console.error('Request failed:', { message: err.message, code: err.code });
  }

  const status = err.status || (err.code === 'MPESA_CONFIG_ERROR' ? 503 : err.isAxiosError ? 502 : 500);
  const message = err.status || err.code === 'MPESA_CONFIG_ERROR'
    ? err.message
    : err.isAxiosError
      ? (err.response?.data?.errorMessage || 'M-Pesa or WhatsApp did not respond properly. Please try again.')
      : err.message || 'Server error';
  res.status(status).json({ error: message });
};
