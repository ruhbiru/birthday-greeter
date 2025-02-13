import { Injectable, ValidationError } from "@nestjs/common";
import { ClassConstructor, plainToClass } from "class-transformer";
import { validate } from "class-validator";
import * as _ from "lodash";

import { IValidationError } from "./validation-error.interface";

@Injectable()
export class ValidationService {
  constructor() {}

  async validate(
    schema: ClassConstructor<unknown>,
    data: { [prop: string]: unknown }
  ): Promise<IValidationError[]> {
    const schemaToValidate = plainToClass(schema, data);
    const errors = await validate(<Object>schemaToValidate);

    if (errors.length) {
      return this.mapToValidationError(errors);
    }

    return null;
  }

  mapToValidationError(
    errors: ValidationError[],
    parentPath?: string
  ): IValidationError[] {
    if (_.isEmpty(errors)) {
      return [];
    }

    const validationErrors = errors.map((error) => {
      let validationErrors: IValidationError[] = [];

      const path = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        validationErrors.push({
          key: path,
          messages: Object.values(error.constraints),
        });
      }

      if (!_.isEmpty(error.children)) {
        validationErrors = _.concat(
          validationErrors,
          this.mapToValidationError(error.children, path)
        );
      }
      return validationErrors;
    });

    return _.flatten(validationErrors);
  }
}
