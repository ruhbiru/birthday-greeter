import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { invoke, isNil, toInteger } from "lodash";
import { AxiosError } from "axios";
import { ResponseMessage } from "../response-message";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const axiosResponse: AxiosError = exception["isAxiosError"]
      ? this.getAxiosError(exception)
      : null;

    const httpStatus = !isNil(axiosResponse)
      ? toInteger(axiosResponse.status)
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const responseMessage = ResponseMessage.errorResponse(
      httpStatus,
      null,
      exception.message ?? exception.name
    );

    this.logger.error("Uncaught exception", exception);

    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    return httpAdapter.reply(ctx.getResponse(), responseMessage, httpStatus);
  }

  private getAxiosError(exception: Error): AxiosError {
    try {
      return invoke(exception, "toJSON") as AxiosError;
    } catch (error) {
      return null;
    }
  }
}
