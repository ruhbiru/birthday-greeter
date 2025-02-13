import { IValidationError } from './validation-error.interface';

export interface IInvalidObjectError {
  id: string;
  reasons?: IValidationError[];
}
