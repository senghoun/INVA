import { ValidationArguments, ValidateBy } from 'class-validator';

// Accept common display separators, but never guess a country code.
export function normalizePhone(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().replace(/[\s().-]/g, '') : value;
}

export const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export function ExactlyOneLoginIdentity(): PropertyDecorator {
  return ValidateBy({
    name: 'exactlyOneLoginIdentity',
    validator: {
      validate: (_value: unknown, args: ValidationArguments) => {
        const dto = args.object as { email?: unknown; phone?: unknown };
        return Number(dto.email !== undefined) + Number(dto.phone !== undefined) === 1;
      },
      defaultMessage: () => 'Provide exactly one of email or phone.',
    },
  });
}
