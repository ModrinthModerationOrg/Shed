declare const ErrorType = {
    ERROR = { name: "error" },
    ABORT = { name: "abort" },
    TIMEOUT = { name: "timeout" },
    INVALID_STATUS = { name: "invalid_status" },
    HANDLER_ERROR = { name: "handler_error" },
} as const

declare type ErrorType = keyof typeof ErrorType;