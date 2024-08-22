import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class IntegrationResult {
  @Field()
  status: boolean;

  @Field()
  info: string;
}