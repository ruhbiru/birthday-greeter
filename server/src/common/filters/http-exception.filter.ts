import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { ResponseMessage } from "../response-message";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const responseMessage = ResponseMessage.errorResponse(
      status,
      null,
      exception.message
    );

    return response.status(status).json(responseMessage);
  }
}
