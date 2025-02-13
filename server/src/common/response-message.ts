import * as _ from "lodash";
import { HttpStatus } from "@nestjs/common";

import { IValidationError } from "./validations/validation-error.interface";
import { IInvalidObjectError } from "./validations/invalid-object-error.interface";
export class ResponseMessage {
  statusCode: HttpStatus;
  data: any;
  message: string;
  errors: IValidationError[] | IInvalidObjectError[];

  static successResponse(data?: any, message?: string) {
    const response = new ResponseMessage();
    response.statusCode = HttpStatus.OK;

    /**
     * Data should always be an object because we want to keep data response scalable.
     * For instance if we want to send users (a list of users),
     * the data that we send will looks like: { users }.
     *
     * That way, we can add more data to the response without changing the response structure.
     */
    response.data = _.isObject(data) ? data : null;

    if (message) {
      response.message = message;
    }
    return response;
  }

  static successMessage(message?: string) {
    const response = new ResponseMessage();
    response.statusCode = HttpStatus.OK;
    response.message = message;
    return response;
  }

  static errorResponse(
    statusCode: HttpStatus,
    errors?: IValidationError[] | IInvalidObjectError[],
    message?: string
  ) {
    const response = new ResponseMessage();
    response.statusCode = statusCode;
    if (errors) {
      response.errors = errors;
    }
    if (message) {
      response.message = message;
    }
    return response;
  }
}
