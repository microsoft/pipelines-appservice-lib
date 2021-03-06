export function getFormattedError(error: any): string {
    if(error && error.message) {
        if(error.statusCode) {
            var errorMessage = typeof error.message.valueOf() == 'string' ? error.message 
                : (error.message.Code || error.message.code) + " - " + (error.message.Message || error.message.message)
            error.message = `${errorMessage} (CODE: ${error.statusCode})`
        }

        return error.message;
    }

    return error;
}