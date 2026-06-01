import { HttpException, HttpStatus } from '@nestjs/common';

export enum FamilyMemberAssignmentErrorCode {
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_NOT_ACTIVE = 'SUBSCRIPTION_NOT_ACTIVE',
  PLAN_NOT_FAMILY_TYPE = 'PLAN_NOT_FAMILY_TYPE',
  FAMILY_MEMBER_PATIENT_NOT_FOUND = 'FAMILY_MEMBER_PATIENT_NOT_FOUND',
  FAMILY_MEMBER_HAS_ACTIVE_FAMILY_PLAN = 'FAMILY_MEMBER_HAS_ACTIVE_FAMILY_PLAN',
  FAMILY_MEMBER_IS_MAIN_SUBSCRIBER = 'FAMILY_MEMBER_IS_MAIN_SUBSCRIBER',
  FAMILY_MEMBER_ALREADY_ASSIGNED = 'FAMILY_MEMBER_ALREADY_ASSIGNED',
}

export class FamilyMemberAssignmentException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: FamilyMemberAssignmentErrorCode,
    public readonly meta?: Record<string, unknown>,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        errorCode,
        meta,
        statusCode: status,
      },
      status,
    );
  }
}
