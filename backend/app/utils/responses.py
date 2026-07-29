def success(data=None, message="Success"):
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error(message, code=400):
    return {
        "success": False,
        "code": code,
        "message": message,
    }
