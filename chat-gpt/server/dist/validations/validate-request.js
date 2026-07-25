"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const express_validator_1 = require("express-validator");
const api_error_1 = require("../utils/api-error");
function validateRequest(req, _res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new api_error_1.ApiError(400, errors.array()[0].msg);
    }
    next();
}
