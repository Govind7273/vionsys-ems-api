function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage ? errorMessage : " Server Error ",
  });
}

exports = handleError;
