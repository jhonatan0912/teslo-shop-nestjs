import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';


export class PaginationDto {

  @IsOptional()
  @IsPositive()
  @Type(() => Number) // this is a decorator that tells class-transformer to transform the value to a number
  limit?: number;

  @IsOptional()
  @IsPositive()
  @Min(0)
  @Type(() => Number) // this is a decorator that tells class-transformer to transform the value to a number
  offset?: number;

}