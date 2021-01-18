class ResponseUtil {
	static success(data = {}, msg = '') {
		return JSON.stringify({
			status: 1,
			msg,
			data
		})
	}

	static fail(errorCode = 0, errorMsg = '截图异常') {
		return JSON.stringify({
			status: errorCode,
			msg: errorMsg,
		})
	}
}

module.exports = ResponseUtil;