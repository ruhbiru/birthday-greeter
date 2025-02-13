import { BadRequestException } from '@nestjs/common';
import { IValidationError } from './validation-error.interface';
export class ValidationException extends BadRequestException {
  constructor(
    public message: string,
    public validationErrors?: IValidationError[],
  ) {
    super();
  }
}
