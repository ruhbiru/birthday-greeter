import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "timezoneValidator", async: false })
export class TimezoneValidator implements ValidatorConstraintInterface {
  validate(timezone: string, args: ValidationArguments) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      return true;
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return "Timezone ($value) is not a valid timezone! sample valid timezone: 'Asia/Jakarta'";
  }
}
