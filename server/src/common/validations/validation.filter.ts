import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { ResponseMessage } from "../response-message";
import { ValidationException } from "./validation.exception";

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const responseMessage = ResponseMessage.errorResponse(
      HttpStatus.BAD_REQUEST,
      exception.validationErrors,
      exception.message
    );

    return response.status(HttpStatus.BAD_REQUEST).json(responseMessage);
  }
}
